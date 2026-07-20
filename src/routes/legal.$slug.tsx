import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Scale, ShieldCheck } from "lucide-react";

const POLICIES: Record<string, { title: string; summary: string; sections: [string, string][] }> = {
  terms: {
    title: "Terms and Conditions",
    summary: "The general rules for accessing and using the ArtDera marketplace.",
    sections: [
      [
        "Accounts and eligibility",
        "Users must provide accurate account information and use the role-appropriate tools. Seller and admin permissions require backend enforcement before production.",
      ],
      [
        "Marketplace transactions",
        "Artwork information, pricing, shipping estimates and order states must be accurate. Demo checkout does not create a binding payment transaction.",
      ],
      [
        "Acceptable use",
        "Users may not misuse the platform, impersonate another person, bypass protected communication or attempt prohibited sales.",
      ],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    summary: "How ArtDera intends to handle personal information and user choices.",
    sections: [
      [
        "Information used",
        "The production service may use account, order, support and marketplace activity data to provide the service. This demo stores only minimum mock state in your browser.",
      ],
      [
        "Protected contact",
        "Buyer and seller contact details stay private before a confirmed order and should be used only for legitimate delivery coordination.",
      ],
      [
        "Your choices",
        "Users will be able to manage notification, marketing and privacy preferences. Production rights and retention periods require legal confirmation.",
      ],
    ],
  },
  "artist-terms": {
    title: "Artist Terms",
    summary: "Responsibilities for artists publishing and fulfilling artwork listings.",
    sections: [
      [
        "Artwork authority",
        "Artists must own, represent or have permission to sell every listed work.",
      ],
      [
        "Accurate listings",
        "Medium, dimensions, edition, framing, certificate, price and shipping details must be accurate.",
      ],
      [
        "Fulfilment",
        "Artists must prepare work carefully, follow confirmed order steps and communicate delays through ArtDera.",
      ],
    ],
  },
  "gallery-terms": {
    title: "Gallery Terms",
    summary: "Responsibilities for galleries, staff and represented-artist records.",
    sections: [
      ["Representation", "Galleries must have authority to represent listed artists and artworks."],
      [
        "Staff access",
        "Gallery staff permissions must be limited to job needs and enforced by the production backend.",
      ],
      ["Inventory", "Sales, availability and exhibition information must be kept current."],
    ],
  },
  "buyer-protection": {
    title: "Buyer Protection",
    summary: "A plain-language outline of the safeguards ArtDera intends to provide.",
    sections: [
      [
        "Before purchase",
        "Buyers can review seller status, artwork information, shipping estimates and return eligibility before checkout.",
      ],
      [
        "During delivery",
        "Order and shipment milestones should remain visible. Damage or disclosure issues should be reported promptly.",
      ],
      [
        "Limits",
        "No policy can guarantee investment value, perfect colour matching or outcomes outside its final eligible scope.",
      ],
    ],
  },
  shipping: {
    title: "Shipping Policy",
    summary: "How artwork preparation, estimates, tracking and delivery are expected to work.",
    sections: [
      [
        "Estimates",
        "Courier, packaging and handling values in this frontend are estimates, not quotes.",
      ],
      [
        "Packaging",
        "Sellers must use packaging appropriate for size, framing, glass and fragility.",
      ],
      [
        "Tracking",
        "Real pickup, tracking and delivery evidence will require a courier integration.",
      ],
    ],
  },
  returns: {
    title: "Return and Refund Policy",
    summary: "A future framework for eligible return, damage and refund requests.",
    sections: [
      [
        "Eligibility",
        "Eligibility may depend on artwork type, condition, listing disclosure and timing after delivery.",
      ],
      [
        "Damage reports",
        "Buyers should preserve packaging and provide clear evidence through the order flow.",
      ],
      [
        "Refund timing",
        "No real refund is processed in this frontend. Final methods and timing depend on connected payment systems.",
      ],
    ],
  },
  verification: {
    title: "Verification Policy",
    summary: "What review status and a public verified badge are intended to mean.",
    sections: [
      ["Review required", "Payment for a subscription never guarantees verification."],
      [
        "Badge meaning",
        "A badge indicates specified identity or business and portfolio checks passed review; it is not an endorsement of investment value.",
      ],
      [
        "Removal",
        "ArtDera may request changes, suspend or remove status if information becomes inaccurate or policy issues arise.",
      ],
    ],
  },
  sponsored: {
    title: "Sponsored Content Policy",
    summary: "Rules for optional paid marketplace visibility.",
    sections: [
      ["Clear labels", "Every paid placement must be labelled Sponsored."],
      [
        "Balanced discovery",
        "Sponsored results are limited to 20% and no more than one in every five artwork cards.",
      ],
      [
        "No trust shortcut",
        "Promotion never improves verification, review ratings or moderation decisions.",
      ],
    ],
  },
  community: {
    title: "Community Guidelines",
    summary: "Standards for respectful buyer, artist, gallery and staff interaction.",
    sections: [
      ["Respect", "Harassment, threats, discrimination and deceptive conduct are not permitted."],
      [
        "Safe communication",
        "Do not pressure people to leave ArtDera, share private details or pay externally before a confirmed order.",
      ],
      ["Reporting", "Users may report, block, archive or mark conversations as spam."],
    ],
  },
  prohibited: {
    title: "Prohibited Artwork Policy",
    summary: "Categories of work that cannot be listed on ArtDera.",
    sections: [
      [
        "Illegal content",
        "Content illegal to possess, distribute or sell in the applicable jurisdiction is prohibited.",
      ],
      [
        "Harm and exploitation",
        "Exploitative, hateful, non-consensual or dangerously deceptive content is prohibited.",
      ],
      [
        "Moderation",
        "ArtDera may request context, reject, archive or remove work subject to final policy and applicable law.",
      ],
    ],
  },
  copyright: {
    title: "Copyright Policy",
    summary: "Respect for artwork ownership, licences and takedown requests.",
    sections: [
      [
        "Seller responsibility",
        "Sellers must have the rights required to display and sell listed work and media.",
      ],
      [
        "Reports",
        "Rights holders should be able to submit a clear report identifying the work, claim and contact route.",
      ],
      [
        "Review",
        "ArtDera may restrict content during review without deciding disputed ownership itself.",
      ],
    ],
  },
  disputes: {
    title: "Dispute Resolution",
    summary: "A future process for order, delivery, disclosure and conduct disputes.",
    sections: [
      [
        "Start in the order",
        "Users should report issues from the relevant order and keep communication and evidence in ArtDera.",
      ],
      [
        "Review",
        "ArtDera may request information from each party before suggesting or applying an eligible outcome.",
      ],
      [
        "Legal limits",
        "Final governing law, arbitration or court terms require professional legal review.",
      ],
    ],
  },
  cookies: {
    title: "Cookies",
    summary: "How browser storage may support sessions and preferences.",
    sections: [
      [
        "Essential storage",
        "This demo uses browser storage for mock session, selected plan, onboarding draft and product state.",
      ],
      ["Analytics", "Production analytics and consent categories are not connected yet."],
      ["Control", "Clearing browser storage removes locally saved demo state."],
    ],
  },
  "ai-policy": {
    title: "AI Disclosure Policy",
    summary: "How AI-assisted creation should be disclosed.",
    sections: [
      [
        "Clear disclosure",
        "Sellers should accurately describe material AI assistance in creation.",
      ],
      [
        "Rights",
        "AI assistance does not remove the seller's responsibility for rights, consent and truthful listing information.",
      ],
      ["Moderation", "ArtDera may request more context or reject misleading claims."],
    ],
  },
};
export const Route = createFileRoute("/legal/$slug")({
  head: ({ params }) => {
    const policy = POLICIES[params.slug];
    return {
      meta: [
        { title: `${policy?.title ?? "Policy"} — ArtDera` },
        { name: "description", content: policy?.summary ?? "ArtDera marketplace policy." },
      ],
    };
  },
  component: LegalPage,
});
function LegalPage() {
  const { slug } = Route.useParams();
  const policy = POLICIES[slug];
  if (!policy)
    return (
      <div className="container-editorial py-20 text-center">
        <Scale className="mx-auto h-9 w-9 text-[var(--oxblood)]" />
        <h1 className="mt-5 font-display text-5xl">Policy not found.</h1>
        <a href="/help" className="btn-primary mt-6">
          Contact Support
        </a>
      </div>
    );
  return (
    <div className="container-editorial py-14">
      <div className="mx-auto max-w-4xl">
        <div className="eyebrow">Trust and policy</div>
        <h1 className="mt-3 font-display text-5xl md:text-6xl">{policy.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {policy.summary}
        </p>
        <div className="mt-7 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            <strong>Draft for professional legal review.</strong> This placeholder explains intended
            product behaviour and is not final legal advice, a guarantee or a production policy.
          </p>
        </div>
        <div className="mt-10 space-y-8">
          {policy.sections.map(([title, body], index) => (
            <section
              key={title}
              className="grid gap-4 border-t border-[var(--color-border)] pt-7 md:grid-cols-[60px_1fr]"
            >
              <div className="font-display text-3xl text-[var(--oxblood)]">0{index + 1}</div>
              <div>
                <h2 className="font-display text-3xl">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
              </div>
            </section>
          ))}
        </div>
        <div className="mt-10 grid gap-4 rounded-2xl bg-[var(--indigo)] p-6 text-[var(--ivory)] sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <ShieldCheck className="h-7 w-7 text-[var(--terracotta)]" />
          <div>
            <div className="font-semibold">Need help understanding this draft?</div>
            <div className="mt-1 text-xs text-white/55">
              Contact ArtDera support before relying on placeholder content.
            </div>
          </div>
          <a href="/help" className="btn-primary bg-[var(--terracotta)] !text-[var(--ink)]">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
