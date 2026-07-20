import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useAuth } from "@/marketplace/auth";
import { PLANS } from "@/marketplace/config";
import { SubscriptionService } from "@/marketplace/services";

export const Route = createFileRoute("/artist/payment-failed")({
  head: () => ({
    meta: [
      { title: "Payment Could Not Be Completed — ArtDera" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentFailed,
});

function PaymentFailed() {
  const { user, ready } = useAuth();
  const selection = SubscriptionService.getSelection();
  if (!ready)
    return (
      <div className="container-editorial py-20">
        <div className="mx-auto h-56 max-w-xl animate-pulse rounded-2xl bg-[var(--porcelain)]" />
      </div>
    );
  return (
    <div className="container-editorial flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-[var(--porcelain)] p-7 text-center shadow-[var(--shadow-soft)] md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-700">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="eyebrow mt-7">Payment failed</div>
        <h1 className="mt-3 font-display text-4xl">Payment could not be completed.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          No real payment was charged. Your {selection ? PLANS[selection.planId].name : "selected"}{" "}
          plan and {user ? "account" : "signup"} details are still saved.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <a href="/artist/checkout" className="btn-primary">
            <RotateCcw className="h-4 w-4" /> Try Again
          </a>
          <a href="/artist/checkout?change-method=true" className="btn-ghost">
            Change Payment Method
          </a>
          <Link to="/sell/plans" className="btn-ghost">
            Change Plan
          </Link>
          <Link to="/sell/plans" className="btn-ghost">
            Return to Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
