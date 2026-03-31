-- posts (feed)
create table posts (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'text',
  body text,
  image_url text,
  link_url text,
  created_at timestamptz default now()
);

alter table posts enable row level security;
create policy "public read" on posts for select using (true);
create policy "auth write" on posts for insert with check (auth.role() = 'authenticated');
create policy "auth update" on posts for update using (auth.role() = 'authenticated');
create policy "auth delete" on posts for delete using (auth.role() = 'authenticated');

-- stories (ephemeral)
create table stories (
  id uuid primary key default gen_random_uuid(),
  body text,
  image_url text,
  created_at timestamptz default now()
);

alter table stories enable row level security;
create policy "public read" on stories for select using (true);
create policy "auth write" on stories for insert with check (auth.role() = 'authenticated');
create policy "auth delete" on stories for delete using (auth.role() = 'authenticated');

-- guestbook
create table guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  name text,
  message text not null,
  created_at timestamptz default now()
);

alter table guestbook_entries enable row level security;
create policy "public read" on guestbook_entries for select using (true);
create policy "public write" on guestbook_entries for insert with check (true);
create policy "auth delete" on guestbook_entries for delete using (auth.role() = 'authenticated');

-- ask box
create table asks (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  anonymous boolean default true,
  name text,
  answer text,
  answered_at timestamptz,
  created_at timestamptz default now()
);

alter table asks enable row level security;
create policy "public read answered" on asks for select using (answer is not null);
create policy "public ask" on asks for insert with check (true);
create policy "auth read all" on asks for select using (auth.role() = 'authenticated');
create policy "auth answer" on asks for update using (auth.role() = 'authenticated');
create policy "auth delete" on asks for delete using (auth.role() = 'authenticated');

-- DMs
create table dms (
  id uuid primary key default gen_random_uuid(),
  name text,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table dms enable row level security;
create policy "public send" on dms for insert with check (true);
create policy "auth read" on dms for select using (auth.role() = 'authenticated');
create policy "auth update" on dms for update using (auth.role() = 'authenticated');
create policy "auth delete" on dms for delete using (auth.role() = 'authenticated');

-- affiliate links
create table affiliate_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  category text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table affiliate_links enable row level security;
create policy "public read" on affiliate_links for select using (true);
create policy "auth write" on affiliate_links for insert with check (auth.role() = 'authenticated');
create policy "auth update" on affiliate_links for update using (auth.role() = 'authenticated');
create policy "auth delete" on affiliate_links for delete using (auth.role() = 'authenticated');

-- storage bucket for media
insert into storage.buckets (id, name, public) values ('media', 'media', true);

create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "auth upload media" on storage.objects for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "auth delete media" on storage.objects for delete using (bucket_id = 'media' and auth.role() = 'authenticated');
