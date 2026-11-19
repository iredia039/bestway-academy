import BookingForm from "./components/BookingForm";
import TeamCarousel from "./components/TeamCarousel";
import StickyCta from "./components/StickyCta";
import { CONTACT_EMAIL, OWNER_WHATSAPP, SOCIALS } from "./config";

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
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/50 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-semibold md:flex" aria-label="Page sections">
          <a href="#team" className="hover:text-brand">Meet the team</a>
          <a href="#contact" className="hover:text-brand">Contact</a>
        </nav>
        <a
          href="#book"
          data-umami-event="nav_cta_click"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Book free
        </a>
      </div>
    </header>
  );
}

function Hero() {
  const badges = [
    "Live with a real tutor",
    "Global school systems (UK, US, Canada, International)",
    "No card needed, no obligation to enrol",
  ];
  return (
    <section id="top" className="bg-mist">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-14 lg:py-16">
        <div>
          <p className="inline-block rounded-full bg-white px-4 py-1.5 text-sm font-bold text-accent">Completely free</p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-navy sm:text-5xl">
            Being abroad shouldn&apos;t mean being <span className="text-accent">in the dark</span> about your child&apos;s education.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-700">
            Discover exactly where your child stands academically with a <strong className="font-extrabold text-accent">Free Assessment</strong>. Our expert tutors identify learning needs and recommend a personalized approach to help them thrive across global school systems.
          </p>
          <a
            href="#book"
            data-umami-event="hero_cta_click"
            className="mt-7 inline-block rounded-full bg-accent px-7 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-mist"
          >
            Book Your Free Assessment
          </a>
          <p className="mt-3 max-w-md text-sm font-semibold text-slate-700">
            A free 30-minute live session with an expert tutor. You&apos;ll leave knowing exactly where your child stands and what to do next.
          </p>
          <ul className="mt-6 space-y-2 font-semibold">
            {badges.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="text-accent" aria-hidden="true">✓</span>
                {b}
              </li>
            ))}
          </ul>
          <a
            href={`https://wa.me/${OWNER_WHATSAPP}`}
            data-umami-event="hero_whatsapp_click"
            className="mt-6 inline-block text-sm underline decoration-1 underline-offset-4"
          >
            Want to find out more? Tap this link to reach us on WhatsApp
          </a>
        </div>

        <BookingForm />
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-navy">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-12 md:flex-row md:items-center">
        <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-white">Ready to see where your child stands?</h2>
        <a
          href="#book"
          data-umami-event="final_cta_click"
          className="rounded-full bg-accent px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
        >
          Book Your Free Assessment
        </a>
      </div>
    </section>
  );
}

function Footer() {
  const socials = SOCIALS.filter((s) => s.url);
  return (
    <footer id="contact" className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 pt-10 pb-28 text-center text-sm text-slate-600 md:pb-10">
        <img src="/logo.png" alt="Bestway Online Academy: Learn, Grow, Achieve" width={900} height={746} className="h-28 w-auto" />
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-semibold text-navy" aria-label="Contact and social links">
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-accent">{CONTACT_EMAIL}</a>
          <a href={`https://wa.me/${OWNER_WHATSAPP}`} data-umami-event="footer_whatsapp_click" className="hover:text-accent">WhatsApp</a>
          {socials.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
              {s.name}{s.handle ? ` ${s.handle}` : ""}
            </a>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} Bestway Online Academy. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TeamCarousel />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
