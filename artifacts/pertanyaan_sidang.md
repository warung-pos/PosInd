# 🎓 Panduan Sidang & Pertanyaan Dosen (WarungPOS)

Berikut adalah 30 pertanyaan kritis yang kemungkinan besar akan ditanyakan oleh dosen penguji, disusun secara spesifik berdasarkan implementasi nyata di source code project **WarungPOS** Anda.

> [!WARNING]
> Pertanyaan yang ditandai dengan label **[⚠️ JEBAKAN]** adalah pertanyaan yang sering membuat mahasiswa *blank* atau terjebak. Pelajari baik-baik alasannya!

---

## 💻 Frontend (React.js & Vite)

### 1. Mengapa Anda memilih React.js dan Vite untuk frontend aplikasi POS ini dibanding framework lain?
**Jawaban:** React.js dipilih karena arsitektur berbasis *komponen* yang membuat elemen UI (seperti form, tabel keranjang, modal) bisa digunakan kembali (reusable). Saya menggunakan Vite karena proses *Hot Module Replacement* (HMR) dan waktu *build*-nya jauh lebih cepat dari Create React App (CRA) berkat penggunaan *esbuild*.

### 2. Bagaimana cara React menangani state management di aplikasi ini, khususnya untuk keranjang belanja?
**Jawaban:** Saya menggunakan Hooks bawaan React yaitu `useState`. State keranjang disimpan sebagai array of objects. Ketika kasir menambah produk, saya melakukan *Binary Search* untuk memvalidasi produk, lalu menggunakan fungsi *setter* (misal `setCart`) dengan *spread operator* untuk meng-update kuantitas tanpa memutasi state aslinya secara langsung.

### 3. [⚠️ JEBAKAN] Apa fungsi `useEffect` pada polling pembayaran QRIS, dan apa risikonya jika lupa dibersihkan?
**Jawaban:** `useEffect` digunakan untuk menjalankan `setInterval` yang memanggil API `checkTransactionStatus` setiap 3 detik guna mengecek apakah QRIS sudah dibayar. 
**Risikonya:** Jika `clearInterval` tidak diletakkan di bagian `return` (cleanup function) di dalam `useEffect`, maka saat modal pembayaran ditutup, interval akan terus berjalan di background, menyebabkan *Memory Leak* dan *spam request* ke server. Di project saya, saya sudah meletakkan `clearInterval` di bagian cleanup.

### 4. Apa peran fitur `Suspense` dan `lazy` yang Anda gunakan pada file `Dashboard.jsx`?
**Jawaban:** Saya menggunakannya untuk *Code Splitting*. Komponen `ConsumerDashboard` di-load menggunakan `lazy()`. Artinya, file JavaScript untuk halaman Konsumen tidak akan didownload oleh browser saat Kasir atau Manager login. Hal ini membuat aplikasi *loading* lebih cepat (*faster initial load time*).

### 5. Bagaimana cara Anda meng-handle input pencarian yang cepat pada kolom "Cari produk"?
**Jawaban:** Saya menangkap perubahan `onChange` pada input, dan menyimpan nilai pencarian di state `searchQuery`. Kemudian, list produk di-filter secara reaktif berdasarkan algoritma *KMP String Matching*.

---

## ⚙️ Backend (Node.js & Express.js)

### 6. Mengapa menggunakan Node.js dan Express.js untuk backend sistem POS?
**Jawaban:** Karena Node.js memiliki sifat *non-blocking I/O* dan *asynchronous*, yang sangat cocok untuk sistem POS di mana kasir, operator, dan konsumen melakukan request ke API (seperti cek stok, bayar, dll) secara konkuren tanpa membuat server terkunci (*blocking*).

### 7. Bagaimana alur request-response ketika kasir memproses pesanan "Cash"?
**Jawaban:** Frontend mengirim JSON via POST. Backend menerima di `posController.js`, menghitung subtotal dan `fee_pos` (1%), mengenerate nomor `invoice`. Lalu melakukan query `INSERT` ke tabel `transactions` dan tabel `transaction_items`. Terakhir, stok produk dikurangi dengan query `UPDATE`, dan backend mengembalikan respons sukses beserta invoice untuk dicetak di struk.

