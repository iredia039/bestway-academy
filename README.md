# Bestway Online Academy: Free Learning Snapshot (demo site)

One-page Next.js + Tailwind website. The booking form sits in the hero and
submits to Formspree, which emails each booking to the site owner.

## Run it

1. `npm install`
2. Open `app/config.js` and paste your Formspree endpoint
   (create a free form at https://formspree.io, copy the URL like `https://formspree.io/f/xyzabcde`).
   Also change `CONTACT_EMAIL`.
3. `npm run dev`, then open http://localhost:3000

## Notes

- Formspree emails the owner each submission. Because the parent's email is sent
  as the `email` field, the owner can hit Reply to answer them directly.
- The first time you submit, Formspree asks you to confirm your own email address.
- Time slots (4:00 pm to 7:30 pm) and the next 10 weekdays are demo data. Edit
  `TIMES` in `app/components/BookingForm.js`.
- Brand colours live in `tailwind.config.js`.
