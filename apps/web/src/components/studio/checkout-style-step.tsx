"use client";

import { CheckoutPreview } from "@/components/studio/storefront-preview";
import { ChoiceRow, ColorField, FontChoice } from "@/components/studio/style-controls";
import {
  BORDER_TOKENS,
  CHECKOUT_LAYOUTS,
  CHECKOUT_LAYOUT_LABELS,
  CORNER_TOKENS,
  DEFAULT_CHECKOUT_STYLE,
  FONT_LABELS,
  FONT_STACKS,
  FONT_TOKENS,
  STUDIO_FONT_HREF,
  THEME_TOKENS,
  type BorderToken,
  type CheckoutLayoutId,
  type CheckoutStyle,
  type CornerToken,
  type FontToken,
  type StyleColors,
  type ThemeToken,
} from "@/lib/studio/page-style";
import type { PreviewProduct } from "@/components/studio/storefront-preview";

const fontOptions = FONT_TOKENS.map((id) => ({ id, label: FONT_LABELS[id] }));
const layoutOptions = CHECKOUT_LAYOUTS.map((id) => ({
  id,
  label: CHECKOUT_LAYOUT_LABELS[id],
}));

const DARK_CHECKOUT_COLORS: StyleColors = {
  background: "#0D0D0F",
  panel: "#16161A",
  border: "#2C2C32",
  text: "#F4F4F5",
  accent: "#635BFF",
  accentText: "#FFFFFF",
};

function luminance(hex: string) {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3 ? raw.split("").map((char) => `${char}${char}`).join("") : raw;
  if (full.length !== 6) return 255;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function CheckoutStyleStep({
  style,
  product,
  onChange,
}: {
  style: CheckoutStyle;
  product: PreviewProduct;
  onChange: (next: CheckoutStyle) => void;
}) {
  function patch(partial: Partial<CheckoutStyle>) {
    if (partial.theme === "dark" && luminance(style.colors.background) > 160) {
      onChange({ ...style, ...partial, colors: DARK_CHECKOUT_COLORS });
      return;
    }
    if (partial.theme === "light" && luminance(style.colors.background) <= 160) {
      onChange({
        ...style,
        ...partial,
        colors: DEFAULT_CHECKOUT_STYLE.colors,
      });
      return;
    }
    onChange({ ...style, ...partial });
  }

  function patchColor(key: keyof StyleColors, value: string) {
    onChange({
      ...style,
      colors: { ...style.colors, [key]: value },
    });
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.95fr)]">
      <link rel="stylesheet" href={STUDIO_FONT_HREF} />
      <div className="space-y-8">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Style
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-tight">
            Typography, layout and shapes
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Same knobs as the product page — applied to checkout only. Buyers still
            see the current checkout until that pass ships.
          </p>
        </div>

        <FontChoice
          label="Heading font"
          value={style.headingFont}
          options={fontOptions}
          stacks={FONT_STACKS}
          onChange={(id) => patch({ headingFont: id as FontToken })}
        />
        <FontChoice
          label="Body font"
          value={style.bodyFont}
          options={fontOptions}
          stacks={FONT_STACKS}
          onChange={(id) => patch({ bodyFont: id as FontToken })}
        />
        <ChoiceRow
          label="Layout"
          value={style.layout}
          options={layoutOptions}
          onChange={(id) => patch({ layout: id as CheckoutLayoutId })}
        />
        <ChoiceRow
          label="Theme"
          value={style.theme}
          options={THEME_TOKENS.map((id) => ({
            id,
            label: id === "light" ? "Light" : "Dark",
          }))}
          onChange={(id) => patch({ theme: id as ThemeToken })}
        />
        <ChoiceRow
          label="Corners"
          value={style.corners}
          options={CORNER_TOKENS.map((id) => ({
            id,
            label: id === "sharp" ? "Sharp" : id === "round" ? "Round" : "Soft",
          }))}
          onChange={(id) => patch({ corners: id as CornerToken })}
        />
        <ChoiceRow
          label="Borders"
          value={style.borders}
          options={BORDER_TOKENS.map((id) => ({
            id,
            label: id === "thin" ? "Thin" : id === "medium" ? "Medium" : "Bold",
          }))}
          onChange={(id) => patch({ borders: id as BorderToken })}
        />

        <div>
          <p className="text-sm font-medium">Colors</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fine-tune the checkout palette.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <ColorField
              label="Background"
              value={style.colors.background}
              onChange={(value) => patchColor("background", value)}
            />
            <ColorField
              label="Product panel"
              value={style.colors.panel}
              onChange={(value) => patchColor("panel", value)}
            />
            <ColorField
              label="Borders"
              value={style.colors.border}
              onChange={(value) => patchColor("border", value)}
            />
            <ColorField
              label="Text"
              value={style.colors.text}
              onChange={(value) => patchColor("text", value)}
            />
            <ColorField
              label="Accent"
              value={style.colors.accent}
              onChange={(value) => patchColor("accent", value)}
            />
            <ColorField
              label="Button text"
              value={style.colors.accentText}
              onChange={(value) => patchColor("accentText", value)}
            />
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24">
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Checkout preview
        </p>
        <div className="mt-3">
          <CheckoutPreview style={style} product={product} />
        </div>
      </div>
    </div>
  );
}
