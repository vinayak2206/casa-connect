"""Casa Connect backend API tests."""
import os
import time
import pytest
import requests
from pathlib import Path

# Load frontend env for public URL
env_path = Path("/app/frontend/.env")
BASE_URL = None
for line in env_path.read_text().splitlines():
    if line.startswith("REACT_APP_BACKEND_URL="):
        BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not found"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@casaconnect.com"
ADMIN_PASSWORD = "Admin@123"
USER_EMAIL = "user@casaconnect.com"
USER_PASSWORD = "User@123"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def user_token(s):
    r = s.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- Health ----------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- Auth ----------
def test_admin_login(admin_token):
    assert admin_token

def test_user_login(user_token):
    assert user_token

def test_me_admin(admin_token):
    r = requests.get(f"{API}/auth/me", headers=hdr(admin_token))
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "admin"

def test_register_new_user():
    ts = int(time.time() * 1000)
    email = f"test-{ts}@example.com"
    r = requests.post(f"{API}/auth/register", json={
        "name": "Test User", "email": email, "password": "Password@123", "role": "user"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "user"
    assert "token" in data

def test_register_admin_role():
    ts = int(time.time() * 1000)
    email = f"admin-{ts}@example.com"
    r = requests.post(f"{API}/auth/register", json={
        "name": "Adm", "email": email, "password": "Password@123", "role": "admin"
    })
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "admin"

def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": "nope@x.com", "password": "wrong"})
    assert r.status_code == 401


# ---------- Properties ----------
def test_list_properties_seeded():
    r = requests.get(f"{API}/properties")
    assert r.status_code == 200
    props = r.json()["properties"]
    assert len(props) >= 10
    # verify shape
    p = props[0]
    for key in ["id", "title", "price", "type", "listing_type", "city"]:
        assert key in p

def test_filter_rent():
    r = requests.get(f"{API}/properties", params={"listing_type": "rent"})
    assert r.status_code == 200
    for p in r.json()["properties"]:
        assert p["listing_type"] == "rent"

def test_filter_beds():
    r = requests.get(f"{API}/properties", params={"beds": 3})
    assert r.status_code == 200
    for p in r.json()["properties"]:
        assert p["bedrooms"] >= 3

def test_filter_price():
    r = requests.get(f"{API}/properties", params={"min_price": 1000000, "max_price": 3000000})
    assert r.status_code == 200
    for p in r.json()["properties"]:
        assert 1000000 <= p["price"] <= 3000000

def test_filter_search_q():
    r = requests.get(f"{API}/properties", params={"q": "Villa"})
    assert r.status_code == 200
    assert len(r.json()["properties"]) >= 1

def test_get_property_detail():
    r = requests.get(f"{API}/properties")
    pid = r.json()["properties"][0]["id"]
    r2 = requests.get(f"{API}/properties/{pid}")
    assert r2.status_code == 200
    assert r2.json()["property"]["id"] == pid

def test_get_property_404():
    r = requests.get(f"{API}/properties/000000000000000000000000")
    assert r.status_code == 404


# ---------- Admin CRUD ----------
def test_admin_property_crud(admin_token):
    payload = {
        "title": "TEST_CRUD Property", "description": "test", "price": 500000,
        "type": "house", "listing_type": "sale", "bedrooms": 3, "bathrooms": 2,
        "area": 1500, "city": "TestCity", "address": "123 Test",
        "images": ["https://example.com/a.jpg"], "amenities": ["Pool"],
        "featured": False, "status": "available",
    }
    r = requests.post(f"{API}/properties", json=payload, headers=hdr(admin_token))
    assert r.status_code == 200, r.text
    pid = r.json()["property"]["id"]
    assert r.json()["property"]["title"] == "TEST_CRUD Property"

    # verify GET
    g = requests.get(f"{API}/properties/{pid}")
    assert g.status_code == 200

    # update
    payload["title"] = "TEST_CRUD Updated"
    payload["price"] = 600000
    u = requests.put(f"{API}/properties/{pid}", json=payload, headers=hdr(admin_token))
    assert u.status_code == 200
    assert u.json()["property"]["title"] == "TEST_CRUD Updated"
    assert u.json()["property"]["price"] == 600000

    # delete
    d = requests.delete(f"{API}/properties/{pid}", headers=hdr(admin_token))
    assert d.status_code == 200

    # verify 404
    g2 = requests.get(f"{API}/properties/{pid}")
    assert g2.status_code == 404


def test_non_admin_cannot_create(user_token):
    payload = {
        "title": "x", "description": "x", "price": 1, "type": "house", "listing_type": "sale",
        "city": "x", "address": "x"
    }
    r = requests.post(f"{API}/properties", json=payload, headers=hdr(user_token))
    assert r.status_code == 403

def test_unauth_cannot_create():
    r = requests.post(f"{API}/properties", json={"title": "x"})
    assert r.status_code in (401, 422)


# ---------- Favorites ----------
def test_favorites_flow(user_token):
    props = requests.get(f"{API}/properties").json()["properties"]
    pid = props[0]["id"]
    # add
    r = requests.post(f"{API}/favorites/{pid}", headers=hdr(user_token))
    assert r.status_code == 200
    # list
    lst = requests.get(f"{API}/favorites", headers=hdr(user_token)).json()["favorites"]
    assert any(p["id"] == pid for p in lst)
    # remove
    d = requests.delete(f"{API}/favorites/{pid}", headers=hdr(user_token))
    assert d.status_code == 200
    lst2 = requests.get(f"{API}/favorites", headers=hdr(user_token)).json()["favorites"]
    assert not any(p["id"] == pid for p in lst2)


# ---------- Inquiries ----------
def test_inquiry_anonymous():
    props = requests.get(f"{API}/properties").json()["properties"]
    pid = props[0]["id"]
    r = requests.post(f"{API}/inquiries", json={
        "property_id": pid, "name": "Anon", "email": "anon@x.com", "message": "Interested"
    })
    assert r.status_code == 200
    assert r.json()["success"] is True

def test_inquiry_user_and_mine(user_token):
    props = requests.get(f"{API}/properties").json()["properties"]
    pid = props[1]["id"]
    r = requests.post(f"{API}/inquiries",
        json={"property_id": pid, "name": "U", "email": "u@x.com", "message": "hi"},
        headers=hdr(user_token))
    assert r.status_code == 200
    mine = requests.get(f"{API}/inquiries/mine", headers=hdr(user_token)).json()["inquiries"]
    assert any(i["property_id"] == pid for i in mine)

def test_admin_list_inquiries(admin_token):
    r = requests.get(f"{API}/inquiries", headers=hdr(admin_token))
    assert r.status_code == 200
    assert "inquiries" in r.json()

def test_user_cannot_list_all_inquiries(user_token):
    r = requests.get(f"{API}/inquiries", headers=hdr(user_token))
    assert r.status_code == 403


# ---------- Admin Stats ----------
def test_admin_stats(admin_token):
    r = requests.get(f"{API}/admin/stats", headers=hdr(admin_token))
    assert r.status_code == 200
    data = r.json()
    for k in ["total_properties", "total_users", "total_inquiries", "active_listings"]:
        assert k in data
        assert isinstance(data[k], int)
