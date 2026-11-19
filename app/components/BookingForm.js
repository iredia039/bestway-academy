"use client";

import { useEffect, useRef, useState } from "react";
import { FORMSPREE_ENDPOINT, OWNER_WHATSAPP } from "../config";
import { track } from "../analytics";

// Cross-system school stages (UK, US, Canada and international equivalents).
const STAGES = [
  { id: "primary", title: "Primary / Elementary", ages: "Ages 5 to 11", uk: "UK Years 1–6", us: "US / Canada Grades 1–5" },
  { id: "lower", title: "Lower Secondary / Middle School", ages: "Ages 11 to 14", uk: "UK Years 7–9", us: "US / Canada Grades 6–8" },
  { id: "upper", title: "Upper Secondary / High School", ages: "Ages 14 to 16", uk: "UK Years 10–11 (GCSE / IGCSE)", us: "US / Canada Grades 9–10" },
  { id: "post16", title: "Advanced / Post-16", ages: "Ages 16 to 18", uk: "UK Years 12–13 (A-Levels / IB)", us: "US / Canada Grades 11–12 (High School / AP)" },
];
const SUBJECTS = ["Maths", "English", "Science", "Other"];

// [country, dial code]. United Kingdom first, then United States / Canada, then the rest.
const COUNTRY_CODES = [
  ["United Kingdom", "+44"], ["United States / Canada", "+1"],
  ["Ireland", "+353"], ["Nigeria", "+234"], ["Ghana", "+233"], ["Kenya", "+254"], ["South Africa", "+27"],
  ["Egypt", "+20"], ["Uganda", "+256"], ["Tanzania", "+255"], ["Zambia", "+260"], ["Zimbabwe", "+263"],
  ["Cameroon", "+237"], ["United Arab Emirates", "+971"], ["Saudi Arabia", "+966"], ["Qatar", "+974"],
  ["India", "+91"], ["Pakistan", "+92"], ["Bangladesh", "+880"], ["Sri Lanka", "+94"], ["Singapore", "+65"],
  ["Malaysia", "+60"], ["Hong Kong", "+852"], ["China", "+86"], ["Japan", "+81"], ["South Korea", "+82"],
  ["Philippines", "+63"], ["Australia", "+61"], ["New Zealand", "+64"], ["France", "+33"], ["Germany", "+49"],
  ["Spain", "+34"], ["Italy", "+39"], ["Netherlands", "+31"], ["Belgium", "+32"], ["Portugal", "+351"],
  ["Poland", "+48"], ["Sweden", "+46"], ["Norway", "+47"], ["Switzerland", "+41"], ["Turkey", "+90"],
  ["Brazil", "+55"], ["Mexico", "+52"], ["Jamaica", "+1876"], ["Trinidad and Tobago", "+1868"],
];

const EMAIL_TYPOS = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "hotmial.com": "hotmail.com",
  "yahooo.com": "yahoo.com",
  "outlok.com": "outlook.com",
};

const WA_MESSAGE =
  "Hello Bestway Online Academy team! I just registered for a Free Assessment for my child. Here is the time slot that works best for our schedule: ";

const EMPTY = {
  parentName: "",
  email: "",
  countryCode: "+44",
  mobile: "",
  childName: "",
  stage: "",
  subjects: [],
  botField: "",
};

function emailOk(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function suggestEmail(v) {
  const [local, domain] = v.trim().split("@");
  if (!local || !domain) return null;
  const fix = EMAIL_TYPOS[domain.toLowerCase()];
  return fix ? `${local}@${fix}` : null;
}

// Accepts a number from any country, either with a chosen country code or typed in full with a +.
function parsePhone(code, raw) {
  const text = raw.trim();
  if (!text) return { empty: true };
  const international = text.startsWith("+") || text.startsWith("00");
  let digits = text.replace(/\D/g, "");
  if (text.startsWith("00")) digits = digits.slice(2);

  if (international) {
    if (digits.startsWith("44")) {
      const nat = digits.slice(2).replace(/^0/, "");
      return nat.length === 10 ? { e164: `+44${nat}` } : { error: "UK mobile numbers have 10 digits after +44." };
    }
    return digits.length >= 8 && digits.length <= 15
      ? { e164: `+${digits}` }
      : { error: "Enter the full number with its country code, like +234 801 234 5678." };
  }

  if (!code) return { error: "Choose your country code, or start the number with +." };
  const nat = digits.replace(/^0/, "");
  if (code === "+44") {
    return nat.length === 10 ? { e164: `+44${nat}` } : { error: "UK mobile numbers have 10 digits, like 7123 456789." };
  }
  if (code === "+1") {
    return nat.length === 10 ? { e164: `+1${nat}` } : { error: "US and Canada numbers have 10 digits, like 415 555 0132." };
  }
  if (nat.length < 6 || code.length - 1 + nat.length > 15) {
    return { error: "That number doesn't look right for the country code you chose." };
  }
  return { e164: `${code}${nat}` };
}

async function sendToFormspree(payload) {
  const res = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.errors?.map((x) => x.message).join(" ") || "send failed");
  }
}

const inputBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

function ErrorText({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-danger">
      {children}
    </p>
  );
}

export default function BookingForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const [waHref, setWaHref] = useState("");
  const cardRef = useRef(null);
  const firstRender = useRef(true);
  const startedRef = useRef(false);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  function onFormFocus() {
    if (startedRef.current) return;
    startedRef.current = true;
    track("form_started");
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function toggleSubject(subject) {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(subject) ? f.subjects.filter((s) => s !== subject) : [...f.subjects, subject],
    }));
  }

  function validateStep1() {
    const next = {};
    if (form.parentName.trim().length < 2) next.parentName = "Please enter your full name.";
    if (!emailOk(form.email)) next.email = "Enter a valid email address.";
    const phone = parsePhone(form.countryCode, form.mobile);
    if (phone.empty) next.mobile = "Enter your WhatsApp number.";
    else if (phone.error) next.mobile = phone.error;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // Step 1 only checks the contact details and moves on. Nothing is sent yet.
  function submitStep1(ev) {
    ev.preventDefault();
    if (!validateStep1()) return;
    setServerError("");
    track("step1_completed");
    setStep(2);
  }

  // Step 2 is optional. Everything is sent to Formspree once, here, whether the parent
  // adds child details or skips them.
  async function finish(skip) {
    if (sending) return;
    setServerError("");
    const phone = parsePhone(form.countryCode, form.mobile);
    const stage = STAGES.find((s) => s.id === form.stage);
    const childName = skip ? "" : form.childName.trim();
    const hasChild = !skip && (childName || form.stage || form.subjects.length > 0);

    setSending(true);
    try {
      await sendToFormspree({
        _subject: `New Free Assessment request: ${form.parentName.trim()}${childName ? ` (child: ${childName})` : ""}`,
        parent_name: form.parentName.trim(),
        email: form.email.trim(),
        whatsapp: phone.e164 || "",
        child_details: hasChild ? "Provided" : "Skipped",
        child_first_name: childName,
        school_stage: !skip && stage ? `${stage.title} (${stage.uk} | ${stage.us})` : "",
        focus_subjects: skip ? "" : form.subjects.join(", "),
        _gotcha: form.botField,
      });
    } catch {
      setServerError("We couldn't send your details. Check your connection and try again.");
      setSending(false);
      return;
    }
    setSending(false);
    track(skip ? "booked_skipped_child_details" : "booked", { child_details: hasChild ? "yes" : "no" });

    setWaHref(`https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(WA_MESSAGE)}`);
    setStep(3);
  }

  const cardClass =
    "scroll-mt-24 rounded-3xl border border-line bg-white p-6 shadow-[0_18px_50px_-20px_rgba(27,54,93,0.35)] sm:p-8";

  const progress = (
    <div className="mb-5 flex gap-2" aria-hidden="true">
      {[1, 2].map((n) => (
        <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-line"}`} />
      ))}
    </div>
  );

  /* ---------- STEP 3: WhatsApp ---------- */
  if (step === 3) {
    return (
      <div id="book" ref={cardRef} className={cardClass}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-ok" aria-hidden="true">
          ✓
        </div>
        <h2 className="text-center text-2xl font-extrabold text-navy">
          Thanks, {form.parentName.trim().split(" ")[0]}. You&apos;re registered.
        </h2>
        <p className="mt-2 text-center text-slate-600">
          Last step: message us on WhatsApp with the date and time that suits your family.
        </p>
        <a
          href={waHref}
          onClick={() => track("whatsapp_clicked")}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-green-700 py-3.5 text-base font-bold text-white transition-colors hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.03 2 11c0 2.12.82 4.07 2.2 5.6L3 22l5.1-1.7c1.2.45 2.5.7 3.9.7 5.52 0 10-4.03 10-9s-4.48-9-10-9z" />
          </svg>
          Continue to WhatsApp
        </a>
        <p className="mt-2 text-center text-xs text-slate-600">
          Type your preferred date and time at the end of the message.
        </p>
      </div>
    );
  }

  /* ---------- STEP 2: optional child details ---------- */
  if (step === 2) {
    return (
      <div id="book" ref={cardRef} className={cardClass}>
        {progress}
        <p className="text-sm font-semibold text-accent">Step 2 of 2 · Optional</p>
        <h2 className="mt-1 text-2xl font-extrabold text-navy">Tell us about your child</h2>
        <p className="mt-1 text-sm text-slate-600">
          This helps us match the right tutor, but you can skip it.
        </p>

        <div className="mt-5">
          <label htmlFor="childName" className="mb-1.5 block text-sm font-semibold">Child&apos;s first name</label>
          <input
            id="childName"
            type="text"
            autoComplete="off"
            value={form.childName}
            onChange={(e) => set("childName", e.target.value)}
            className={`${inputBase} border-line`}
          />
        </div>

        <fieldset className="mt-5">
          <legend className="mb-1.5 text-sm font-semibold">School stage</legend>
          <div className="grid gap-2" role="radiogroup">
            {STAGES.map((s) => {
              const on = form.stage === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set("stage", on ? "" : s.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    on ? "border-accent bg-red-50" : "border-line bg-white hover:bg-mist"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-bold text-navy">{s.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-slate-600">{s.ages}</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600">{s.uk} | {s.us}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-600">
            On an international curriculum? Pick the closest age group.
          </p>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="mb-1.5 text-sm font-semibold">Focus subjects</legend>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => {
              const on = form.subjects.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleSubject(s)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    on ? "border-accent bg-accent text-white" : "border-line bg-white hover:bg-mist"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>

        {serverError && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-danger">{serverError}</p>
        )}

        <button
          type="button"
          onClick={() => finish(false)}
          disabled={sending}
          className="mt-6 w-full rounded-full bg-accent py-3.5 text-base font-bold text-white transition-colors hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          {sending ? "Sending..." : "Book Now"}
        </button>
        <button
          type="button"
          onClick={() => finish(true)}
          disabled={sending}
          className="mt-2 w-full rounded-full py-2 text-sm font-semibold text-brand underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Skip for now &amp; book via WhatsApp
        </button>
      </div>
    );
  }

  /* ---------- STEP 1: parent contact ---------- */
  const emailFix = suggestEmail(form.email);

  return (
    <form id="book" ref={cardRef} onSubmit={submitStep1} onFocus={onFormFocus} noValidate className={`${cardClass} relative`}>
      {progress}
      <p className="text-sm font-semibold text-accent">Step 1 of 2</p>
      <h2 className="mt-1 text-2xl font-extrabold text-navy">Book Your Free Assessment</h2>
      <p className="mt-1 text-sm text-slate-600">Just your contact details. We&apos;ll arrange the time on WhatsApp.</p>

      {/* Spam trap: real people never see or fill this in. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.botField}
        onChange={(e) => set("botField", e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="mt-5">
        <label htmlFor="parentName" className="mb-1.5 block text-sm font-semibold">Parent full name</label>
        <input
          id="parentName"
          type="text"
          autoComplete="name"
          value={form.parentName}
          onChange={(e) => set("parentName", e.target.value)}
          aria-invalid={!!errors.parentName}
          aria-describedby={errors.parentName ? "parentName-err" : undefined}
          className={`${inputBase} ${errors.parentName ? "border-danger" : "border-line"}`}
        />
        <ErrorText id="parentName-err">{errors.parentName}</ErrorText>
      </div>

      <div className="mt-4">
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email || emailFix ? "email-err" : undefined}
          className={`${inputBase} ${errors.email ? "border-danger" : "border-line"}`}
        />
        {(errors.email || emailFix) && (
          <p id="email-err" role="alert" className="mt-1.5 text-sm font-medium text-danger">
            {errors.email || "Check this email address."}
            {emailFix && (
              <>
                {" "}Did you mean{" "}
                <button type="button" onClick={() => set("email", emailFix)} className="underline underline-offset-2">
                  {emailFix}
                </button>
                ?
              </>
            )}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="mobile" className="mb-1.5 block text-sm font-semibold">WhatsApp mobile number</label>
        <div className="flex flex-col gap-2">
          <select
            aria-label="Country code"
            value={form.countryCode}
            onChange={(e) => set("countryCode", e.target.value)}
            className={`${inputBase} ${errors.mobile ? "border-danger" : "border-line"}`}
          >
            {COUNTRY_CODES.map(([name, code]) => (
              <option key={name} value={code}>{name} ({code})</option>
            ))}
            <option value="">Other country (type the number starting with +)</option>
          </select>
          <input
            id="mobile"
            type="tel"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder={form.countryCode === "+44" ? "7XXX XXXXXX" : form.countryCode ? "Phone number" : "+ and full number"}
            value={form.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            aria-invalid={!!errors.mobile}
            aria-describedby={errors.mobile ? "mobile-err" : undefined}
            className={`${inputBase} ${errors.mobile ? "border-danger" : "border-line"}`}
          />
        </div>
        <ErrorText id="mobile-err">{errors.mobile}</ErrorText>
      </div>

      <button
        type="submit"
        className="mt-5 w-full rounded-full bg-accent py-3.5 text-base font-bold text-white transition-colors hover:bg-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Continue
      </button>
      <p className="mt-3 text-center text-xs text-slate-600">
        Free. No card needed. By continuing you confirm you are the child&apos;s parent or guardian.
      </p>
    </form>
  );
}
