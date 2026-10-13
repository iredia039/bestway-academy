import BookingForm from "./components/BookingForm";

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-3" aria-label="Bestway Online Academy, back to top">
      <img src="/logo-mark.png" alt="" width={400} height={391} className="h-10 w-auto" />
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight text-brand">BESTWAY</span>
        <span className="block text-xs font-semibold tracking-widest text-brand">ONLINE ACADEMY</span>
      </span>
    </a>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-semibold md:flex" aria-label="Page sections">
          <a href="#snapshot" className="hover:text-brand">The Snapshot</a>
          <a href="#how" className="hover:text-brand">How it works</a>
          <a href="#faq" className="hover:text-brand">Questions</a>
        </nav>
        <a href="#book" className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
          Book free
        </a>
      </div>
    </header>
  );
}

function SampleSheet() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm" aria-label="Sample Snapshot">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="font-extrabold">Rin, Year 6</p>
          <p className="text-sm text-slate-600">Maths, 30-minute session</p>
        </div>
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-brand">Sample Snapshot</span>
      </div>
      <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-bold text-ok">Strengths</p>
          <ul className="mt-1 space-y-1 text-slate-700">
            <li>Quick, accurate mental addition</li>
            <li>Explains her thinking out loud</li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-brand">Gaps</p>
          <ul className="mt-1 space-y-1 text-slate-700">
            <li>Fractions of amounts</li>
            <li>Setting out multi-step problems</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="bg-mist">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-14 lg:py-16">
        <div>
          <p className="inline-block rounded-full bg-white px-4 py-1.5 text-sm font-bold text-brand">Completely free</p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            Know exactly where your child stands in just 30 minutes.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-700">
            A free, friendly live session with one of our tutors, then a one-page Snapshot made just for your child.
          </p>
          <ul className="mt-6 space-y-2 font-semibold">
            <li className="flex items-center gap-3"><span className="text-ok" aria-hidden="true">✓</span>Live with a real tutor</li>
            <li className="flex items-center gap-3"><span className="text-ok" aria-hidden="true">✓</span>UK curriculum, ages 5 to 18, from anywhere in the world</li>
            <li className="flex items-center gap-3"><span className="text-ok" aria-hidden="true">✓</span>No card needed, no obligation to enrol</li>
          </ul>
          <div className="mt-8 hidden lg:block">
            <SampleSheet />
          </div>
        </div>

        <BookingForm />
      </div>
    </section>
  );
}

function Snapshot() {
  return (
    <section id="snapshot" className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight">A gentle check-up with a summary you can actually use</h2>
      <p className="mt-3 max-w-2xl text-lg text-slate-700">
        The Snapshot is one page. No scores to decode and no jargon, just what your child can do and where a little support goes a long way.
      </p>
      <div className="mt-8 lg:hidden">
        <SampleSheet />
      </div>
      <div className="mt-8 grid overflow-hidden rounded-3xl border border-line md:grid-cols-3 md:divide-x md:divide-line">
        {[
          ["2 strengths", "What your child already does well, so you know what to celebrate."],
          ["1 to 2 gaps", "Where a little support goes a long way, in plain language."],
          ["A next step", "One clear suggestion for what to work on first."],
        ].map(([title, text]) => (
          <div key={title} className="border-b border-line p-6 last:border-b-0 md:border-b-0">
            <h3 className="text-xl font-extrabold text-brand">{title}</h3>
            <p className="mt-2 text-slate-700">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function How() {
  const steps = [
    ["Book a time", "Tell us about your child and pick a slot that suits you. It takes about two minutes."],
    ["Meet your tutor", "Join a friendly 30-minute live session from a laptop or tablet. An adult stays nearby."],
    ["Get the Snapshot", "After the session, we email your child's one-page Snapshot to you."],
  ];
  return (
    <section id="how" className="bg-mist">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-extrabold tracking-tight">How it works</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-extrabold text-white">{i + 1}</span>
              <div>
                <h3 className="text-lg font-extrabold">{title}</h3>
                <p className="mt-1 text-slate-700">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    ["Is it really free?", "Yes. There is no card to enter and no obligation to enrol afterwards."],
    ["What does my child need?", "A quiet space, a laptop or tablet with camera and microphone, and pen and paper. An adult should be nearby, and you should join two minutes early."],
    ["How do I know my time is confirmed?", "After you book, we email you to confirm your time. If we cannot offer the slot you chose, we will suggest another."],
    ["What if none of the times suit?", "Email us and we will find one that works."],
    ["Which ages do you cover?", "Ages 5 to 18: primary (Years 1 to 6), lower secondary (Years 7 to 9), GCSE (Years 10 and 11) and A-level (Years 12 and 13), following the UK curriculum. Not sure which year your child is in? The form explains how to tell from their age."],
    ["We don't live in the UK. Can we still book?", "Yes. Sessions are live online and run on UK time, from 4:00 to 7:30 pm. The booking form shows each slot in your own time zone, so you can see exactly when it starts for you."],
  ];
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="text-3xl font-extrabold tracking-tight">Questions parents ask</h2>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {items.map(([q, a]) => (
          <details key={q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              {q}
              <span className="text-2xl text-brand transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-2 text-slate-700">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-brand">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-12 md:flex-row md:items-center">
        <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-white">Ready to see where your child stands?</h2>
        <a href="#book" className="rounded-full bg-white px-7 py-3.5 text-base font-bold text-brand transition-colors hover:bg-mist focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand">
          Book my free Snapshot
        </a>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Snapshot />
        <How />
        <Faq />
        <FinalCta />
      </main>
      <footer className="flex flex-col items-center gap-3 px-5 py-10 text-center text-sm text-slate-600">
        <img src="/logo.png" alt="Bestway Online Academy: Learn, Grow, Achieve" width={900} height={746} className="h-28 w-auto" />
        <p>© Bestway Online Academy. Demo website.</p>
      </footer>
    </>
  );
}
