import { FORMSPARK_FORM_ID, CAPTCHA_SITEKEY } from "@/lib/flags";
import type { InvisibleCaptcha } from "@/lib/captcha";

export type SubmitResult = "success" | "error";

/**
 * Shared submission path for the brief and the hello drawer. Honeypot short-
 * circuits, no form id → mailto: fallback (never dead-ends), otherwise POST
 * JSON to Formspark with the reCAPTCHA token when one is available.
 */
export async function submitForm(
  payload: Record<string, string>,
  mailtoHref: string,
  captcha: InvisibleCaptcha | null,
): Promise<SubmitResult> {
  if (payload._gotcha) return "success"; // bot — swallow silently

  if (!FORMSPARK_FORM_ID) {
    window.location.href = mailtoHref; // graceful fallback
    return "success";
  }

  let token = "";
  if (CAPTCHA_SITEKEY && captcha) {
    try {
      token = await captcha.execute();
    } catch {
      token = ""; // proceed tokenless; Formspark rejects → error state handles it
    }
  }
  const body = token ? { ...payload, "g-recaptcha-response": token } : payload;

  try {
    const res = await fetch(`https://submit-form.com/${FORMSPARK_FORM_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(String(res.status));
    return "success";
  } catch {
    return "error";
  }
}
