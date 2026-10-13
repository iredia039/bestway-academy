"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FORMSPREE_ENDPOINT, CONTACT_EMAIL } from "../config";

const UK_TZ = "Europe/London";

const YEAR_GROUPS = Array.from({ length: 13 }, (_, i) => `Year ${i + 1}`);
const SUBJECTS = ["Maths", "English", "Science", "Other", "Not sure"];
const HELP = ["Building confidence", "Catching up", "Exam preparation"];

// Sessions run on UK time: 4:00 pm to 7:30 pm. Each entry is [hour, minute] in 24-hour UK time.
const UK_SLOTS = [[16, 0], [16, 30], [17, 0], [17, 30], [18, 0], [18, 30], [19, 0], [19, 30]];

// [short label, dial code]. The UK is first and is the default.
const COUNTRY_CODES = [
  ["UK", "+44"], ["IE", "+353"], ["US/CA", "+1"], ["NG", "+234"], ["GH", "+233"], ["KE", "+254"],
  ["ZA", "+27"], ["EG", "+20"], ["UG", "+256"], ["TZ", "+255"], ["ZM", "+260"], ["ZW", "+263"],
  ["CM", "+237"], ["AE", "+971"], ["SA", "+966"], ["QA", "+974"], ["IN", "+91"], ["PK", "+92"],
  ["BD", "+880"], ["LK", "+94"], ["SG", "+65"], ["MY", "+60"], ["HK", "+852"], ["CN", "+86"],
  ["JP", "+81"], ["KR", "+82"], ["PH", "+63"], ["AU", "+61"], ["NZ", "+64"], ["FR", "+33"],
  ["DE", "+49"], ["ES", "+34"], ["IT", "+39"], ["NL", "+31"], ["BE", "+32"], ["PT", "+351"],
  ["PL", "+48"], ["SE", "+46"], ["NO", "+47"], ["CH", "+41"], ["TR", "+90"], ["BR", "+55"],
  ["MX", "+52"], ["JM", "+1876"], ["TT", "+1868"],
];

// Used to pre-select a sensible country code from the visitor's time zone.
const TZ_DIAL = {
  "Europe/London": "+44", "Europe/Dublin": "+353", "Africa/Lagos": "+234", "Africa/Accra": "+233",
  "Africa/Nairobi": "+254", "Africa/Johannesburg": "+27", "Africa/Cairo": "+20", "Asia/Dubai": "+971",
  "Asia/Riyadh": "+966", "Asia/Kolkata": "+91", "Asia/Calcutta": "+91", "Asia/Karachi": "+92",
  "Asia/Dhaka": "+880", "Asia/Singapore": "+65", "Asia/Kuala_Lumpur": "+60", "Asia/Hong_Kong": "+852",
  "Asia/Shanghai": "+86", "Asia/Tokyo": "+81", "Asia/Seoul": "+82", "Asia/Manila": "+63",
  "Australia/Sydney": "+61", "Australia/Melbourne": "+61", "Pacific/Auckland": "+64",
  "America/New_York": "+1", "America/Chicago": "+1", "America/Denver": "+1", "America/Los_Angeles": "+1",
  "America/Toronto": "+1", "Europe/Paris": "+33", "Europe/Berlin": "+49", "Europe/Madrid": "+34",
  "Europe/Rome": "+39", "Europe/Amsterdam": "+31",
};

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
  date: null, // the day picked, in the visitor's own time zone, like 2026-10-15
  slotIso: "", // the exact moment picked (UTC), like 2026-10-15T15:00:00.000Z
  timeZone: "",
  parentName: "",
  email: "",
  countryCode: "+44",
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
  if (nat.length < 6 || code.length - 1 + nat.length > 15) {
    return { error: "That number doesn't look right for the country code you chose." };
  }
  return { e164: `${code}${nat}` };
}

/* ---------- time zones ---------- */

function tzOffsetMinutes(date, tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUtc - date.getTime()) / 60000;
}

// The exact moment when the clock in `tz` reads y-m-d h:min.
function zonedToUtc(y, m, d, h, min, tz) {
  const guess = Date.UTC(y, m - 1, d, h, min);
  const off1 = tzOffsetMinutes(new Date(guess), tz);
  let utc = guess - off1 * 60000;
  const off2 = tzOffsetMinutes(new Date(utc), tz);
  if (off2 !== off1) utc = guess - off2 * 60000;
  return new Date(utc);
}

function timeIn(date, tz) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true })
    .format(date)
    .replace(/\u202f/g, " ")
    .toLowerCase();
}

function dayKeyIn(date, tz) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function fmtIn(utc, tz, opts) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...opts }).format(utc);
}

// Every bookable moment: 4:00 to 7:30 pm UK time on the next `count` UK weekdays.
function buildSlotIsos(count) {
  const out = [];
  for (const d of upcomingUkWeekdays(count)) {
    const [y, m, day] = d.iso.split("-").map(Number);
    for (const [h, min] of UK_SLOTS) out.push(zonedToUtc(y, m, day, h, min, UK_TZ).toISOString());
  }
  return out;
}

