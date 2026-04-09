# 🍃 Sky View — Hotel Management System v2

Full-stack hotel room management web app for **Sky View, Bondarwadi, Mahabaleshwar**.

React + Vite · Supabase · Cloudinary · Chart.js · Mobile-first · Dark/Light mode


Note - 
1. When get domain then only we can use email using Resend.com serivces.


---

## 🚀 Quick Setup (5 steps)

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Set up Supabase
1. Go to [supabase.com](https://supabase.com) → create a free project
2. In **SQL Editor**, paste and run the full contents of **`supabase-schema.sql`**
3. Go to **Authentication → Users** → **Add User** → create the owner account
4. Copy your **Project URL** and **anon/public key** from **Settings → API**

### Step 3 — Set up Cloudinary
1. Go to [cloudinary.com](https://cloudinary.com) → create account
2. Note your **Cloud Name**
3. Go to **Settings → Upload → Upload Presets** → Add preset → set **Unsigned** → save
4. Note the **Upload Preset Name**

### Step 4 — Configure environment variables
```bash
cp .env.example .env
```
Fill in `.env`:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset

# Optional SMS (for real OTP delivery — see below)
VITE_FAST2SMS_API_KEY=your_key
# OR
VITE_MSG91_API_KEY=your_key
VITE_MSG91_TEMPLATE_ID=your_template_id
```

### Step 5 — Run
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

---

## 🌐 Deploy to Vercel
1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add all env vars in Vercel project settings
4. Deploy — `vercel.json` handles SPA routing automatically

---

## 📱 Features

### Core
| Feature | Description |
|---|---|
| 🏠 Dashboard | Stats cards with trends, Chart.js arrivals chart, room grid, recent guests |
| ✅ Check-in | 3-step form: room → guest details + OTP → review & confirm |
| 🛏️ Rooms | Add, edit, delete, manual status control |
| 👥 Guests | Search, filter, profiles with ID/photo lightbox, verification badge |
| 🍽️ Food Orders | Per-booking food tracking, meal types, running totals |
| 🧾 Billing | Itemized bill, print/PDF, payment status |
| 📊 Reports | Revenue charts, Excel & PDF export |

### New in v2

#### 📱 Mobile Number Verification (OTP)
- During check-in, owner taps **"Verify Mobile"** after entering the guest's number
- 6-digit OTP sent to guest's phone via SMS (Fast2SMS or MSG91)
- 6-box OTP input with paste support, keyboard navigation, auto-focus
- **Countdown timer** (30s) before resend is allowed
- **Max 3 attempts** per OTP — locked out after that, must request new OTP
- **10-minute expiry** — OTP auto-expires
- If owner skips → guest saved with `is_mobile_verified: false`
- Status badge (✓ Verified / ✗ Not Verified) shown on:
  - Check-in Step 2 (inline next to mobile field)
  - Check-in Step 3 review summary
  - Guest profile page
  - Guest list table
  - Current guests cards
- **Dev mode**: OTP shown as a toast notification — no SMS gateway needed for testing

#### 👥 Multi-Owner Workspace
- **Settings → Team Access** section for managing workspace members
- Primary owner can **invite co-owners or managers** by email
- Invited person signs into Supabase Auth → automatically joins workspace on first login
- **Copy invite link** button for sharing
- **Roles**: Owner (full access) / Manager (operational access)
- **Revoke access** with one tap — instantly locks out the member
- **Cancel pending invites** before they're accepted
- All owners share the same rooms, bookings, guests, and reports data
- Active members list with status dots (active / invited / revoked)
- Invite expiry shown with clock icon (7 days)

---

## 🔑 OTP SMS Setup

### Development (no gateway needed)
In dev mode (`npm run dev`), the OTP is displayed as a toast notification in the UI.
No SMS gateway configuration required for testing.

### Production — Fast2SMS (India, free tier)
1. Register at [fast2sms.com](https://www.fast2sms.com)
2. Go to **Dev API** → copy your API key
3. Set `VITE_FAST2SMS_API_KEY=your_key` in `.env`

### Production — MSG91
1. Register at [msg91.com](https://msg91.com)
2. Create an OTP template, note the **Template ID**
3. Copy your **Auth Key**
4. Set `VITE_MSG91_API_KEY` and `VITE_MSG91_TEMPLATE_ID` in `.env`

---

## 🔐 Security Notes
- All Supabase tables have **Row Level Security** enabled
- Only authenticated users can access any data
- OTP codes are stored hashed-equivalent (short-lived, expire in 10 min)
- Max 3 verification attempts per OTP before lockout
- Workspace invites expire after 7 days
- Cloudinary uses unsigned presets (no secret keys in frontend)
- Owner account created manually in Supabase — no public signup

---

## 📁 Project Structure
```
src/
  components/
    layout/       Sidebar, BottomNav, MobileDrawer, Topbar, Layout
    ui/           Spinner, EmptyState, Modal, BottomSheet, Badge, StatCard,
                  RoomPill, Lightbox, MobileVerification  ← NEW
    ErrorBoundary.jsx
    PrivateRoute.jsx
  pages/          Login, Dashboard, CheckIn*, Rooms, Guests*, GuestDetail*,
                  CurrentGuests*, FoodManagement, Billing, Reports, Settings*,
                  NotFound       (* = updated in v2)
  hooks/          useRooms, useGuests, useBookings, useFoodOrders,
                  useDashboardStats, useWorkspace  ← NEW
  lib/            supabase.js, cloudinary.js, formatters.js, validators.js,
                  exportPdf.js, exportExcel.js,
                  otpService.js  ← NEW
                  workspaceService.js  ← NEW
  context/        AuthContext.jsx, ThemeContext.jsx
  App.jsx · main.jsx · index.css
```

---

## 🐛 Troubleshooting

| Issue | Fix |
|---|---|
| OTP not received | Check SMS gateway API key in `.env`; in dev, look for OTP toast |
| "No OTP found" error | OTP expired (10 min) — request a new one |
| Invite not working | User must be created in Supabase Auth first, then invite them |
| Login fails | Verify user exists in Supabase Auth dashboard |
| Images not uploading | Verify Cloudinary cloud name + unsigned preset name |
| 404 on refresh (Vercel) | `vercel.json` handles this — redeploy if missing |

---

*Sky View Hotel Management System — v2.0.0*
