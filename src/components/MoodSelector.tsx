import { useState, useRef, useEffect } from "react";
import { Palette } from "lucide-react";

const MOODS = [
  { id: "haze",   icon: "☁️", label: "Haze",   desc: "Neutral calm tones" },
  { id: "dawn",   icon: "🌅", label: "Dawn",   desc: "Warm morning tones" },
  { id: "sunset", icon: "🌇", label: "Sunset", desc: "Warm orange-pink tones" },
  { id: "neon",   icon: "🌃", label: "Neon",   desc: "Deep blue-purple tones" },
  { id: "grove",  icon: "🌲", label: "Grove",  desc: "Muted green nature tones" },
] as const;

export type MoodId = (typeof MOODS)[number]["id"];

export function useMood() {
  const [mood, setMoodState] = useState<MoodId>(() => {
    if (typeof window === "undefined") return "haze";
    return (localStorage.getItem("shukan-mood") as MoodId) || "haze";
  });

  const setMood = (m: MoodId) => {
    setMoodState(m);
    localStorage.setItem("shukan-mood", m);
    document.documentElement.setAttribute("data-mood", m);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-mood", mood);
  }, []);

  return { mood, setMood };
}

export default function MoodSelector({
  mood,
  setMood,
}: {
  mood: MoodId;
  setMood: (m: MoodId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = MOODS.find((m) => m.id === mood)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change mood"
        title={`Mood: ${current.label}`}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
      >
        <span className="text-sm leading-none">{current.icon}</span>
        <Palette className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-border bg-popover shadow-lg z-50 py-1 animate-fade-in">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMood(m.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 flex items-center gap-3 text-sm font-body transition-colors hover:bg-muted ${
                mood === m.id
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <span className="text-base leading-none">{m.icon}</span>
              <div>
                <p className="leading-tight">{m.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
