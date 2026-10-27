import { useMemo, useState } from "react";
import { makeGateChallenge } from "@/lib/gate";
import { useT } from "@/i18n/strings";

export function ParentalGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  const t = useT();
  const [seed, setSeed] = useState(0);
  const [wrong, setWrong] = useState(false);
  const ch = useMemo(() => makeGateChallenge(), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="gate-title" className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 text-center">
      <div className="text-6xl" aria-hidden>🔒</div>
      <h2 id="gate-title" className="text-3xl font-extrabold">{t("gate.title")}</h2>
      <p className="text-soft">{t("gate.hint")}</p>
      <p className="text-lg font-bold">{t("gate.solve")}</p>
      <p className="text-5xl font-extrabold tabular-nums" aria-live="polite">{ch.a} + {ch.b} = ?</p>
      <div className="grid w-full grid-cols-2 gap-3">
        {ch.options.map((o) => (
          <button key={o} type="button" className="min-h-16 rounded-2xl bg-teal-bg text-3xl font-extrabold text-white shadow-soft active:scale-95"
            onClick={() => { if (o === ch.answer) onPass(); else { setWrong(true); setSeed((s) => s + 1); } }}>{o}</button>
        ))}
      </div>
      {wrong && <p role="alert" className="font-bold text-berry">{t("gate.wrong")}</p>}
      <button type="button" onClick={onCancel} className="min-h-14 rounded-2xl px-6 text-lg font-bold text-soft underline">{t("common.cancel")}</button>
    </div>
  );
}
