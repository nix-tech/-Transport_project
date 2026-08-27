# 🚌 BisRezèv — Sistèm Rezèvasyon Biyè Bis

> Yon aplikasyon Full-Stack pou rezève plas nan bis, bâti ak **HTML5 · Tailwind CSS · Vanilla JS · Supabase**.

![Preview](https://img.shields.io/badge/Stack-HTML%20%7C%20Tailwind%20%7C%20Supabase-6366f1?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Ready%20for%20Portfolio-10b981?style=for-the-badge)

---

## ✨ Fonksyonalite

| # | Fonksyonalite | Detay |
|---|--------------|-------|
| 1 | **Homepage ak fòm rechèch** | Chèche pa Depa, Destinasyon, ak Dat |
| 2 | **Lis vwayaj (Trips)** | Done reyèl soti nan Supabase/PostgreSQL |
| 3 | **Seat Map Vizyèl** | 30 plas · 🟢 Vèt = Lib · 🔴 Wouj = Okipe · 🟣 Mov = Chwazi |
| 4 | **Fòm Pasajè** | Non, Imel, Telefòn |
| 5 | **Prevansyon Konfli** | Unique constraint + double-check anvan INSERT |
| 6 | **Biyè Virtyèl** | Modal konfèmasyon ak kòd inik `BIS-XXXX-XXXX` |

---

## 🗂️ Estrikti Dosye

```
Transport-project/
│
├── index.html              ← Aplikasyon konplè (1 paj)
│
├── js/
│   ├── config.js           ← ⚠️ URL + ANON KEY Supabase ou a (METE LADAN L)
│   └── app.js              ← Tout lojik JS (State, Supabase calls, UI)
│
└── supabase/
    └── schema.sql          ← Script SQL konplè (tabs + RLS + done tès)
```

---

## 🚀 Kòman pou Mete l Anlè (Setup)

### Etap 1 — Kreye Pwojè Supabase

1. Ale sou [supabase.com](https://supabase.com) → **New Project**
2. Chwazi yon non (ex: `bisrezev`) ak yon password solid
3. Chwazi rejyon ki pi pre ou a (ex: `US East`)

### Etap 2 — Kreye Baz de Done a

1. Nan Dashboard Supabase ou a, ale nan **SQL Editor**
2. Klike **New query**
3. Kopye tout kontni fichye `supabase/schema.sql` la
4. Klike **Run** (Ctrl+Enter)
5. Ou ta dwe wè: `Trips created: 10 | Bookings created: 8`

### Etap 3 — Rekipere Kle API ou a

1. Ale nan **Settings → API**
2. Kopye:
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon public** key

### Etap 4 — Konfigire `js/config.js`

Ouvri fichye `js/config.js` epi ranplase:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

Ak tout bon valè ou yo.

### Etap 5 — Louvri Aplikasyon an

Ou ka jis ouvri `index.html` dirèkteman nan navigatè ou a (double-click), oswa itilize yon servè lokal:

```bash
# Ak Python
python -m http.server 8080

# Ak Node.js
npx serve .

# Ak VS Code
# Itilize estansyon "Live Server"
```

---

## 🗄️ Estrikti Baz de Done a

### Table `trips`
| Kolòn | Tip | Deskripsyon |
|-------|-----|-------------|
| `id` | UUID | Kle primè (auto) |
| `origin` | TEXT | Vil depa |
| `destination` | TEXT | Vil rive |
| `departure_at` | TIMESTAMPTZ | Lè depa |
| `arrival_at` | TIMESTAMPTZ | Lè rive |
| `price` | NUMERIC | Pri an HTG |
| `bus_company` | TEXT | Non konpayi bis la |
| `total_seats` | INTEGER | Kantite plas (30) |

### Table `bookings`
| Kolòn | Tip | Deskripsyon |
|-------|-----|-------------|
| `id` | UUID | Kle primè (auto) |
| `trip_id` | UUID | FK → trips.id |
| `seat_number` | INTEGER | Nimewo plas (1-30) |
| `passenger_name` | TEXT | Non pasajè |
| `passenger_email` | TEXT | Imel |
| `passenger_phone` | TEXT | Telefòn |
| `booking_code` | TEXT | Kòd inik `BIS-XXXX-XXXX` |
| `status` | TEXT | `confirmed` \| `cancelled` |
| `booked_at` | TIMESTAMPTZ | Dat/lè rezèvasyon |

**Constraint kle**: `UNIQUE(trip_id, seat_number)` — Garanti pa gen 2 moun sou menm plas!

---

## 🔒 Sekirite (RLS Policies)

| Aksyon | Règ |
|--------|-----|
| `SELECT trips` | ✅ Public — Tout moun ka li |
| `SELECT bookings` | ✅ Public — Pou verifikasyon plas |
| `INSERT bookings` | ✅ Public — Pou fè rezèvasyon |
| `UPDATE/DELETE` | ❌ Bloke — Pèsonn pa ka modifye |

---

## 🎨 Stack Teknik

- **Frontend**: HTML5 semantik · Tailwind CSS (CDN) · Vanilla JavaScript (ES6+)
- **Backend/DB**: Supabase (PostgreSQL) · Supabase JS SDK v2
- **Design**: Glassmorphism · Dark Mode · Gradient UI · Micro-animations
- **Fonts**: Outfit (Google Fonts)

---

## 📸 Flou Itilizatè

```
Akèy (Fòm Rechèch)
     ↓ [Chèche Vwayaj]
Lis Vwayaj Disponib (Trips)
     ↓ [Klike sou yon Vwayaj]
Seat Map (30 Plas · Vèt/Wouj/Mov)
     ↓ [Chwazi Plas + Kontinye]
Fòm Pasajè (Non, Imel, Telefòn)
     ↓ [Konfime Rezèvasyon]
Biyè Virtyèl (Modal) + Confetti 🎉
     ↓ [Retounen Akèy]
```

---

*Pwojè bâti pou portfolio · 2025 · Full-Stack · Supabase + Tailwind*
