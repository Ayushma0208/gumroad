"use client";

import { useMemo, useState } from "react";
import {
  ProductPagePreview,
  TemplateThumb,
} from "@/components/studio/storefront-preview";
import { Input } from "@/components/ui/input";
import { STUDIO_FONT_HREF, type PageStyle } from "@/lib/studio/page-style";
import {
  PAGE_TEMPLATES,
  TEMPLATE_GROUP_LABELS,
  TEMPLATE_GROUPS,
  type PageTemplate,
} from "@/lib/studio/page-templates";
import { cn } from "@/lib/utils";
import type { PreviewProduct } from "@/components/studio/storefront-preview";

export function ProductPageStep({
  templateId,
  pageStyle,
  product,
  onSelect,
}: {
  templateId: string;
  pageStyle: PageStyle | null;
  product: PreviewProduct;
  onSelect: (template: PageTemplate | null) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return PAGE_TEMPLATES;
    return PAGE_TEMPLATES.filter(
      (template) =>
        template.name.toLowerCase().includes(needle) ||
        template.id.includes(needle) ||
        template.style.layout.includes(needle),
    );
  }, [query]);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.95fr)]">
      <link rel="stylesheet" href={STUDIO_FONT_HREF} />
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Templates
            </p>
            <h2 className="mt-1 font-display text-2xl tracking-tight">
              Layout for this product
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Templates apply to this product only. Leave Lumen default selected
              to keep the original marketplace page.
            </p>
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates"
            className="h-10 max-w-xs rounded-xl"
            aria-label="Search templates"
          />
        </div>

        {query.trim() === "" ||
        "lumen default original page".includes(query.trim().toLowerCase()) ? (
        <section className="mt-8">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Default
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => onSelect(null)} className="text-left">
              <span
                className={cn(
                  "block overflow-hidden rounded-xl border text-left transition-colors",
                  !templateId
                    ? "border-foreground ring-2 ring-foreground/15"
                    : "border-border hover:border-foreground/30",
                )}
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-[#0c0c0e]">
                  <span className="absolute inset-x-3 top-3 h-2 rounded-full bg-white/20" />
                  <span className="absolute inset-x-3 top-7 h-[46%] rounded-md border border-white/10 bg-white/5" />
                  <span className="absolute bottom-3 left-3 h-2 w-16 rounded-full bg-white/40" />
                  <span className="absolute right-3 bottom-3 h-6 w-14 rounded-md bg-white" />
                </span>
                <span className="block px-3 py-2">
                  <span className="block text-sm font-medium">Lumen default</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Original page
                  </span>
                </span>
              </span>
            </button>
          </div>
        </section>
        ) : null}

        {TEMPLATE_GROUPS.map((group) => {
          const items = filtered.filter((template) => template.group === group);
          if (items.length === 0) return null;
          return (
            <section key={group} className="mt-8">
              <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                {TEMPLATE_GROUP_LABELS[group]}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onSelect(template)}
                    className="text-left"
                  >
                    <TemplateThumb
                      template={template}
                      selected={template.id === templateId}
                    />
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            No templates match “{query}”.
          </p>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-24">
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Product page preview
        </p>
        <div className="mt-3">
          {pageStyle ? (
            <ProductPagePreview style={pageStyle} product={product} />
          ) : (
            <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm leading-relaxed text-muted-foreground">
              Buyers will see the original Lumen product page. Pick a template
              on the left to restyle this product only.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
