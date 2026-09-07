<div align="center">

# 🔐 PasMager

### *Mager ingat password? Biar PasMager yang ingat.*

Brankas digital untuk password, rekening bank, dan kartu — sekalian jadi
pencatat keuangan pribadi. Satu master password, semua aman di satu tempat.

<sub>PasMager = **Pas**sword **Mana**ger — pas buat kamu yang mager ngapalin password.</sub>

</div>

---

## Apa itu PasMager?

PasMager menggabungkan dua hal yang biasanya terpisah:

**🔒 Brankas Kredensial** — simpan password, rekening bank, kartu, dan catatan
rahasia. Semuanya dienkripsi sebelum masuk database.

**📊 Manajer Keuangan** — catat pos aset (likuid, terkunci, fisik & piutang),
pantau net worth, buat snapshot harian, dan minta analisis dari AI advisor.

---

## ✨ Fitur

### Brankas
- 🗝️ Satu master password membuka semua isi vault
- 🔐 Enkripsi **AES-256-GCM** dengan kunci unik per pengguna
- 🏦 4 tipe item: Password, Rekening Bank, Kartu, dan Catatan Aman
- 🎲 Generator password acak yang kuat
- 🛡️ Audit keamanan — deteksi password lemah & yang dipakai berulang
- ⭐ Tandai favorit, filter per kategori, dan pencarian cepat

### Keuangan
- 💰 Pencatatan aset dengan 3 kategori: likuid, terkunci, fisik & piutang
- 📈 Perhitungan net worth otomatis (dengan/tanpa piutang)
- 📸 Snapshot berkala untuk melihat perkembangan dari waktu ke waktu
- 📓 Jurnal transaksi
- 🤖 AI Financial Advisor untuk analisis portofolio *(opsional)*

---

## 🧰 Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | React 19, Vite, Lucide Icons |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL |
| Keamanan | bcryptjs, JSON Web Token, AES-256-GCM, PBKDF2 |
| AI *(opsional)* | Google Gemini / OpenAI |

---

## 🚀 Mulai

### Prasyarat
- Node.js 18 atau lebih baru
- PostgreSQL 13 atau lebih baru

### 1. Clone & pasang dependencies

```bash
git clone <url-repo-kamu>
cd Password-Manager

npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Siapkan database

```bash
createdb pasmager
```

Tabel dibuat otomatis dari `backend/schema.sql` saat server pertama kali jalan.

### 3. Konfigurasi environment

```bash
cp backend/.env.example backend/.env
```

Buka `backend/.env`, lalu isi kredensial database kamu dan **generate dua secret**:

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# ENCRYPTION_MASTER_SALT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ **`ENCRYPTION_MASTER_SALT` tidak boleh diubah** setelah ada data tersimpan.
> Mengubahnya membuat seluruh vault yang sudah ada tidak bisa didekripsi lagi.

### 4. Jalankan

```bash
npm run dev
```

| Layanan | Alamat |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |

Buka frontend, daftar akun baru, dan vault kamu siap dipakai.

---

## 📡 API

Semua endpoint kecuali `/register`, `/login`, dan `/health` butuh header
`Authorization: Bearer <token>`.

### Autentikasi
| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/api/auth/register` | Daftar akun & master password |
| `POST` | `/api/auth/login` | Buka vault |
| `GET` | `/api/auth/me` | Info sesi aktif |

### Vault
| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/vault` | Ambil semua item (terdekripsi) |
| `POST` | `/api/vault` | Tambah item baru |
| `PUT` | `/api/vault/:id` | Perbarui item |
| `DELETE` | `/api/vault/:id` | Hapus item |
| `GET` | `/api/vault/audit/health` | Audit keamanan vault |

### Keuangan
| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/finance/recap` | Rekap aset & net worth |
| `POST` | `/api/finance/assets` | Tambah pos aset |
| `PUT` | `/api/finance/assets/:id` | Perbarui pos aset |
| `DELETE` | `/api/finance/assets/:id` | Hapus pos aset |
| `GET` | `/api/finance/snapshots` | Daftar snapshot |
| `GET` | `/api/finance/snapshots/:id` | Detail snapshot |
| `POST` | `/api/finance/snapshots` | Buat snapshot baru |
| `GET` | `/api/finance/advisory` | Saran keuangan otomatis |
| `POST` | `/api/finance/ai-advisor` | Analisis oleh AI |
| `GET` | `/api/finance/journal` | Daftar jurnal |
| `POST` | `/api/finance/journal` | Tambah jurnal |

