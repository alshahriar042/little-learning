import { useEffect, useRef, useState, type ReactNode } from "react";
import { isCrossOrigin } from "@/lib/assetUrl";

interface Props {
  src: string;
  w: number;
  h: number;
  alt: string;
  /** dominant-colour placeholder */
  color?: string;
  /** above-the-fold images load immediately with high fetch priority */
  priority?: boolean;
  className?: string;
  fit?: "cover" | "contain";
  /** shown when the image is not available (e.g. offline and not downloaded) */
  fallback: ReactNode;
}

/** Lazy image: IntersectionObserver-driven, dominant-colour placeholder, emoji fallback on failure. */
export function Img({ src, w, h, alt, color = "#e5e7eb", priority, className = "", fit = "cover", fallback }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!!priority);
  // state is tied to the src it belongs to, so a cached image that loads instantly (before any effect could run)
  // can never be overwritten by a late "reset" and left invisible
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;
  const failed = failedSrc === src;

  useEffect(() => {
    if (visible || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setVisible(true); io.disconnect(); } }, { rootMargin: "400px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={{ backgroundColor: loaded ? undefined : `${color}55`, aspectRatio: `${w} / ${h}` }}>
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center text-[min(28vw,7rem)] leading-none" aria-label={alt} role="img">{fallback}</div>
      ) : visible ? (
        <img
          key={src} src={src} width={w} height={h} alt={alt} decoding="async"
          crossOrigin={isCrossOrigin() ? "anonymous" : undefined}
          {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
          onLoad={() => setLoadedSrc(src)} onError={() => setFailedSrc(src)}
          ref={(el) => { if (el?.complete && el.naturalWidth > 0) setLoadedSrc(src); }}
          className={`absolute inset-0 h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          draggable={false}
        />
      ) : null}
    </div>
  );
}
