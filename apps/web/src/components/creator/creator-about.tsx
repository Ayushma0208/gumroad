import { Container } from "@/components/layout/container";

export function CreatorAbout({
  description,
  bio,
}: {
  description?: string | null;
  bio?: string | null;
}) {
  const copy = description?.trim();
  if (!copy || copy === bio?.trim()) return null;

  return (
    <Container as="section" className="py-16 sm:py-20">
      <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
        About
      </p>
      <h2 className="mt-2 font-display text-3xl tracking-tight">
        About the creator
      </h2>
      <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed whitespace-pre-wrap text-muted-foreground">
        {copy}
      </p>
    </Container>
  );
}