### 8. [⚠️ JEBAKAN] Apa kelemahan dari arsitektur backend Anda jika ada 2 Kasir yang mengklik "Bayar" untuk 1 produk sisa stok 1 secara bersamaan (Race Condition)?
**Jawaban:** Saat ini backend melakukan `UPDATE products SET stock = GREATEST(0, stock - ?)`. Penggunaan `GREATEST` memastikan stok tidak akan menjadi minus (berhenti di 0). Namun kelemahannya, salah satu kasir mungkin akan mencatat transaksi sukses padahal barang aslinya cuma ada 1. Cara terbaik untuk memperbaikinya adalah dengan menggunakan implementasi *Database Transaction* (BEGIN; COMMIT; ROLLBACK) untuk mengunci (Locking) baris tabel selama transaksi diproses.

---

## 🗄️ Database (MySQL)

### 9. Mengapa Anda memilih database relasional MySQL dibandingkan NoSQL seperti MongoDB untuk aplikasi ini?
**Jawaban:** Aplikasi POS membutuhkan integritas data tingkat tinggi, konsistensi (ACID), dan memiliki relasi yang jelas (User -> Transaction -> Items). MySQL sangat andal dalam operasi relasional `JOIN` dan mendukung *Foreign Key* dengan skema yang terstruktur (seperti `ON DELETE CASCADE`), yang mana ini lebih sulit dicapai secara aman di NoSQL.

### 10. [⚠️ JEBAKAN] Pada tabel `transaction_items`, terdapat kolom `product_name` dan `price`. Bukankah ini redundan karena data itu sudah ada di tabel `products`?
**Jawaban:** Ini adalah teknik **Denormalisasi** (atau *Snapshot*). Tujuannya agar riwayat transaksi bersifat **abadi (immutable)**. Jika 5 bulan lagi saya mengganti nama produk atau menghapus produk tersebut, struk transaksi yang lama tidak akan berubah namanya atau menjadi *error/null*, karena nama produk pada saat transaksi itu dibeli sudah "difoto" dan disimpan di kolom `product_name` tersebut.

### 11. Mengapa kolom `item_id` di tabel `transaction_items` diset `DEFAULT NULL`?
**Jawaban:** Hal ini berfungsi agar jika suatu saat produk dihapus dari tabel master (tabel `products`), data transaksi tidak ikut terhapus. `item_id` bisa berubah jadi `NULL` (SET NULL), tapi kita tetap punya jejak data dari field `product_name` yang dibahas sebelumnya.

---

## 🔐 Keamanan & JWT Authentication

### 12. Mengapa menggunakan JWT (JSON Web Token) dan bukan Session Login biasa (berbasis Cookies)?
**Jawaban:** JWT bersifat *Stateless*. Server Node.js tidak perlu menyimpan data session di RAM memori server. Token JWT disimpan di sisi *Client* (Local Storage/Frontend). Ini sangat menghemat beban server, terutama untuk aplikasi berskala Enterprise dengan banyak cabang.

### 13. [⚠️ JEBAKAN] Berapa lama `expiresIn` Token JWT Anda? Apa risikonya jika token tersebut dicuri hacker?
**Jawaban:** Berdasarkan kode di `authController.js`, masa aktif token saya di-set `'1d'` (1 hari). Jika dicuri sebelum 1 hari, hacker bisa mengakses API sebagai user tersebut karena JWT sifatnya tidak bisa di-logout/dibatalkan (*stateless*) secara sepihak dari server. Solusi mahirnya adalah menerapkan *Blacklist Token* di database atau memendekkan umur token menjadi 15 menit dan dipadukan dengan *Refresh Token*.

### 14. Bagaimana Anda mengirimkan JWT Token dari Frontend React ke API Backend Node.js?
**Jawaban:** Di file `src/utils/api.js`, setiap kali `apiFetch` dipanggil, saya mengambil token dari `localStorage` dan menyisipkannya ke dalam header request HTTP dengan format `Authorization: Bearer <TOKEN>`. Di backend, `auth.js` middleware menangkap header tersebut dan mem-verifikasinya menggunakan `jwt.verify`.

---

## 🛡️ Role-Based Access Control (RBAC)

### 15. Jelaskan implementasi RBAC (Role-Based Access Control) di aplikasi ini!
**Jawaban:** Di project ini, ada 1 *Single Source of Truth* yaitu file `permissions.js`. Saya membagi user menjadi 4 Role: `Manager`, `Operator`, `Kasir`, dan `Konsumen`. Setiap role di-mapping ke daftar *ID menu tab* yang spesifik. Fungsi helper `canAccess()` digunakan untuk memvalidasi apakah role pengguna berhak melihat menu tertentu.

