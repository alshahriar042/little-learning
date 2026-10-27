import { Suspense, lazy } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import Home from "@/pages/Home";
import { modules } from "@/modules/registry";
import { OfflineChip, Screen, UpdatePrompt, useHtmlLang } from "@/ui/shell";
import { RewardsLayer } from "@/ui/Rewards";
import { useT } from "@/i18n/strings";

const Parent = lazy(() => import("@/pages/Parent"));
const Credits = lazy(() => import("@/pages/Credits"));

function NotFound() {
  const t = useT();
  return (
    <Screen title={t("nf.title")} back="/">
      <div className="py-10 text-center">
        <p className="mb-6 text-6xl" aria-hidden>🌱</p>
        <p className="mb-6 text-xl font-bold">{t("nf.msg")}</p>
        <Link to="/" className="inline-flex min-h-16 items-center rounded-2xl bg-teal-bg px-8 text-xl font-extrabold text-white">🏠 {t("common.home")}</Link>
      </div>
    </Screen>
  );
}

function Loading() {
  return <div className="flex h-full items-center justify-center text-6xl" role="status" aria-label="Loading">🌱</div>;
}

export default function App() {
  useHtmlLang();
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <OfflineChip />
        <RewardsLayer />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Every module mounts itself at <route>/* — adding a module needs no change here. */}
            {modules.map((m) => <Route key={m.id} path={`${m.route}/*`} element={<m.component />} />)}
            <Route path="/parent" element={<Parent />} />
            <Route path="/parent/credits" element={<Credits />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <UpdatePrompt />
      </LazyMotion>
    </MotionConfig>
  );
}
