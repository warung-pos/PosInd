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

## 1️⃣ Buat Database di phpMyAdmin

Nama database:

```bash
pos_app
```

---

## 2️⃣ Import Database

Import file berikut ke dalam database `pos_app`:

```bash
database/pos_app.sql
```

---

## 3️⃣ Migrasi Tabel & Tambah Akun Testing (Wajib)

Setelah file SQL di atas di-import, pastikan Anda berada di folder `backend` lalu jalankan perintah migrasi ini untuk memperbarui sistem Role (Manager, Operator, Kasir, Konsumen):

```bash
node migrate_roles.js
```

Lalu jalankan perintah ini untuk memasukkan 4 akun testing secara otomatis:

```bash
node seed_test_users.js
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
* [x] JWT Authentication
* [x] Role Management (Manager, Operator, Kasir, Konsumen)
* [x] Product Management
* [x] Transaction System (POS & Pesanan Mandiri Konsumen)
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
1. Affifah Putri Deza   714240001
2. Alifya Azzahra   714240011
3. Al Yasmin Assa'diyah   714240014

---