// One slot described in the visitor's time zone, with its UK equivalent.
function describeSlot(iso, tz) {
  const utc = new Date(iso);
  const localKey = dayKeyIn(utc, tz);
  return {
    iso,
    localKey,
    sameDay: localKey === dayKeyIn(utc, UK_TZ),
    localTime: timeIn(utc, tz),
    ukTime: timeIn(utc, UK_TZ),
    localWeekday: fmtIn(utc, tz, { weekday: "short" }),
    localDayNum: fmtIn(utc, tz, { day: "numeric" }),
    localMonth: fmtIn(utc, tz, { month: "short" }),
    localDayShort: fmtIn(utc, tz, { weekday: "short", day: "numeric", month: "short" }),
    localDayLong: fmtIn(utc, tz, { weekday: "long", day: "numeric", month: "long" }),
    ukDayShort: fmtIn(utc, UK_TZ, { weekday: "short", day: "numeric", month: "short" }),
    ukDayLong: fmtIn(utc, UK_TZ, { weekday: "long", day: "numeric", month: "long" }),
  };
}

function tzLabel(z) {
  return z === UK_TZ ? "United Kingdom (London)" : z.replace(/_/g, " ");
}

function getTimeZones(detected) {
  let list = [];
  try {
    list = Intl.supportedValuesOf("timeZone");
  } catch {
    list = [];
  }
  if (!list.length) {
    list = ["Europe/Dublin", "Africa/Lagos", "Africa/Johannesburg", "America/New_York", "Asia/Dubai", "Asia/Kolkata", "Australia/Sydney"];
  }
  const set = new Set(list);
  set.delete(UK_TZ);
  if (detected && detected !== UK_TZ) set.add(detected);
  return [UK_TZ, ...[...set].sort()];
}

// The next `count` weekdays, counted from tomorrow in the UK.
function upcomingUkWeekdays(count) {
  const [y, m, d] = dayKeyIn(new Date(), UK_TZ).split("-").map(Number);
  const cur = new Date(Date.UTC(y, m - 1, d, 12));
  const out = [];
  while (out.length < count) {
    cur.setUTCDate(cur.getUTCDate() + 1);
    const dow = cur.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    out.push({
      iso: cur.toISOString().slice(0, 10),
      weekday: cur.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
      day: cur.getUTCDate(),
      month: cur.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      long: cur.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
    });
  }
  return out;
}

/* ---------- small UI pieces ---------- */

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

