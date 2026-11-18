<div align="center">

# 🌱 KompasDesa

**Marketplace pertanian yang menghubungkan petani langsung dengan pembeli.**

Aplikasi mobile Flutter dengan REST API Express + TypeScript dan database PostgreSQL.

![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter&logoColor=white)
![Dart](https://img.shields.io/badge/Dart-3.x-0175C2?logo=dart&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)

</div>

---

## 📖 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Arsitektur](#-arsitektur)
- [Struktur Proyek](#-struktur-proyek)
- [Memulai](#-memulai)
- [Variabel Lingkungan](#-variabel-lingkungan)
- [Dokumentasi API](#-dokumentasi-api)
- [Skema Database](#-skema-database)
- [Alur Status Pesanan](#-alur-status-pesanan)
- [Roadmap](#-roadmap)

---

## 🌾 Tentang Proyek

**KompasDesa** adalah platform jual-beli hasil pertanian. Petani bisa memasarkan produknya sendiri tanpa perantara, dan pembeli bisa mendapatkan produk segar langsung dari sumbernya.

Aplikasi punya dua peran pengguna:

| Peran | Deskripsi |
|-------|-----------|
| 🧑‍🌾 **Petani** | Mengelola produk dan kategori, memproses pesanan masuk, dan memantau penjualan lewat dashboard. |
| 🛒 **Pembeli** | Menjelajahi katalog, mengelola keranjang, checkout, dan melacak status pesanan. |

---

## ✨ Fitur

### Pembeli
- 🔐 Registrasi & login dengan JWT (sesi tersimpan di perangkat)
- 🏠 Beranda dengan ringkasan aktivitas
- 🔎 Katalog produk & halaman detail produk
- 🛒 Keranjang belanja (tambah, ubah jumlah, hapus, kosongkan)
- 📦 Checkout dengan alamat pengiriman
- 📋 Riwayat & detail pesanan, termasuk pembatalan pesanan berstatus `pending`
- 👤 Kelola profil (nama, no. HP, alamat)

### Petani
- 📊 Dashboard statistik: total produk, produk aktif, total pesanan, dan pendapatan
- 🌿 CRUD produk (nama, deskripsi, harga, stok, satuan, foto)
- 🗂️ CRUD kategori produk
- 📥 Kelola pesanan masuk & ubah status pesanan
- 🧾 Riwayat penjualan

### Sistem
- ✅ Validasi input di setiap endpoint menggunakan **Zod**
- 🛡️ Otorisasi berbasis peran (`pembeli` / `petani`) lewat middleware
- 🔁 Checkout memakai transaksi database, jadi stok dan pesanan tetap konsisten
- 📚 Dokumentasi API interaktif dengan **Swagger UI**

---

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Mobile** | Flutter (Material 3), Dart, `http`, `shared_preferences` |
| **Backend** | Node.js, Express 5, TypeScript, `tsx`, `nodemon` |
| **Database** | PostgreSQL (`pg`) |
| **Auth** | JSON Web Token (`jsonwebtoken`), `bcrypt` |
| **Validasi** | Zod |
| **Dokumentasi** | Swagger (`swagger-jsdoc`, `swagger-ui-express`) |
| **Pembayaran** | Midtrans Snap *(sedang dikembangkan)* |

---

## 🏗 Arsitektur

```
┌──────────────────────┐        HTTPS / JSON        ┌──────────────────────────┐        ┌──────────────┐
│   Flutter Mobile App │ ─────────────────────────▶ │   Express REST API (TS)  │ ─────▶ │  PostgreSQL  │
│                      │   Authorization: Bearer    │                          │  pg    │              │
│  screens → services  │ ◀───────────────────────── │ routes → middleware →    │ ◀───── │              │
│  session (JWT lokal) │                            │ controllers → validations│        └──────────────┘
└──────────────────────┘                            └────────────┬─────────────┘
                                                                 │
                                                                 ▼
                                                          Midtrans Snap API
                                                        (integrasi pembayaran)
```

**Alur request di backend:**
`Route` → `authMiddleware` (verifikasi JWT) → `role()` (cek peran) → `Controller` (validasi Zod + query) → `errorHandler`

---

## 📁 Struktur Proyek

```
.
├── backend/                     # REST API
│   ├── migrations/              # File SQL migrasi berurutan (001–012)
│   └── src/
│       ├── config/              # Koneksi database & konfigurasi Swagger
│       ├── controllers/         # Logika bisnis tiap resource
│       ├── middleware/          # Auth JWT, role guard, error handler
│       ├── routes/              # Definisi endpoint
│       ├── services/            # Integrasi pihak ketiga (Midtrans)
│       ├── types/               # Deklarasi tipe tambahan Express
│       ├── validations/         # Skema Zod
│       └── index.ts             # Entry point server
│
└── mobile/                      # Aplikasi Flutter
    └── lib/
        ├── config/              # Tema aplikasi & manajemen sesi
        ├── models/              # Model data
        ├── screens/             # Halaman pembeli & petani
        ├── services/            # HTTP client & service per resource
        ├── widgets/             # Shell navigasi & komponen reusable
        └── main.dart            # Entry point + splash / cek sesi
```

---

## 🚀 Memulai

### Prasyarat

- [Node.js](https://nodejs.org/) **v20.6+** (wajib, karena dev script memakai flag `--env-file`)
- [PostgreSQL](https://www.postgresql.org/) **v14+**
- [Flutter SDK](https://docs.flutter.dev/get-started/install) **3.x** (Dart SDK `^3.13`)
- Emulator Android/iOS atau perangkat fisik

### 1. Clone repository

```bash
git clone <url-repository>
cd <nama-folder>
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Buat file `.env` di folder `backend/` (lihat bagian [Variabel Lingkungan](#-variabel-lingkungan)).

**Buat database & jalankan migrasi:**

```bash
createdb kompasdesa

# Jalankan semua file migrasi secara berurutan
for f in migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

> 💡 Pengguna Windows (PowerShell):
> ```powershell
> Get-ChildItem migrations\*.sql | Sort-Object Name | ForEach-Object { psql $env:DATABASE_URL -f $_.FullName }
> ```

**Jalankan server development:**

```bash
npm run dev
```

Server berjalan di `http://localhost:5000` dan dokumentasi API tersedia di `http://localhost:5000/api-docs`.

### 3. Setup Mobile

```bash
cd mobile
flutter pub get
```

Atur URL API di `mobile/lib/services/config.dart`:

```dart
class AppConfig {
  const AppConfig._();
  static const String baseUrl = 'http://localhost:5000/api';
}
```

| Target | `baseUrl` |
|--------|-----------|
| Web / Desktop / iOS Simulator | `http://localhost:5000/api` |
| Android Emulator | `http://10.0.2.2:5000/api` |
| Perangkat fisik | `http://<IP-LAN-komputer>:5000/api` |

Lalu jalankan aplikasi:

```bash
flutter run
```

---

## 🔑 Variabel Lingkungan

Buat file `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/kompasdesa

# Auth
JWT_SECRET=ganti_dengan_string_acak_yang_panjang

# Midtrans (opsional, untuk fitur pembayaran)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

| Variabel | Wajib | Keterangan |
|----------|:-----:|------------|
| `PORT` | ❌ | Port server (default `5000`) |
| `NODE_ENV` | ❌ | Isi `production` untuk mengaktifkan SSL pada koneksi database |
| `API_URL` | ❌ | URL server production untuk Swagger |
| `DATABASE_URL` | ✅ | Connection string PostgreSQL |
| `JWT_SECRET` | ✅ | Secret untuk menandatangani token JWT (berlaku 7 hari) |
| `MIDTRANS_SERVER_KEY` | ❌ | Server key Midtrans |
| `MIDTRANS_IS_PRODUCTION` | ❌ | `true` untuk mode production Midtrans |

> ⚠️ File `.env` sudah masuk `.gitignore`. Jangan pernah commit kredensial ke repository.

---

## 📚 Dokumentasi API

Base URL: `http://localhost:5000/api`
Dokumentasi interaktif: **`/api-docs`** (Swagger UI)

Endpoint yang butuh login wajib menyertakan header:
```
Authorization: Bearer <token>
```

### 🔐 Auth — `/api/auth`
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `POST` | `/register` | Publik | Registrasi akun (`nama`, `email`, `password`, `role`) |
| `POST` | `/login` | Publik | Login dan mendapatkan token JWT |

### 👤 Users — `/api/users`
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/profile` | Login | Ambil profil pengguna |
| `PUT` | `/profile` | Login | Ubah profil (`nama`, `no_hp`, `alamat`) |

### 🌿 Products — `/api/products`
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/` | Publik | Daftar produk |
| `GET` | `/:id` | Publik | Detail produk |
| `POST` | `/` | Petani | Tambah produk |
| `PUT` | `/:id` | Petani | Ubah produk |
| `DELETE` | `/:id` | Petani | Hapus produk |

### 🗂️ Categories — `/api/categories`
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/` | Publik | Daftar kategori |
| `GET` | `/:id` | Publik | Detail kategori |
| `POST` | `/` | Petani | Tambah kategori |
| `PUT` | `/:id` | Petani | Ubah kategori |
| `DELETE` | `/:id` | Petani | Hapus kategori |

### 🛒 Cart — `/api/cart`
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/` | Pembeli | Lihat isi keranjang |
| `POST` | `/items` | Pembeli | Tambah item (`product_id`, `jumlah`) |
| `PUT` | `/items/:id` | Pembeli | Ubah jumlah item |
| `DELETE` | `/items/:id` | Pembeli | Hapus item |
| `DELETE` | `/` | Pembeli | Kosongkan keranjang |

### 📦 Orders — `/api/orders`
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `POST` | `/` | Login | Checkout dari keranjang (`alamat_pengiriman`) |
| `GET` | `/` | Login | Daftar pesanan (sesuai peran) |
| `GET` | `/:id` | Login | Detail pesanan |
| `PATCH` | `/:id/status` | Petani penjual | Ubah status pesanan |
| `PATCH` | `/:id/cancel` | Pembeli | Batalkan pesanan berstatus `pending` |

### 📊 Dashboard — `/api/dashboard`
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/` | Login | Statistik ringkas sesuai peran pengguna |

<details>
<summary><b>Contoh request &amp; response</b></summary>

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "petani@example.com",
  "password": "rahasia123"
}
```
```json
{
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "petani@example.com", "role": "petani" }
}
```

**Format error**
```json
{
  "error": "Input tidak valid",
  "detail": [ { "path": ["email"], "message": "Invalid email address" } ]
}
```
</details>

---

## 🗄 Skema Database

```
users ─┬──< products >── categories
       │       │
       │       ├──< cart_items >── carts ── users (buyer)
       │       │
       ├──< orders (buyer_id / farmer_id) ──< order_items >── products
       │       │
       │       └──< payments
```

| Tabel | Keterangan |
|-------|------------|
| `users` | Akun pengguna dengan `role` `pembeli` atau `petani` |
| `categories` | Kategori produk |
| `products` | Produk milik petani (harga, stok, satuan, foto, status) |
| `carts` | Satu keranjang untuk setiap pembeli |
| `cart_items` | Item di dalam keranjang |
| `orders` | Pesanan antara pembeli dan petani |
| `order_items` | Snapshot produk, harga, dan jumlah saat checkout |
| `payments` | Data transaksi pembayaran |

**Enum:**
- `product_status`: `active`, `inactive`, `draft`, `out_of_stock`
- `order_status`: `pending`, `confirmed`, `processing`, `shipped`, `completed`, `cancelled`
- `payment_status`: `pending`, `paid`, `failed`, `expired`, `refunded`

---

## 🔄 Alur Status Pesanan

```
  pending ──▶ confirmed ──▶ processing ──▶ shipped ──▶ completed
     │
     └──▶ cancelled   (dibatalkan pembeli selama masih pending)
```

- **Pembeli** hanya bisa membatalkan pesanan selama statusnya `pending`.
- **Petani** pemilik pesanan yang memperbarui status ke tahap selanjutnya.

---

## 🗺 Roadmap

- [x] Autentikasi JWT & role-based access
- [x] CRUD produk & kategori
- [x] Keranjang & checkout
- [x] Manajemen status pesanan
- [x] Dashboard petani & pembeli
- [x] Dokumentasi Swagger
- [ ] Integrasi pembayaran Midtrans Snap (service sudah ada, route belum diaktifkan)
- [ ] Upload foto produk ke Cloudinary
- [ ] Script migrasi otomatis (`npm run migrate`)
- [ ] Unit & integration testing

---

<div align="center">

Dibuat untuk **Uji Level — SMK Taruna Bhakti** 🎓

</div>
