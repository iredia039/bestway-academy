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
- Sessions run on UK time (4:00 to 7:30 pm, next 10 weekdays). Visitors see each slot
  converted to their own time zone, and can change the time zone in the form. Edit
  `UK_SLOTS` in `app/components/BookingForm.js` to change the hours.
- The mobile field accepts numbers from any country: pick a country code, or type the
  full number starting with +. The UK (+44) is the default unless the visitor's time
  zone points elsewhere.
- Formspree emails show the UK time, the parent's local time and their time zone.
- Brand colours live in `tailwind.config.js`.
