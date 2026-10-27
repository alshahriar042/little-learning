import { useLocation } from "react-router-dom";
import { modules } from "./registry";
import { Screen } from "@/ui/shell";
import { useT } from "@/i18n/strings";
import type { ReactNode } from "react";

/** Generic friendly placeholder: used by any module whose status is "coming-soon". */
export default function ComingSoon({ children, moduleId }: { children?: ReactNode; moduleId?: string }) {
  const t = useT();
  const { pathname } = useLocation();
  const mod = modules.find((m) => (moduleId ? m.id === moduleId : pathname.startsWith(m.route)));
  return (
    <Screen title={mod?.titleEn ?? t("soon.title")} titleBn={mod?.titleBn} color="#9a9a9a" back="/">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-8 text-center">
        <div className="text-8xl" aria-hidden>{mod?.icon ?? "🌱"}</div>
        <h2 className="text-3xl font-extrabold">{t("soon.title")}</h2>
        <p lang="bn" className="text-2xl font-bold">{translateSoon()}</p>
        <p className="text-lg text-soft">{t("soon.msg")}</p>
        {children}
      </div>
    </Screen>
  );
}
const translateSoon = () => "শীঘ্রই আসছে!";
