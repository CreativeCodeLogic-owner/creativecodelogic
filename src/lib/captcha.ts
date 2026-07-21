import { CAPTCHA_SITEKEY } from "@/lib/flags";

type RenderParams = {
  sitekey: string;
  size: "normal" | "invisible";
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
  /** The current token, or "" if the checkbox has not been solved. */
  getToken: () => string;
  /** Clear the checkbox (after submit / on drawer close). */
  reset: () => void;
};

/**
 * Lazy-load reCAPTCHA and render a VISIBLE v2 checkbox into `container`.
 * `onChange(solved)` fires true when solved, false when expired/errored — the
 * caller uses it to gate the submit button.
 */
export async function renderCheckbox(
  container: HTMLElement,
  onChange: (solved: boolean) => void,
): Promise<CheckboxCaptcha> {
  await loadScript();
  const g = window.grecaptcha;
  if (!g) throw new Error("recaptcha unavailable");

  const id = g.render(container, {
    sitekey: CAPTCHA_SITEKEY,
    size: "normal",
    theme: "dark",
    callback: () => onChange(true),
    "expired-callback": () => onChange(false),
    "error-callback": () => onChange(false),
  });

  return {
    getToken: () => {
      try {
        return g.getResponse(id);
      } catch {
        return "";
      }
    },
    reset: () => {
      try {
        g.reset(id);
      } catch {
        /* widget already gone — ignore */
      }
      onChange(false);
    },
  };
}
