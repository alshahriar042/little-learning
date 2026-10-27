import { assetUrl } from "@/lib/assetUrl";
import { useSettings, type SpeechMode } from "@/store/settings";

export type Lang = "en" | "bn";
const TTS_LANG: Record<Lang, string[]> = { en: ["en-US", "en"], bn: ["bn-BD", "bn-IN", "bn"] };

const synth: SpeechSynthesis | null = typeof speechSynthesis !== "undefined" ? speechSynthesis : null;
let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();

function refresh() { voices = synth?.getVoices() ?? []; listeners.forEach((l) => l()); }
if (synth) { refresh(); synth.addEventListener?.("voiceschanged", refresh); }

export function findVoice(lang: Lang, list: Pick<SpeechSynthesisVoice, "lang" | "name">[] = voices) {
  for (const tag of TTS_LANG[lang]) {
    const hit = list.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(tag.toLowerCase()));
    if (hit) return hit as SpeechSynthesisVoice;
  }
  return undefined;
}
export const voiceStatus = () => ({ supported: !!synth, en: !!findVoice("en"), bn: !!findVoice("bn") });
export function onVoicesChanged(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }

let token = 0;
let currentAudio: HTMLAudioElement | null = null;

export function cancelSpeech() {
  token++;
  synth?.cancel();
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
}

function speakTts(text: string, lang: Lang, rate: number, my: number): Promise<void> {
  return new Promise((resolve) => {
    if (!synth || my !== token) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    const v = findVoice(lang);
    if (v) u.voice = v;
    u.lang = v?.lang ?? TTS_LANG[lang][0];
    u.rate = rate;
    const guard = window.setTimeout(resolve, text.length * 220 / rate + 2500); // some engines never fire `end`
    u.onend = u.onerror = () => { clearTimeout(guard); resolve(); };
    synth.speak(u);
  });
}

function playRecorded(url: string, my: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (my !== token) return resolve(true);
    const a = new Audio(url);
    currentAudio = a;
    a.onended = () => resolve(true);
    a.onerror = () => resolve(false);
    a.play().catch(() => resolve(false));
  });
}

export interface Speakable {
  en?: string; bn?: string;
  /** Recorded audio file names (relative to <module>/audio/). Preferred over TTS when present. */
  audio?: { en?: string; bn?: string };
}

/** Speak one language: recorded audio from R2 if available, else Web Speech API. */
async function speakOne(s: Speakable, lang: Lang, moduleId: string, rate: number, my: number) {
  const file = s.audio?.[lang];
  if (file && (await playRecorded(assetUrl(moduleId, `audio/${file}`), my))) return;
  const text = s[lang];
  if (text) await speakTts(text, lang, rate, my);
}

export async function speak(s: Speakable, moduleId: string, mode?: SpeechMode): Promise<void> {
  const { sound, speechMode, rate } = useSettings.getState();
  if (!sound) return;
  cancelSpeech();
  const my = token;
  const m = mode ?? speechMode;
  if (m !== "bn") await speakOne(s, "en", moduleId, rate, my);
  if (m !== "en" && my === token) await speakOne(s, "bn", moduleId, rate, my);
}

/** iOS/Safari only allow audio after a user gesture: prime both engines on first tap. */
export function installAudioUnlock() {
  const unlock = () => {
    try {
      if (synth) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; synth.speak(u); }
      const a = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=");
      a.volume = 0; void a.play().catch(() => undefined);
    } catch { /* ignore */ }
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
}
