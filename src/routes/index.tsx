import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { roastExcuse, type RoastResult } from "@/lib/roast.functions";
import deskImg from "@/assets/study-desk.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Excuse.exe 💀 — Get roasted for not studying" },
      {
        name: "description",
        content:
          "Type your excuse for not studying and get a funny AI roast, an excuse score, a reality check and a tiny study challenge with a cute timer.",
      },
      { property: "og:title", content: "Excuse.exe 💀 — Get roasted for not studying" },
      {
        property: "og:description",
        content:
          "Your excuses have been reported to the study department. Get roasted, then study for 15 cute minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExcuseApp,
});

/* ---------------- decorations ---------------- */

const FLOATERS = [
  { e: "✨", top: "8%", left: "6%", d: "0s" },
  { e: "💗", top: "18%", left: "88%", d: "1.1s" },
  { e: "📚", top: "46%", left: "3%", d: "0.6s" },
  { e: "☕", top: "62%", left: "92%", d: "1.7s" },
  { e: "✏️", top: "80%", left: "8%", d: "0.3s" },
  { e: "⭐", top: "88%", left: "82%", d: "1.3s" },
  { e: "☁️", top: "32%", left: "78%", d: "2.1s" },
];

function Decorations() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {FLOATERS.map((f) => (
        <span
          key={f.e + f.top}
          className="float-slow absolute text-2xl opacity-70 sm:text-3xl"
          style={{ top: f.top, left: f.left, animationDelay: f.d }}
        >
          {f.e}
        </span>
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="twinkle absolute text-xs"
          style={{
            top: `${(i * 37) % 95}%`,
            left: `${(i * 61) % 95}%`,
            animationDelay: `${(i % 5) * 0.4}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        e: ["🎉", "💗", "✨", "⭐", "📚", "🎀"][i % 6],
        left: `${(i * 13) % 100}%`,
        delay: `${(i % 10) * 0.12}s`,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit absolute text-2xl"
          style={{ left: b.left, animationDelay: b.delay }}
        >
          {b.e}
        </span>
      ))}
    </div>
  );
}

/* ---------------- progress storage ---------------- */

type Stats = { roasts: number; sessions: number; streak: number; last: string };
const EMPTY: Stats = { roasts: 0, sessions: 0, streak: 0, last: "" };
const KEY = "excuse-exe-stats";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function useStats() {
  const [stats, setStats] = useState<Stats>(EMPTY);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setStats({ ...EMPTY, ...(JSON.parse(raw) as Stats) });
    } catch {
      /* ignore */
    }
  }, []);

  const bump = (key: "roasts" | "sessions") => {
    setStats((prev) => {
      const t = today();
      let streak = prev.streak;
      if (prev.last !== t) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        streak = prev.last === yesterday ? prev.streak + 1 : 1;
      }
      const next = { ...prev, [key]: prev[key] + 1, streak, last: t };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return { stats, bump };
}

/* ---------------- timer ---------------- */

function StudyTimer({ minutes, onDone }: { minutes: number; onDone: () => void }) {
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (left === 0 && !doneRef.current) {
      doneRef.current = true;
      setRunning(false);
      onDone();
    }
  }, [left, onDone]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pct = 1 - left / (minutes * 60);

  return (
    <div className="card-cute pop-in relative mx-auto w-full max-w-md p-7 text-center">
      <span className="wiggle absolute -top-5 -left-4 text-3xl">⏰</span>
      <span className="float-slow absolute -top-6 right-2 text-2xl">☁️</span>
      <p className="font-display text-lg font-bold">Cute study timer</p>
      <p className="mt-1 text-sm text-muted-foreground">Just {minutes} minutes. You got this 💗</p>
      <div
        className="mx-auto mt-5 grid size-44 place-items-center rounded-full"
        style={{
          background: `conic-gradient(oklch(0.84 0.12 350) ${pct * 360}deg, oklch(0.95 0.03 330) 0deg)`,
        }}
      >
        <div className="grid size-36 place-items-center rounded-full bg-card">
          <span className="font-display text-4xl font-extrabold tabular-nums">
            {mm}:{ss}
          </span>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button className="btn-puffy" onClick={() => setRunning(true)} disabled={running}>
          Start ▶️
        </button>
        <button className="btn-soft" onClick={() => setRunning(false)}>
          Pause ⏸️
        </button>
        <button
          className="btn-soft"
          onClick={() => {
            doneRef.current = false;
            setRunning(false);
            setLeft(minutes * 60);
          }}
        >
          Reset 🔁
        </button>
      </div>
    </div>
  );
}

/* ---------------- app ---------------- */

type Stage = "home" | "loading" | "roast" | "timer" | "done";

function ExcuseApp() {
  const [excuse, setExcuse] = useState("");
  const [stage, setStage] = useState<Stage>("home");
  const [result, setResult] = useState<RoastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { stats, bump } = useStats();
  const getRoast = useServerFn(roastExcuse);

  const submit = async () => {
    if (!excuse.trim()) return;
    setError(null);
    setStage("loading");
    try {
      const r = await getRoast({ data: { excuse: excuse.trim() } });
      setResult(r);
      bump("roasts");
      setStage("roast");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something broke. Try again!");
      setStage("home");
    }
  };

  const reset = () => {
    setExcuse("");
    setResult(null);
    setStage("home");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 pt-8 pb-16">
      <Decorations />
      {stage === "done" && <Confetti />}

      <div className="relative z-10 mx-auto w-full max-w-xl">
        <header className="text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Excuse.exe 💀
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your excuses have been reported to the study department.
          </p>
        </header>

        {stage === "home" && (
          <section className="pop-in mt-8">
            <div className="card-cute relative overflow-hidden p-6 sm:p-8">
              <span className="twinkle absolute top-4 right-5 text-xl">✨</span>
              <h2 className="font-display text-3xl leading-tight font-extrabold">
                Why didn&apos;t you study? 👀
              </h2>
              <p className="mt-2 text-muted-foreground">
                Tell me your excuse. I promise I&apos;ll only judge a little.
              </p>

              <div className="mt-5 flex items-end gap-3">
                <img
                  src={deskImg}
                  alt="Cute pastel study desk with books, coffee and a pencil"
                  className="float-slow hidden w-28 shrink-0 sm:block"
                  loading="lazy"
                />
                <textarea
                  value={excuse}
                  onChange={(e) => setExcuse(e.target.value)}
                  rows={4}
                  maxLength={300}
                  placeholder="I didn't study because..."
                  className="w-full resize-none rounded-3xl border-2 border-border bg-muted/50 p-4 text-base outline-none focus:border-primary focus:ring-4 focus:ring-ring/30"
                />
              </div>

              <img
                src={deskImg}
                alt=""
                aria-hidden
                className="float-slow mx-auto mt-4 w-24 sm:hidden"
                loading="lazy"
              />

              <div className="mt-5 text-center">
                <button className="btn-puffy w-full sm:w-auto" onClick={submit}>
                  Roast Me 🔥
                </button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Don&apos;t worry. It&apos;ll hurt only a little.
                </p>
                {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
              </div>
            </div>

            <Progress stats={stats} />
          </section>
        )}

        {stage === "loading" && (
          <section className="pop-in mt-16 text-center">
            <div className="flex justify-center gap-4 text-4xl">
              <span className="float-slow">📚</span>
              <span className="float-slow" style={{ animationDelay: "0.3s" }}>
                🔍
              </span>
              <span className="float-slow" style={{ animationDelay: "0.6s" }}>
                💀
              </span>
            </div>
            <p className="font-display mt-6 text-xl font-bold">Analyzing your academic crime...</p>
            <p className="mt-1 text-sm text-muted-foreground">Consulting the roast department ✨</p>
          </section>
        )}

        {stage === "roast" && result && (
          <section className="mt-8 space-y-6">
            <div className="card-cute pop-in relative p-6 text-center sm:p-8">
              <span className="float-slow absolute -top-5 -left-3 text-3xl">💀</span>
              <span className="float-slow absolute -top-6 right-0 text-3xl">🔥</span>
              <span className="twinkle absolute -bottom-4 left-6 text-2xl">✨</span>
              <h2 className="font-display text-3xl font-extrabold">OH NO... 💀</h2>
              <p className="font-display mt-4 text-xl leading-snug font-bold sm:text-2xl">
                «{result.roast}»
              </p>
            </div>

            <div className="card-cute pop-in p-6 text-center">
              <div
                className="mx-auto grid size-32 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(oklch(0.84 0.12 350) ${result.score * 3.6}deg, oklch(0.95 0.03 330) 0deg)`,
                }}
              >
                <div className="grid size-24 place-items-center rounded-full bg-card">
                  <span className="font-display text-2xl font-extrabold">{result.score}</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">out of 100</p>
              <p className="font-display mt-3 text-lg font-bold">{result.title}</p>
            </div>

            <div className="sticky-note pop-in">
              <p className="font-display text-lg font-extrabold">Okay... but seriously 🥺</p>
              <p className="mt-2 text-sm font-semibold">{result.realityCheck}</p>
            </div>

            <div className="card-cute pop-in relative p-6 text-center">
              <span className="wiggle absolute -top-5 right-6 text-2xl">😇</span>
              <p className="font-display text-lg font-extrabold">
                Your punishment... I mean, challenge 😇
              </p>
              <p className="mt-3 text-base font-semibold">{result.challenge}</p>
              <button className="btn-puffy mt-5" onClick={() => setStage("timer")}>
                Okay, I&apos;ll do it 🫡
              </button>
            </div>

            <div className="pop-in text-center">
              <p className="font-display text-base font-bold">I have another question...</p>
              <button className="btn-soft mt-3" onClick={reset}>
                Give Me Another Roast 💀
              </button>
            </div>

            <Progress stats={stats} />
          </section>
        )}

        {stage === "timer" && result && (
          <section className="mt-10">
            <StudyTimer
              minutes={result.minutes}
              onDone={() => {
                bump("sessions");
                setStage("done");
              }}
            />
            <div className="mt-6 text-center">
              <button className="btn-soft" onClick={reset}>
                Back to excuses 💗
              </button>
            </div>
          </section>
        )}

        {stage === "done" && (
          <section className="pop-in mt-14 text-center">
            <div className="card-cute p-8">
              <p className="text-5xl">🎉</p>
              <h2 className="font-display mt-4 text-3xl font-extrabold">
                YOU ACTUALLY STUDIED?! 😭🎉
              </h2>
              <p className="mt-2 text-muted-foreground">Character development unlocked.</p>
              <button className="btn-puffy mt-6" onClick={reset}>
                Roast me again 💀
              </button>
            </div>
            <Progress stats={stats} />
          </section>
        )}
      </div>
    </main>
  );
}

function Progress({ stats }: { stats: Stats }) {
  const pct = Math.min(100, 20 + stats.sessions * 12 + stats.streak * 6);
  const cards = [
    { icon: "🔥", label: "Roasts", value: stats.roasts, bg: "var(--peach)" },
    { icon: "📚", label: "Study Sessions", value: stats.sessions, bg: "var(--mint)" },
    { icon: "✨", label: "Day Streak", value: stats.streak, bg: "var(--sky)" },
  ];
  return (
    <div className="mt-10">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="card-cute p-3 text-center"
            style={{ background: c.bg as string }}
          >
            <p className="text-2xl">{c.icon}</p>
            <p className="font-display text-xl font-extrabold">{c.value}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, oklch(0.85 0.12 350), oklch(0.85 0.1 200))",
            }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          You&apos;re doing better than yesterday 💗
        </p>
      </div>
    </div>
  );
}
