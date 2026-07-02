import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Filter, Palette, Eye } from "lucide-react";

export const Route = createFileRoute("/_layout/templates")({
  component: TemplatesPage,
});

const TEMPLATE_LIST = [
  {
    id: "t1",
    name: "Amara — Timeless Serif",
    category: "Wedding",
    tone: "Classic",
    colors: ["#1B4D3E", "#F9F7F4"],
  },
  {
    id: "t2",
    name: "Nusantara — Clean Modern",
    category: "Corporate",
    tone: "Minimal",
    colors: ["#0F0D0B", "#FFFFFF"],
  },
  {
    id: "t3",
    name: "Nadia — Warm Autumn",
    category: "Birthday",
    tone: "Warm",
    colors: ["#A85A42", "#F9F7F4"],
  },
  {
    id: "t4",
    name: "Class of 2026 — Academic",
    category: "Graduation",
    tone: "Formal",
    colors: ["#1B4D3E", "#FFFFFF"],
  },
  {
    id: "t5",
    name: "Design Systems — Industrial",
    category: "Seminar",
    tone: "Editorial",
    colors: ["#0F0D0B", "#E5E0DA"],
  },
];

function TemplatesPage() {
  const [filter, setFilter] = useState("All");

  const filteredTemplates = TEMPLATE_LIST.filter((t) => filter === "All" || t.category === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-ink">Template Showroom</h2>
        <p className="text-xs text-ink-soft mt-1">
          Select or change invitation theme templates for your active events.
        </p>
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-rule py-3 bg-white">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft flex items-center gap-1">
            <Filter className="h-3 w-3" /> Category:
          </span>
          {["All", "Wedding", "Corporate", "Birthday", "Seminar"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-[2px] px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
                filter === cat
                  ? "bg-ink text-paper border-ink"
                  : "bg-white text-ink-soft border-rule hover:border-ink hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid gallery */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="group border border-rule rounded-[2px] bg-white p-4 flex flex-col justify-between hover:border-ink transition-colors duration-150 ease-out"
          >
            <div>
              {/* Card visual mockup */}
              <div className="aspect-4/3 bg-paper border border-rule rounded-[2px] mb-4 flex flex-col items-center justify-center p-6 text-center select-none">
                <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-ink-soft">
                  You are invited
                </span>
                <div className="my-3 h-px w-6 bg-rule" />
                <h4 className="text-lg font-semibold text-ink line-clamp-1">
                  {t.name.split(" — ")[0]}
                </h4>
                <div className="my-3 h-px w-6 bg-rule" />
                <span className="font-mono text-[8px] uppercase tracking-widest text-ink-soft">
                  {t.tone} · Layout
                </span>
              </div>

              <div className="flex justify-between items-baseline gap-2">
                <span className="font-mono text-[8px] uppercase tracking-widest text-ink-soft">
                  {t.category}
                </span>
                <div className="flex gap-1">
                  {t.colors.map((c, i) => (
                    <span
                      key={i}
                      style={{ backgroundColor: c }}
                      className="h-2.5 w-2.5 rounded-full border border-rule"
                    />
                  ))}
                </div>
              </div>
              <h3 className="text-base font-semibold text-ink mt-1">{t.name}</h3>
            </div>

            <div className="mt-4 pt-4 border-t border-rule/50 flex gap-2">
              <button className="flex-1 inline-flex justify-center items-center gap-1 border border-rule bg-white text-ink text-xs px-3 py-1.5 rounded-[2px] hover:border-ink transition-colors cursor-pointer">
                <Eye className="h-3.5 w-3.5 text-ink-soft" /> Preview
              </button>
              <button className="flex-1 inline-flex justify-center items-center bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-[2px] hover:bg-primary/90 transition-colors cursor-pointer">
                Use Theme
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
