import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { on } from "@/services/events";
import { Confetti } from "./kit";

const STICKERS = ["🦁", "🐘", "🌈", "🍎", "🚀", "🎈", "🐠", "🦋", "⚽", "🍉", "🌻", "🚂", "🐯", "🍓"];
/** Deterministic sticker for a unit (e.g. a section id). */
export function stickerFor(unitId: string): string {
  let h = 0;
  for (const c of unitId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return STICKERS[h % STICKERS.length];
}

/** Global celebration layer: listens to local events (no network) and shows a sticker pop-up with confetti. */
export function RewardsLayer() {
  const [sticker, setSticker] = useState<string | null>(null);
  useEffect(() => on("sticker:earned", ({ unitId }) => {
    setSticker(stickerFor(unitId));
    window.setTimeout(() => setSticker(null), 2600);
  }), []);
  return (
    <>
      <Confetti show={!!sticker} />
      <AnimatePresence>
        {sticker && (
          <m.div role="status" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
            <div className="rounded-[2rem] bg-white px-10 py-8 text-center shadow-soft">
              <div className="text-8xl" aria-hidden>{sticker}</div>
              <p className="text-2xl font-extrabold">New sticker! <span lang="bn">নতুন স্টিকার!</span></p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
