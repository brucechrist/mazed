# mazed

The idea is to build the Mazed app for PC, it will be built in react electron, so it's useable through web, app. mobile, while being highly customizable and alive

It will ressemble sopmething like discord or steam , but for the whole mazed project

There are 4 aspects that we need to hold

Make that people can find, their character ( Find function meaning..
Provide tools to elevate their character and themselves (God
Make and HUD for the world, and make it alive, using imagination (POkemon go..
And make it social so people can make friends (School

It will hold all the spiritual lore,
The idea of mazed is to make a map, that people can use to find themselves, god, and there version of it

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root with your Supabase credentials:

   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Run the SQL in `profiles.sql` on your Supabase instance. This file creates
   or updates the `profiles` table so it contains an `email` column and a
   unique `username` for each user. The script also backfills the column with
   existing emails, so simply executing it keeps your database in sync with the
   application.



4. Run the SQL in `supabase-tables.sql` to create the `quests` and `runs`
   tables used by the application.
5. Run the SQL in `friendships.sql` to create the `friendships` table used for
   managing friend requests.

## Running the App

For development with live reload:

```bash
npm run dev
```

To build for production and start Electron:

```bash
npm run build
npm start
```

Make sure the `.env` file with your Supabase credentials exists before running either command.

### Profile Pictures

Create a public storage bucket named `avatars` in Supabase. The `profiles`
table includes an `avatar_url` column where uploaded image paths are stored.
When viewing your profile, click the picture to choose a new image. The image
can now be cropped before uploading and the final picture is persisted across
sessions. After pulling new changes be sure to run `npm install` so the
`react-easy-crop` dependency is available.

Uploaded filenames are automatically sanitized to avoid characters that
Supabase storage rejects. If you see a "row-level security" error when uploading,
check that your `avatars` bucket allows authenticated users to insert and select
files.

## Versioning

The displayed version comes from `src/version.js`. After each update to the
codebase, bump the patch number (the last digit) and commit the file so
releases are easy to track.
