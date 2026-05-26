# 🌱 SAHARA — Setup & Deploy Guide

## Step 1 — Add your API key

1. Copy `.env.example` and rename it to `.env`
2. Open `.env` and replace `paste_your_openrouter_key_here` with your actual OpenRouter key
3. Your `.env` file should look like this:
   ```
   VITE_OPENROUTER_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
   ```

## Step 2 — Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 — SAHARA is running!

## Step 3 — Deploy to Vercel (free)

### Option A — Via Vercel website (easiest)
1. Push this project to GitHub
2. Go to vercel.com → New Project → Import your GitHub repo
3. In "Environment Variables" add:
   - Key: `VITE_OPENROUTER_KEY`
   - Value: your OpenRouter key
4. Click Deploy
5. Done — you get a live link!

### Option B — Via terminal
```bash
npm install -g vercel
vercel
```
When it asks for environment variables, add VITE_OPENROUTER_KEY.

## Model used
DeepSeek V4 Flash (free) via OpenRouter
- Completely free, no expiry
- Model ID: deepseek/deepseek-v4-flash:free

## Features built
- Onboarding with nickname
- 4AM Mode (auto-detects night time)
- Hinglish / English toggle
- Check-in with mood + stress tracking
- Pattern detection (notices stress trends)
- Breathing exercises (4-7-8 and Box)
- AI talk mode powered by DeepSeek
- Overthinking support
- Mood playlists (Spotify + YouTube)
- Quiet journal with history
- Letter to future self
- Anonymous peer notes
- Crisis helpline in footer (iCall India)
