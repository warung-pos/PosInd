# 📂 Panduan Source Code untuk Presentasi Sidang WarungPOS

Sebagai dosen penguji yang sering memeriksa tugas akhir/project mahasiswa, saya cenderung langsung melompati teori di *slide* presentasi dan meminta mahasiswa untuk **membuka source code** guna menguji *kejujuran* dan *pemahaman logika* mereka. 

Jika saya menjadi dosen penguji Anda, **file pertama yang akan saya suruh buka adalah `src/utils/stringMatcher.js` dan `backend/controllers/posController.js`**. Kenapa? Karena di sanalah letak pembuktian bahwa Anda benar-benar mengimplementasikan algoritma dan alur logika bisnis (transaksi), bukan sekadar memakai framework instan.

Berikut adalah urutan file dari yang **Paling Sering Diminta Dibuka (Rank 1)** hingga yang paling jarang (Rank 5), beserta cara Anda harus meresponsnya.

---

## 🥇 Rank 1: Folder Algoritma (Sangat Mungkin Dibuka)
**File Target:** `src/utils/stringMatcher.js`, `binarySearch.js`, `greedyChange.js`

**Alasan Dosen Membuka:** Dosen ingin memastikan Anda mengoding algoritmanya sendiri, bukan sekadar menggunakan fitur bawaan JavaScript seperti `.includes()` atau `.find()`.

### 1. KMP String Matching (`stringMatcher.js`)
* **Fungsi:** Menyaring/mencari nama produk saat user mengetik di kolom pencarian.
* **Bagian Kode yang Harus Dipahami:** 
  Pahami fungsi `buildLPSTable()`. Dosen pasti menyoroti logika `while (i < pattern.length)`.
* **Pertanyaan Dosen:** *"Coba tunjukkan di mana letak perhitungan LPS (Longest Prefix Suffix)? Buat apa array LPS itu?"*
* **Jawaban Aman:** *"LPS dihitung di baris awal fungsi `buildLPSTable`. Array ini menyimpan angka yang memberi tahu algoritma KMP agar tidak mengulang pengecekan karakter dari indeks nol jika terjadi ketidakcocokan, melainkan 'melompat' sejauh nilai LPS-nya, sehingga kompleksitasnya jadi `O(N+M)`."*

### 2. Binary Search (`binarySearch.js`)
* **Fungsi:** Mencari produk berdasarkan `ID` saat diklik masuk ke keranjang.
* **Bagian Kode yang Harus Dipahami:**
  Perhitungan nilai tengah: `const mid = Math.floor((left + right) / 2)`.
* **Pertanyaan Dosen:** *"Bagaimana jika data produknya belum di-sort? Apakah file ini tetap jalan?"*
* **Jawaban Aman:** *"Binary Search akan gagal/error jika data tidak urut. Oleh karena itu, sebelum memanggil fungsi ini, saya telah memastikan bahwa himpunan `products` sudah diurutkan berdasarkan `ID` (ascending) pada saat *fetch* dari database di komponen Frontend."*

### 3. Greedy Algorithm (`greedyChange.js`)
* **Fungsi:** Menghitung jumlah lembar pecahan uang kembalian untuk pelanggan.
* **Bagian Kode yang Harus Dipahami:**
  Array denominasi `const denominations = [100000, 50000, 20000, ...]` dan operasi pembagian pembulatan ke bawah `Math.floor(remaining / bill)`.
* **Pertanyaan Dosen:** *"Apa parameter yang masuk ke fungsi ini dan apa outputnya?"*
* **Jawaban Aman:** *"Inputnya adalah total nilai kembalian (contoh: 30000). Outputnya adalah array of object yang berisi nominal dan jumlah lembarnya (contoh: Rp20.000 sebanyak 1, dan Rp10.000 sebanyak 1)."*

---

## 🥈 Rank 2: Core Bisnis & API Gateway/SmartBank (Pasti Dibuka)
**File Target:** `backend/controllers/posController.js`

**Alasan Dosen Membuka:** Ini adalah jantung dari aplikasi Anda. Segala integrasi keuangan, status pesanan, dan perhitungan harga ada di sini.

* **Fungsi:** Menangani pembuatan *invoice*, validasi keranjang, pengurangan stok, dan simulasi respon Payment Gateway (SmartBank/QRIS Midtrans).
* **Bagian Kode yang Harus Dipahami:**
  * Fungsi `payTransaction` (khususnya *looping* insert ke `transaction_items`).
  * Blok kode `if (payment_method === 'SmartBank (QRIS)')` yang mengenerate `qrisUrl` dari API `qrserver.com`.
