import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Info, Mail, Pencil, RotateCcw, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEMO_OTP, DEMO_OTP_MODE, PLANS } from "@/marketplace/config";
import { useAuth } from "@/marketplace/auth";
import { SubscriptionService, UserService, VerificationService } from "@/marketplace/services";

export const Route = createFileRoute("/artist/verify")({
  head: () => ({
    meta: [
      { title: "Verify Your Artist Account — ArtDera" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ArtistVerify,
});

function ArtistVerify() {
  const { user, ready, refresh } = useAuth();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(45);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState<"email" | "mobile" | null>(null);
  const [contact, setContact] = useState("");
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const selection = SubscriptionService.getSelection();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (!ready) return;
    if (!user) window.location.replace("/auth/login?return=/artist/verify");
    else if (!["artist", "gallery"].includes(user.role)) window.location.replace("/account");
    else if (!selection) window.location.replace("/sell/plans?notice=plan-required");
  }, [ready, selection, user]);

  function changeDigit(index: number, value: string) {
    const number = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((digit, position) => (position === index ? number : digit)));
    setError("");
    if (number && index < 5) refs.current[index + 1]?.focus();
  }

  function paste(value: string) {
    const next = value.replace(/\D/g, "").slice(0, 6).split("");
    if (!next.length) return;
    setDigits(Array.from({ length: 6 }, (_, index) => next[index] ?? ""));
    refs.current[Math.min(5, next.length)]?.focus();
  }

  async function verify() {
    if (!user || !selection) return;
    const result = await VerificationService.verify(user.id, digits.join(""));
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSuccess(true);
    window.setTimeout(() => {
      window.location.assign(
        selection.planId === "free" ? "/artist/onboarding?activated=free" : "/artist/checkout",
      );
    }, 900);
  }

  async function resend() {
    setError("");
    const result = await VerificationService.resend();
    if (result.error) return setError(result.error.message);
    setCountdown(45);
  }

  async function saveContact() {
    if (!user || !editing || !contact.trim()) return;
    const updated = await UserService.updateContact(
      user.id,
      editing === "email" ? { email: contact } : { mobile: contact },
    );
    if (!updated) return setError(`The ${editing} could not be updated.`);
    await refresh();
    if (editing === "email") await resend();
    setEditing(null);
    setContact("");
  }

  if (!ready || !user || !selection) return <Loading />;
  if (success)
    return (
      <div className="container-editorial flex min-h-[70vh] items-center justify-center py-14">
        <div className="w-full max-w-xl rounded-2xl bg-[var(--ink)] p-8 text-center text-[var(--ivory)] md:p-10">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--terracotta)]" />
          <div className="eyebrow mt-6 !text-white/50">Account verified</div>
          <h1 className="mt-3 font-display text-4xl">
            {selection.planId === "free"
              ? "Your Free Plan is active."
              : "Your secure checkout is ready."}
          </h1>
          <p className="mt-3 text-sm text-white/65">
            {selection.planId === "free"
              ? "Complete your profile to create your store."
              : `Continue to activate the ${PLANS[selection.planId].name} Plan.`}
          </p>
        </div>
      </div>
    );

  return (
    <div className="container-editorial flex min-h-[72vh] items-center justify-center py-12">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-6 text-center shadow-[var(--shadow-soft)] sm:p-8 md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ivory)] text-[var(--oxblood)]">
          <Smartphone className="h-7 w-7" />
        </div>
        <div className="eyebrow mt-7">Account verification</div>
        <h1 className="mt-3 font-display text-4xl">Enter the six-digit code.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We sent a verification code to <strong className="text-foreground">{user.email}</strong>.
        </p>
        {DEMO_OTP_MODE && (
          <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 p-4 text-left text-xs leading-relaxed text-amber-900">
            <Info className="h-4 w-4 shrink-0" />
            <p>
              Development OTP: <strong>{DEMO_OTP}</strong>. Delivery is disabled in this mode.
            </p>
          </div>
        )}
        <div
          className="mt-7 grid grid-cols-6 gap-2"
          onPaste={(event) => {
            event.preventDefault();
            paste(event.clipboardData.getData("text"));
          }}
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                refs.current[index] = element;
              }}
              aria-label={`OTP digit ${index + 1}`}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              value={digit}
              onChange={(event) => changeDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !digit && index > 0)
                  refs.current[index - 1]?.focus();
              }}
              className="min-w-0 rounded-xl border border-[var(--color-border-strong)] bg-white/70 px-0 py-3 text-center font-mono text-xl sm:text-2xl"
            />
          ))}
        </div>
        {error && (
          <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={verify}
          disabled={digits.some((digit) => !digit)}
          className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-45"
        >
          Verify Account
        </button>
        <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs">
          <button
            type="button"
            disabled={countdown > 0}
            onClick={() => void resend()}
            className="inline-flex items-center gap-1 font-semibold underline disabled:no-underline disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {countdown > 0 ? `Resend in 0:${String(countdown).padStart(2, "0")}` : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing("email");
              setContact(user.email);
            }}
            className="inline-flex items-center gap-1 font-semibold underline"
          >
            <Mail className="h-3.5 w-3.5" />
            Change email
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing("mobile");
              setContact(user.mobile ?? "");
            }}
            className="inline-flex items-center gap-1 font-semibold underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            Change phone
          </button>
        </div>
        {editing && (
          <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--ivory)] p-4 text-left">
            <label className="eyebrow mb-2 block">Updated {editing}</label>
            <input
              type={editing === "email" ? "email" : "tel"}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              className="art-field"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void saveContact()}
                className="btn-primary flex-1"
              >
                Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="container-editorial py-20">
      <div className="mx-auto h-52 max-w-xl animate-pulse rounded-2xl bg-[var(--porcelain)]" />
    </div>
  );
}
