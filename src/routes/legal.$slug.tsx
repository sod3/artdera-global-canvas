import { createFileRoute } from "@tanstack/react-router";

const TITLES: Record<string, string> = {
  terms: "Terms",
  privacy: "Privacy",
  cookies: "Cookies",
  copyright: "Copyright",
  "ai-policy": "AI Policy",
};

export const Route = createFileRoute("/legal/$slug")({
  head: ({ params }) => {
    const title = TITLES[params.slug] ?? "Policy";
    return {
      meta: [
        { title: `${title} - ArtDera` },
        { name: "description", content: `${title} information for ArtDera users.` },
      ],
    };
  },
  component: LegalPage,
});

function LegalPage() {
  const { slug } = Route.useParams();
  const title = TITLES[slug] ?? "Policy";

  return (
    <div className="container-editorial py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-6 md:p-10">
        <div className="eyebrow">Legal</div>
        <h1 className="mt-3 font-display text-5xl">{title}</h1>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          This page is ready for ArtDera's final legal copy. Until the production policy text is
          connected, customers should contact ArtDera support for current terms, privacy, cookies,
          copyright or AI disclosure guidance.
        </p>
        <a href="/help" className="btn-primary mt-7">
          Contact Support
        </a>
      </div>
    </div>
  );
}