* **Pertanyaan Dosen:** *"Coba tunjukkan di mana kode yang mengintegrasikan aplikasi ini dengan Payment Gateway / SmartBank?"*
* **Jawaban Aman:** *"Integrasi payment gateway ditangani di fungsi `payTransaction`. Saat metode QRIS dipilih, status diset `Pending` dan saya memanggil API pihak ketiga (`api.qrserver.com`) untuk menggenerate *mock* QR Code. Di *production*, URL ini akan diganti dengan endpoint API Snap Midtrans (API Gateway). Lalu, frontend akan melakukan *polling* ke API `checkTransactionStatus` saya untuk mengecek perubahan status jadi 'Selesai'."*
> **Catatan Marketplace:** Jika dosen menagih integrasi *Marketplace*, jelaskan secara jujur bahwa konsep "Marketplace" dalam aplikasi ini adalah halaman **Katalog Konsumen** (`ConsumerDashboard`), di mana Konsumen bisa login secara mandiri dan memesan produk yang masuk ke antrean pesanan Kasir (`processConsumerOrder`).

---

## 🥉 Rank 3: Keamanan & JWT (Biasa Ditanyakan)
**File Target:** `backend/controllers/authController.js`

**Alasan Dosen Membuka:** Dosen ingin melihat seberapa aman aplikasi Anda mengelola *password* dan sesi user.

* **Fungsi:** Registrasi, Login, dan pembuatan Token Sesi (JWT).
* **Bagian Kode yang Harus Dipahami:**
  * `bcrypt.hash(password, 10)` (Saat Register).
  * `jwt.sign(...)` (Saat Login berhasil).
* **Pertanyaan Dosen:** *"Kalau database kamu di-hack, apakah password usernya terbaca? Tunjukkan mana kode yang melindunginya!"*
* **Jawaban Aman:** *"Tidak terbaca, Pak/Bu. Karena di dalam file `authController.js` pada fungsi `register`, password asli dienkripsi secara asimetris satu arah menggunakan library `bcrypt.hash` dengan cost factor (salt rounds) sebesar 10 sebelum dimasukkan ke database SQL."*

---

## 🏅 Rank 4: Hak Akses RBAC (Cukup Sering)
**File Target:** `src/rbac/permissions.js`

**Alasan Dosen Membuka:** Untuk memvalidasi pernyataan Anda bahwa sistem ini memiliki 4 tipe user (Manager, Kasir, Operator, Konsumen).

* **Fungsi:** Pusat pengaturan (*Single Source of Truth*) menu apa saja yang boleh dibuka oleh masing-masing Role.
* **Bagian Kode yang Harus Dipahami:**
  Objek mapping `ROLE_PERMISSIONS` dan fungsi `canAccess(role, tabId)`.
* **Pertanyaan Dosen:** *"Bagaimana caramu melarang Kasir masuk ke menu Laporan Manager?"*
* **Jawaban Aman:** *"Sistem pengecekannya ada di file `permissions.js`. Ketika Kasir mencoba memaksa masuk, fungsi `canAccess` akan mengembalikan nilai `false` karena `laporan` tidak ada di array milik `KASIR`. Frontend (React) secara otomatis akan memblokir komponen UI dan mengalihkan kasir ke peringatan `Unauthorized`."*

---

## 🎖️ Rank 5: Database Schema (Opsional)
**File Target:** `backend/migrations/002_create_transaction_items.sql` (Atau bisa saja dosen menyuruh langsung buka phpMyAdmin).

**Alasan Dosen Membuka:** Untuk memastikan rancangan relasi Anda (ERD) bukan ecek-ecek.

* **Fungsi:** Membuat tabel detail transaksi `transaction_items`.
* **Bagian Kode yang Harus Dipahami:**
  Kolom `product_name` dan sintaks `ON DELETE CASCADE`.
* **Pertanyaan Dosen:** *"Kenapa kamu menyimpan `product_name` lagi padahal sudah ada `item_id` yang me-relasi ke tabel Produk?"*
* **Jawaban Aman:** *"Karena riwayat transaksi keuangan harus abadi (Immutable). Kolom `product_name` di sini bertindak sebagai *snapshot* denormalisasi. Jika sewaktu-waktu produk tersebut diganti namanya atau dihapus oleh Manager, struk digital yang tercetak 2 tahun lalu tidak akan rusak/hilang namanya."*

---

### 💡 Saran Ekstra dari "Dosen Penguji" (AI):
Jangan menghafal kode karakter demi karakter. Hafalkan **alur (flow)** datanya.
Misal, alur login:
1. User ketik email -> React lempar ke `/api/auth/login`.
2. Node.js cari email di MySQL.
3. Node.js cocokkan password pakai `bcrypt.compare`.
4. Jika sukses, buat token JWT.
5. Lempar kembali ke React, React simpan di `localStorage`.
6. React ubah `currentPage` ke `dashboard`.

Bicaralah secara terstruktur seperti itu saat demo, maka dosen tidak akan banyak mencecar celah aplikasi Anda. Semangat!
