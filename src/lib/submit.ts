export type SubmitResult = "success" | "error";

/**
 * Shared submission path. Honeypot short-circuits; an empty form id falls back
 * to the mailto: href when one is provided (brief), or returns "error" when it
 * is not (contact drawer — no email in its UI, so it shows its retry state
 * rather than dropping the message). Otherwise POST JSON to Formspark,
 * including the reCAPTCHA token when the caller has one.
 */
export async function submitForm(
  formId: string,
  payload: Record<string, string>,
  mailtoHref: string | null,
  token: string,
): Promise<SubmitResult> {
  if (payload._gotcha) return "success"; // bot — swallow silently

  if (!formId) {
    if (!mailtoHref) return "error"; // nowhere to send it — never drop silently
    window.location.href = mailtoHref; // brief fallback
    return "success";
  }

  const body = token ? { ...payload, "g-recaptcha-response": token } : payload;

  try {
    const res = await fetch(`https://submit-form.com/${formId}`, {
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
