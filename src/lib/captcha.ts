import { CAPTCHA_SITEKEY } from "@/lib/flags";

type RenderParams = {
  sitekey: string;
  size: "normal" | "compact" | "invisible";
  theme?: "dark" | "light";
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
};

type Grecaptcha = {
  render: (container: HTMLElement, params: RenderParams) => number;
  getResponse: (id: number) => string;
  reset: (id: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Lazy-load the reCAPTCHA script exactly once (explicit render mode). */
function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("recaptcha failed to load"));
    s.onload = () => {
      const ready = () => {
        if (window.grecaptcha?.render) resolve();
        else window.setTimeout(ready, 50);
      };
      ready();
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export type CheckboxCaptcha = {
  /** Clear the checkbox (after submit / on drawer close); also emits token "". */
  reset: () => void;
};

/**
 * Lazy-load reCAPTCHA and render a VISIBLE v2 checkbox into `container`.
 * The widget's own callbacks push the token into React via `onToken` — the
 * solve happens inside Google's iframe and triggers no re-render otherwise, so
 * polling getResponse() at render time would never see it. Empty token on
 * expiry/error.
 */
export async function renderCheckbox(
  container: HTMLElement,
  onToken: (token: string) => void,
  size: "normal" | "compact" = "normal",
): Promise<CheckboxCaptcha> {
  await loadScript();
  const g = window.grecaptcha;
  if (!g) throw new Error("recaptcha unavailable");

  const id = g.render(container, {
    sitekey: CAPTCHA_SITEKEY,
    size,
    theme: "dark",
    callback: (token: string) => onToken(token),
    "expired-callback": () => onToken(""),
    "error-callback": () => onToken(""),
  });

  return {
    reset: () => {
      try {
        g.reset(id);
      } catch {
        /* widget already gone — ignore */
      }
      onToken("");
    },
  };
}
