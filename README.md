# serenedge.com

Marketing site for SerenEdge, built with Next.js (App Router), Tailwind CSS v4, GSAP + Lenis, and Resend.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your RESEND_API_KEY
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run email` | React Email preview of both templates on :3001 |
| `npm run email:logo` | Regenerates `src/emails/static/logo-email.png` from the mock logo |

## Environment

| Variable | Default | Notes |
|---|---|---|
| `RESEND_API_KEY` | none | Required to send mail. `serenedge.com` must be verified in Resend. |
| `CONTACT_TO_EMAIL` | `daham@serenedge.com` | Receives new enquiries (reply-to is the client). |
| `CONTACT_FROM_EMAIL` | `SerenEdge <sales@serenedge.com>` | Sender for both emails. |

Set the same variables in the Vercel project settings.

## Structure

- `src/app`: routes `/`, `/about`, `/services`, `/contact` (+ `contact/actions.ts` Server Action)
- `src/components`: `layout`, `ui`, `motion` (Lenis, reveals, page transition), and one folder per page
- `src/emails`: React Email templates; the logo is sent as a CID inline attachment
- `src/lib`: site content (`site.ts`), form schema, GSAP setup, email builders
- `design-mock/`: the original static HTML/CSS mock, kept as the visual reference

Design spec and implementation plan: `docs/superpowers/`.
