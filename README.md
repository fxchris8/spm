<!-- @faw_sd -->

# Ship Personnel Management (SPM) System

Sistem manajemen personel kapal yang dirancang untuk mengelola rotasi, promosi, dan penjadwalan awak kapal. Sistem ini membantu dalam perencanaan rotasi nahkoda, KKM (Kepala Kamar Mesin), dan crew lainnya di berbagai jenis kapal.

## Deskripsi Repository

### Back-end

- **Framework**: Flask (Python)
- **Fungsi**:
  - API untuk manajemen data seaman/awak kapal
  - Sistem rekomendasi menggunakan Word2Vec dan similarity matching
  - Penjadwalan otomatis rotasi crew
  - Integrasi dengan data API eksternal
  - Background scheduler untuk fetch data berkala

### Database

- **DBMS**: PostgreSQL
- **Fungsi**:
  - Menyimpan data seaman/awak kapal
  - Menyimpan data rotasi dan penjadwalan
  - Menyimpan data mutasi dan promosi
  - Menyimpan data training dan sertifikasi
  - Tracking history perubahan data
- **Setup Tools**:
  - `db_setup.py` - Membuat struktur database dan tabel
  - `seeder.py` - Mengisi data awal untuk development/testing
  - `scheduler.py` - Background task untuk sinkronisasi data

### Front-end

- **Framework**: React 19 + TypeScript
- **UI Library**: Flowbite React + Tailwind CSS
- **Fungsi**:
  - Dashboard monitoring awak kapal
  - Interface untuk rotasi container dan manalagi ships
  - Manajemen promosi nahkoda dan KKM
  - Export data ke Excel
  - Search dan filter data crew

---

## Cara Menjalankan Aplikasi

### Option 1: Menggunakan Docker (Recommended for Production)

Docker deployment menyediakan environment yang konsisten dan mudah di-deploy.

#### Prerequisites
- Docker Engine (v20.10+)
- Docker Compose (v2.0+)

#### Setup dan Menjalankan

```bash
# 1. Clone repository
git clone <repository-url>
cd spm

# 2. Copy environment file
cp .env.docker .env

# 3. Edit .env dan isi semua nilai yang diperlukan
# Pastikan DB_PASSWORD, EMAIL, dan API credentials sudah diisi
nano .env  # atau gunakan text editor favorit Anda

# 4. Build dan jalankan semua services
docker-compose up -d

# 5. Setup database (hanya pertama kali)
docker exec -it spm-backend python database/db_setup.py
docker exec -it spm-backend python database/seeder.py

# 6. Cek logs untuk memastikan semua berjalan
docker-compose logs -f

# 7. Akses aplikasi
# - Frontend: http://localhost:8047
# - Backend API: http://localhost:8048
# - PostgreSQL: localhost:5432
```

#### Perintah Docker yang Berguna

```bash
# Stop semua services
docker-compose down

# Stop dan hapus semua data (termasuk database)
docker-compose down -v

# Rebuild image setelah perubahan kode
docker-compose up -d --build

# Lihat logs service tertentu
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
docker-compose logs -f scheduler

# Restart service tertentu
docker-compose restart backend

# Masuk ke container untuk debugging
docker exec -it spm-backend sh
docker exec -it spm-frontend sh
docker exec -it spm-postgres psql -U postgres -d spm
```

#### Port Mapping (Docker)
- **Frontend**: `8047` → internal `5173` (development) atau `80` (production)
- **Backend**: `8048` → internal `5000`
- **PostgreSQL**: `5432` → internal `5432`

---

### Option 2: Menjalankan Localhost (Development)

Untuk development dengan live reload dan debugging.

#### 1. Setup Backend (Flask)

##### a. Install Dependencies
```bash
# Masuk ke direktori back-end
cd back-end

# Install dependencies Python
pip install -r requirements.txt
```

##### b. Setup Environment Variables
```bash
# Salin file .env.example menjadi .env
cp .env.example .env

# Edit file .env sesuai konfigurasi Anda
# Pastikan semua variabel yang diperlukan sudah diisi
```

##### c. Setup Database dan Data Awal
Jalankan script-script berikut secara berurutan:

```bash
# 1. Setup database (membuat tabel-tabel)
python database/db_setup.py
# Opsi: python database/db_setup.py --drop (untuk drop & recreate semua tabel)

# 2. Seeding data awal (mengisi data ke database)
python database/seeder.py
# Opsi: python database/seeder.py --fresh (untuk hapus data lama & insert data baru)

# 3. Jalankan scheduler (background task untuk fetch data berkala)
python database/scheduler.py
# Opsi: python database/scheduler.py --manual (untuk run sekali tanpa schedule otomatis)

# 4. Jalankan Flask server
python app.py

# Server akan berjalan di http://localhost:8048
```

