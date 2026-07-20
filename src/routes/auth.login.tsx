import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, Info, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/site/Logo";
import { IMAGES } from "@/lib/artdera";
import { AuthService } from "@/marketplace/services";
import { useAuth } from "@/marketplace/auth";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — ArtDera" }, { name: "robots", content: "noindex" }] }),
  component: Login,
});

const demos = [
  ["Free artist", "free.artist@artdera.demo", "FreeArtist@2026"],
  ["Professional", "professional.artist@artdera.demo", "Professional@2026"],
  ["Pro Plus", "pro.artist@artdera.demo", "ProArtist@2026"],
  ["Gallery demo", "gallery@artdera.demo", "GalleryDemo@2026"],
  ["Buyer demo", "buyer@artdera.demo", "BuyerDemo@2026"],
] as const;

function Login() {
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await AuthService.login(email, password);
    setLoading(false);
    if (result.error) return setError(result.error.message);
    refresh();
    if (result.data) window.location.href = result.data.destination;
  }
  return (
    <div className="grid min-h-[calc(100vh-var(--header-height))] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Logo />
          <div className="eyebrow mt-10">Your ArtDera account</div>
          <h1 className="mt-3 font-display text-5xl">Welcome back.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Sign in to collecting, your store or the ArtDera operations workspace.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="eyebrow mb-2 block">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="art-field"
              />
            </label>
            <label className="block">
              <span className="eyebrow mb-2 block">Password</span>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="art-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-[var(--ivory)]"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-[var(--oxblood)]" /> Remember this browser
              </label>
              <Link to="/auth/forgot" className="font-semibold underline">
                Forgot password?
              </Link>
            </div>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </div>
            )}
            <button disabled={loading} className="btn-primary min-h-12 w-full disabled:opacity-60">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <div className="mt-7 rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-4">
            <div className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-[var(--indigo)]" />
              <p>
                Development-only quick access. Admin credentials are intentionally not shown on this
                public screen.
              </p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {demos.map(([label, demoEmail, demoPassword]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setEmail(demoEmail);
                    setPassword(demoPassword);
                  }}
                  className="rounded-xl bg-[var(--ivory)] px-3 py-3 text-xs font-semibold hover:ring-1 hover:ring-[var(--oxblood)]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            New buyer?{" "}
            <Link to="/auth/signup" className="font-semibold text-foreground underline">
              Create an account
            </Link>
            <span className="mx-2">·</span>Seller?{" "}
            <Link to="/sell/plans" className="font-semibold text-foreground underline">
              View plans
            </Link>
          </div>
          <div className="mt-5 flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <LockKeyhole className="h-4 w-4 shrink-0" />
            Session state is stored only for this browser tab and expires after one hour. Backend
            authorization is still required for production.
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={IMAGES.heroStudio}
          alt="Art-filled studio interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/85 via-transparent to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 rounded-2xl border border-white/12 bg-black/28 p-6 text-white backdrop-blur-xl">
          <ShieldCheck className="h-6 w-6 text-[var(--terracotta)]" />
          <div className="mt-4 font-display text-3xl">One account. The right workspace.</div>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/62">
            Artists, galleries and buyers are routed to the tools meant for their role.
          </p>
        </div>
      </div>
    </div>
  );
}
