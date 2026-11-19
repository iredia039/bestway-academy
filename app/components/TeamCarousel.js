"use client";

import { useRef, useState } from "react";
import { TEAM } from "../config";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TeamCarousel() {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  function cardWidth() {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    return card ? card.getBoundingClientRect().width + 16 : 0;
  }

  function scrollByCard(dir) {
    trackRef.current?.scrollBy({ left: dir * cardWidth(), behavior: "smooth" });
  }

  function onScroll() {
    const w = cardWidth();
    if (!w) return;
    setActive(Math.round(trackRef.current.scrollLeft / w));
  }

  function goTo(i) {
    trackRef.current?.scrollTo({ left: i * cardWidth(), behavior: "smooth" });
  }

  const arrow =
    "flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-lg font-bold text-navy transition-colors hover:bg-mist focus:outline-none focus-visible:ring-2 focus-visible:ring-brand";

  return (
    <section id="team" className="mx-auto max-w-6xl px-5 py-16" aria-roledescription="carousel" aria-label="Meet the team">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-navy">Meet the team</h2>
          <p className="mt-2 max-w-xl text-slate-600">The tutors and leaders who will guide your child.</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => scrollByCard(-1)} aria-label="Previous team member" className={arrow}>‹</button>
          <button type="button" onClick={() => scrollByCard(1)} aria-label="Next team member" className={arrow}>›</button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TEAM.map((m) => (
          <article
            key={m.name}
            className="w-[85%] shrink-0 snap-start rounded-3xl border border-line bg-white p-6 sm:w-[46%] lg:w-[31%]"
          >
            {m.photo ? (
              <img src={m.photo} alt={`${m.name}, ${m.role}`} className="h-32 w-32 rounded-full object-cover" />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-mist text-3xl font-extrabold text-brand" aria-hidden="true">
                {initials(m.name)}
              </div>
            )}
            <h3 className="mt-4 text-xl font-extrabold text-navy">{m.name}</h3>
            <p className="text-sm font-bold text-accent">{m.role}</p>
            <p className="mt-2 text-slate-700">{m.bio}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-2">
        {TEAM.map((m, i) => (
          <button
            key={m.name}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show ${m.name}`}
            className={`h-2.5 rounded-full transition-all ${i === active ? "w-6 bg-accent" : "w-2.5 bg-line"}`}
          />
        ))}
      </div>
    </section>
  );
}
