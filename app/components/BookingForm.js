"use client";

import { useEffect, useRef, useState } from "react";
import { FORMSPREE_ENDPOINT, CONTACT_EMAIL } from "../config";

const YEAR_GROUPS = Array.from({ length: 13 }, (_, i) => `Year ${i + 1}`);
const SUBJECTS = ["Maths", "English", "Science", "Other", "Not sure"];
const HELP = ["Building confidence", "Catching up", "Exam preparation"];
const TIMES = ["4:00 pm", "4:30 pm", "5:00 pm", "5:30 pm", "6:00 pm", "6:30 pm", "7:00 pm", "7:30 pm"];

const EMAIL_TYPOS = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "hotmial.com": "hotmail.com",
  "yahooo.com": "yahoo.com",
  "outlok.com": "outlook.com",
};

const EMPTY = {
  childName: "",
  yearGroup: "",
  examBoard: "",
  subject: "",
  helpMost: "",
  date: null,
  time: "",
  parentName: "",
  email: "",
  mobile: "",
  whatsapp: false,
  guardian: false,
  privacy: false,
  marketing: false,
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

function ukMobileDigits(v) {
  // "07123 456789", "+44 7123 456789" and "7123456789" all become 7123456789
  let d = v.replace(/\D/g, "");
  if (d.startsWith("44")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

function upcomingWeekdays(count) {
  const out = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    out.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-GB", { month: "short" }),
      long: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    });
  }
  return out;
}

function ErrorText({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-danger">
      {children}
    </p>
  );
}