---

## 📁 Struktur Project

```
Password-Manager/
├── backend/
│   ├── config/db.js          # Koneksi PostgreSQL & migrasi otomatis
│   ├── middleware/auth.js    # Verifikasi JWT
│   ├── routes/
│   │   ├── auth.js           # Register, login, sesi
│   │   ├── vault.js          # CRUD vault & audit keamanan
│   │   └── finance.js        # Aset, snapshot, jurnal, AI advisor
│   ├── utils/crypto.js       # Enkripsi AES-256-GCM
│   ├── schema.sql            # Definisi tabel
│   ├── .env.example          # Template environment
│   └── server.js
│
├── frontend/
│   └── src/
│       ├── components/       # Komponen UI
│       ├── utils/api.js      # Client API
│       └── App.jsx
│
└── .gitignore
```

---

## 🔐 Catatan Keamanan

**Yang sudah diterapkan:**
- Master password di-hash dengan **bcrypt** — tidak pernah disimpan sebagai teks biasa
- Isi vault dienkripsi **AES-256-GCM** (enkripsi terautentikasi, anti-tampering)
- Kunci enkripsi diturunkan lewat **PBKDF2** (100.000 iterasi) dari salt acak
  yang unik per pengguna — kunci satu user tidak bisa dipakai membuka vault user lain
- Setiap query memakai *parameterized statement* — aman dari SQL injection
- Kepemilikan item diverifikasi di setiap operasi baca/tulis/hapus

**Batasan yang perlu kamu tahu:**

> Arsitektur saat ini **bukan zero-knowledge**. Kunci enkripsi diturunkan dari
> secret di server, sehingga secara teknis server mampu mendekripsi isi vault.
> Berbeda dengan Bitwarden atau 1Password yang menurunkan kunci di sisi browser
> sehingga server tidak pernah melihat data mentah.
>
> Artinya: **amankan `.env` dan akses database sebaik mungkin**, dan pertimbangkan
> baik-baik sebelum menyimpan kredensial yang sangat kritis di instance publik.

**Aturan wajib:**
- ❌ Jangan pernah commit file `.env`
- ✅ Pakai secret yang di-generate acak, bukan tebakan sendiri
- ✅ Selalu jalankan di belakang HTTPS saat production
- 🔄 Rotasi `JWT_SECRET` bila dicurigai bocor (semua sesi akan logout)

---

## 🗺️ Roadmap

Hal-hal yang belum ada dan direncanakan:

- [ ] Enkripsi sisi klien (arsitektur zero-knowledge penuh)
- [ ] Rate limiting pada endpoint login
- [ ] Auto-lock vault saat idle
- [ ] Clipboard auto-clear setelah menyalin password
- [ ] Alur reset / pemulihan master password
- [ ] Autentikasi dua faktor (2FA)
- [ ] Ekspor & impor vault terenkripsi
- [ ] Security headers (helmet) & unit test

---

## 🌐 Deployment

Aplikasi ini terdiri dari tiga bagian yang di-host terpisah:

| Bagian | Rekomendasi |
|---|---|
| Frontend | Vercel / Netlify |
| Backend | Railway / Render / Fly.io |
| Database | Neon / Supabase |

Sebelum deploy, pastikan:
1. Semua secret di-set lewat dashboard environment variable host — **bukan** file `.env`
2. `CORS_ORIGIN` diarahkan ke domain frontend production
3. Alamat API di frontend memakai environment variable, bukan `localhost`
4. HTTPS aktif di semua endpoint

> **Catatan:** GitHub Pages tidak bisa dipakai untuk aplikasi ini — layanan
> tersebut hanya melayani file statis, sedangkan PasMager butuh server Node.js
> dan database PostgreSQL yang berjalan.

---

## 📄 Lisensi

MIT — bebas dipakai dan dimodifikasi.

---

<div align="center">
<sub>Dibangun untuk yang mau rapi soal password dan keuangan, tanpa ribet.</sub>
</div>
