import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CheckCircle2, LockKeyhole } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { AuthService } from "@/marketplace/services";

export const Route = createFileRoute("/auth/reset")({
  head: () => ({
    meta: [{ title: "Reset Password — ArtDera" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});
function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const valid = useMemo(
    () =>
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      password === confirm,
    [confirm, password],
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!valid) return;
    const result = await AuthService.resetPassword(email, code, password);
    if (result.error) return setError(result.error.message);
    setDone(true);
  }
  return (
    <div className="container-editorial flex min-h-[65vh] items-center justify-center py-14">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-7 md:p-10">
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--success)]" />
            <h1 className="mt-5 font-display text-4xl">Password updated.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Your existing sessions were revoked. Sign in again with your new password.
            </p>
            <Link to="/auth/login" className="btn-primary mt-6">
              Return to sign in
            </Link>
          </div>
        ) : (
          <>
            <LockKeyhole className="h-9 w-9 text-[var(--oxblood)]" />
            <div className="eyebrow mt-6">Secure reset</div>
            <h1 className="mt-3 font-display text-4xl">Choose a new password.</h1>
            <form onSubmit={submit} className="mt-7 grid gap-5">
              <label>
                <span className="eyebrow mb-2 block">Account email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="art-field"
                />
              </label>
              <label>
                <span className="eyebrow mb-2 block">Six-digit code</span>
                <input
                  inputMode="numeric"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="art-field"
                />
              </label>
              <label>
                <span className="eyebrow mb-2 block">New password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="art-field"
                />
              </label>
              <label>
                <span className="eyebrow mb-2 block">Confirm new password</span>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="art-field"
                />
              </label>
              <div className="grid gap-2 text-xs text-muted-foreground">
                {[
                  [password.length >= 8, "At least 8 characters"],
                  [/[A-Z]/.test(password), "Uppercase letter"],
                  [/[a-z]/.test(password), "Lowercase letter"],
                  [/\d/.test(password), "Number"],
                  [Boolean(confirm) && password === confirm, "Passwords match"],
                ].map(([met, label]) => (
                  <span key={label as string} className={met ? "text-[var(--success)]" : ""}>
                    <Check className="mr-2 inline h-3.5 w-3.5" />
                    {label as string}
                  </span>
                ))}
              </div>
              {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
              <button
                disabled={!valid || code.length !== 6 || !email}
                className="btn-primary w-full disabled:opacity-45"
              >
                Update password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