### 16. Bagaimana cara Anda mencegah Konsumen "memaksa" masuk ke halaman Dashboard Manager menggunakan *Inspect Element*?
**Jawaban:** Di frontend, di dalam file `AdminDashboard.jsx`, saya membuat komponen *Tab Guard* ( `<Unauthorized />` ). Jika `canAccess()` mengembalikan nilai `false`, UI akan diblokir total dan menampilkan notifikasi "Akses Ditolak". Di sisi Backend, middleware RBAC juga memblokir request API agar data tidak bocor.

### 17. Apa yang terjadi jika nama role di database (misal: "Admin") tidak terdaftar di daftar Konstanta Role di frontend?
**Jawaban:** Sistem keamanan otomatis (*Fail-Safe*) akan membuat variabel array *allowed permissions* menjadi `undefined` atau kosong `[]`. Ini akan menyebabkan `canAccess` mengembalikan false, dan user akan tertahan di halaman peringatan tanpa bisa melakukan akses menu apapun.

---

## 🔌 API & Transaction Flow

### 18. Apa perbedaan method `PUT` dan `POST` dalam struktur API yang Anda buat?
**Jawaban:** Sesuai prinsip RESTful API, `POST` digunakan untuk **membuat data baru** (seperti membuat akun Staf baru atau membuat Transaksi POS baru). Sedangkan `PUT` digunakan untuk **memperbarui data secara penuh** (seperti meng-update profil *name* dan *email* milik user).

### 19. Jelaskan bagaimana Anda memanipulasi *Upload Image* (Gambar Produk/Profil)?
**Jawaban:** Frontend mengirim data dalam format `FormData` (multipart/form-data) karena berisi file binari. Di Node.js, request ini ditangkap menggunakan middleware `multer`, lalu file disimpan di folder `uploads/` server. Kemudian, nama file-nya saja (teks) yang disimpan di tabel MySQL.

### 20. Bagaimana cara Anda memastikan bahwa harga pesanan yang dihitung frontend tidak dimanipulasi oleh *hacker* sebelum masuk database?
**Jawaban:** *(Jika dosen jeli, di kode saat ini harga diambil mentah dari payload request)*. Solusi terbaik yang harus ditekankan adalah: Di backend, server harus melakukan kalkulasi ulang (mengalikan `qty` dengan nilai `price` asli yang langsung ditarik dari tabel produk DB), sehingga mengabaikan total harga yang diklaim oleh frontend.

---

## 💸 SmartBank / Midtrans Integration

### 21. Bagaimana cara aplikasi ini memverifikasi bahwa pembayaran dari QRIS berhasil masuk?
**Jawaban:** Frontend akan melakukan *polling* (mengecek berulang kali) setiap 3 detik ke endpoint `api/pos/status/:invoice`. Di dunia nyata, Midtrans akan mengirimkan *Webhook / Callback API* ke server Node.js kita jika pelanggan berhasil mentransfer dana, sehingga status transaksi diubah dari `Pending` menjadi `Selesai`.

### 22. Jika server Midtrans sedang gangguan/down, apa *fallback* (solusi cadangan) pada aplikasi Anda?
**Jawaban:** Karena status awal pembayaran QRIS dimasukkan sebagai `Pending` di database, dan kasir bebas mengganti "Metode Pembayaran", jika QRIS gagal/down, kasir bisa langsung membatalkan tab tersebut atau beralih mencatat metode pembayarannya menjadi `Cash`.

---

## 🧬 Algoritma KMP (String Matching)

### 23. Jelaskan cara kerja algoritma Knuth-Morris-Pratt (KMP) yang Anda pakai untuk fitur pencarian!
**Jawaban:** Algoritma KMP digunakan saat admin mengetik pencarian di form Cari Produk. Alih-alih mengecek kecocokan per karakter dari awal terus menerus (seperti metode *Naïve String Matching* yang lambat), KMP menghindari pengecekan ulang karakter yang sudah diketahui cocok dengan memanfaatkan tabel bantuan bernama **LPS (Longest Prefix Suffix)**.

