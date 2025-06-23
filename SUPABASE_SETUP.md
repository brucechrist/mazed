# Supabase Setup Quick Guide

1. Create a new project at [Supabase](https://supabase.com/) and copy the project URL and anon key.
2. In the root of this repo create a `.env` file containing:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Open the SQL editor in Supabase and run these scripts in order:
   - `profiles.sql`
   - `supabase-tables.sql`
   - `friendships.sql`
   - `auth-trigger.sql`

   These create all required tables and columns and ensure a profile row is
   created automatically for each new user.
a

4. If row level security is enabled on `profiles`, allow public read access so username lookups work during login:

```sql
create policy "Public read for login" on profiles
  for select using (true);
```

5. Create a public storage bucket named `avatars` if you want to upload profile pictures.

Once the database is ready, run `npm install` followed by `npm run dev` to start the app.
