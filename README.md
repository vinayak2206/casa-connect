# 🏡 Casa Connect

Casa Connect is a modern full-stack Real Estate Management Platform designed to simplify property buying, selling, and renting. The application provides a seamless experience for users to browse properties, save favorites, compare listings, and send inquiries, while administrators can efficiently manage all property listings through a dedicated dashboard.

---

## 🌐 Live Demo

**Frontend:** https://casa-connect-eight.vercel.app

**Backend API:** https://casa-connect-im9q.onrender.com

---

## ✨ Features

### 👤 User Features
- User Registration & Login (JWT Authentication)
- Browse Properties
- Search & Filter Listings
- View Property Details
- Save Favorite Properties
- Compare Multiple Properties
- Send Property Inquiries
- Responsive Design

### 👨‍💼 Admin Features
- Secure Admin Login
- Add New Properties
- Edit Existing Properties
- Delete Properties
- Manage Property Listings
- View Dashboard Statistics
- Manage Customer Inquiries

---

## 🛠 Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Framer Motion
- Axios
- React Router
- Lucide Icons

### Backend
- FastAPI
- Python
- JWT Authentication
- Pydantic
- Motor (MongoDB)

### Database
- MongoDB Atlas

### Deployment
- Vercel (Frontend)
- Render (Backend)

---

## 📂 Project Structure

```
Casa-Connect/
│
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
└── README.md
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/vinayak2206/casa-connect.git
```

### Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

uvicorn server:app --reload
```

### Frontend

```bash
cd frontend

npm install --legacy-peer-deps

npm start
```

---

## 🔐 Environment Variables

Create a `.env` file inside the backend folder.

```env
MONGO_URL=your_mongodb_connection_string
DB_NAME=casa_connect
JWT_SECRET=your_secret_key
```

Create a `.env` file inside the frontend folder.

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

---

## 📸 Screenshots

You can add screenshots of:

- Home Page
- Property Listings
- Property Details
- User Dashboard
- Admin Dashboard
- Login Page

---

## 📌 Future Enhancements

- Google Maps Integration
- Online Property Booking
- Payment Gateway
- AI-Based Property Recommendations
- Email Notifications
- Property Reviews & Ratings
- Live Chat Support

---

## 👨‍💻 Author

**Vinayak Bhutra**

GitHub: https://github.com/vinayak2206

---

## 📄 License

This project was developed as a Final Internship Project for learning and educational purposes.
