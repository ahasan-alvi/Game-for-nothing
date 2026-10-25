# NeuroPulse — Clinical PVT & Stroop Reaction Time Engine

A medical-grade, mobile-optimized **Psychomotor Vigilance Task (PVT)** and **Stroop Cognitive Interference Test** web application with a serverless backend designed for **Vercel** deployment.

Built strictly according to the **Software Requirement Specification (SRS v1.0.0)** with hardware-level millisecond latency compensation, persistent offline local storage, serverless cloud synchronization, and instant **RFC 4180 CSV export**.

---

## 🚀 Fast Vercel Deployment Setup (Takes Under 2 Minutes)

You can deploy this project to Vercel in two quick ways:

### Method 1: Using the Vercel CLI (Fastest — 1 Command)

Open your terminal in this project directory and run:
```bash
npx vercel
```
1. It will ask: `Set up and deploy?` Press **Y** (Enter).
2. Accept the default project name and settings by pressing Enter.
3. In ~20 seconds, Vercel will output your live URL (e.g., `https://neuropulse-reaction-engine.vercel.app`)!

To deploy to production directly:
```bash
npx vercel --prod
```

### Method 2: Via GitHub & Vercel Dashboard (Zero Terminal)
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial NeuroPulse deployment"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Go to **[vercel.com](https://vercel.com)** and log in with GitHub.
3. Click **"Add New..."** → **"Project"**.
4. Select your repository and click **Deploy**.
5. Vercel automatically detects the static frontend and the serverless functions in `/api/`.

---

## ⚡ Serverless Backend Endpoints Included

This codebase includes production-ready Vercel serverless backend endpoints in `/api/`:

- **`POST /api/sessions`**: Automatically saves completed test session metrics to the serverless database.
- **`GET /api/sessions`**: Fetches all recorded test sessions across users in JSON format.
- **`GET /api/export-csv`**: Generates and streams standard RFC 4180 CSV files directly with automatic browser download headers.
- **`DELETE /api/sessions`**: Clears cloud session history.
- **`GET /api/health`**: Health monitor endpoint confirming backend status.

---

## 📱 How to Convert Into a Mobile Android APK (100% Free)

Once deployed to your Vercel URL:

### Method A: PWABuilder (1-Click Free APK Generator)
1. Go to **[pwabuilder.com](https://www.pwabuilder.com)** (Microsoft's official open-source tool).
2. Enter your live Vercel URL (e.g. `https://your-app.vercel.app`) and click **Start**.
3. PWABuilder will automatically read the built-in [manifest.json](file:///Users/ahasan/My-Programs/chudling%20pong%20game/manifest.json) and [sw.js](file:///Users/ahasan/My-Programs/chudling%20pong%20game/sw.js).
4. Click **Package for Stores** → choose **Android**.
5. Download your signed **`.apk`** file and install it directly onto any Android phone!

### Method B: Direct "Add to Home Screen"
- Open your Vercel URL on any phone (Chrome for Android or Safari for iOS).
- Tap the browser menu (`⋮` or Share) → **Add to Home Screen** / **Install App**.
- The app will install onto the home screen with its custom icon, open fullscreen without browser address bars, and work offline.

---

## 🎯 Captured Metrics (Stored Every Run)

1. **Test Start Time (Clock & ISO)**: e.g. `00:25:00 (2026-10-26)`
2. **Median Reaction Time (ms)**: True median reaction speed (gold-standard PVT metric)
3. **Mean Reaction Time (ms)**: Arithmetic average latency
4. **Peak Performance**: Fastest (Best) & Slowest (Worst) tap timestamps
5. **Lapses**: Count and percentage of delayed responses **slower than 500 ms**
6. **False Starts**: Count of anticipatory taps **faster than 100 ms** or tapping before stimulus
7. **Number of Valid Trials**: Clean trials meeting clinical validity criteria
8. **Stroop Interference (Optional Mode)**:
   - Mean RT Congruent (ms)
   - Mean RT Incongruent (ms)
   - Stroop Interference Delay ($\Delta$ ms)
   - Total Stroop errors & accuracy rate
9. **Ergonomic Profile & Notes**:
   - Tapping Hand (Right Hand / Left Hand) — Which hand the user taps with
   - Dominant hand (Right Hand / Left Hand) — Natural ergonomic handedness
   - Comfort finger mode (Index / Thumb / Any)
   - Ambient noise (Quiet / Moderate / Loud)
   - Interruptions (None / Minor / Significant)
   - Participant ID & Custom clinical observations

---

## 📊 CSV Export Guide

1. **Session Summary CSV**:
   - Click **Download CSV Report** on the results screen, or **Export All Sessions (CSV)** in the History drawer.
   - Generates an RFC 4180 CSV containing Session ID, Participant ID, Tapping Hand, Dominant Hand, Start Clock, Median RT, Mean RT, Best/Worst RT, Valid Trials, Lapses (>500ms), False Starts (<100ms), Stroop Congruent/Incongruent RT, Stroop Errors, Noise, Interruptions, and Notes.
2. **Trial-by-Trial Raw Logs CSV**:
   - Click **Trial Logs (Raw ms)** on the results screen.
   - Exports the millisecond reaction time, tapping hand, stimulus digit, delay, and classification for every single individual tap.