### 24. [⚠️ JEBAKAN] Di mana array LPS itu dihitung, dan nilai apa yang disimpannya?
**Jawaban:** LPS dihitung dalam fungsi `buildLPSTable(pattern)`. Array ini menyimpan panjang maksimum dari *prefix* dari substring pola pencarian (keyword) yang juga merupakan *suffix*-nya. Hal ini memberi tahu algoritma "seberapa banyak karakter yang bisa kita lewati (skip)" tanpa mundur ke indeks teks awal jika terjadi ketidakcocokan (*mismatch*).

### 25. [⚠️ JEBAKAN] Kenapa susah-susah pakai KMP padahal di JavaScript sudah ada fungsi `String.includes()` atau `RegExp`?
**Jawaban:** *(Ini krusial)* Fungsi bawaan JavaScript memang mudah, tetapi project ini mengimplementasikan algoritma KMP untuk **membuktikan pemahaman fundamental mahasiswa terhadap Analisis Algoritma dan Struktur Data (AASD)**. KMP menjamin kompleksitas waktu **O(N + M)**, di mana N adalah panjang nama produk, dan M adalah panjang keyword pencarian, membuatnya efisien secara logis di atas kertas.

---

## 🔢 Binary Search (Decrease & Conquer)

### 26. Bagaimana Anda mengimplementasikan Binary Search pada aplikasi ini?
**Jawaban:** Saya menerapkannya di *Decrease & Conquer* pada fungsi `binarySearchById` di frontend. Saat kasir mengklik sebuah produk ke keranjang, sistem harus memvalidasi ID produk. Karena daftar produk sebelumnya *sudah diurutkan (sorted)* berdasarkan ID, fungsi ini mencari nilai ID dengan cara membelah himpunan data menjadi dua (nilai tengah / `mid`) secara terus menerus hingga ditemukan, menghasilkan pencarian yang jauh lebih cepat daripada me-looping *array* satu per satu.

### 27. [⚠️ JEBAKAN] Apa syarat mutlak berjalannya Binary Search, dan bagaimana Anda menjamin hal tersebut?
**Jawaban:** Syarat **MUTLAK** Binary Search adalah data **harus sudah terurut (sorted)**. Saya menjaminnya di `AdminDashboard.jsx`, dimana data hasil `fetchProducts` dari API langsung diurutkan dengan fungsi mutasi: `data.sort((a, b) => a.id - b.id)` secara Ascending, sebelum di-pass ke algoritma Binary Search.

### 28. Bagaimana jika ID produk di database ada yang loncat (misal ID 1, 3, 5 karena ada yang dihapus)? Apakah Binary Search Anda *error*?
**Jawaban:** **Tidak error.** Karena Binary Search membandingkan **nilai dari ID produk** (`midProduct.id === targetId`), bukan mencari kecocokan indeks array secara membabi-buta. Selama susunan nilainya terus terurut membesar (1, 3, 5), logika `if (midProduct.id < targetId)` akan selalu akurat membelah area pencarian ke kanan atau ke kiri.

---

## 💰 Greedy Algorithm

### 29. Di mana dan untuk apa Anda menggunakan Algoritma Greedy?
**Jawaban:** Algoritma Greedy saya gunakan untuk membangun fitur **"Kalkulator Pecahan Uang Kembalian Kasir"**. Fungsi `getGreedyChange` menghitung sisa kembalian dan berusaha memecahnya menggunakan lembaran uang yang **paling besar terlebih dahulu** (dari Rp100.000, lalu ke Rp50.000, dst), agar kasir memberikan jumlah lembar kertas/koin sesedikit mungkin kepada pembeli.

### 30. [⚠️ JEBAKAN] Apakah Algoritma Greedy *selalu* menjamin lembaran uang paling optimal?
**Jawaban:** **TIDAK SELALU**, tetapi **YA** untuk sistem denominasi mata uang Rupiah standar Indonesia. Kondisi Greedy bisa gagal menjadi optimal jika kita menggunakan "mata uang fiktif" dengan denominasi aneh (misal koin pecahan 1, 3, dan 4, lalu mencari kembalian 6. Greedy akan mengambil 4+1+1 = 3 koin. Padahal solusi optimalnya adalah Dynamic Programming 3+3 = 2 koin). Namun, karena project saya secara konstan menggunakan pecahan standar kanonikal IDR (`[100000, 50000, 20000, 10000, 5000...]`), maka sifat **Greedy Choice Property** terbukti valid dan selalu optimal di sistem ini.
