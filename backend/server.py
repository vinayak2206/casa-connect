from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated
from bson import ObjectId

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr, BeforeValidator

# =============== DB ===============
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# =============== APP ===============
app = FastAPI(title="Casa Connect API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# =============== HELPERS ===============
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

PyObjectId = Annotated[str, BeforeValidator(str)]

def to_public_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "created_at": user.get("created_at").isoformat() if isinstance(user.get("created_at"), datetime) else user.get("created_at"),
    }

def to_public_property(p: dict) -> dict:
    return {
        "id": str(p["_id"]),
        "title": p.get("title"),
        "description": p.get("description"),
        "price": p.get("price"),
        "type": p.get("type"),
        "listing_type": p.get("listing_type", "sale"),
        "bedrooms": p.get("bedrooms", 0),
        "bathrooms": p.get("bathrooms", 0),
        "area": p.get("area", 0),
        "city": p.get("city"),
        "address": p.get("address"),
        "lat": p.get("lat"),
        "lng": p.get("lng"),
        "images": p.get("images", []),
        "amenities": p.get("amenities", []),
        "featured": p.get("featured", False),
        "status": p.get("status", "available"),
        "created_by": p.get("created_by"),
        "created_at": p.get("created_at").isoformat() if isinstance(p.get("created_at"), datetime) else p.get("created_at"),
    }

# =============== MODELS ===============
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"  # "user" or "admin"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class PropertyIn(BaseModel):
    title: str
    description: str
    price: float
    type: str  # apartment, villa, house, condo, land
    listing_type: str = "sale"  # sale or rent
    bedrooms: int = 0
    bathrooms: int = 0
    area: float = 0
    city: str
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    images: List[str] = []
    amenities: List[str] = []
    featured: bool = False
    status: str = "available"

class InquiryIn(BaseModel):
    property_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

# =============== AUTH DEPENDENCY ===============
def _extract_token(request: Request) -> Optional[str]:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    return token

async def get_current_user(request: Request) -> dict:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_optional_user(request: Request) -> Optional[dict]:
    token = _extract_token(request)
    if not token:
        return None
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        return user
    except Exception:
        return None

def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token, httponly=True,
        secure=True, samesite="none", max_age=7 * 24 * 3600, path="/",
    )

# =============== AUTH ROUTES ===============
@api_router.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower().strip()
    role = "admin" if payload.role == "admin" else "user"
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "role": role,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    token = create_access_token(str(result.inserted_id), email, role)
    _set_auth_cookie(response, token)
    return {"user": to_public_user(doc), "token": token}

@api_router.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email, user.get("role", "user"))
    _set_auth_cookie(response, token)
    return {"user": to_public_user(user), "token": token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"success": True}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": to_public_user(user)}

# =============== PROPERTY ROUTES ===============
@api_router.get("/properties")
async def list_properties(
    q: Optional[str] = None,
    city: Optional[str] = None,
    type: Optional[str] = None,
    listing_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    beds: Optional[int] = None,
    featured: Optional[bool] = None,
    limit: int = Query(60, le=200),
):
    filt = {}
    if q:
        filt["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
            {"address": {"$regex": q, "$options": "i"}},
        ]
    if city:
        filt["city"] = {"$regex": f"^{city}$", "$options": "i"}
    if type:
        filt["type"] = type
    if listing_type:
        filt["listing_type"] = listing_type
    if beds is not None:
        filt["bedrooms"] = {"$gte": beds}
    if featured is not None:
        filt["featured"] = featured
    price_filt = {}
    if min_price is not None:
        price_filt["$gte"] = min_price
    if max_price is not None:
        price_filt["$lte"] = max_price
    if price_filt:
        filt["price"] = price_filt

    cursor = db.properties.find(filt).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return {"properties": [to_public_property(p) for p in docs]}

