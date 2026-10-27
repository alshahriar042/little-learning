import { useEffect, useRef, useState, type ReactNode } from "react";
import { m } from "framer-motion";
import { Confetti, StarBurst } from "./kit";
import { useT } from "@/i18n/strings";
import { useProgress } from "@/store/progress";

export interface GameOption { id: string; node: ReactNode; label: string }
/** A game is just data: a list of questions (prompt -> options -> answer). */
export interface GameQuestion {
  id: string;
  prompt: ReactNode;
  options: GameOption[];
  answerId: string;
  /** called when the question appears and when the child taps "hear again" */
  onShow?: () => void;
}

/** Generic question -> options -> feedback engine. Positive-only: wrong answers shake gently and invite another try. */
export function GameShell({ moduleId, questions, layout = "grid", onExit, onAgain }: {
  moduleId: string; questions: GameQuestion[]; layout?: "grid" | "list"; onExit: () => void; onAgain: () => void;
}) {
  const t = useT();
  const addStars = useProgress((s) => s.addStars);
  const [i, setI] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);
  const [firstTry, setFirstTry] = useState(true);
  const [stars, setStars] = useState(0);
  const [burst, setBurst] = useState(false);
  const timer = useRef<number>(0);
  const q = questions[i];
  const finished = i >= questions.length;

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (q) q.onShow?.(); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (finished && stars > 0) addStars(moduleId, stars); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(id: string) {
    if (rightId || !q) return;
    if (id === q.answerId) {
      setRightId(id); setBurst(true);
      if (firstTry) setStars((s) => s + 1);
      timer.current = window.setTimeout(() => { setBurst(false); setRightId(null); setWrongId(null); setFirstTry(true); setI((x) => x + 1); }, 1300);
    } else {
      setFirstTry(false); setWrongId(id);
      timer.current = window.setTimeout(() => setWrongId(null), 600);
    }
  }

  if (finished) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-10 text-center">
        <Confetti show />
        <div className="text-7xl" aria-hidden>🏆</div>
        <h2 className="text-3xl font-extrabold">{t("games.great")}</h2>
        <p className="text-2xl font-bold">{"⭐".repeat(Math.min(stars, 12)) || "💛"} <span className="text-soft">{stars} {t("games.stars")}</span></p>
        <button type="button" onClick={onAgain} className="min-h-16 w-full rounded-3xl bg-teal-bg text-2xl font-extrabold text-white shadow-soft">{t("games.playAgain")}</button>
        <button type="button" onClick={onExit} className="min-h-16 w-full rounded-3xl bg-white text-xl font-bold shadow-soft">{t("common.back")}</button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <StarBurst show={burst} />
      <div className="flex items-center justify-between text-lg font-extrabold" aria-live="polite">
        <span>{i + 1} {t("common.of")} {questions.length}</span><span>⭐ {stars}</span>
      </div>
      <div className="flex justify-center">{q.prompt}</div>
      <p role="status" className="min-h-8 text-center text-xl font-extrabold text-berry">{wrongId ? t("games.again") : ""}</p>
      <div className={layout === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
        {q.options.map((o) => (
          <m.button key={o.id} type="button" aria-label={o.label} onClick={() => pick(o.id)}
            animate={rightId === o.id ? { scale: [1, 1.08, 1] } : undefined}
            className={`overflow-hidden rounded-3xl bg-white p-2 shadow-soft active:scale-95 ${wrongId === o.id ? "anim-shake" : ""} ${rightId === o.id ? "ring-8 ring-leaf" : ""} ${rightId && rightId !== o.id ? "opacity-50" : ""}`}>
            {o.node}
          </m.button>
        ))}
      </div>
    </div>
  );
}
