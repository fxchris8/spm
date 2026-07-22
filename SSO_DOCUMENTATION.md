# Dokumentasi SSO Portal SPM

Dokumen ini menjelaskan cara kerja sistem SSO (Single Sign-On) yang telah dibangun, serta panduan lengkap untuk mengintegrasikan website/aplikasi lain ke dalam sistem ini.

---

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Alur OAuth 2.0 (Authorization Code Flow)](#alur-oauth-20-authorization-code-flow)
- [Mendaftarkan Aplikasi Baru](#mendaftarkan-aplikasi-baru)
- [Panduan Integrasi untuk Developer Aplikasi](#panduan-integrasi-untuk-developer-aplikasi)
  - [Yang Dibutuhkan](#yang-dibutuhkan)
  - [Langkah 1 — Arahkan pengguna ke SSO Portal](#langkah-1--arahkan-pengguna-ke-sso-portal)
  - [Langkah 2 — Tangkap Authorization Code di Callback](#langkah-2--tangkap-authorization-code-di-callback)
  - [Langkah 3 — Tukar Authorization Code dengan Token](#langkah-3--tukar-authorization-code-dengan-token)
  - [Langkah 4 — Simpan dan Gunakan Access Token](#langkah-4--simpan-dan-gunakan-access-token)
  - [Langkah 5 — Refresh Access Token](#langkah-5--refresh-access-token)
- [Referensi Endpoint OAuth](#referensi-endpoint-oauth)
- [Referensi Endpoint Auth (SSO Portal Internal)](#referensi-endpoint-auth-sso-portal-internal)
- [Format Response](#format-response)
- [Error Codes](#error-codes)
- [Contoh Implementasi](#contoh-implementasi)
  - [Node.js / Express](#nodejs--express)
  - [PHP / Laravel](#php--laravel)
  - [Python / Django atau Flask](#python--django-atau-flask)
- [Manajemen Akses Pengguna](#manajemen-akses-pengguna)
- [Keamanan dan Catatan Penting](#keamanan-dan-catatan-penting)
- [Implementasi pada Certificate Storage Management](#implementasi-pada-certificate-storage-management)
  - [Gambaran Arsitektur](#gambaran-arsitektur)
  - [Perubahan Database](#perubahan-database)
  - [Environment Variables](#environment-variables)
  - [Struktur File yang Dibuat/Diubah](#struktur-file-yang-dibuatdiubah)
  - [Alur Lengkap di Aplikasi Ini](#alur-lengkap-di-aplikasi-ini)
  - [Flow Login jika Redirect dari Aplikasi Portal](#flow-login-jika-redirect-dari-aplikasi-portal)
  - [Endpoint SSO di Aplikasi Ini](#endpoint-sso-di-aplikasi-ini)
  - [Strategi State CSRF](#strategi-state-csrf)
  - [Logika Find-or-Create User](#logika-find-or-create-user)
  - [Perilaku Login Normal vs SSO](#perilaku-login-normal-vs-sso)
  - [Catatan Networking Docker](#catatan-networking-docker)

---

## Gambaran Umum

SSO Portal SPM mengimplementasikan standar **OAuth 2.0 Authorization Code Flow**. Dengan sistem ini:

- Pengguna hanya perlu **login sekali** di SSO Portal, lalu bisa mengakses semua aplikasi yang telah diberikan akses.
- Setiap aplikasi **tidak menyimpan password** pengguna — autentikasi sepenuhnya dikelola oleh SSO Portal.
- Administrator dapat **mengatur aplikasi mana** yang bisa diakses oleh setiap pengguna.

### Komponen Utama

| Komponen | Deskripsi |
|----------|-----------|
| **SSO Portal** | Aplikasi pusat autentikasi (portal ini sendiri) |
| **Aplikasi Client** | Website/aplikasi lain yang ingin menggunakan SSO |
| **Authorization Code** | Kode sementara (berlaku 5 menit) yang ditukar dengan token |
| **Access Token** | Token opaque (berlaku 15 menit) untuk mengakses resource |
| **Refresh Token** | Token untuk memperbarui Access Token (berlaku 7 hari) |

---

## Alur OAuth 2.0 (Authorization Code Flow)

```
Pengguna          Aplikasi Client         SSO Portal
   │                    │                     │
   │── Klik "Login" ──►│                     │
   │                    │                     │
   │              Redirect ke SSO Portal      │
   │◄───────────────────┤                     │
   │                                          │
   │──────── Login (username + password) ───►│
   │                                          │
   │◄── Redirect ke callback_url?code=xxx ───│
   │                                          │
   │                    │                     │
   │                    │◄── POST /oauth/token (code=xxx, client_secret) ──►│
   │                    │                     │
   │                    │◄── { access_token, refresh_token } ──────────────│
   │                    │                     │
   │◄── Login berhasil ─┤                     │
   │                    │                     │
```

**Langkah-langkah:**
1. Pengguna mengklik tombol "Login dengan SSO" pada aplikasi client.
2. Aplikasi client mengarahkan pengguna ke endpoint `/oauth/authorize` di SSO Portal.
3. Pengguna login di SSO Portal (jika belum login).
4. SSO Portal memverifikasi bahwa pengguna memiliki akses ke aplikasi tersebut.
5. SSO Portal mengarahkan kembali pengguna ke `callbackUrl` aplikasi dengan `?code=xxx`.
6. Aplikasi client (dari sisi server) menukar `code` tersebut dengan `access_token` dan `refresh_token`.
7. Aplikasi client menggunakan `access_token` untuk sesi pengguna.

---

## Mendaftarkan Aplikasi Baru

Sebelum bisa menggunakan SSO, aplikasi harus didaftarkan oleh **Superadmin** melalui halaman **Manajemen Aplikasi** di SSO Portal.

### Data yang diperlukan saat pendaftaran

| Field | Deskripsi | Contoh |
|-------|-----------|--------|
| `name` | Nama tampilan aplikasi | `Sistem HRD` |
| `description` | Deskripsi singkat (opsional) | `Aplikasi manajemen HR` |
| `baseUrl` | URL utama aplikasi | `https://hrd.perusahaan.com` |
| `callbackUrl` | URL yang menerima authorization code | `https://hrd.perusahaan.com/auth/callback` |
| `iconUrl` | URL icon/logo aplikasi (opsional) | `https://hrd.perusahaan.com/icon.png` |

### Yang didapat setelah pendaftaran

Setelah aplikasi didaftarkan, sistem akan menghasilkan:

| Field | Deskripsi |
|-------|-----------|
| `client_id` | Identitas unik aplikasi (boleh publik) |
| `client_secret` | Kunci rahasia aplikasi (**JANGAN dibagikan atau taruh di frontend**) |

> **Simpan `client_secret` dengan aman.** Taruh di environment variable sisi server, tidak pernah di source code atau frontend.

---

## Panduan Integrasi untuk Developer Aplikasi

### Yang Dibutuhkan

Pastikan sudah memiliki:
- `client_id` — didapat dari Superadmin setelah aplikasi didaftarkan
- `client_secret` — didapat dari Superadmin setelah aplikasi didaftarkan
- Endpoint `callbackUrl` yang sudah disiapkan di aplikasi

**Base URL SSO Portal:**
```
https://sso.perusahaan.com   (production)
http://localhost:5000         (development, akses langsung ke backend)
http://localhost:3000         (development, melalui Vite proxy)
```

---

### Langkah 1 — Arahkan pengguna ke SSO Portal

Buat link atau redirect ke URL berikut:

```
GET {SSO_BASE_URL}/api/v1/oauth/authorize
```

**Query Parameters:**

| Parameter | Wajib | Deskripsi |
|-----------|-------|-----------|
| `client_id` | ✅ | Client ID aplikasi kamu |
| `redirect_uri` | ✅ | Harus sama persis dengan `callbackUrl` yang didaftarkan |
| `response_type` | ✅ | Selalu `code` |
| `state` | ❌ | String acak untuk mencegah CSRF (sangat direkomendasikan) |

**Contoh URL:**
```
https://sso.perusahaan.com/api/v1/oauth/authorize?client_id=abc123&redirect_uri=https://hrd.perusahaan.com/auth/callback&response_type=code&state=xyz789
```

**Respons:**
- Jika pengguna belum login: SSO Portal akan meminta login terlebih dahulu.
- Jika pengguna **tidak memiliki akses** ke aplikasi ini: akan mendapat error `403 Forbidden`.
- Jika berhasil: pengguna akan diarahkan ke `redirect_uri?code=AUTHORIZATION_CODE&state=xyz789`.

---

### Langkah 2 — Tangkap Authorization Code di Callback

Siapkan route/endpoint di aplikasi untuk menerima redirect dari SSO Portal.

**Contoh URL yang akan diterima:**
```
https://hrd.perusahaan.com/auth/callback?code=a1b2c3d4e5f6...&state=xyz789
```

Di sisi server, ambil `code` dari query parameter dan lanjutkan ke langkah 3.

> **Validasi `state`:** Bandingkan nilai `state` yang diterima dengan nilai yang kamu simpan sebelumnya (di session/cookie). Jika berbeda, tolak request untuk mencegah CSRF attack.

> **Jangan gunakan `code` lebih dari sekali.** Authorization code hanya bisa ditukar satu kali dan **kedaluwarsa dalam 5 menit**.

---

### Langkah 3 — Tukar Authorization Code dengan Token

Dari **sisi server** (bukan browser), kirim request berikut:

```
POST {SSO_BASE_URL}/api/v1/oauth/token
Content-Type: application/json
```

**Request Body:**
```json
{
  "grant_type": "authorization_code",
  "code": "AUTHORIZATION_CODE_DARI_LANGKAH_2",
  "redirect_uri": "https://hrd.perusahaan.com/auth/callback",
  "client_id": "CLIENT_ID_KAMU",
  "client_secret": "CLIENT_SECRET_KAMU"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "...",
  "data": {
    "access_token": "opaque_access_token_string",
    "refresh_token": "opaque_refresh_token_string",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

| Field | Deskripsi |
|-------|-----------|
| `access_token` | Token untuk sesi pengguna (berlaku **15 menit**) |
| `refresh_token` | Token untuk memperbarui access_token (berlaku **7 hari**) |
| `token_type` | Selalu `Bearer` |
| `expires_in` | Durasi access token dalam detik (900 = 15 menit) |

> ⚠️ Request ini harus dilakukan dari **server**, bukan browser, karena menggunakan `client_secret`.

---

### Langkah 4 — Simpan dan Gunakan Access Token

Setelah mendapat token:
1. Simpan `access_token` di session server (misalnya `express-session`, database, Redis).
2. Simpan `refresh_token` di tempat yang aman (database atau encrypted cookie HttpOnly).
3. Tandai pengguna sebagai "sudah login" di aplikasi kamu.

**Kamu TIDAK perlu memanggil endpoint tambahan untuk mendapatkan info profil pengguna** — `access_token` sendiri sudah menjadi bukti bahwa pengguna telah diautentikasi melalui SSO Portal.

Jika kamu perlu mengidentifikasi pengguna, kamu bisa decode payload JWT jika aplikasimu menggunakan JWT, atau simpan user identifier saat proses exchange.

---

### Langkah 5 — Refresh Access Token

Ketika `access_token` kedaluwarsa (setelah 15 menit), gunakan `refresh_token` untuk mendapatkan token baru tanpa perlu pengguna login ulang.

```
POST {SSO_BASE_URL}/api/v1/oauth/token
Content-Type: application/json
```

**Request Body:**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "REFRESH_TOKEN_KAMU",
  "client_id": "CLIENT_ID_KAMU",
  "client_secret": "CLIENT_SECRET_KAMU"
}
```

**Response (200 OK):** sama seperti langkah 3 — mendapat `access_token` dan `refresh_token` baru.

> **Catatan:** Setelah refresh, `refresh_token` lama hangus. Simpan `refresh_token` yang baru.

---

## Referensi Endpoint OAuth

Base path: `/api/v1/oauth`

### `GET /oauth/authorize`

Memulai alur OAuth. **Membutuhkan pengguna yang sudah login di SSO Portal** (via cookie/session SSO Portal).

| Parameter | Tipe | Wajib | Keterangan |
|-----------|------|-------|------------|
| `client_id` | string | ✅ | Client ID aplikasi |
| `redirect_uri` | string (URL) | ✅ | Harus sama dengan `callbackUrl` yang didaftarkan |
| `response_type` | `"code"` | ✅ | Harus bernilai `"code"` |
| `state` | string | ❌ | Nilai acak untuk CSRF protection |

**Response sukses:** Redirect ke `redirect_uri?code=xxx[&state=yyy]`

**Error:**
- `404` — `client_id` tidak ditemukan atau aplikasi tidak aktif
- `400` — `redirect_uri` tidak cocok dengan yang didaftarkan
- `403` — Pengguna tidak memiliki akses ke aplikasi ini
- `401` — Pengguna belum login di SSO Portal

---

### `POST /oauth/token`

Menukar authorization code atau refresh token menjadi access token. **Dipanggil dari server-side.**

**Content-Type:** `application/json`

#### Grant Type: `authorization_code`

```json
{
  "grant_type": "authorization_code",
  "code": "string",
  "redirect_uri": "string (URL)",
  "client_id": "string",
  "client_secret": "string"
}
```

#### Grant Type: `refresh_token`

```json
{
  "grant_type": "refresh_token",
  "refresh_token": "string",
  "client_id": "string",
  "client_secret": "string"
}
```

**Response sukses (200):**
```json
{
  "success": true,
  "message": "...",
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Error:**
- `401` — `client_secret` salah atau token tidak valid/kedaluwarsa
- `400` — `grant_type` tidak dikenal atau `code` tidak diberikan

---

## Referensi Endpoint Auth (SSO Portal Internal)

Base path: `/api/v1/auth`

Endpoint berikut digunakan oleh SSO Portal sendiri (bukan oleh aplikasi client).

### `POST /auth/login`

Login ke SSO Portal.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "JWT_STRING",
    "refreshToken": "JWT_STRING",
    "user": {
      "id": "uuid",
      "name": "string",
      "username": "string",
      "role": "user | superadmin"
    }
  }
}
```

---

### `POST /auth/refresh`

Memperbarui JWT access token SSO Portal (bukan OAuth token).

**Request Body:**
```json
{
  "refreshToken": "JWT_REFRESH_TOKEN"
}
```

---

### `GET /auth/me`

Mendapatkan profil pengguna yang sedang login (membutuhkan JWT Bearer token).

**Header:** `Authorization: Bearer <accessToken>`

---

### `GET /auth/me/applications`

Mendapatkan daftar aplikasi yang bisa diakses oleh pengguna yang sedang login.

**Header:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Sistem HRD",
      "iconUrl": "https://...",
      "isActive": true,
      "clientId": "abc123",
      "baseUrl": "https://hrd.perusahaan.com"
    }
  ]
}
```

---

## Format Response

Semua endpoint mengembalikan format JSON yang konsisten:

**Sukses:**
```json
{
  "success": true,
  "message": "Deskripsi pesan",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Deskripsi error",
  "errors": [ ... ]
}
```

---

## Error Codes

| HTTP Status | Keterangan |
|-------------|------------|
| `400 Bad Request` | Parameter tidak lengkap atau format salah |
| `401 Unauthorized` | Token tidak valid, kedaluwarsa, atau client_secret salah |
| `403 Forbidden` | Pengguna tidak memiliki akses ke aplikasi ini |
| `404 Not Found` | `client_id` atau resource tidak ditemukan |
| `422 Unprocessable Entity` | Validasi input gagal (format field salah) |
| `429 Too Many Requests` | Rate limit terlampaui (endpoint login) |

---

## Contoh Implementasi

### Node.js / Express

```javascript
// routes/auth.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const SSO_BASE_URL = process.env.SSO_BASE_URL; // https://sso.perusahaan.com
const CLIENT_ID = process.env.SSO_CLIENT_ID;
const CLIENT_SECRET = process.env.SSO_CLIENT_SECRET;
const CALLBACK_URL = process.env.SSO_CALLBACK_URL; // https://hrd.perusahaan.com/auth/callback

// Langkah 1: Arahkan ke SSO
router.get("/login", (req, res) => {
  const state = require("crypto").randomBytes(16).toString("hex");
  req.session.oauthState = state; // simpan state di session

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: "code",
    state,
  });

  res.redirect(`${SSO_BASE_URL}/api/v1/oauth/authorize?${params}`);
});

// Langkah 2 & 3: Terima callback dan tukar code dengan token
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  // Validasi state untuk mencegah CSRF
  if (state !== req.session.oauthState) {
    return res.status(403).send("State mismatch — possible CSRF attack");
  }

  try {
    const response = await axios.post(`${SSO_BASE_URL}/api/v1/oauth/token`, {
      grant_type: "authorization_code",
      code,
      redirect_uri: CALLBACK_URL,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const { access_token, refresh_token, expires_in } = response.data.data;

    // Langkah 4: Simpan token di session
    req.session.accessToken = access_token;
    req.session.refreshToken = refresh_token;
    req.session.tokenExpiresAt = Date.now() + expires_in * 1000;
    req.session.isAuthenticated = true;

    res.redirect("/dashboard");
  } catch (err) {
    console.error("OAuth error:", err.response?.data);
    res.redirect("/login?error=sso_failed");
  }
});

// Middleware untuk cek autentikasi + auto refresh
router.use(async (req, res, next) => {
  if (!req.session.isAuthenticated) return res.redirect("/login");

  // Auto refresh jika token hampir kedaluwarsa (dalam 2 menit)
  if (req.session.tokenExpiresAt - Date.now() < 2 * 60 * 1000) {
    try {
      const response = await axios.post(`${SSO_BASE_URL}/api/v1/oauth/token`, {
        grant_type: "refresh_token",
        refresh_token: req.session.refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      });
      const { access_token, refresh_token, expires_in } = response.data.data;
      req.session.accessToken = access_token;
      req.session.refreshToken = refresh_token;
      req.session.tokenExpiresAt = Date.now() + expires_in * 1000;
    } catch {
      // Refresh gagal — paksa login ulang
      req.session.destroy();
      return res.redirect("/login");
    }
  }

  next();
});

module.exports = router;
```

---

### PHP / Laravel

```php
<?php
// routes/web.php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SsoController;

Route::get('/login', [SsoController::class, 'redirectToSso']);
Route::get('/auth/callback', [SsoController::class, 'handleCallback']);

// app/Http/Controllers/SsoController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SsoController extends Controller
{
    private string $ssoBaseUrl;
    private string $clientId;
    private string $clientSecret;
    private string $callbackUrl;

    public function __construct()
    {
        $this->ssoBaseUrl   = config('sso.base_url');    // https://sso.perusahaan.com
        $this->clientId     = config('sso.client_id');
        $this->clientSecret = config('sso.client_secret');
        $this->callbackUrl  = config('sso.callback_url'); // https://hrd.perusahaan.com/auth/callback
    }

    // Langkah 1: Redirect ke SSO Portal
    public function redirectToSso(Request $request)
    {
        $state = Str::random(40);
        session(['oauth_state' => $state]);

        $query = http_build_query([
            'client_id'     => $this->clientId,
            'redirect_uri'  => $this->callbackUrl,
            'response_type' => 'code',
            'state'         => $state,
        ]);

        return redirect("{$this->ssoBaseUrl}/api/v1/oauth/authorize?{$query}");
    }

    // Langkah 2 & 3: Terima callback dan tukar code
    public function handleCallback(Request $request)
    {
        // Validasi state
        if ($request->state !== session('oauth_state')) {
            abort(403, 'State mismatch');
        }

        $response = Http::post("{$this->ssoBaseUrl}/api/v1/oauth/token", [
            'grant_type'    => 'authorization_code',
            'code'          => $request->code,
            'redirect_uri'  => $this->callbackUrl,
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
        ]);

        if ($response->failed()) {
            return redirect('/login')->withErrors(['sso' => 'Autentikasi SSO gagal.']);
        }

        $data = $response->json('data');

        // Langkah 4: Simpan token di session
        session([
            'access_token'      => $data['access_token'],
            'refresh_token'     => $data['refresh_token'],
            'token_expires_at'  => now()->addSeconds($data['expires_in']),
            'is_authenticated'  => true,
        ]);

        return redirect('/dashboard');
    }
}
```

---

### Python / Django atau Flask

```python
# Flask example
import os
import secrets
import requests
from flask import Flask, redirect, request, session, url_for

app = Flask(__name__)
app.secret_key = os.environ["FLASK_SECRET_KEY"]

SSO_BASE_URL   = os.environ["SSO_BASE_URL"]     # https://sso.perusahaan.com
CLIENT_ID      = os.environ["SSO_CLIENT_ID"]
CLIENT_SECRET  = os.environ["SSO_CLIENT_SECRET"]
CALLBACK_URL   = os.environ["SSO_CALLBACK_URL"] # https://hrd.perusahaan.com/auth/callback

# Langkah 1: Redirect ke SSO Portal
@app.route("/login")
def login():
    state = secrets.token_hex(16)
    session["oauth_state"] = state

    params = {
        "client_id":     CLIENT_ID,
        "redirect_uri":  CALLBACK_URL,
        "response_type": "code",
        "state":         state,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return redirect(f"{SSO_BASE_URL}/api/v1/oauth/authorize?{query}")

# Langkah 2 & 3: Terima callback dan tukar code dengan token
@app.route("/auth/callback")
def callback():
    # Validasi state
    if request.args.get("state") != session.get("oauth_state"):
        return "State mismatch", 403

    code = request.args.get("code")

    resp = requests.post(f"{SSO_BASE_URL}/api/v1/oauth/token", json={
        "grant_type":    "authorization_code",
        "code":          code,
        "redirect_uri":  CALLBACK_URL,
        "client_id":     CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    })

    if not resp.ok:
        return redirect("/login?error=sso_failed")

    data = resp.json()["data"]

    # Langkah 4: Simpan token di session
    session["access_token"]  = data["access_token"]
    session["refresh_token"] = data["refresh_token"]
    session["expires_in"]    = data["expires_in"]
    session["authenticated"] = True

    return redirect("/dashboard")
```

---

## Manajemen Akses Pengguna

Akses aplikasi untuk setiap pengguna dikelola oleh **Superadmin** melalui halaman **Manajemen Pengguna** di SSO Portal.

### Cara Memberikan Akses

1. Login ke SSO Portal sebagai Superadmin.
2. Buka menu **Manajemen Pengguna**.
3. Cari pengguna yang ingin diberi akses.
4. Klik ikon **Shield** (🛡) pada baris pengguna tersebut.
5. Centang aplikasi yang ingin diberikan akses.
6. Klik **Simpan Akses**.

### Aturan Akses

- Pengguna yang **tidak memiliki akses** ke suatu aplikasi akan mendapat error `403` saat mencoba login via SSO ke aplikasi tersebut.
- Aplikasi yang `isActive = false` tidak akan muncul di dashboard meskipun pengguna memiliki akses.
- Superadmin dapat melihat dan mengubah akses dari tabel pengguna (kolom "Aplikasi" menampilkan chip per aplikasi yang sudah di-assign).

---

## Keamanan dan Catatan Penting

### ✅ Yang HARUS dilakukan

- **Simpan `client_secret` di environment variable** sisi server — jangan di source code atau frontend.
- **Validasi `state` parameter** di setiap callback untuk mencegah CSRF.
- **Gunakan HTTPS** di semua komunikasi production (SSO Portal dan aplikasi client).
- **Simpan `refresh_token`** di HttpOnly cookie atau database, bukan di localStorage.
- **Tangani token kedaluwarsa** dengan logic refresh otomatis.

### ❌ Yang TIDAK BOLEH dilakukan

- Jangan panggil `POST /oauth/token` dari browser/frontend (karena menggunakan `client_secret`).
- Jangan simpan `access_token` atau `refresh_token` di localStorage (rentan XSS).
- Jangan gunakan `authorization_code` lebih dari satu kali (akan ditolak).
- Jangan abaikan `state` parameter — ini penting untuk keamanan.

### Token Expiry Summary

| Token | Durasi |
|-------|--------|
| Authorization Code | 5 menit |
| Access Token (OAuth) | 15 menit |
| Refresh Token (OAuth) | 7 hari |
| JWT Access Token (SSO Portal internal) | Sesuai `JWT_ACCESS_EXPIRES_IN` di `.env` |
| JWT Refresh Token (SSO Portal internal) | Sesuai `JWT_REFRESH_EXPIRES_IN` di `.env` |

### Rate Limiting

Endpoint `/auth/login` memiliki rate limiter bawaan. Jika terlalu banyak percobaan login dalam waktu singkat, akan mendapat respons `429 Too Many Requests`.

---

*Dokumentasi ini dibuat berdasarkan implementasi SSO Portal SPM. Untuk pertanyaan atau perubahan konfigurasi, hubungi tim pengembang atau Superadmin portal.*

---

## Implementasi pada Certificate Storage Management

Section ini mendokumentasikan implementasi nyata SSO OAuth 2.0 pada project **certificate-storage-management** menggunakan stack Express.js + TypeScript (backend) dan React + Vite (frontend).

---

### Gambaran Arsitektur

```
Browser (pengguna)
    │
    │  1. Klik "Login dengan SSO"
    ▼
Frontend React (localhost:5176)
    │
    │  2. window.location.href → backend /api/auth/sso/initiate
    ▼
Backend Express (localhost:5001)
    │
    │  3. Redirect browser ke SSO Frontend /login?client_id=...&redirect_uri=...&state=...
    ▼
SSO Portal Frontend (localhost:5173)
    │
    │  4. User login di SSO Portal
    │  5. SSO Portal redirect ke backend /api/auth/sso/callback?code=xxx&state=xxx
    ▼
Backend Express (localhost:5001)
    │
    │  6. Server-to-server: POST SSO Backend /api/v1/oauth/token (tukar code → access_token)
    │  7. Server-to-server: GET  SSO Backend /api/v1/oauth/userinfo (ambil { id, username, name, role })
    │  8. Find-or-create user di database lokal
    │  9. Generate JWT lokal
    │  10. Redirect → Frontend /auth/sso/callback?token=JWT_LOKAL
    ▼
Frontend React
    │
    │  11. Baca token dari URL, simpan di cookie, navigate ke /dashboard
    ▼
Dashboard ✅
```

**Catatan penting:**
- Langkah 3 mengarahkan ke **SSO Frontend** (`SSO_FRONTEND_URL`), bukan SSO Backend. Ini penting agar user yang belum login di SSO Portal bisa melihat halaman login SSO terlebih dahulu.
- Langkah 6–7 dilakukan dari **server** ke server (`SSO_BASE_URL`), tidak melalui browser, karena menggunakan `client_secret`.
- Token yang dikirim ke frontend (langkah 10) adalah **JWT lokal aplikasi ini**, bukan `access_token` dari SSO Portal.

---

### Perubahan Database

Dua field ditambahkan ke tabel `users` via Prisma migration (`20260225000000_add_sso_fields`):

```sql
ALTER TABLE "users"
  ALTER COLUMN "password_hash" DROP NOT NULL,
  ADD COLUMN "sso_id" TEXT UNIQUE;
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `password_hash` | `String?` (nullable) | Dijadikan opsional — user SSO-only tidak punya password |
| `sso_id` | `String? @unique` | ID user dari SSO Portal, dipakai untuk lookup saat login berulang |

**Jalankan migration:**
```bash
# Dengan Docker
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npx prisma migrate deploy

# Tanpa Docker (dari folder backend/)
npx prisma migrate deploy
```

---

### Environment Variables

Tambahkan variabel berikut ke file `.env` di root project:

```env
# === SSO Integration ===

# URL backend SSO Portal — dipakai untuk server-to-server (token exchange, userinfo)
# Saat berjalan di dalam Docker, gunakan host.docker.internal bukan localhost
SSO_BASE_URL=http://host.docker.internal:5000

# URL frontend SSO Portal — dipakai untuk redirect browser ke halaman login SSO
SSO_FRONTEND_URL=http://localhost:5173

# Client credentials dari Superadmin SSO Portal
SSO_CLIENT_ID=client_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SSO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Harus sama persis dengan callbackUrl yang didaftarkan di SSO Portal
# Format: <URL_BACKEND_APPS>/api/auth/sso/callback
SSO_CALLBACK_URL=http://localhost:5001/api/auth/sso/callback

# URL frontend aplikasi ini — dipakai untuk redirect setelah callback selesai
FRONTEND_URL=http://localhost:5176
```

**Aturan `SSO_BASE_URL` vs `SSO_FRONTEND_URL`:**

| Variable | Dipakai untuk | Nilai (development) |
|----------|--------------|---------------------|
| `SSO_BASE_URL` | Server-to-server HTTP call (token exchange, userinfo) | `http://host.docker.internal:5000` (dari dalam Docker) |
| `SSO_FRONTEND_URL` | Redirect browser ke halaman login SSO | `http://localhost:5173` (URL yang bisa dibuka browser user) |

> ⚠️ Di dalam container Docker, `localhost` merujuk ke container itu sendiri. Gunakan `host.docker.internal` untuk mengakses service yang berjalan di host machine.

**Tambahkan ke `docker-compose.yml`** (service `backend`):
```yaml
environment:
  SSO_BASE_URL: ${SSO_BASE_URL:-http://host.docker.internal:5000}
  SSO_FRONTEND_URL: ${SSO_FRONTEND_URL:-http://localhost:5173}
  SSO_CLIENT_ID: ${SSO_CLIENT_ID:-}
  SSO_CLIENT_SECRET: ${SSO_CLIENT_SECRET:-}
  SSO_CALLBACK_URL: ${SSO_CALLBACK_URL:-http://localhost:5001/api/auth/sso/callback}
  FRONTEND_URL: ${FRONTEND_URL:-http://localhost:5175}
```

**Tambahkan ke `WHITE_LIST_URLS`** di `.env`:
```env
WHITE_LIST_URLS=http://localhost:5001,http://localhost:5176,...
```
URL frontend aplikasi ini harus ada di whitelist CORS.

---

### Struktur File yang Dibuat/Diubah

#### File Baru — Backend

| File | Deskripsi |
|------|-----------|
| `backend/src/features/user/services/sso.service.ts` | Core SSO logic: state generation, token exchange, userinfo, find-or-create user |
| `backend/src/features/user/controllers/sso.controller.ts` | HTTP handler untuk `initiate` dan `callback` |
| `backend/src/features/user/routes/sso.routes.ts` | Route definitions: `GET /initiate`, `GET /callback` |
| `backend/prisma/migrations/20260225000000_add_sso_fields/migration.sql` | SQL migration untuk `password_hash` nullable dan kolom `sso_id` |

#### File Diubah — Backend

| File | Perubahan |
|------|-----------|
| `backend/prisma/schema.prisma` | `passwordHash String?` (nullable), tambah `ssoId String? @unique` |
| `backend/src/config/env-schema.ts` | Tambah 5 env var SSO (semua optional) + `FRONTEND_URL` |
| `backend/src/features/user/repositories/user.repository.ts` | Tambah `findBySsoId()`, `createSsoUser()`, update `updateUser()` dengan field `ssoId` |
| `backend/src/app.ts` | Register route: `app.use('/api/auth/sso', ssoRoutes)` |
| `backend/src/features/user/services/user.service.ts` | Guard `if (!user.passwordHash)` di `login()` untuk SSO-only user |
| `backend/package.json` | Tambah dependency `axios` |

#### File Baru — Frontend

| File | Deskripsi |
|------|-----------|
| `frontend/src/features/auth/pages/SsoCallbackPage.tsx` | Halaman callback SSO: baca `?token=` dari URL, simpan ke cookie, redirect ke dashboard |

#### File Diubah — Frontend

| File | Perubahan |
|------|-----------|
| `frontend/src/features/auth/pages/LoginPage.tsx` | Tambah tombol "Login dengan SSO SPIL", handler `handleSsoLogin()`, tampilkan `sso_error` dari query param |
| `frontend/src/routes/Router.tsx` | Tambah route `auth/sso/callback` → `<SsoCallbackPage />` |

---

### Alur Lengkap di Aplikasi Ini

**1. User klik tombol "Login dengan SSO"**

Frontend memanggil:
```
window.location.href = `${VITE_API_URL}/api/auth/sso/initiate`
```

**2. Backend `/api/auth/sso/initiate`**

Backend generate stateless HMAC state token, lalu redirect browser ke:
```
http://localhost:5173/login?client_id=...&redirect_uri=http://localhost:5001/api/auth/sso/callback&response_type=code&state=<timestamp.hmac>
```

**3. User login di SSO Portal**

SSO Portal memverifikasi user, mengecek akses ke aplikasi ini, lalu redirect ke:
```
http://localhost:5001/api/auth/sso/callback?code=XXXX&state=<timestamp.hmac>
```

**4. Backend `/api/auth/sso/callback`**

a. Validasi state (HMAC signature + max 10 menit)
b. POST `SSO_BASE_URL/api/v1/oauth/token` → dapat `access_token`
c. GET `SSO_BASE_URL/api/v1/oauth/userinfo` → dapat `{ id, username, name, role }`
d. Find-or-create user lokal di database
e. Generate JWT lokal aplikasi ini
f. Redirect browser ke:
```
http://localhost:5176/auth/sso/callback?token=JWT_LOKAL
```

**5. Frontend `/auth/sso/callback`**

`SsoCallbackPage` membaca `?token=` dari URL, menyimpannya ke cookie melalui `setToken()`, lalu navigate ke `/dashboard`.

---

### Flow Login jika Redirect dari Aplikasi Portal

Jika login dimulai dari aplikasi portal, portal mengarahkan browser user ke halaman login frontend aplikasi eksternal dengan format:

```text
{frontend_url}/login?login_sso=true&client_id={client_id}
```

Contoh:

```text
http://localhost:5176/login?login_sso=true&client_id=client_xxxxxxxxx
```

Perilaku pada halaman login (`frontend/src/app/(auth)/login/page.tsx`):

1. Membaca query param `login_sso` dan `client_id` dari URL.
2. Jika `login_sso === "true"` dan `client_id === NEXT_PUBLIC_SSO_CLIENT_ID`, frontend otomatis menjalankan `handleSsoLogin()`.
3. `handleSsoLogin()` akan redirect ke backend:
   `{NEXT_PUBLIC_API_ENDPOINT}/api/auth/sso/initiate?client_id={client_id}`.
4. Jika `client_id` tidak cocok atau tidak ada, auto-login SSO tidak dijalankan, dan user tetap bisa klik tombol **Login with SSO SPIL** secara manual.

Catatan:
- Validasi `client_id` terhadap `NEXT_PUBLIC_SSO_CLIENT_ID` mencegah auto-redirect untuk client yang bukan milik aplikasi ini.
- Parameter `client_id` tetap diteruskan ke endpoint `initiate` agar backend dapat memvalidasi/menggunakan client ID yang sesuai.

---

### Endpoint SSO di Aplikasi Ini

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/auth/sso/initiate` | Redirect browser ke SSO Portal untuk login |
| `GET` | `/api/auth/sso/callback` | Terima code dari SSO, proses, redirect ke frontend dengan JWT |

**Error handling di callback:**
- Jika SSO Portal mengirim `?error=...` → redirect ke `/auth/login?sso_error=...`
- Jika state tidak valid → redirect ke `/auth/login?sso_error=State+parameter+tidak+valid`
- Jika SSO belum dikonfigurasi (`isEnabled = false`) → response `503 Service Unavailable`

---

### Strategi State CSRF

Tidak menggunakan in-memory Map (yang akan hilang saat hot-reload/restart). Sebagai gantinya, dipakai **stateless HMAC-signed token**:

```
state = <timestamp_ms>.<HMAC_SHA256(timestamp_ms, JWT_SECRET)>
```

**Validasi:**
1. Split state menjadi `[timestamp, hmac]`
2. Hitung ulang HMAC dari timestamp menggunakan `JWT_SECRET`
3. Bandingkan secara timing-safe (`crypto.timingSafeEqual`)
4. Pastikan umur token ≤ 10 menit

Keuntungan:
- Tidak butuh storage (session, Redis, database)
- Tetap valid meski backend restart atau hot-reload
- Tidak bisa dipalsukan tanpa `JWT_SECRET`

---

### Logika Find-or-Create User

Saat callback berhasil dan `{ id, username }` didapat dari SSO Portal, user lokal dicari/dibuat dengan prioritas:

```
1. Cari user berdasarkan ssoId
   → ditemukan: gunakan langsung

2. Cari user berdasarkan username (sama dengan SSO)
   → ditemukan: link ssoId ke akun yang ada, gunakan akun tersebut

3. Tidak ditemukan sama sekali
   → Buat user baru (tanpa passwordHash, dengan ssoId)
```

Logika ini memastikan:
- User yang sudah punya akun lokal (dibuat via register biasa) dapat di-link ke SSO secara otomatis saat pertama kali login SSO
- Tidak terjadi duplikasi akun

---

### Perilaku Login Normal vs SSO

| Kondisi user | Login normal (username+password) | Login SSO |
|---|---|---|
| Dibuat via `register` (punya password) | ✅ Bisa | ❌ Tidak bisa (belum punya `ssoId`) |
| Dibuat via SSO (tidak punya password) | ❌ "Invalid credentials" | ✅ Bisa |
| Dibuat via `register`, sudah login SSO sekali | ✅ Bisa | ✅ Bisa (akun ter-link otomatis) |
| SSO user, sudah set password via profil | ✅ Bisa | ✅ Bisa |

> User SSO yang ingin bisa login normal perlu set password terlebih dahulu melalui halaman profil menggunakan endpoint `PUT /api/users/:id` dengan body `{ "password": "..." }`.

---

### Catatan Networking Docker

Saat aplikasi berjalan di dalam Docker container, terdapat perbedaan penting:

| Konteks | Cara akses SSO Portal backend |
|---------|-------------------------------|
| Browser user (di host) | `http://localhost:5000` |
| Backend container (server-to-server) | `http://host.docker.internal:5000` |

Gunakan `http://host.docker.internal:5000` untuk `SSO_BASE_URL` di `.env` agar token exchange dan userinfo call dari dalam container berhasil.

`SSO_FRONTEND_URL` tetap menggunakan `http://localhost:5173` karena ini adalah URL yang dibuka oleh **browser user**, bukan oleh container.
