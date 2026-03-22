# Cannabis Product Scan MVP

Minimal full-stack Next.js MVP for scanning cannabis product labels, extracting structured data with OpenAI, saving results to Supabase, and showing the extracted JSON in the UI.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS
- Supabase (`@supabase/supabase-js`)
- OpenAI API (`openai`)

## Environment variables
Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

## Install

```bash
npm install
```

> Note: in this execution environment, outbound access to the npm registry was blocked, so dependencies could not be installed here. The project files and package manifest are ready for local installation.

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup
Run `supabase-schema.sql` in your Supabase SQL editor to create `product_logs`.

## MVP flow
1. Upload one or more cannabis product label images.
2. Submit to `/api/scan`.
3. Backend converts images to base64 and sends them to OpenAI.
4. OpenAI returns strict JSON.
5. Backend stores the extracted result in `product_logs`.
6. UI renders the JSON response.

## What to test
- App loads and shows the upload form.
- Upload multiple images and submit.
- Verify the API returns the extracted JSON shape.
- Verify a row is inserted in `product_logs`.
- Verify backend errors render in the UI.
