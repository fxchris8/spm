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

### Front-end

- **Framework**: React 19 + TypeScript
- **UI Library**: Flowbite React + Tailwind CSS
- **Fungsi**:
  - Dashboard monitoring awak kapal
  - Interface untuk rotasi container dan manalagi ships
  - Manajemen promosi nahkoda dan KKM
  - Export data ke Excel
  - Search dan filter data crew

## Cara Menjalankan

### Menggunakan Docker Compose (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd spm

# Build dan jalankan semua services
docker-compose up --build

# Akses aplikasi:
# Frontend: http://localhost:8047
# Backend API: http://localhost:8048
```

### Menjalankan di Localhost

#### 1. Setup Backend (Flask)

```bash
# Masuk ke direktori back-end
cd back-end

# Install dependencies
pip install -r requirements.txt

# Jalankan Flask server
python app.py

# Server akan berjalan di http://localhost:5000
```

#### 2. Setup Frontend (React)

```bash
# Masuk ke direktori front-end
cd front-end

# Install dependencies
npm install

# Jalankan development server
npm run dev

# Server akan berjalan di http://localhost:5173
```

### Environment Variables

Pastikan mengatur environment variable dengan melihat file .env.example

