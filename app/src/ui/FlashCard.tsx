import { useState, type ReactNode } from "react";

/** Generic flashcard: big picture (tap = bounce + speak), coloured primary word, pronunciation and meaning. */
export function FlashCard({ picture, word, pron, meaning, color, onSpeak, speakLabel }: {
  picture: ReactNode; word: string; pron?: string; meaning?: string; color: string; onSpeak: () => void; speakLabel: string;
}) {
  const [pop, setPop] = useState(0);
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <button type="button" aria-label={speakLabel} onClick={() => { setPop((p) => p + 1); onSpeak(); }}
        key={pop} className={`${pop ? "anim-bounce" : ""} w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-2 shadow-soft`}>
        {picture}
      </button>
      <div>
        <p className="text-5xl font-black uppercase tracking-wide" style={{ color }}>{word}</p>
        {pron && <p lang="bn" className="mt-1 text-3xl font-bold text-soft">({pron})</p>}
        {meaning && <p lang="bn" className="mt-1 text-5xl font-extrabold leading-tight">{meaning}</p>}
      </div>
    </div>
  );
}
