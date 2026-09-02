export const trustStats = [
  { value: "12,408", label: "independent creators" },
  { value: "$48M", label: "paid out to makers" },
  { value: "2.1M", label: "files delivered" },
  { value: "4.9", label: "average rating" },
] as const;

export const howItWorksSteps = [
  {
    number: "01",
    title: "Create your product",
    body: "A kit, a course, a sample pack, a typeface. Upload the files, write the page, set a price.",
    imageId: "photo-1545235617-9465d2a55698",
    caption: "From the studio",
  },
  {
    number: "02",
    title: "Share your store",
    body: "Your Lumen page is the shop window. Send it to the people who already care — then let Discover do the rest.",
    imageId: "photo-1522202176988-66273c2fd55f",
    caption: "A store with your name on it",
  },
  {
    number: "03",
    title: "Get paid",
    body: "Checkout, instant delivery, the buyer’s email. Ten percent. No monthly plan to reach your own customers.",
    imageId: "photo-1554224155-6726b3ff858f",
    caption: "The money, then the relationship",
  },
] as const;

export const creatorBenefits = [
  {
    title: "Sell globally",
    body: "One store, buyers anywhere. Pricing in the open. No regional maze to ship a file.",
    span: "lg:col-span-2 lg:row-span-2",
  },
  {
    title: "Secure payments",
    body: "Razorpay on the ledger. We never trust a frontend “success” screen.",
    span: "",
  },
  {
    title: "Instant delivery",
    body: "Paid files move over short-lived signed URLs — not a public bucket.",
    span: "",
  },
  {
    title: "Own your audience",
    body: "Every buyer is yours. We do not rent them back to you as ads.",
    span: "",
  },
  {
    title: "Analytics that read like a book",
    body: "Revenue, refunds, what actually sold. Not forty vanity charts.",
    span: "lg:col-span-2",
  },
] as const;

export const footerSocial = [
  { href: "https://x.com", label: "X" },
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://youtube.com", label: "YouTube" },
] as const;