function Pill({ selected, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        selected
          ? "border-brand bg-brand text-white"
          : "border-line bg-white text-ink hover:border-brand"
      }`}
    >
      {selected && <span aria-hidden="true">✓</span>}
      {children}
    </button>
  );
}

const inputBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand";

export default function BookingForm() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [days, setDays] = useState([]);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const cardRef = useRef(null);
  const firstRender = useRef(true);

  // Dates are built in the browser so they are always "from tomorrow".
  useEffect(() => {
    setDays(upcomingWeekdays(10));
  }, []);

  // On phones, bring the card back into view when the step changes.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (window.innerWidth < 1024 && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step, done]);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const showExamBoard = form.yearGroup === "Year 10" || form.yearGroup === "Year 11";
  const chosenDay = days.find((d) => d.iso === form.date);
  const emailFix = suggestEmail(form.email);

  function validate(forStep) {
    const e = {};
    if (forStep === 1) {
      if (!form.childName.trim()) e.childName = "Enter your child's first name.";
      if (!form.yearGroup) e.yearGroup = "Choose a year group.";
      if (!form.subject) e.subject = "Choose a focus subject.";
    }
    if (forStep === 2) {
      if (!form.date) e.date = "Choose a day.";
      if (!form.time) e.time = "Choose a time.";
    }
    if (forStep === 3) {
      if (!form.parentName.trim()) e.parentName = "Enter your full name.";
      if (!form.email.trim()) e.email = "Enter your email address.";
      else if (!emailOk(form.email)) e.email = "That email doesn't look right.";
      const digits = ukMobileDigits(form.mobile);
      if (form.whatsapp && !form.mobile.trim()) e.mobile = "Add your mobile number so we can use WhatsApp.";
      else if (form.mobile.trim() && !/^7\d{9}$/.test(digits)) e.mobile = "Enter a UK mobile number, like 7123 456789.";
      if (!form.guardian) e.guardian = "You need to confirm this to book.";
      if (!form.privacy) e.privacy = "You need to confirm this to book.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validate(step)) setStep((s) => s + 1);
  }

  function back() {
    setErrors({});
    setServerError("");
    setStep((s) => s - 1);
  }

  async function submit(ev) {
    ev.preventDefault();
    if (sending || !validate(3)) return;
    setServerError("");

    if (FORMSPREE_ENDPOINT.includes("YOUR_FORM_ID")) {
      setServerError("The form isn't connected yet. Open app/config.js and paste your Formspree endpoint.");
      return;
    }

    const mobile = form.mobile.trim() ? `+44 ${ukMobileDigits(form.mobile)}` : "";
    const payload = {
      _subject: `Snapshot booking request: ${form.childName.trim()} (${form.yearGroup}), ${chosenDay?.long}, ${form.time} UK time`,
      name: form.parentName.trim(),
      email: form.email.trim(),
      mobile,
      child_first_name: form.childName.trim(),
      year_group: form.yearGroup,
      exam_board: form.examBoard.trim(),
      focus_subject: form.subject,
      helps_most: form.helpMost,
      requested_day: chosenDay?.long,
      requested_time_uk: form.time,
      reply_on_whatsapp: form.whatsapp ? "Yes" : "No",
      guardian_confirmed: form.guardian ? "Yes" : "No",
      privacy_confirmed: form.privacy ? "Yes" : "No",
      marketing_opt_in: form.marketing ? "Yes" : "No",
      _gotcha: form.botField,
    };

    setSending(true);
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        const detail = data?.errors?.map((x) => x.message).join(" ");
        setServerError(detail || "We couldn't send your booking. Check your connection and try again.");
      }
    } catch {
      setServerError("We couldn't send your booking. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  function startAgain() {
    setForm(EMPTY);
    setErrors({});
    setServerError("");
    setStep(1);
    setDone(false);
  }

  const cardClass =
    "rounded-3xl border border-line bg-white p-6 shadow-[0_18px_50px_-20px_rgba(11,63,166,0.35)] sm:p-8";

  if (done) {
    return (
      <div id="book" ref={cardRef} className={`${cardClass} scroll-mt-24`}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-ok" aria-hidden="true">
          ✓
        </div>
        <h2 className="text-center text-2xl font-extrabold">
          Thanks, {form.parentName.trim().split(" ")[0]}. Your request is in.
        </h2>
        <p className="mt-2 text-center text-slate-600">
          We will email <strong className="text-ink">{form.email.trim()}</strong> to confirm your time.
        </p>

        <dl className="mt-6 divide-y divide-line rounded-2xl bg-mist px-5 text-sm">
          {[
            ["Child", `${form.childName.trim()}, ${form.yearGroup}`],
            ["Subject", form.subject],
            ["Requested time", `${chosenDay?.long}, ${form.time} UK time`],
            ["Length", "30 minutes"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3">
              <dt className="text-slate-600">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-6 font-bold">How to get ready</h3>
        <ol className="mt-3 space-y-2 text-sm text-slate-700">
          <li>1. A quiet space and a laptop or tablet with camera and microphone.</li>
          <li>2. Pen and paper ready.</li>
          <li>3. An adult nearby. Join two minutes early.</li>
        </ol>

        <p className="mt-5 rounded-2xl bg-mist p-4 text-sm">
          <strong>What happens next:</strong> after the session, we will email {form.childName.trim()}&apos;s one-page Snapshot to you.
        </p>

        <button
          type="button"
          onClick={startAgain}
          className="mt-5 w-full rounded-full py-2 text-sm font-semibold text-brand underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Book for another child
        </button>
      </div>
    );
  }

  return (
    <form id="book" ref={cardRef} onSubmit={submit} noValidate className={`${cardClass} scroll-mt-24`}>
      <div className="mb-5 flex gap-2" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-brand" : "bg-line"}`} />
        ))}
      </div>
      <p className="text-sm font-semibold text-brand">Step {step} of 3</p>

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          <h2 className="mt-1 text-2xl font-extrabold">Tell us about your child</h2>
          <p className="mt-1 text-sm text-slate-600">We use this to prepare your tutor. First name only, please.</p>

          <div className="mt-5">
            <label htmlFor="childName" className="mb-1.5 block text-sm font-semibold">Child&apos;s first name</label>
            <div className="relative">
              <input
                id="childName"
                type="text"
                autoComplete="off"
                value={form.childName}
                onChange={(e) => set("childName", e.target.value)}
                aria-invalid={!!errors.childName}
                aria-describedby={errors.childName ? "childName-err" : undefined}
                className={`${inputBase} pr-10 ${errors.childName ? "border-danger" : form.childName.trim() ? "border-ok" : "border-line"}`}
              />
              {form.childName.trim() && !errors.childName && (
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ok" aria-hidden="true">✓</span>
              )}
            </div>
            <ErrorText id="childName-err">{errors.childName}</ErrorText>
          </div>

          <div className="mt-4">
            <label htmlFor="yearGroup" className="mb-1.5 block text-sm font-semibold">Year group</label>
            <select
              id="yearGroup"
              value={form.yearGroup}
              onChange={(e) => set("yearGroup", e.target.value)}
              aria-invalid={!!errors.yearGroup}
              aria-describedby={errors.yearGroup ? "yearGroup-err" : undefined}
              className={`${inputBase} ${errors.yearGroup ? "border-danger" : "border-line"}`}
            >
              <option value="">Choose a year group</option>
              {YEAR_GROUPS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ErrorText id="yearGroup-err">{errors.yearGroup}</ErrorText>
          </div>

          {showExamBoard && (
            <div className="mt-4">
              <label htmlFor="examBoard" className="mb-1.5 block text-sm font-semibold">
                Exam board <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="examBoard"
                type="text"
                placeholder="AQA, Edexcel, OCR..."
                value={form.examBoard}
                onChange={(e) => set("examBoard", e.target.value)}
                className={`${inputBase} border-line`}
              />
            </div>
          )}

          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold">Focus subject for the 30 minutes</legend>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <Pill key={s} selected={form.subject === s} onClick={() => set("subject", s)}>{s}</Pill>
              ))}
            </div>
            <ErrorText>{errors.subject}</ErrorText>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold">
              What would help most? <span className="font-normal text-slate-500">(optional)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {HELP.map((h) => (
                <Pill key={h} selected={form.helpMost === h} onClick={() => set("helpMost", form.helpMost === h ? "" : h)}>{h}</Pill>
              ))}
            </div>
          </fieldset>

          <button type="button" onClick={next} className="mt-6 w-full rounded-full bg-brand py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
            Continue
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <h2 className="mt-1 text-2xl font-extrabold">Pick a time that suits you</h2>
          <p className="mt-1 text-sm text-slate-600">All times are shown in UK time.</p>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold">Day</legend>
            {days.length === 0 ? (
              <div className="h-[132px] rounded-2xl bg-mist" />
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {days.map((d) => {
                  const on = form.date === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("date", d.iso)}
                      className={`flex flex-col items-center rounded-2xl border py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                        on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"
                      }`}
                    >
                      <span className="text-xs font-medium">{d.weekday}</span>
                      <span className="text-lg font-extrabold leading-tight">{d.day}</span>
                      <span className="text-xs">{d.month}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <ErrorText>{errors.date}</ErrorText>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold">Time</legend>
            <div className="grid grid-cols-3 gap-2">
              {TIMES.map((t) => (
                <Pill key={t} selected={form.time === t} onClick={() => set("time", t)}>{t}</Pill>
              ))}
            </div>
            <ErrorText>{errors.time}</ErrorText>
          </fieldset>

          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Learning%20Snapshot%20time%20request`}
            className="mt-4 inline-block text-sm font-semibold text-brand underline underline-offset-4"
          >
            None of these times work? Email us
          </a>

          <button type="button" onClick={next} className="mt-5 w-full rounded-full bg-brand py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
            Continue
          </button>
          <button type="button" onClick={back} className="mt-2 w-full rounded-full py-2 text-sm font-semibold text-slate-600 underline underline-offset-4">
            Back
          </button>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div>
          <h2 className="mt-1 text-2xl font-extrabold">Last step: your details</h2>
          <p className="mt-1 text-sm text-slate-600">We will send your booking and reminders here.</p>

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
            <label htmlFor="parentName" className="mb-1.5 block text-sm font-semibold">Your full name</label>
            <input
              id="parentName"
              type="text"
              autoComplete="name"
              placeholder="Parent or guardian name"
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
              aria-describedby={errors.email ? "email-err" : undefined}
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
            <label htmlFor="mobile" className="mb-1.5 block text-sm font-semibold">
              Mobile number <span className="font-normal text-slate-500">(only needed for WhatsApp)</span>
            </label>
            <div className="flex gap-2">
              <span className="flex items-center rounded-xl border border-line bg-mist px-4 text-base font-semibold">+44</span>
              <input
                id="mobile"
                type="tel"
                autoComplete="tel-national"
                inputMode="tel"
                placeholder="7XXX XXXXXX"
                value={form.mobile}
                onChange={(e) => set("mobile", e.target.value)}
                aria-invalid={!!errors.mobile}
                aria-describedby={errors.mobile ? "mobile-err" : undefined}
                className={`${inputBase} ${errors.mobile ? "border-danger" : "border-line"}`}
              />
            </div>
            <ErrorText id="mobile-err">{errors.mobile}</ErrorText>
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={form.whatsapp} onChange={(e) => set("whatsapp", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
              <span>Yes, send my booking and reminders on WhatsApp.</span>
            </label>

            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.guardian} onChange={(e) => set("guardian", e.target.checked)} aria-invalid={!!errors.guardian} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
                <span>
                  I am this child&apos;s parent or legal guardian and agree to my child taking part in a free 30-minute live online session. An adult will be nearby throughout. <span className="text-danger" aria-label="required">*</span>
                </span>
              </label>
              <ErrorText>{errors.guardian}</ErrorText>
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.privacy} onChange={(e) => set("privacy", e.target.checked)} aria-invalid={!!errors.privacy} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
                <span>
                  I have read the Privacy Notice and agree you can use my details to arrange this Snapshot. <span className="text-danger" aria-label="required">*</span>
                </span>
              </label>
              <ErrorText>{errors.privacy}</ErrorText>
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={form.marketing} onChange={(e) => set("marketing", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
              <span>Send me occasional study tips and news. I can unsubscribe at any time.</span>
            </label>
          </div>

          {serverError && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-danger">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="mt-5 w-full rounded-full bg-brand py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          >
            {sending ? "Booking..." : "Book my free Snapshot"}
          </button>
          <button type="button" onClick={back} disabled={sending} className="mt-2 w-full rounded-full py-2 text-sm font-semibold text-slate-600 underline underline-offset-4">
            Back
          </button>
        </div>
      )}

      <p className="mt-3 text-center text-sm text-slate-600">Free. No card needed. No obligation to enrol.</p>
    </form>
  );
}
