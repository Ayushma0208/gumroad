import type { CSSProperties, ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import {
  borderWidth,
  cornerRadius,
  FONT_STACKS,
  PAGE_LAYOUT_LABELS,
  type CheckoutStyle,
  type PageStyle,
} from "@/lib/studio/page-style";
import type { PageTemplate } from "@/lib/studio/page-templates";
import { cn } from "@/lib/utils";
import type { Currency } from "@/types/catalog";

export type PreviewProduct = {
  title: string;
  shortDescription: string;
  coverUrl: string;
  priceCents: number;
  currency: Currency;
  pricingModel: "free" | "fixed" | "pwyw";
};

function priceLabel(product: PreviewProduct) {
  if (product.pricingModel === "free") return "Free";
  return formatPrice(product.priceCents, product.currency);
}

export function styleCanvasVars(
  style: PageStyle | CheckoutStyle,
): CSSProperties {
  return {
    background: style.colors.background,
    color: style.colors.text,
    fontFamily: FONT_STACKS[style.bodyFont],
    ["--pf-bg" as string]: style.colors.background,
    ["--pf-panel" as string]: style.colors.panel,
    ["--pf-border" as string]: style.colors.border,
    ["--pf-text" as string]: style.colors.text,
    ["--pf-accent" as string]: style.colors.accent,
    ["--pf-accent-text" as string]: style.colors.accentText,
    ["--pf-heading" as string]: FONT_STACKS[style.headingFont],
    ["--pf-body" as string]: FONT_STACKS[style.bodyFont],
    ["--pf-radius" as string]: cornerRadius(style.corners),
    ["--pf-border-w" as string]: borderWidth(style.borders),
  };
}

function Heading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn("font-semibold tracking-tight text-balance", className)}
      style={{ fontFamily: "var(--pf-heading)" }}
    >
      {children}
    </p>
  );
}

function Cta({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium"
      style={{
        background: "var(--pf-accent)",
        color: "var(--pf-accent-text)",
        borderRadius: "var(--pf-radius)",
      }}
    >
      {label}
    </span>
  );
}

function Cover({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn("flex items-center justify-center text-xs opacity-50", className)}
        style={{
          background: "var(--pf-panel)",
          borderRadius: "var(--pf-radius)",
          border: "var(--pf-border-w) solid var(--pf-border)",
        }}
      >
        Cover
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={cn("object-cover", className)}
      style={{ borderRadius: "var(--pf-radius)" }}
    />
  );
}

