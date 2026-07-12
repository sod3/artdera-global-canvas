import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, MessageCircle, ShieldCheck, Truck } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Centre - ArtDera" },
      {
        name: "description",
        content: "Get help with buying, selling, delivery, returns and messages on ArtDera.",
      },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <div className="container-editorial py-16">
      <div className="max-w-2xl">
        <div className="eyebrow">Help centre</div>
        <h1 className="mt-3 font-display text-5xl">How can we help?</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Quick support paths for buying, selling, delivery, protection and messages.
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {[
          ["Buying art", "Explore products, quick view and product details.", HelpCircle],
          ["Delivery", "Track delivery expectations and seller updates.", Truck],
          ["Buyer protection", "Understand eligibility and dispute support.", ShieldCheck],
          ["Messages", "Contact creators about products or commissions.", MessageCircle],
        ].map(([title, text, Icon]) => (
          <a
            key={title as string}
            href={
              title === "Buyer protection"
                ? "/buyer-protection"
                : title === "Messages"
                  ? "/messages"
                  : "/discover"
            }
            className="rounded-xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 transition hover:border-[var(--oxblood)]"
          >
            <Icon className="h-6 w-6 text-[var(--oxblood)]" />
            <h2 className="mt-8 font-display text-2xl">{title as string}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text as string}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
