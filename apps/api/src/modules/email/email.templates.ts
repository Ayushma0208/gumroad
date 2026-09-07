/** Escape text for safe interpolation into HTML email templates. */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string, cta?: { label: string; href: string }) {
  const ctaBlock = cta
    ? `<p style="margin:28px 0 0;">
        <a href="${escapeHtml(cta.href)}"
           style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;">
          ${escapeHtml(cta.label)}
        </a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;padding:32px;border:1px solid #e4e4e7;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#71717a;">Lumen</p>
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">${escapeHtml(title)}</h1>
          ${bodyHtml}
          ${ctaBlock}
          <p style="margin:32px 0 0;font-size:12px;color:#a1a1aa;">You’re receiving this because of activity on your Lumen account.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export type PurchaseEmailPayload = {
  customerName: string;
  orderId: string;
  totalLabel: string;
  purchasedAt: string;
  products: Array<{ title: string; creatorName: string }>;
  libraryUrl: string;
  orderUrl: string;
};

export function renderPurchaseConfirmation(payload: PurchaseEmailPayload) {
  const list = payload.products
    .map(
      (p) =>
        `<li style="margin:0 0 8px;"><strong>${escapeHtml(p.title)}</strong> · ${escapeHtml(p.creatorName)}</li>`,
    )
    .join("");
  const html = layout(
    "Purchase confirmed",
    `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(payload.customerName)}, thanks for your purchase.</p>
     <p style="margin:0 0 12px;line-height:1.5;">Order <strong>${escapeHtml(payload.orderId)}</strong> · ${escapeHtml(payload.totalLabel)} · ${escapeHtml(payload.purchasedAt)}</p>
     <ul style="padding-left:18px;margin:0 0 12px;">${list}</ul>
     <p style="margin:0;line-height:1.5;">Your files are ready in your Library. We never email permanent download links.</p>`,
    { label: "Open Library", href: payload.libraryUrl },
  );
  const text = [
    "Purchase confirmed",
    `Hi ${payload.customerName},`,
    `Order ${payload.orderId} · ${payload.totalLabel} · ${payload.purchasedAt}`,
    ...payload.products.map((p) => `- ${p.title} (${p.creatorName})`),
    `Open Library: ${payload.libraryUrl}`,
  ].join("\n");
  return { subject: "Your Lumen purchase is ready", html, text };
}

export type CreatorSaleEmailPayload = {
  creatorName: string;
  productTitle: string;
  amountLabel: string;
  orderId: string;
  soldAt: string;
  dashboardUrl: string;
};

export function renderCreatorSale(payload: CreatorSaleEmailPayload) {
  const html = layout(
    "New sale",
    `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(payload.creatorName)}, you sold <strong>${escapeHtml(payload.productTitle)}</strong>.</p>
     <p style="margin:0;line-height:1.5;">${escapeHtml(payload.amountLabel)} · Order ${escapeHtml(payload.orderId)} · ${escapeHtml(payload.soldAt)}</p>`,
    { label: "View dashboard", href: payload.dashboardUrl },
  );
  const text = [
    "New sale",
    `You sold ${payload.productTitle}`,
    `${payload.amountLabel} · Order ${payload.orderId} · ${payload.soldAt}`,
    payload.dashboardUrl,
  ].join("\n");
  return { subject: `Sale: ${payload.productTitle}`, html, text };
}

export type ReviewEmailPayload = {
  creatorName: string;
  productTitle: string;
  rating: number;
  reviewTitle: string;
  preview: string;
  reviewsUrl: string;
};

export function renderReviewReceived(payload: ReviewEmailPayload) {
  const html = layout(
    "New review",
    `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(payload.creatorName)}, someone left a ${payload.rating}-star review on <strong>${escapeHtml(payload.productTitle)}</strong>.</p>
     <p style="margin:0 0 8px;line-height:1.5;"><strong>${escapeHtml(payload.reviewTitle)}</strong></p>
     <p style="margin:0;line-height:1.5;color:#52525b;">${escapeHtml(payload.preview)}</p>`,
    { label: "View reviews", href: payload.reviewsUrl },
  );
  const text = [
    "New review",
    `${payload.rating}★ on ${payload.productTitle}`,
    payload.reviewTitle,
    payload.preview,
    payload.reviewsUrl,
  ].join("\n");
  return { subject: `New review on ${payload.productTitle}`, html, text };
}

export type ProductStatusEmailPayload = {
  creatorName: string;
  productTitle: string;
  statusLabel: string;
  message: string;
  productUrl: string;
};

export function renderProductStatus(payload: ProductStatusEmailPayload) {
  const html = layout(
    payload.statusLabel,
    `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(payload.creatorName)},</p>
     <p style="margin:0;line-height:1.5;">${escapeHtml(payload.message)} (<strong>${escapeHtml(payload.productTitle)}</strong>)</p>`,
    { label: "Manage product", href: payload.productUrl },
  );
  const text = [
    payload.statusLabel,
    payload.message,
    payload.productTitle,
    payload.productUrl,
  ].join("\n");
  return { subject: `${payload.statusLabel}: ${payload.productTitle}`, html, text };
}
