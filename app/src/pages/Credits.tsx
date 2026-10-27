import { useEffect, useState } from "react";
import { Screen } from "@/ui/shell";
import { Gated } from "./Parent";
import { useT } from "@/i18n/strings";
import { modules } from "@/modules/registry";
import type { CreditEntry } from "@/modules/types";

/** Lists every photo's author / licence / source from every module's content JSON. */
export default function Credits() {
  const t = useT();
  const [groups, setGroups] = useState<{ id: string; title: string; entries: CreditEntry[] }[] | null>(null);
  useEffect(() => {
    void Promise.all(modules.filter((m) => m.loadCredits).map(async (m) => ({ id: m.id, title: m.titleEn, entries: await m.loadCredits!().catch(() => []) }))).then(setGroups);
  }, []);
  return (
    <Gated title={t("credits.title")} back="/parent">
      <Screen title={t("credits.title")} back="/parent">
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 text-lg">{t("credits.intro")}</p>
          {!groups && <p>{t("common.loading")}</p>}
          {groups?.map((g) => (
            <section key={g.id} className="mb-6">
              <h2 className="mb-2 text-2xl font-extrabold">{g.title} <span className="text-soft">({g.entries.length})</span></h2>
              <ul className="space-y-2">
                {g.entries.map((e, i) => (
                  <li key={i} className="rounded-2xl bg-white p-3 text-base shadow-soft">
                    <p className="font-extrabold">{e.label}</p>
                    <p className="text-soft">
                      {e.credit.author && <>{t("credits.by")} {e.credit.author} · </>}
                      {e.credit.license ?? "—"}
                    </p>
                    {e.credit.title && <p className="break-words text-sm text-soft">{e.credit.title}</p>}
                    {e.credit.sourceUrl && (
                      <a href={e.credit.sourceUrl} target="_blank" rel="noopener noreferrer" className="break-all text-sm font-bold text-teal underline">{t("credits.source")}</a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Screen>
    </Gated>
  );
}