**Catatan:**
- `db_setup.py` - Membuat struktur database dan tabel-tabel yang diperlukan
  - Gunakan `--drop` untuk drop dan recreate semua tabel (hati-hati, data akan hilang!)
- `seeder.py` - Mengisi data awal untuk testing/development
  - Gunakan `--fresh` untuk menghapus data lama dan insert data baru
- `scheduler.py` - Background task untuk fetch dan sinkronisasi data berkala
  - Gunakan `--manual` untuk menjalankan sekali saja tanpa schedule otomatis
  - Jika dijalankan tanpa parameter, akan berjalan sebagai background scheduler
- `app.py` - Server utama aplikasi

### 2. Setup Frontend (React)

##### a. Install Dependencies
```bash
# Masuk ke direktori front-end (dari root project)
cd front-end

# Install dependencies Node.js
npm install
```

##### b. Setup Environment Variables
```bash
# Salin file .env.example menjadi .env (jika ada)
cp .env.example .env

# Edit file .env untuk konfigurasi API endpoint
# VITE_API_BASE_URL=http://localhost:8048/api
```

##### c. Jalankan Development Server
```bash
# Jalankan development server
npm run dev

# Server akan berjalan di http://localhost:5173
```

#### Port Mapping (Localhost)
- **Frontend**: `5173` (Vite default)
- **Backend**: `8048`
- **PostgreSQL**: `5432` (tergantung instalasi PostgreSQL lokal Anda)

---

## Environment Variables

### Backend (.env di back-end/)
```env
# Database
DB_HOST=localhost         # atau 'database' untuk Docker
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=spm

# Email
EMAIL_SENDER=your-email@example.com
EMAIL_PASSWORD=your_app_password
EMAIL_RECIPIENTS=recipient@example.com

# External APIs
API_BASE_URL_PUSAT=https://api-pusat.example.com
API_BASE_URL_IT=https://api-it.example.com
```

### Frontend (.env di front-end/)
```env
VITE_API_BASE_URL=http://localhost:8048/api
```

### Docker (.env di /)
```env
# Database
DB_HOST=database
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=spm

# Email
EMAIL_SENDER=your-email@example.com
EMAIL_PASSWORD=your_app_password
EMAIL_RECIPIENTS=recipient@example.com

# External APIs
API_BASE_URL_PUSAT=https://api-pusat.example.com
API_BASE_URL_IT=https://api-it.example.com

# Flask
FLASK_ENV=production
FLASK_DEBUG=0

VITE_API_BASE_URL=http://localhost:8048/api

BUILD_TARGET=development
```

---

## API Documentation

### Change Schedule Rotation API

API untuk tim IT apabila ada kru yang tidak ready.

**Endpoint:** `POST http://pe.spil.co.id:8048/api/change-schedule-rotation`

#### API V1

Parameter:
1. `seamencode` - Seaman Code kru yang tidak ready
2. `tanggalready` - Tanggal kru ready
3. `statusdata` - Status data dengan value "CHANGE"

**Request Body:**
```json
{
  "seamencode": "20190451",
  "tanggalready": "25-12-2025",
  "statusdata": "CHANGE"
}
```

#### API V2

Parameter tambahan:
4. `stage` - Informasi stage dimana kru tidak ready atau gagal ("KONFIRMASI ROB" atau "FAMILIARISASI")

**Request Body:**
```json
{
  "seamencode": "20040116",
  "tanggalready": "24-02-2026",
  "statusdata": "CHANGE",
  "stage": "FAMILIARISASI"
}
```

> **Note:** Nilai `stage` yang valid adalah `KONFIRMASI ROB` atau `FAMILIARISASI`

---

## Development Workflow

### Sebelum Commit ke Repository

Sebelum melakukan `git add`, pastikan untuk menjalankan pre-commit hooks untuk memastikan kode sudah sesuai dengan standar:

```bash
# Jalankan pre-commit pada semua file
pre-commit run --all-files
```

Pre-commit akan melakukan pengecekan seperti:
- Linting dan formatting kode
- Validasi syntax
- Pengecekan lainnya sesuai konfigurasi `.pre-commit-config.yaml`

Jika ada error, perbaiki terlebih dahulu sebelum melakukan commit.

---

## Contributors

- [@hilmifawwazsaad](https://github.com/hilmifawwazsaad)
- [@fxchris8](https://github.com/fxchris8)
- [@FourzeBlitz](https://github.com/FourzeBlitz)
- [@FransiscusSuhargo](https://github.com/FransiscusSuhargo)
- [@Miuura](https://github.com/Miuura)

---