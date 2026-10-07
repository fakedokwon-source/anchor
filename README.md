# Anchor v0.2 — Supabase

Reconnect. Relive. Chat.

This version adds Supabase email/password authentication and persistent profiles while keeping the Anchor UI.

## .env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

Never commit `.env`.

## Database
Your existing `public.profiles` table and RLS policies are used. Optional Auth trigger SQL is in `supabase/anchor-auth.sql`.

## Run
npm install
npm run dev