@api_router.get("/properties/{prop_id}")
async def get_property(prop_id: str):
    try:
        doc = await db.properties.find_one({"_id": ObjectId(prop_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Property not found")
    if not doc:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"property": to_public_property(doc)}

@api_router.post("/properties")
async def create_property(payload: PropertyIn, admin: dict = Depends(get_current_admin)):
    doc = payload.model_dump()
    doc["created_by"] = str(admin["_id"])
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.properties.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"property": to_public_property(doc)}

@api_router.put("/properties/{prop_id}")
async def update_property(prop_id: str, payload: PropertyIn, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(prop_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Property not found")
    update = payload.model_dump()
    result = await db.properties.update_one({"_id": obj_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    doc = await db.properties.find_one({"_id": obj_id})
    return {"property": to_public_property(doc)}

@api_router.delete("/properties/{prop_id}")
async def delete_property(prop_id: str, admin: dict = Depends(get_current_admin)):
    try:
        obj_id = ObjectId(prop_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Property not found")
    result = await db.properties.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"success": True}

# =============== FAVORITES ===============
@api_router.get("/favorites")
async def list_favorites(user: dict = Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": str(user["_id"])}).to_list(length=200)
    prop_ids = [ObjectId(f["property_id"]) for f in favs if f.get("property_id")]
    props = await db.properties.find({"_id": {"$in": prop_ids}}).to_list(length=200) if prop_ids else []
    return {"favorites": [to_public_property(p) for p in props]}

@api_router.post("/favorites/{prop_id}")
async def add_favorite(prop_id: str, user: dict = Depends(get_current_user)):
    await db.favorites.update_one(
        {"user_id": str(user["_id"]), "property_id": prop_id},
        {"$set": {"user_id": str(user["_id"]), "property_id": prop_id, "created_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"success": True}

@api_router.delete("/favorites/{prop_id}")
async def remove_favorite(prop_id: str, user: dict = Depends(get_current_user)):
    await db.favorites.delete_one({"user_id": str(user["_id"]), "property_id": prop_id})
    return {"success": True}

# =============== INQUIRIES ===============
@api_router.post("/inquiries")
async def create_inquiry(payload: InquiryIn, request: Request):
    user = await get_optional_user(request)
    doc = payload.model_dump()
    doc["user_id"] = str(user["_id"]) if user else None
    doc["status"] = "new"
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.inquiries.insert_one(doc)
    return {"success": True, "id": str(result.inserted_id)}

@api_router.get("/inquiries")
async def list_inquiries(admin: dict = Depends(get_current_admin)):
    docs = await db.inquiries.find({}).sort("created_at", -1).to_list(length=500)
    # attach property title
    result = []
    for d in docs:
        prop_title = None
        try:
            p = await db.properties.find_one({"_id": ObjectId(d.get("property_id", ""))})
            if p:
                prop_title = p.get("title")
        except Exception:
            pass
        result.append({
            "id": str(d["_id"]),
            "property_id": d.get("property_id"),
            "property_title": prop_title,
            "name": d.get("name"),
            "email": d.get("email"),
            "phone": d.get("phone"),
            "message": d.get("message"),
            "status": d.get("status", "new"),
            "created_at": d.get("created_at").isoformat() if isinstance(d.get("created_at"), datetime) else d.get("created_at"),
        })
    return {"inquiries": result}

@api_router.get("/inquiries/mine")
async def list_my_inquiries(user: dict = Depends(get_current_user)):
    docs = await db.inquiries.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(length=200)
    result = []
    for d in docs:
        prop_title = None
        try:
            p = await db.properties.find_one({"_id": ObjectId(d.get("property_id", ""))})
            if p:
                prop_title = p.get("title")
        except Exception:
            pass
        result.append({
            "id": str(d["_id"]),
            "property_id": d.get("property_id"),
            "property_title": prop_title,
            "message": d.get("message"),
            "status": d.get("status", "new"),
            "created_at": d.get("created_at").isoformat() if isinstance(d.get("created_at"), datetime) else d.get("created_at"),
        })
    return {"inquiries": result}

# =============== ADMIN STATS ===============
@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_current_admin)):
    total_props = await db.properties.count_documents({})
    total_users = await db.users.count_documents({"role": "user"})
    total_inquiries = await db.inquiries.count_documents({})
    active_listings = await db.properties.count_documents({"status": "available"})
    return {
        "total_properties": total_props,
        "total_users": total_users,
        "total_inquiries": total_inquiries,
        "active_listings": active_listings,
    }

# =============== ROOT ===============
@api_router.get("/")
async def root():
    return {"message": "Casa Connect API", "status": "ok"}

app.include_router(api_router)

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://casa-connect-eight.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============== SEED ===============
_PEXELS = "https://images.pexels.com/photos"
_UNSPLASH = "https://images.unsplash.com"

_CITY_COORDS = {
    "Malibu": (34.0259, -118.7798),
    "San Francisco": (37.7749, -122.4194),
    "New York": (40.7128, -74.0060),
    "Napa": (38.2975, -122.2869),
    "Miami": (25.7617, -80.1918),
    "Aspen": (39.1911, -106.8175),
    "Portland": (45.5152, -122.6784),
    "Santa Fe": (35.6870, -105.9378),
    "Austin": (30.2672, -97.7431),
    "Newport": (41.4901, -71.3128),
}

SEED_PROPERTIES = [
    {
        "title": "Villa Serena — Cliffside Estate",
        "description": "A modernist cliff-top villa framed by floor-to-ceiling glass, an infinity pool, and unobstructed ocean views. Designed by award-winning architects with imported Italian finishes throughout, this six-bedroom sanctuary offers absolute privacy across three landscaped acres. The main pavilion opens to a cantilevered terrace where the horizon meets your morning coffee.",
        "price": 4850000,
        "type": "villa", "listing_type": "sale",
        "bedrooms": 5, "bathrooms": 6, "area": 6800,
        "city": "Malibu", "address": "34 Coastal Ridge, Malibu, CA",
        "images": [
            f"{_PEXELS}/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1600",
        ],
        "amenities": ["Infinity Pool", "Ocean View", "Home Cinema", "Wine Cellar", "Smart Home", "3-Car Garage"],
        "featured": True, "status": "available",
    },
    {
        "title": "The Ivory House",
        "description": "A meticulously restored heritage residence blending original 1920s bones with a sculptural modern extension. Walled garden, a private studio, and a rare double-height library with reclaimed oak beams. Every fixture was hand-selected by the previous owner — a Danish furniture designer with an obsession for provenance.",
        "price": 2150000,
        "type": "house", "listing_type": "sale",
        "bedrooms": 4, "bathrooms": 3, "area": 3200,
        "city": "San Francisco", "address": "1888 Ivory Lane, San Francisco, CA",
        "images": [
            f"{_PEXELS}/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=1600",
        ],
        "amenities": ["Garden", "Studio", "Fireplace", "Heritage Details", "Library"],
        "featured": True, "status": "available",
    },
    {
        "title": "Kestrel Loft — Downtown Penthouse",
        "description": "Sky-lit penthouse in the arts district with cast-iron columns, oak flooring, and a private roof terrace overlooking the skyline. This former printing house has been reimagined as a luminous urban home with sliding barn doors and industrial-scale windows on three sides. Doorman, elevator direct-to-unit, and full-service concierge.",
        "price": 3200,
        "type": "apartment", "listing_type": "rent",
        "bedrooms": 2, "bathrooms": 2, "area": 1650,
        "city": "New York", "address": "42 Franklin St, PH, New York, NY",
        "images": [
            f"{_PEXELS}/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1571471/pexels-photo-1571471.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/2724748/pexels-photo-2724748.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1600",
        ],
        "amenities": ["Roof Terrace", "Doorman", "Gym", "Loft Ceilings", "Concierge"],
        "featured": True, "status": "available",
    },
    {
        "title": "Meadow House by the Vineyard",
        "description": "A quiet country retreat surrounded by vineyards, olive groves, and lavender. Timber-clad exterior and light-drenched interiors organized around a central courtyard with a mature fig tree. Includes an independent guest cottage and a fully equipped outdoor kitchen with a wood-fired oven.",
        "price": 1420000,
        "type": "house", "listing_type": "sale",
        "bedrooms": 3, "bathrooms": 3, "area": 2800,
        "city": "Napa", "address": "1200 Vineyard Path, Napa, CA",
        "images": [
            f"{_PEXELS}/2079249/pexels-photo-2079249.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/2724748/pexels-photo-2724748.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1600",
        ],
        "amenities": ["Vineyard View", "Pool", "Guest House", "Outdoor Kitchen", "Wine Storage"],
        "featured": False, "status": "available",
    },
    {
        "title": "The Terrace at Marina Bay",
        "description": "Contemporary two-bedroom apartment with wraparound terrace and marina frontage. Minimal, warm interiors with brushed brass fixtures, a custom Danish kitchen, and Italian oak flooring throughout. Sunset from every room. Deeded parking and a private storage cage included.",
        "price": 895000,
        "type": "apartment", "listing_type": "sale",
        "bedrooms": 2, "bathrooms": 2, "area": 1400,
        "city": "Miami", "address": "8 Marina Way, Miami, FL",
        "images": [
            f"{_PEXELS}/276625/pexels-photo-276625.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=1600",
        ],
        "amenities": ["Marina View", "Concierge", "Pool", "Fitness Center", "Parking"],
        "featured": True, "status": "available",
    },
    {
        "title": "Cedar & Stone Retreat",
        "description": "A brutalist-influenced mountain house wrapped in cedar and local stone. Vaulted living hall and glazed corner facing the alpine ridge, with a sunken conversation pit around a hand-forged steel hearth. Direct ski-in / ski-out access, a private sauna, and a mudroom sized for four.",
        "price": 1780000,
        "type": "house", "listing_type": "sale",
        "bedrooms": 4, "bathrooms": 4, "area": 3900,
        "city": "Aspen", "address": "56 Ridgecrest Trail, Aspen, CO",
        "images": [
            f"{_PEXELS}/2440471/pexels-photo-2440471.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1876045/pexels-photo-1876045.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/2635038/pexels-photo-2635038.jpeg?auto=compress&cs=tinysrgb&w=1600",
        ],
        "amenities": ["Mountain View", "Sauna", "Fireplace", "Ski Storage", "Mudroom"],
        "featured": False, "status": "available",
    },
    {
        "title": "Studio No. 17 — Arts Quarter",
        "description": "Compact but beautifully proportioned studio with double-height windows, a mezzanine sleeping loft, and shared rooftop garden. Ideal pied-à-terre for a designer, writer, or long-weekend traveller. Utilities included; walking distance to two Michelin-listed restaurants.",
        "price": 1800,
        "type": "apartment", "listing_type": "rent",
        "bedrooms": 1, "bathrooms": 1, "area": 620,
        "city": "Portland", "address": "17 Arts Quarter, Portland, OR",
        "images": [
            f"{_PEXELS}/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/6580227/pexels-photo-6580227.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1571464/pexels-photo-1571464.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=1600",
        ],
        "amenities": ["Mezzanine", "Rooftop", "Bike Storage", "Utilities Included"],
        "featured": False, "status": "available",
    },
    {
        "title": "Casa Luz — Adobe Villa",
        "description": "Sun-baked adobe villa with courtyard fountains, hand-hewn beams, and locally quarried stone floors. Pure Mediterranean calm on the high desert. Includes a detached guest casita, a saltwater pool set into the terraced garden, and a private kiva fireplace in the primary suite.",
        "price": 2650000,
        "type": "villa", "listing_type": "sale",
        "bedrooms": 5, "bathrooms": 4, "area": 4600,
        "city": "Santa Fe", "address": "9 Camino de Luz, Santa Fe, NM",
        "images": [
            f"{_PEXELS}/1571470/pexels-photo-1571470.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/2635038/pexels-photo-2635038.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/2029731/pexels-photo-2029731.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1571458/pexels-photo-1571458.jpeg?auto=compress&cs=tinysrgb&w=1600",
        ],
        "amenities": ["Courtyard", "Adobe Fireplace", "Guest Casita", "Pool", "Kiva Fireplace"],
        "featured": False, "status": "available",
    },
    {
        "title": "Blackwood Modern",
        "description": "Sculptural blackened-timber house cantilevered over a wooded creek. Open-plan living with a monolithic concrete hearth and a floating oak staircase. Passive-house rated with geothermal heating and a green roof. Featured in Dwell and Architectural Record in the same season.",
        "price": 2380000,
        "type": "house", "listing_type": "sale",
        "bedrooms": 4, "bathrooms": 3, "area": 3400,
        "city": "Austin", "address": "220 Creek Bluff, Austin, TX",
        "images": [
            f"{_PEXELS}/2724748/pexels-photo-2724748.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/2440471/pexels-photo-2440471.jpeg?auto=compress&cs=tinysrgb&w=1600",
        ],
        "amenities": ["Creek View", "Concrete Hearth", "Home Office", "Rooftop Deck", "Passive House"],
        "featured": True, "status": "available",
    },
    {
        "title": "Harbor Point Land Parcel",
        "description": "A rare 2.3-acre buildable parcel with harbor frontage. Development-ready with all utilities to lot line, zoning approval for a single-family residence up to 6,500 sqft, and preserved oak canopy along the north boundary. Deep-water dock rights included.",
        "price": 780000,
        "type": "land", "listing_type": "sale",
        "bedrooms": 0, "bathrooms": 0, "area": 100000,
        "city": "Newport", "address": "Harbor Point Lot 4, Newport, RI",
        "images": [
            f"{_PEXELS}/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/2739666/pexels-photo-2739666.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/163864/coast-nature-water-cliff-163864.jpeg?auto=compress&cs=tinysrgb&w=1600",
            f"{_PEXELS}/1029611/pexels-photo-1029611.jpeg?auto=compress&cs=tinysrgb&w=1600",
        ],
        "amenities": ["Waterfront", "Buildable", "Utilities Ready", "Dock Rights", "Oak Canopy"],
        "featured": False, "status": "available",
    },
]

async def seed_admin_and_data():
    # ensure indexes
    await db.users.create_index("email", unique=True)

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@casaconnect.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Casa Connect Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
        })
        logger.info(f"Seeded admin: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Seed demo user
    demo_email = "user@casaconnect.com"
    if not await db.users.find_one({"email": demo_email}):
        await db.users.insert_one({
            "email": demo_email,
            "password_hash": hash_password("User@123"),
            "name": "Demo Buyer",
            "role": "user",
            "created_at": datetime.now(timezone.utc),
        })

    # Seed properties
    count = await db.properties.count_documents({})
    if count == 0:
        admin_doc = await db.users.find_one({"email": admin_email})
        created_by = str(admin_doc["_id"]) if admin_doc else None
        for p in SEED_PROPERTIES:
            coords = _CITY_COORDS.get(p.get("city"), (None, None))
            doc = {
                **p,
                "lat": coords[0],
                "lng": coords[1],
                "created_by": created_by,
                "created_at": datetime.now(timezone.utc),
            }
            await db.properties.insert_one(doc)
        logger.info(f"Seeded {len(SEED_PROPERTIES)} properties")

@app.on_event("startup")
async def on_startup():
    await seed_admin_and_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
