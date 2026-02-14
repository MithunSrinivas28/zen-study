# Shūkan — A Discipline Tracker

Shūkan is a minimalist web application designed to transform intention into consistent action. It measures study discipline through verified hours, structured commitments, and long-term progress tracking.

The platform is built around a simple philosophy:

Consistency compounds. Motivation fades.

Shūkan exists to make discipline visible.

---

## Concept

Most productivity tools track time.  
Shūkan tracks commitment.

Instead of rewarding bursts of effort, it emphasizes sustained daily practice. Users log verified study hours, declare commitments, and observe their progress through calm analytics and a public leaderboard ranked by real work.

The design avoids noise, gamified clutter, and artificial urgency. The interface is intentionally restrained to encourage focus rather than stimulation.

---

## Core Principles

Discipline over motivation  
Verification over self-reporting  
Consistency over intensity  
Calm over distraction  

---

## Features

### Verified Study Logging

Users can increment study hours only after completing a full cooldown interval. This prevents artificial inflation and ensures logged time reflects real effort.

### Daily Commitment System

Users declare a study goal for the day. Completing the commitment yields bonus recognition, reinforcing follow-through behavior without penalties for missed goals.

### Personal Analytics

A private dashboard presents meaningful metrics:

- Total verified hours  
- Weekly activity  
- Best study day  
- Average session length  
- Planning accuracy  

The analytics emphasize clarity and reflection rather than competition.

### Lifetime Leaderboard

The public leaderboard ranks users by cumulative verified hours.

Each entry displays:

- Rank  
- Username  
- Days active  
- Total hours  
- Relative position to the leader  

The leaderboard highlights long-term consistency rather than short bursts of activity.

### Minimalist Interface

The visual language draws from Japanese minimalism:

Muted colors  
Generous spacing  
Thin typography  
Subtle hierarchy  

The interface is designed to reduce cognitive load and support extended use.

---

## System Design

Shūkan enforces integrity through server-side validation.

Each user record includes:

- Account creation timestamp  
- Total verified hours  
- Last verified session timestamp  
- Daily commitment value  

Study increments are allowed only after a defined time interval. Commitment bonuses are awarded automatically when conditions are met.

All calculations prioritize transparency and simplicity.

---

## User Flow

1. User creates an account  
2. User sets a daily commitment  
3. User logs study hours after completing sessions  
4. Dashboard updates analytics in real time  
5. Leaderboard reflects long-term progress  

The system encourages a cycle of planning, execution, and reflection.

---

## Privacy

Shūkan stores only essential metadata required for tracking progress.

No audio, video, or personal content is recorded.  
No behavioral profiling is performed.  
No data is shared externally.

The system measures effort, not identity.

---

## Intended Audience

Students  
Self-learners  
Engineers  
Researchers  
Anyone building a daily practice  

Shūkan is especially suited for individuals who prefer structured, quiet productivity tools over gamified environments.

---

## Technology

Frontend: React (Vite), TypeScript, Tailwind CSS  
Backend & Database: Supabase  
Hosting: Vercel  

The architecture favors simplicity, scalability, and maintainability.

---

## Deployment

The application is deployed as a static site with serverless backend integration. Automatic redeployment occurs on repository updates.

Client-side routing is supported through rewrite configuration to ensure seamless navigation.

---

## Future Direction

Potential enhancements include:

Presence verification  
Focus mode  
Group accountability rooms  
Discipline scoring  
Mobile installation support  

The goal is to evolve into a system that measures not just time, but behavioral consistency.

---

## Author

Mithun Srinivas  
Electronics and Communication Engineering  
Full Stack Development and Cloud Computing

---

## Closing Note

Shūkan is not a productivity tool designed to push users harder.  
It is a quiet system designed to help users keep promises to themselves.

Discipline is not dramatic.  
It is repetition.

Shūkan makes repetition visible.
