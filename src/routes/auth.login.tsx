import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/site/Logo";
import { IMAGES } from "@/lib/artdera";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — ArtDera" }, { name: "robots", content: "noindex" }] }),
  component: Login,
});

function Login() {
  return (
    <div className="grid lg:grid-cols-2 min-h-[80vh]">
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 font-display text-4xl">Welcome back.</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your ArtDera account.</p>
          <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Enable Lovable Cloud to activate authentication"); }}>
            <div>
              <label className="eyebrow mb-2 block" htmlFor="email">Email</label>
              <input id="email" type="email" required className="w-full rounded-md border bg-transparent px-4 py-3 text-sm" style={{ borderColor: "var(--color-border-strong)" }} />
            </div>
            <div>
              <label className="eyebrow mb-2 block" htmlFor="password">Password</label>
              <input id="password" type="password" required className="w-full rounded-md border bg-transparent px-4 py-3 text-sm" style={{ borderColor: "var(--color-border-strong)" }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2"><input type="checkbox" /> Remember me</label>
              <a href="/auth/forgot" className="underline">Forgot password?</a>
            </div>
            <button className="btn-primary w-full py-3.5">Sign in</button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            New to ArtDera? <a href="/auth/signup" className="text-foreground underline">Create an account</a>
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <img src={IMAGES.hero_studio ?? IMAGES.heroStudio} alt="" className="absolute inset-0 h-full w-full object-cover"/>
      </div>
    </div>
  );
}
