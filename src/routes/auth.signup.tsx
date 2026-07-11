import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/site/Logo";
import { IMAGES } from "@/lib/artdera";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Create account — ArtDera" }, { name: "robots", content: "noindex" }] }),
  component: Signup,
});

function Signup() {
  return (
    <div className="grid lg:grid-cols-2 min-h-[80vh]">
      <div className="relative hidden lg:block">
        <img src={IMAGES.heroInterior} alt="" className="absolute inset-0 h-full w-full object-cover"/>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 font-display text-4xl">Start collecting.</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create an ArtDera account to save works, follow creators and check out securely.</p>
          <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Enable Lovable Cloud to activate authentication"); }}>
            <div>
              <label className="eyebrow mb-2 block" htmlFor="name">Full name</label>
              <input id="name" required className="w-full rounded-md border bg-transparent px-4 py-3 text-sm" style={{ borderColor: "var(--color-border-strong)" }} />
            </div>
            <div>
              <label className="eyebrow mb-2 block" htmlFor="email">Email</label>
              <input id="email" type="email" required className="w-full rounded-md border bg-transparent px-4 py-3 text-sm" style={{ borderColor: "var(--color-border-strong)" }} />
            </div>
            <div>
              <label className="eyebrow mb-2 block" htmlFor="password">Password</label>
              <input id="password" type="password" required minLength={8} className="w-full rounded-md border bg-transparent px-4 py-3 text-sm" style={{ borderColor: "var(--color-border-strong)" }} />
            </div>
            <label className="text-xs text-muted-foreground flex gap-2">
              <input type="checkbox" required /> I agree to the ArtDera terms and privacy policy.
            </label>
            <button className="btn-primary w-full py-3.5">Create account</button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have one? <a href="/auth/login" className="text-foreground underline">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
