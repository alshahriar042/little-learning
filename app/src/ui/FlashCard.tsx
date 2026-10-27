import { darken } from "@/lib/color";
import { useState, type ReactNode } from "react";

/** Generic flashcard: big picture (tap = bounce + speak), coloured primary word, pronunciation and meaning. */
export function FlashCard({ picture, word, pron, meaning, color, onSpeak, speakLabel }: {
  picture: ReactNode; word: string; pron?: string; meaning?: string; color: string; onSpeak: () => void; speakLabel: string;
}) {
  const [pop, setPop] = useState(0);
  return (
    <div className="flex flex-col items-center gap-4 text-center lg:flex-row lg:justify-center lg:gap-8">
      {/* phones/tablets: picture above the words (width capped by screen height); desktops: picture left, words right, as tall as the screen allows */}
      <button type="button" aria-label={speakLabel} onClick={() => { setPop((p) => p + 1); onSpeak(); }}
        key={pop} className={`${pop ? "anim-bounce" : ""} w-full shrink-0 overflow-hidden rounded-[2rem] bg-white p-1.5 shadow-soft md:p-3 max-w-[max(28rem,min(100%,calc((100dvh-24rem)*1.7)))] lg:w-[72%] lg:max-w-[min(72%,calc((100dvh-12rem)*1.7))]`}>
        {picture}
      </button>
      <div className="lg:min-w-0 lg:flex-1">
        <p className="text-5xl font-black uppercase tracking-wide md:text-6xl xl:text-7xl" style={{ color: darken(color, 0.2) }}>{word}</p>
        {pron && <p lang="bn" className="mt-1 text-3xl font-bold text-soft md:text-4xl xl:text-5xl">({pron})</p>}
        {meaning && <p lang="bn" className="mt-1 text-5xl font-extrabold leading-tight md:text-6xl xl:text-7xl">{meaning}</p>}
      </div>
    </div>
  );
}
