# 🚀 Deploy Spendy ke Production

## Prasyarat

- Akun [GitHub](https://github.com)
- Akun [Vercel](https://vercel.com) (Hobby — gratis)
- Akun [Neon](https://neon.tech) (Free tier — 0.5GB)
- Akun [Supabase](https://supabase.com) (Free tier — 1GB)

---

## 1. Setup Database (Neon)

1. Buka https://neon.tech → Sign up / Login
2. Klik **"Create a project"**
   - Name: `spendy`
   - Region: Pilih yang terdekat (e.g., Singapore `ap-southeast-1`)
   - Klik **"Create project"**
3. Setelah jadi, copy **connection string**:
   ```
   postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   Simpan untuk langkah 4.

---

## 2. Setup Storage (Supabase)

1. Buka https://supabase.com → Sign up / Login
2. Klik **"New project"**
   - Name: `spendy`
   - Database Password: buat password
   - Region: `Southeast Asia` (Singapore)
   - Klik **"Create new project"** (tunggu ~2 menit)
3. Setelah jadi, buka **Project Settings > API**:
   - Copy **`Project URL`** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **`anon public`** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Buka **Storage > Create bucket**:
   - Name: `receipts`
   - Public bucket: ✅ **Centang**
   - Klik **"Create bucket"**

---

## 3. Push ke GitHub

```bash
# Dari folder spendy/
git add .
git commit -m "Initial commit: Spendy expense tracker v1"
git remote add origin https://github.com/username/spendy.git
git branch -M main
git push -u origin main
```

> **Catatan:** Ganti `username/spendy.git` dengan repo GitHub Anda.

---

## 4. Deploy ke Vercel

### Cara 1: Deploy dari Vercel Dashboard (Mudah)

1. Buka https://vercel.com/new
2. Import repository GitHub `spendy`
3. Framework: `Next.js` (otomatis terdeteksi)
4. **Environment Variables** — tambahkan:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Connection string dari Neon |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key dari Supabase |
| `NEXT_PUBLIC_WEBAUTHN_RP_NAME` | `Spendy` |
| `NEXT_PUBLIC_WEBAUTHN_RP_ID` | Domain Vercel (e.g., `spendy.vercel.app`) |
| `NEXT_PUBLIC_WEBAUTHN_ORIGIN` | `https://spendy.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://spendy.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `Spendy` |

5. **Build Settings:**
   - Build Command: `prisma generate && next build` (otomatis dari package.json)
   - Output Directory: (default)
6. Klik **"Deploy"** 🚀

### Cara 2: Deploy via CLI

```bash
npm i -g vercel
vercel login
cd /path/to/spendy
vercel --prod
```

Vercel akan meminta environment variables — masukkan sama seperti di atas.

---

## 5. Setup Database Migration

Setelah deploy berhasil, buka terminal Vercel atau gunakan `curl`:

```bash
# Seed default categories
curl -X POST https://spendy.vercel.app/api/seed
```

Atau jalankan via Vercel CLI:
```bash
vercel env pull
npx prisma migrate deploy
```

---

## 6. Setup Domain Kustom (Optional)

1. Buka Vercel Dashboard → Project `spendy` → **Settings > Domains**
2. Masukkan domain Anda (e.g., `spendy.antoine.com`)
3. Ikuti instruksi untuk setup DNS (CNAME record)

---

## 7. Verifikasi Deploy

| Cek | URL | Expected |
|-----|-----|----------|
| Halaman Login | `https://spendy.vercel.app/login` | ✅ Tampil form login |
| Halaman Register | `https://spendy.vercel.app/register` | ✅ Tampil form register |
| Dashboard | `https://spendy.vercel.app/` | ✅ Redirect ke login (belum auth) |
| API Seed | `POST https://spendy.vercel.app/api/seed` | ✅ `{"success":true}` |
| API Categories | `GET https://spendy.vercel.app/api/categories` | ✅ Butuh auth |

---

## 8. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| **Build gagal — Prisma not found** | Pastikan `postinstall` script ada di package.json |
| **Cannot connect to database** | Cek `DATABASE_URL` di Vercel env vars, pastikan benar |
| **Supabase 401** | Cek `NEXT_PUBLIC_SUPABASE_ANON_KEY` — pakai `anon` key, bukan `service_role` |
| **WebAuthn error** | Pastikan `NEXT_PUBLIC_WEBAUTHN_ORIGIN` pakai `https://` bukan `http://` |
| **Face ID tidak muncul** | WebAuthn hanya jalan di **localhost (HTTPS dev)** atau **production HTTPS** |
| **Halaman blank** | Buka console browser — cek JavaScript error |

---

## 9. Update & Redeploy

Setiap push ke branch `main` akan otomatis redeploy:

```bash
git add .
git commit -m "Fix: something"
git push
```

Untuk melihat log: Vercel Dashboard → Deployments → klik deploy terakhir.
