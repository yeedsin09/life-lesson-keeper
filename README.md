# Life Lesson Keeper - Phase 1

A private web app for saving lessons, reminders, work corrections, Sir AOA insights, sources, tags, and screenshots.

## Phase 1 scope

- Email and password login through Supabase Auth
- Personal lesson database with Row Level Security
- Add, edit, delete, search, and filter lessons
- Reminder Review view
- Sir AOA view
- Mistakes to Avoid view
- Image and screenshot uploads through Supabase Storage
- Mobile-friendly layout for laptop and Android use
- Basic home screen app manifest

## Tech stack

- Next.js
- Supabase Auth
- Supabase Database
- Supabase Storage
- Vercel hosting

## 1. Create the Supabase project

1. Go to Supabase and create a new project.
2. Open SQL Editor.
3. Paste and run the file located at:

```txt
supabase/schema.sql
```

This creates:

- `lessons` table
- Row Level Security policies
- private `lesson-images` storage bucket
- storage policies for user-owned image folders

## 2. Create your user account

For personal-only access, create one account for your email inside Supabase Auth.

Recommended security setup:

- Use your personal email only.
- Disable public sign-ups in Supabase Auth settings.
- Keep the storage bucket private.
- Do not share the Supabase service role key with the browser app.

## 3. Get Supabase keys

In Supabase:

1. Go to Project Settings.
2. Open API.
3. Copy:
   - Project URL
   - anon public key

Create a local `.env.local` file using `.env.example` as reference:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_ALLOWED_EMAIL=your-email@example.com
```

## 4. Run locally

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## 5. Deploy on Vercel

1. Push this project to a private GitHub repository.
2. Import the repository in Vercel.
3. Add these environment variables in Vercel Project Settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_ALLOWED_EMAIL=your-email@example.com
```

4. Deploy.
5. Open the Vercel URL and sign in.

## 6. Add to Android home screen

On Honor 200 Pro and Samsung S24 FE:

1. Open the deployed link in Chrome.
2. Open the Chrome menu.
3. Select Add to Home screen.
4. Name the app Life Lesson Keeper.

## Notes

The app uses Supabase Row Level Security, so every lesson belongs to the signed-in user. Uploaded images are stored in a folder named after the user ID. The app reads images through temporary signed URLs.

## Next phase

Phase 2 may add:

- Faster quick-add mode
- Markdown export
- Better mobile form flow
- backup controls
- reminder scheduling
