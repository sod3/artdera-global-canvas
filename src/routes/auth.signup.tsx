import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CheckCircle2, Eye, EyeOff, Info } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Logo } from "@/components/site/Logo";
import { IMAGES } from "@/lib/artdera";
import { AuthService, UserService } from "@/marketplace/services";
import { DEMO_OTP } from "@/marketplace/config";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: [{ title: "Create Buyer Account — ArtDera" }, { name: "robots", content: "noindex" }],
  }),
  component: Signup,
});
function Signup() {
  const [stage, setStage] = useState<"account" | "verify" | "done">("account");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    city: "Islamabad",
    terms: false,
  });
  const valid = useMemo(
    () =>
      form.password.length >= 8 &&
      /[A-Z]/.test(form.password) &&
      /[a-z]/.test(form.password) &&
      /\d/.test(form.password) &&
      form.password === form.confirm,
    [form],
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!valid)
      return setError(
        "Use at least 8 characters with uppercase, lowercase and a number, then confirm the same password.",
      );
    if (!form.terms) return setError("Please agree to the Terms and Privacy Policy.");
    setStage("verify");
  }
  async function verify() {
    if (otp !== DEMO_OTP) return setError(`Use the demo code ${DEMO_OTP}.`);
    const result = await UserService.create({
      fullName: form.name,
      email: form.email,
      password: form.password,
      city: form.city,
      country: "Pakistan",
      role: "buyer",
    });
    if (result.error) return setError(result.error.message);
    if (result.data) {
      AuthService.startSession(result.data);
      setStage("done");
      window.setTimeout(() => (window.location.href = "/account"), 700);
    }
  }
  return (
    <div className="grid min-h-[calc(100vh-var(--header-height))] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src={IMAGES.heroInterior}
          alt="Art in a contemporary interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <div className="font-display text-4xl">
            Save work. Follow artists. Collect with context.
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Logo />
          {stage === "done" ? (
            <div className="mt-12 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--success)]" />
              <h1 className="mt-5 font-display text-4xl">Your buyer account is ready.</h1>
              <p className="mt-3 text-sm text-muted-foreground">Opening your collector account…</p>
            </div>
          ) : stage === "verify" ? (
            <div className="mt-10">
              <div className="eyebrow">Demo verification</div>
              <h1 className="mt-3 font-display text-4xl">Enter the six-digit code.</h1>
              <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
                <Info className="h-4 w-4 shrink-0" />
                Use <strong>{DEMO_OTP}</strong>. No real email or SMS was sent.
              </div>
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                className="mt-6 w-full rounded-xl border p-4 text-center font-mono text-3xl tracking-[.4em]"
                placeholder="000000"
              />
              {error && (
                <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
              )}
              <button onClick={verify} className="btn-primary mt-5 w-full">
                Verify and create account
              </button>
              <button
                onClick={() => {
                  setStage("account");
                  setError("");
                }}
                className="mt-4 w-full text-xs font-semibold underline"
              >
                Change account details
              </button>
            </div>
          ) : (
            <>
              <div className="eyebrow mt-10">Buyer account</div>
              <h1 className="mt-3 font-display text-5xl">Start collecting.</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Save work, follow studios, manage offers and track demo orders.
              </p>
              <form onSubmit={submit} className="mt-8 grid gap-5">
                <label>
                  <span className="eyebrow mb-2 block">Full name</span>
                  <input
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="art-field"
                  />
                </label>
                <label>
                  <span className="eyebrow mb-2 block">Email</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="art-field"
                  />
                </label>
                <label>
                  <span className="eyebrow mb-2 block">City</span>
                  <input
                    required
                    value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                    className="art-field"
                  />
                </label>
                <label>
                  <span className="eyebrow mb-2 block">Password</span>
                  <div className="relative">
                    <input
                      required
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      className="art-field pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((value) => !value)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center"
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
                <label>
                  <span className="eyebrow mb-2 block">Confirm password</span>
                  <input
                    required
                    type={show ? "text" : "password"}
                    value={form.confirm}
                    onChange={(event) => setForm({ ...form, confirm: event.target.value })}
                    className="art-field"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {[
                    [form.password.length >= 8, "8+ characters"],
                    [/[A-Z]/.test(form.password), "Uppercase"],
                    [/[a-z]/.test(form.password), "Lowercase"],
                    [/\d/.test(form.password), "Number"],
                    [Boolean(form.confirm) && form.password === form.confirm, "Passwords match"],
                  ].map(([met, label]) => (
                    <span key={label as string} className={met ? "text-[var(--success)]" : ""}>
                      <Check className="mr-1 inline h-3.5 w-3.5" />
                      {label as string}
                    </span>
                  ))}
                </div>
                <label className="flex items-start gap-3 text-xs leading-relaxed">
                  <input
                    type="checkbox"
                    checked={form.terms}
                    onChange={(event) => setForm({ ...form, terms: event.target.checked })}
                    className="mt-1 accent-[var(--oxblood)]"
                  />
                  I agree to the{" "}
                  <a href="/legal/terms" className="underline">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="/legal/privacy" className="underline">
                    Privacy Policy
                  </a>
                  .
                </label>
                {error && (
                  <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
                )}
                <button className="btn-primary w-full">Create buyer account</button>
              </form>
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth/login" className="font-semibold text-foreground underline">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
