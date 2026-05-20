create extension if not exists pgcrypto;

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  source_type text not null default 'Sir AOA',
  date_received date not null default current_date,
  summary text,
  key_themes text[] not null default '{}',
  markdown_body text not null,
  status text not null default 'Unread' check (status in ('Unread', 'Reading', 'Processed', 'Archived')),
  extracted_lessons_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  lesson text not null,
  context text,
  action_point text,
  notes text,
  date_saved date not null default current_date,
  date_learned date,
  source_type text,
  source_name text,
  source_link text,
  source_date date,
  source_document_id uuid references public.source_documents(id) on delete set null,
  category text,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  reminder_required text not null default 'No' check (reminder_required in ('Yes', 'No')),
  reminder_frequency text default 'None',
  lesson_type text,
  setting text,
  people_involved text,
  image_path text,
  image_name text,
  status text not null default 'Active' check (status in ('Active', 'Archived')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lessons
  add column if not exists source_document_id uuid references public.source_documents(id) on delete set null;

alter table public.source_documents enable row level security;
alter table public.lessons enable row level security;

drop policy if exists "Users read own source documents" on public.source_documents;
drop policy if exists "Users insert own source documents" on public.source_documents;
drop policy if exists "Users update own source documents" on public.source_documents;
drop policy if exists "Users delete own source documents" on public.source_documents;

drop policy if exists "Users read own lessons" on public.lessons;
drop policy if exists "Users insert own lessons" on public.lessons;
drop policy if exists "Users update own lessons" on public.lessons;
drop policy if exists "Users delete own lessons" on public.lessons;

create policy "Users read own source documents"
  on public.source_documents for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own source documents"
  on public.source_documents for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own source documents"
  on public.source_documents for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own source documents"
  on public.source_documents for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users read own lessons"
  on public.lessons for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own lessons"
  on public.lessons for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own lessons"
  on public.lessons for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own lessons"
  on public.lessons for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_lessons_updated_at on public.lessons;
create trigger set_lessons_updated_at
before update on public.lessons
for each row
execute function public.set_updated_at();

drop trigger if exists set_source_documents_updated_at on public.source_documents;
create trigger set_source_documents_updated_at
before update on public.source_documents
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('lesson-images', 'lesson-images', false)
on conflict (id) do nothing;

drop policy if exists "Users read own lesson images" on storage.objects;
drop policy if exists "Users upload own lesson images" on storage.objects;
drop policy if exists "Users update own lesson images" on storage.objects;
drop policy if exists "Users delete own lesson images" on storage.objects;

create policy "Users read own lesson images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'lesson-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users upload own lesson images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lesson-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own lesson images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'lesson-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'lesson-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own lesson images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lesson-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
