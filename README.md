# Shūkan — Study Streak & Leaderboard Platform

Shūkan is a minimalist web application designed to help students and self-learners build strong study habits through consistency and measurable effort. The platform allows users to log verified study hours and track their long-term progress on a public leaderboard.

Shūkan focuses on discipline over motivation by emphasizing daily commitment rather than short-term bursts of activity.

Subtitle: Verified Hours. Real Discipline.

---

## Overview

Shūkan enables users to:

- Create secure accounts
- Log study hours with time-based validation
- Maintain a lifetime study record
- Compare progress on a public leaderboard
- Build sustainable learning habits

The system enforces strict time rules on the backend to ensure fairness and prevent artificial inflation of study hours.

---

## Features

- User authentication using Supabase
- Secure login and registration
- Backend-enforced one-hour cooldown for study logging
- Lifetime study hour tracking
- Public all-time leaderboard
- “Since X days” activity calculation
- Japanese-inspired minimalist user interface
- Mobile and desktop responsive design
- Data protection using Row Level Security

---

## Technology Stack

Frontend:
- React (Vite)
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend and Database:
- Supabase (PostgreSQL + Authentication)
- Row Level Security (RLS)

Hosting and Deployment:
- Vercel

---

## System Design

Each user account contains:

- Account creation timestamp
- Total verified study hours
- Last verified study session timestamp

Study hour increments are validated on the server using time difference checks. Users are allowed to log one hour only after completing a full 60-minute interval since their previous submission.

Leaderboard rankings are generated using cumulative lifetime hours, ensuring long-term consistency is rewarded.

---
