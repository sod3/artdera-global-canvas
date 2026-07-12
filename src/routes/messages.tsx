import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages - ArtDera" },
      {
        name: "description",
        content: "Message creators and sellers about artworks, commissions and orders on ArtDera.",
      },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <div className="container-editorial py-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--porcelain)] shadow-[var(--shadow-soft)]">
          <MessageCircle className="h-6 w-6 text-[var(--indigo)]" />
        </div>
        <div className="eyebrow mt-8">Messages</div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">No conversations yet.</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Ask a creator about dimensions, framing, commissions or delivery when a work catches your
          eye.
        </p>
        <a href="/discover" className="btn-primary mt-7">
          Find a Work to Discuss
        </a>
      </div>
    </div>
  );
}
