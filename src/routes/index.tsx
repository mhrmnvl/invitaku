import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Philosophy } from "@/components/landing/Philosophy";
import { Capabilities } from "@/components/landing/Capabilities";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Invitaku — Invitation & Event Operations Platform" },
      {
        name: "description",
        content:
          "Invitaku is a professional SaaS platform to create elegant digital invitations, manage guests, track RSVPs, and run every event with confidence.",
      },
      { property: "og:title", content: "Invitaku — Invitation & Event Operations Platform" },
      {
        property: "og:description",
        content:
          "Create beautiful invitations, manage guests, monitor RSVPs, and organize events from one professional platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <main>
        <Hero />
        <Philosophy />
        <Capabilities />
        <Pricing />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
