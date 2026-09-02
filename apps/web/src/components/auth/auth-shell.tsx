import { Logo } from "@/components/layout/logo";
import type { ReactNode } from "react";

export function AuthShell({
  kicker,
  title,
  description,
  children,
  footer,
}: {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="lg:grid lg:min-h-[calc(100vh-8rem)] lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14 xl:px-16">
        <Logo inverse />
        <div className="max-w-md">
          <p className="text-xs font-medium tracking-[0.2em] text-background/55 uppercase">
            {kicker}
          </p>
          <p className="mt-6 font-display text-5xl leading-[1.05] tracking-tight text-balance">
            A quieter way to sell what you make.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-background/70">
            “I replaced three tools with Lumen. Checkout is quieter, payouts are
            faster, and the store actually looks like my work.”
          </p>
          <p className="mt-4 text-sm text-background/50">Leah Okonkwo · Illustrator</p>
        </div>
        <p className="text-sm text-background/45">Ten percent. No monthly rent.</p>
      </aside>

      <div className="flex items-center px-5 py-14 sm:px-10 sm:py-16 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
            {kicker}
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-muted-foreground">{description}</p>
          {children}
          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
