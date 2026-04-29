# Life Lesson Keeper

Life Lesson Keeper is a self-hosted web app for saving lessons, reminders, work corrections, mentor insights, sources, tags, and screenshots in one organized personal knowledge base.

The app is designed for people who want a simple way to capture lessons from work, daily life, online sources, books, conversations, and personal reflection.

## Phase 1 Scope

- Email and password login through Supabase Auth
- Personal lesson database with Row Level Security
- Add, edit, delete, search, and filter lessons
- Reminder Review view
- Mentor Insights view
- Mistakes to Avoid view
- Image and screenshot uploads through Supabase Storage
- Mobile-friendly layout for desktop and Android use
- Home screen app support through a basic web app manifest

## Tech Stack

- Next.js
- Supabase Auth
- Supabase Database
- Supabase Storage
- Vercel hosting

## Project Setup

### 1. Create a Supabase Project

1. Go to Supabase and create a new project.
2. Open the SQL Editor.
3. Paste and run the SQL file located at:

```txt
supabase/schema.sql