export function ProductPagePreview({
  style,
  product,
}: {
  style: PageStyle;
  product: PreviewProduct;
}) {
  const title = product.title.trim() || "Untitled product";
  const pitch =
    product.shortDescription.trim() ||
    "A short, practical guide you can read in an afternoon.";
  const layout = style.layout;

  return (
    <div
      className="overflow-hidden text-[13px] leading-relaxed"
      style={{
        ...styleCanvasVars(style),
        border: "var(--pf-border-w) solid var(--pf-border)",
        borderRadius: "calc(var(--pf-radius) + 4px)",
      }}
    >
      {layout === "poster" ? (
        <div className="relative min-h-[420px]">
          <Cover src={product.coverUrl} className="absolute inset-0 h-full w-full rounded-none" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative flex min-h-[420px] flex-col items-center justify-end p-8 text-center text-white">
            <Heading className="text-3xl text-white">{title}</Heading>
            <p className="mt-3 max-w-md text-white/80">{pitch}</p>
            <div className="mt-5">
              <Cta label="I want this" />
            </div>
          </div>
        </div>
      ) : null}

      {layout === "launch" ? (
        <div className="px-8 py-10 text-center">
          <Heading className="text-3xl">{title}</Heading>
          <p className="mx-auto mt-3 max-w-md opacity-80">{pitch}</p>
          <Cover src={product.coverUrl} className="mx-auto mt-8 h-44 w-full max-w-lg" />
          <div className="mt-6">
            <Cta label="I want this" />
          </div>
        </div>
      ) : null}

      {layout === "hero-card" ? (
        <div>
          <div
            className="px-6 py-8"
            style={{ background: "var(--pf-panel)" }}
          >
            <div className="grid gap-6 sm:grid-cols-[1fr_14rem]">
              <div>
                <Heading className="text-3xl">{title}</Heading>
                <p className="mt-3 opacity-80">{pitch}</p>
                <p className="mt-4 text-lg font-medium">{priceLabel(product)}</p>
              </div>
              <div
                className="p-4"
                style={{
                  background: "var(--pf-bg)",
                  borderRadius: "var(--pf-radius)",
                  border: "var(--pf-border-w) solid var(--pf-border)",
                }}
              >
                <p className="text-xs uppercase tracking-wide opacity-60">Offer</p>
                <p className="mt-2 text-xl font-semibold">{priceLabel(product)}</p>
                <div className="mt-4 w-full">
                  <Cta label="I want this" />
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <Cover src={product.coverUrl} className="h-40 w-full" />
          </div>
        </div>
      ) : null}

      {layout === "split" ? (
        <div className="grid min-h-[420px] sm:grid-cols-[16rem_1fr]">
          <aside
            className="p-6"
            style={{
              background: "var(--pf-panel)",
              borderRight: "var(--pf-border-w) solid var(--pf-border)",
            }}
          >
            <Cover src={product.coverUrl} className="h-28 w-full" />
            <Heading className="mt-4 text-xl">{title}</Heading>
            <p className="mt-3 text-lg font-medium">{priceLabel(product)}</p>
            <div className="mt-4">
              <Cta label="I want this" />
            </div>
          </aside>
          <div className="p-8">
            <p className="opacity-80">{pitch}</p>
            <p className="mt-4 opacity-70">
              What you get, who it’s for, and why it exists — laid out as a long read beside the offer.
            </p>
          </div>
        </div>
      ) : null}

      {layout === "gallery" ? (
        <div className="grid min-h-[420px] sm:grid-cols-[1.1fr_0.9fr]">
          <Cover src={product.coverUrl} className="h-full min-h-[280px] w-full rounded-none" />
          <div className="p-7">
            <Heading className="text-3xl">{title}</Heading>
            <p className="mt-3 opacity-80">{pitch}</p>
            <p className="mt-4 text-lg font-medium">{priceLabel(product)}</p>
            <div className="mt-5">
              <Cta label="I want this" />
            </div>
          </div>
        </div>
      ) : null}

      {layout === "editorial" ? (
        <div className="px-8 py-10">
          <Heading className="text-center text-4xl">{title}</Heading>
          <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_13rem]">
            <div>
              <p className="opacity-80">{pitch}</p>
              <p className="mt-4 opacity-70">
                Magazine pacing: a long column of copy, a quiet price rail, no chrome shouting over the work.
              </p>
            </div>
            <aside className="sm:text-right">
              <p className="text-xl font-medium">{priceLabel(product)}</p>
              <div className="mt-4 sm:flex sm:justify-end">
                <Cta label="I want this" />
              </div>
            </aside>
          </div>
        </div>
      ) : null}

      {layout === "minimal" ? (
        <div className="grid min-h-[420px] sm:grid-cols-[1.1fr_0.9fr]">
          <Cover src={product.coverUrl} className="h-full min-h-[280px] w-full rounded-none" />
          <div className="p-7">
            <Heading className="text-3xl">{title}</Heading>
            <p className="mt-3 opacity-80">{pitch}</p>
            <p className="mt-4 text-lg font-medium">{priceLabel(product)}</p>
            <div className="mt-5">
              <Cta label="I want this" />
            </div>
          </div>
        </div>
      ) : null}

      {layout === "market" ? (
        <div className="p-5">
          <div
            className="overflow-hidden"
            style={{
              border: "var(--pf-border-w) solid var(--pf-border)",
              borderRadius: "var(--pf-radius)",
            }}
          >
            <Cover src={product.coverUrl} className="h-44 w-full rounded-none" />
            <div
              className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]"
              style={{ borderTop: "var(--pf-border-w) solid var(--pf-border)" }}
            >
              <div>
                <Heading className="text-2xl">{title}</Heading>
                <p className="mt-2 opacity-80">{pitch}</p>
              </div>
              <div>
                <p className="text-lg font-medium">{priceLabel(product)}</p>
                <div className="mt-3">
                  <Cta label="I want this" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {layout === "classic" ? (
        <div>
          <div
            className="flex items-center justify-between gap-4 px-6 py-4"
            style={{
              borderBottom: "var(--pf-border-w) solid var(--pf-border)",
              background: "var(--pf-panel)",
            }}
          >
            <Heading className="truncate text-lg">{title}</Heading>
            <Cta label="I want this" />
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-[1.2fr_0.8fr]">
            <Cover src={product.coverUrl} className="h-52 w-full" />
            <div>
              <p className="opacity-80">{pitch}</p>
              <p className="mt-4 text-xl font-medium">{priceLabel(product)}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CheckoutPreview({
  style,
  product,
}: {
  style: CheckoutStyle;
  product: PreviewProduct;
}) {
  const title = product.title.trim() || "Untitled product";
  const layout = style.layout;
  const panel = (
    <div
      className="p-5"
      style={{
        background: "var(--pf-panel)",
        borderRadius: "var(--pf-radius)",
        border: "var(--pf-border-w) solid var(--pf-border)",
      }}
    >
      <Heading className="text-xl">{title}</Heading>
      <p className="mt-2 text-lg font-medium">{priceLabel(product)}</p>
      <Cover src={product.coverUrl} className="mt-4 h-36 w-full" />
      <p className="mt-4 text-xs leading-relaxed opacity-75">
        Almost done — your download starts immediately. You’re purchasing this
        product; files arrive in your library after checkout.
      </p>
    </div>
  );
  const pay = (
    <div
      className="p-5"
      style={{
        background: "var(--pf-bg)",
        borderRadius: "var(--pf-radius)",
        border: "var(--pf-border-w) solid var(--pf-border)",
      }}
    >
      <p className="text-xs uppercase tracking-wide opacity-60">Payment</p>
      <div
        className="mt-3 h-10"
        style={{
          border: "var(--pf-border-w) solid var(--pf-border)",
          borderRadius: "var(--pf-radius)",
          background: "var(--pf-panel)",
        }}
      />
      <div
        className="mt-2 h-10"
        style={{
          border: "var(--pf-border-w) solid var(--pf-border)",
          borderRadius: "var(--pf-radius)",
          background: "var(--pf-panel)",
        }}
      />
      <div className="mt-4 w-full">
        <span
          className="flex w-full items-center justify-center py-2.5 text-sm font-medium"
          style={{
            background: "var(--pf-accent)",
            color: "var(--pf-accent-text)",
            borderRadius: "var(--pf-radius)",
          }}
        >
          Pay {priceLabel(product)}
        </span>
      </div>
    </div>
  );

  const framed = layout === "frame";
  const cardWrap = layout === "card" || layout === "sheet";

  return (
    <div
      className={cn("overflow-hidden p-4 text-[13px]", framed && "p-3")}
      style={{
        ...styleCanvasVars(style),
        border: "var(--pf-border-w) solid var(--pf-border)",
        borderRadius: "calc(var(--pf-radius) + 4px)",
        boxShadow: framed ? `inset 0 0 0 10px ${style.colors.accent}` : undefined,
      }}
    >
      <div
        className={cn(
          cardWrap && "mx-auto max-w-md p-3",
        )}
        style={
          cardWrap
            ? {
                background: "var(--pf-panel)",
                borderRadius: "var(--pf-radius)",
                border: "var(--pf-border-w) solid var(--pf-border)",
              }
            : undefined
        }
      >
        {layout === "banner" || layout === "hero" ? (
          <div className="space-y-4">
            {layout === "hero" ? (
              <div className="px-2 pt-4 text-center">
                <Cover src={product.coverUrl} className="mx-auto h-28 w-40" />
              </div>
            ) : (
              <Cover src={product.coverUrl} className="h-28 w-full" />
            )}
            {panel}
            {pay}
          </div>
        ) : null}

        {layout === "focus" || layout === "sheet" ? (
          <div className="mx-auto max-w-sm space-y-4">{panel}{pay}</div>
        ) : null}

        {layout === "flipped" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {pay}
            {panel}
          </div>
        ) : null}

        {layout === "sidebar" ? (
          <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
            {panel}
            {pay}
          </div>
        ) : null}

        {layout === "gallery" ? (
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            {pay}
            {panel}
          </div>
        ) : null}

        {layout === "split" || layout === "card" || layout === "frame" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {panel}
            {pay}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TemplateThumb({
  template,
  selected,
}: {
  template: PageTemplate;
  selected: boolean;
}) {
  const { colors } = template.style;
  return (
    <span
      className={cn(
        "block overflow-hidden rounded-xl border text-left transition-colors",
        selected ? "border-foreground ring-2 ring-foreground/15" : "border-border hover:border-foreground/30",
      )}
    >
      <span
        className="relative block aspect-[16/10] overflow-hidden"
        style={{ background: colors.background }}
      >
        <span
          className="absolute inset-x-3 top-3 h-2 rounded-full"
          style={{ background: colors.accent, opacity: 0.9 }}
        />
        <span
          className="absolute inset-x-3 top-7 h-[46%] rounded-md"
          style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
        />
        <span
          className="absolute bottom-3 left-3 h-2 w-16 rounded-full"
          style={{ background: colors.text, opacity: 0.55 }}
        />
        <span
          className="absolute right-3 bottom-3 h-6 w-14 rounded-md"
          style={{ background: colors.accent }}
        />
      </span>
      <span className="block px-3 py-2.5">
        <span className="block text-sm font-medium">{template.name}</span>
        <span className="mt-0.5 block text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {PAGE_LAYOUT_LABELS[template.style.layout]}
        </span>
      </span>
    </span>
  );
}
