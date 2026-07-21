import { CAPTCHA_SITEKEY } from "@/lib/flags";

/**
 * Google's required attribution when the reCAPTCHA badge is hidden. Renders
 * nothing when no site key is configured (captcha is off).
 */
export function CaptchaNotice() {
  if (!CAPTCHA_SITEKEY) return null;
  return (
    <p className="mt-3 text-xs leading-snug text-mist/50">
      Protected by reCAPTCHA — Google{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-mist"
      >
        Privacy Policy
      </a>{" "}
      and{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-mist"
      >
        Terms
      </a>{" "}
      apply
    </p>
  );
}
