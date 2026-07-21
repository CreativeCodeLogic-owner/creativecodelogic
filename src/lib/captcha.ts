import { CAPTCHA_SITEKEY } from "@/lib/flags";

type RenderParams = {
  sitekey: string;
  size: "invisible";
  callback: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
};

type Grecaptcha = {
  render: (container: HTMLElement, params: RenderParams) => number;
  execute: (id: number) => void;
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

export type InvisibleCaptcha = { execute: () => Promise<string> };

/**
 * Mount an invisible reCAPTCHA widget into `container` and return an executor.
 * execute() resolves the token — or "" on any failure/timeout, so callers
 * never hang on a spinner — and resets the widget for reuse.
 */
export async function mountInvisibleCaptcha(
  container: HTMLElement,
): Promise<InvisibleCaptcha> {
  await loadScript();
  const g = window.grecaptcha;
  if (!g) throw new Error("recaptcha unavailable");

  let resolver: ((t: string) => void) | null = null;
  const finish = (t: string) => {
    const r = resolver;
    resolver = null;
    r?.(t);
  };

  const id = g.render(container, {
    sitekey: CAPTCHA_SITEKEY,
    size: "invisible",
    callback: (token: string) => finish(token),
    "error-callback": () => finish(""),
    "expired-callback": () => finish(""),
  });

  return {
    execute: () =>
      new Promise<string>((resolve) => {
        resolver = resolve;
        window.setTimeout(() => finish(""), 8000); // never hang
        try {
          g.execute(id);
        } catch {
          finish("");
        }
      }).then((t) => {
        try {
          g.reset(id);
        } catch {
          /* widget already gone — ignore */
        }
        return t;
      }),
  };
}
