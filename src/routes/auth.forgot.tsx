import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthService } from "@/marketplace/services";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({
    meta: [{ title: "Forgot Password — ArtDera" }, { name: "robots", content: "noindex" }],
  }),
  component: ForgotPassword,
});
function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    await AuthService.requestPasswordReset(email);
    setSent(true);
  }
  return (
    <div className="container-editorial flex min-h-[65vh] items-center justify-center py-14">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-7 text-center md:p-10">
        {sent ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--success)]" />
            <div className="eyebrow mt-6">Request accepted</div>
            <h1 className="mt-3 font-display text-4xl">Check your recovery channel.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              For privacy, this screen does not reveal whether an account exists. If configured,
              a time-limited code has been sent.
            </p>
            <Link to="/auth/reset" className="btn-primary mt-6">
              Enter reset code
            </Link>
          </>
        ) : (
          <>
            <Mail className="mx-auto h-10 w-10 text-[var(--oxblood)]" />
            <div className="eyebrow mt-6">Account recovery</div>
            <h1 className="mt-3 font-display text-4xl">Reset your password.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Enter your email to request a time-limited recovery code.
            </p>
            <form onSubmit={submit} className="mt-7">
              <label htmlFor="forgot-email" className="eyebrow mb-2 block text-left">
                Email address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="art-field"
              />
              <button className="btn-primary mt-4 w-full">Send reset code</button>
            </form>
            <Link to="/auth/login" className="mt-5 inline-block text-xs font-semibold underline">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
