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

## Cara Menjalankan Localhost


### 1. Setup Backend (Flask)

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

# Edit file .env untuk konfigurasi API endpoint, dll
```

##### c. Jalankan Development Server
```bash
# Jalankan development server
npm run dev

# Server akan berjalan di http://localhost:5173
```

