# Doryoku – Study Streak & Leaderboard Platform

Doryoku is a minimalist productivity web application designed to help students build discipline through consistent study habits. Users log verified study hours and compete on a public leaderboard based on long-term effort.

> “Verified Hours. Real Discipline.”

---

## 🚀 Features

- User Authentication (Sign Up / Login / Logout)
- Secure Study Hour Tracking (1-hour cooldown enforced on backend)
- Lifetime Study Counter
- Public All-Time Leaderboard
- Japanese-Inspired Minimal UI
- Mobile Responsive Design
- Secure Database with Access Control

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend & Database
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS)

### Hosting
- Vercel

---

## 📊 Core Logic

- Users can increment study hours only once every 60 minutes
- Cooldown is validated on the server
- Each increment updates:
  - total_hours
  - last_increment
- Leaderboard ranks users by total_hours
- “Since X days” is calculated from account creation date

---


