# 🚀 POSIND — WarungPOS Point of Sale System

POSIND adalah aplikasi Point of Sale (POS) modern berbasis web yang dirancang untuk membantu bisnis mengelola transaksi, produk, stok, laporan, dan pengguna dalam satu platform.

Project ini dibangun menggunakan teknologi modern fullstack JavaScript dan mendukung pengembangan kolaboratif berbasis GitHub Organization.

---

# ✨ Features

## Frontend

* React + Vite
* Tailwind CSS
* Responsive UI
* Login & Register Page
* Dashboard Interface
* Pricing Section
* Modern Dark Theme

## Backend

* Express.js API
* Authentication Routes
* JWT Ready
* MySQL Database
* REST API Structure
* CORS Enabled

## Collaboration

* GitHub Organization Ready
* Branch Development Workflow
* Modular Project Structure

---

# 🛠️ Tech Stack

| Technology   | Usage               |
| ------------ | ------------------- |
| React        | Frontend UI         |
| Vite         | Frontend Build Tool |
| Tailwind CSS | Styling             |
| Express.js   | Backend API         |
| MySQL        | Database            |
| Node.js      | Runtime             |
| GitHub       | Collaboration       |

---

# 📁 Project Structure

```bash
PosInd/
├── backend/
│   ├── config/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
├── public/
├── src/
│   ├── components/
│   ├── App.jsx
│   └── main.jsx
│
├── database/
│   └── pos_app.sql
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

# ⚙️ Installation Guide

## 1️⃣ Clone Repository

```bash
git clone https://github.com/warung-pos/PosInd.git
```

---

# 🎨 Frontend Setup

## Install Dependencies

```bash
npm install
```

## Run Frontend

```bash
npm run dev
```

Frontend berjalan di:

```bash
http://localhost:5173
```

---

# 🚀 Backend Setup

## Masuk ke Folder Backend

```bash
cd backend
```

## Install Dependencies

```bash
npm install
```

## Run Backend

```bash
node server.js
```

Backend berjalan di:

```bash
http://localhost:3000
```

---

# 🗄️ Database Setup

## 1️. Buat Database di phpMyAdmin

Nama database:

```bash
pos_app
```

---

## 2️. Import Database

Import file berikut:

```bash
database/pos_app.sql
```

---

# 🔐 Environment Variables

Buat file:

```bash
backend/.env
```

Isi dengan:

```env
PORT=3000
JWT_SECRET=rahasia_super_aman
```

---

# 🔌 API Endpoints

## Register

```http
POST /api/auth/register
```

### Body

```json
{
  "email": "user@gmail.com",
  "password": "123456"
}
```

---

## Login

```http
POST /api/auth/login
```

### Body

```json
{
  "email": "user@gmail.com",
  "password": "123456"
}
```

---

# 👥 Team Workflow

## Recommended Branch Structure

```bash
main
frontend
backend
payment-gateway
```

---

# 📌 Development Roadmap

* [x] Landing Page
* [x] Responsive UI
* [x] Backend Setup
* [x] Authentication Route
* [x] Login/Register UI
* [ ] JWT Authentication
* [ ] Role Management
* [ ] Product Management
* [ ] Transaction System
* [ ] Payment Gateway
* [ ] SaaS Subscription System
* [ ] Deployment

---

# 🤝 Contribution Guide

1. Fork / Clone repository
2. Create branch baru
3. Commit perubahan
4. Push branch
5. Create Pull Request

---

# 📄 License

This project is developed for educational and collaborative purposes.

---

# 💜 POSIND

Modern Fullstack SaaS POS System for Smart Businesses 🚀
