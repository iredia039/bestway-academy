"use client";

import { useEffect, useState } from "react";

// Mobile-only bar pinned to the bottom of the screen. It hides while the booking form is on screen.
export default function StickyCta() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let frame = 0;
    function check() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const form = document.getElementById("book");
        if (!form) return setVisible(true);
        const r = form.getBoundingClientRect();
        const onScreen = r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.25;
        setVisible(!onScreen);
      });
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(27,54,93,0.35)] transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <a
        href="#book"
        tabIndex={visible ? 0 : -1}
        data-umami-event="sticky_cta_click"
        className="block w-full rounded-full bg-accent py-3.5 text-center text-base font-bold text-white transition-colors hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Book Your Free Assessment
      </a>
    </div>
  );
}
