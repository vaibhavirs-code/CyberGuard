# Supabase authentication setup

CyberGuard Vision uses Supabase Auth for email/password authentication and a private `operators` table for role-based access.

## 1. Create Supabase project
Create a project in Supabase and enable Email authentication.

Add these environment variables to Vercel and local development:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not put a Supabase service-role key in this repository or any `NEXT_PUBLIC_*` variable.

## 2. Create the operator profile table
Run this SQL in Supabase SQL Editor:

```sql
create table public.operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  id text not null unique,
  level text not null check (level in ('OPERATOR', 'SUPERVISOR', 'ADMIN')),
  store text not null
);

alter table public.operators enable row level security;

create policy "operators can read own profile"
on public.operators
for select
to authenticated
using (auth.uid() = user_id);
```

## 3. Create operator accounts
In Supabase Authentication, create users with email/password.

For each user, copy their Auth user UUID and insert an operator profile:

```sql
insert into public.operators (user_id, name, id, level, store)
values ('AUTH_USER_UUID', 'STORE OPERATOR', 'CGV-001', 'OPERATOR', 'FLAGSHIP_01');
```

Use `SUPERVISOR` or `ADMIN` for authorized staff.

## 4. Deploy
Add the two public Supabase environment variables to the Vercel project's Environment Variables and redeploy.

The app then performs:
Login -> Supabase Auth -> authenticated user ID -> operator profile -> role-aware dashboard.

The local/demo mode remains available for the offline hackathon demonstration, but it is not a substitute for real authentication.