function SlotButton({ slot, selected, showUk, onClick }) {
  const sub = selected ? "text-white/85" : "text-slate-600";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border px-1 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        selected ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
      }`}
    >
      <span className="text-sm font-bold">{slot.localTime}</span>
      {showUk && <span className={`text-xs ${sub}`}>{slot.ukTime} UK</span>}
      {showUk && !slot.sameDay && <span className={`text-xs ${sub}`}>{slot.ukDayShort}</span>}
    </button>
  );
}

const inputBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand";

/* ---------- the form ---------- */

export default function BookingForm() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [allSlots, setAllSlots] = useState([]);
  const [tzList, setTzList] = useState([]);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const cardRef = useRef(null);
  const firstRender = useRef(true);

  // Dates and time zones come from the browser, so they are set after the page loads.
  useEffect(() => {
    setAllSlots(buildSlotIsos(12));
    let detected = UK_TZ;
    try {
      detected = Intl.DateTimeFormat().resolvedOptions().timeZone || UK_TZ;
    } catch {
      detected = UK_TZ;
    }
    setTzList(getTimeZones(detected));
    const dial = TZ_DIAL[detected];
    setForm((f) => ({
      ...f,
      timeZone: detected,
      countryCode: dial && COUNTRY_CODES.some((c) => c[1] === dial) ? dial : f.countryCode,
    }));
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

  const tz = form.timeZone || UK_TZ;
  const isUk = tz === UK_TZ;
  const showExamBoard = form.yearGroup === "Year 10" || form.yearGroup === "Year 11";
  const described = useMemo(() => allSlots.map((iso) => describeSlot(iso, tz)), [allSlots, tz]);
  const stripDays = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const sl of described) {
      if (!seen.has(sl.localKey)) {
        seen.add(sl.localKey);
        out.push(sl);
      }
    }
    return out.slice(0, 10);
  }, [described]);
  const daySlots = form.date ? described.filter((sl) => sl.localKey === form.date) : [];
  const chosen = form.slotIso ? described.find((sl) => sl.iso === form.slotIso) : null;
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
      if (!form.slotIso) e.time = "Choose a time.";
    }
    if (forStep === 3) {
      if (!form.parentName.trim()) e.parentName = "Enter your full name.";
      if (!form.email.trim()) e.email = "Enter your email address.";
      else if (!emailOk(form.email)) e.email = "That email doesn't look right.";
      const phone = parsePhone(form.countryCode, form.mobile);
      if (phone.empty) {
        if (form.whatsapp) e.mobile = "Add your mobile number so we can use WhatsApp.";
      } else if (phone.error) {
        e.mobile = phone.error;
      }
      if (!form.guardian) e.guardian = "You need to confirm this to book.";
      if (!form.privacy) e.privacy = "You need to confirm this to book.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function changeTimeZone(z) {
    // Keep the chosen moment, but show it on its date in the new time zone.
    setForm((f) => ({ ...f, timeZone: z, date: f.slotIso ? dayKeyIn(new Date(f.slotIso), z) : null }));
    setErrors((e) => ({ ...e, date: undefined, time: undefined }));
  }

  function pickDay(key) {
    setForm((f) => ({
      ...f,
      date: key,
      slotIso: f.slotIso && dayKeyIn(new Date(f.slotIso), tz) === key ? f.slotIso : "",
    }));
    setErrors((e) => ({ ...e, date: undefined }));
  }

  function pickSlot(iso) {
    setForm((f) => ({ ...f, slotIso: iso }));
    setErrors((e) => ({ ...e, time: undefined }));
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

    const phone = parsePhone(form.countryCode, form.mobile);
    const payload = {
      _subject: `Snapshot booking request: ${form.childName.trim()} (${form.yearGroup}), ${chosen?.ukDayLong}, ${chosen?.ukTime} UK time`,
      name: form.parentName.trim(),
      email: form.email.trim(),
      mobile: phone.e164 || "",
      child_first_name: form.childName.trim(),
      year_group: form.yearGroup,
      exam_board: form.examBoard.trim(),
      focus_subject: form.subject,
      helps_most: form.helpMost,
      requested_day_uk: chosen?.ukDayLong,
      requested_time_uk: chosen?.ukTime,
      requested_time_for_parent: `${chosen?.localDayShort}, ${chosen?.localTime}`,
      parent_time_zone: tz,
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
    setForm({ ...EMPTY, timeZone: form.timeZone, countryCode: form.countryCode });
    setErrors({});
    setServerError("");
    setStep(1);
    setDone(false);
  }

  const cardClass =
    "rounded-3xl border border-line bg-white p-6 shadow-[0_18px_50px_-20px_rgba(1,64,170,0.35)] sm:p-8";

  if (done) {
    const rows = [
      ["Child", `${form.childName.trim()}, ${form.yearGroup}`],
      ["Subject", form.subject],
      ["UK time", `${chosen?.ukDayLong}, ${chosen?.ukTime}`],
      ...(isUk ? [] : [["Your time", `${chosen?.localDayLong}, ${chosen?.localTime} (${tzLabel(tz)})`]]),
      ["Length", "30 minutes"],
    ];
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
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3">
              <dt className="shrink-0 text-slate-600">{k}</dt>
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
          <p className="mt-1 text-sm text-slate-600">
            {isUk
              ? "All times are UK time."
              : "Dates and times are shown in your time zone. Sessions run from 4:00 to 7:30 pm UK time."}
          </p>

          <div className="mt-4">
            <label htmlFor="timeZone" className="mb-1.5 block text-sm font-semibold">Your time zone</label>
            {tzList.length ? (
              <select
                id="timeZone"
                value={form.timeZone}
                onChange={(e) => changeTimeZone(e.target.value)}
                className={`${inputBase} border-line`}
              >
                {tzList.map((z) => (
                  <option key={z} value={z}>{tzLabel(z)}</option>
                ))}
              </select>
            ) : (
              <div className="h-[50px] rounded-xl bg-mist" />
            )}
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold">Day</legend>
            {stripDays.length === 0 ? (
              <div className="h-[132px] rounded-2xl bg-mist" />
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {stripDays.map((d) => {
                  const on = form.date === d.localKey;
                  return (
                    <button
                      key={d.localKey}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pickDay(d.localKey)}
                      className={`flex flex-col items-center rounded-2xl border py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                        on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"
                      }`}
                    >
                      <span className="text-xs font-medium">{d.localWeekday}</span>
                      <span className="text-lg font-extrabold leading-tight">{d.localDayNum}</span>
                      <span className="text-xs">{d.localMonth}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <ErrorText>{errors.date}</ErrorText>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold">Time</legend>
            {form.date ? (
              <div className="grid grid-cols-3 gap-2">
                {daySlots.map((sl) => (
                  <SlotButton key={sl.iso} slot={sl} showUk={!isUk} selected={form.slotIso === sl.iso} onClick={() => pickSlot(sl.iso)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Choose a day to see the times.</p>
            )}
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
              <select
                aria-label="Country code"
                value={form.countryCode}
                onChange={(e) => set("countryCode", e.target.value)}
                className={`${inputBase} w-[7.25rem] shrink-0 px-3 ${errors.mobile ? "border-danger" : "border-line"}`}
              >
                {COUNTRY_CODES.map(([short, code]) => (
                  <option key={short} value={code}>{short} {code}</option>
                ))}
                <option value="">Other</option>
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
                aria-describedby={errors.mobile ? "mobile-err" : "mobile-help"}
                className={`${inputBase} ${errors.mobile ? "border-danger" : "border-line"}`}
              />
            </div>
            {errors.mobile ? (
              <ErrorText id="mobile-err">{errors.mobile}</ErrorText>
            ) : (
              <p id="mobile-help" className="mt-1.5 text-sm text-slate-600">
                Any country works. Pick your code, or type the full number starting with +.
              </p>
            )}
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
