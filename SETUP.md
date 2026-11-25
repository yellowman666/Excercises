# Exercises — setup and publishing

This is a starter web app for **Exercises**. It starts with an empty personal workout history. The exercise library is pre-populated with general exercise names, common gym machines and variations; it is not a copy of HEVY's proprietary catalogue or assets.

## What is included
- HEVY-inspired dark interface with red branding and treadmill-style mark.
- Exercise library search and muscle/equipment filters.
- Workout entry with editable date (defaults to today's date).
- Basic previous-workout base loading.
- Exercise progression chart for weight or reps.
- Supabase cloud database and email/password authentication integration.
- Responsive layout and installable-web-app manifest.

## Important first-version limitations
- The workout form currently saves one exercise per workout entry. To record multiple exercises, save each exercise under the same workout name/date. A fuller multi-exercise session builder is a sensible next iteration.
- Base loading currently loads the first matching prior workout's first exercise; it is a starter implementation, not yet a full session cloning workflow.
- No workout history has been imported. Do not upload your backdating document until you are ready.
- The exercise library is a useful starter catalogue, not an exhaustive mirror of HEVY. You can extend it with more machine models, grips and movement variations.
- Cloud saving is not active until you create a Supabase project and add its credentials.

## 1. Create the cloud database
1. Go to https://supabase.com and create an account/project.
2. Choose a project name such as `Exercises`. Save the database password somewhere safe.
3. In the Supabase project, open **SQL Editor**.
4. Open `supabase/schema.sql` from this ZIP, copy its contents into a new SQL query, and run it.
5. Go to **Project Settings → API** (sometimes labelled API Keys).
6. Copy the Project URL and the `anon` / publishable client key. Never put a `service_role` key in this website.

## 2. Run the app on your computer
1. Install Node.js LTS from https://nodejs.org.
2. Extract the ZIP.
3. Open a terminal in the extracted `Exercises-Web-App` folder.
4. Run `npm install`.
5. Copy `.env.example` to a new file named `.env`.
6. Put your Supabase URL and anon/publishable key into `.env`:
   `VITE_SUPABASE_URL=...`
   `VITE_SUPABASE_ANON_KEY=...`
7. Run `npm run dev`.
8. Open the local address printed by Vite (normally http://localhost:5173).

## 3. Publish it as a website with Vercel
1. Create a GitHub account at https://github.com if you do not already have one.
2. Create a **private** GitHub repository named `exercises`.
3. Upload the extracted project files to that repository.
4. Create an account at https://vercel.com and choose **Add New → Project**.
5. Import your `exercises` GitHub repository.
6. Vercel should detect Vite. Use:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
7. In Vercel project settings, open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/publishable key
8. Deploy. Vercel will give you a public website address.
9. If you later change environment variables, redeploy the project.

## 4. Add it to your phone
Open the deployed website in Safari on your iPhone → Share → Add to Home Screen.

## Security notes
- The app uses Supabase Auth and row-level security policies in `schema.sql` so signed-in users can only access their own workout records.
- Only use the anon/publishable key in the frontend. Never expose your database password or `service_role` key.
- For a production launch, enable email confirmation and configure your site's allowed redirect URLs in Supabase Authentication settings.
- Back up your database before importing historical workout data later.

## 5. Your future backdating document
When you provide the document, we can review its structure and add a controlled import process. The app has not imported any historical workout information.
