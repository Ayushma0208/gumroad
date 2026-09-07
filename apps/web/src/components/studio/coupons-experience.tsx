"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, TicketPercent } from "lucide-react";
import { StudioPage } from "@/components/studio/studio-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { Field, fieldControlClass } from "@/components/studio/field";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateCoupon,
  useCreatorCoupons,
  useDeactivateCoupon,
  useDeleteCoupon,
} from "@/hooks/use-coupons";
import { useStudioProducts } from "@/hooks/use-studio";
import { formatDate, formatPrice } from "@/lib/format";
import { useToastStore } from "@/stores/toast-store";
import type { Coupon } from "@/lib/api/coupons";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";

const formSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Code is required.")
      .max(32)
      .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - or _ only."),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number().int().positive(),
    maxDiscountMajor: z.string().optional(),
    minOrderMajor: z.string().optional(),
    maxUses: z.string().optional(),
    perUserLimit: z.string().optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    scope: z.enum(["creator", "products"]),
    productIds: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERCENTAGE" && (data.value < 1 || data.value > 100)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage must be 1–100.",
      });
    }
    if (data.scope === "products" && data.productIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["productIds"],
        message: "Select at least one product.",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

function statusBadge(status: Coupon["status"]) {
  const labels: Record<Coupon["status"], string> = {
    active: "Active",
    scheduled: "Scheduled",
    expired: "Expired",
    inactive: "Deactivated",
    limit_reached: "Limit reached",
  };
  return labels[status];
}

function dollarsToCents(value: string | undefined) {
  if (!value?.trim()) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function CouponsExperience() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const coupons = useCreatorCoupons({ page: 1, limit: 48 });
  const products = useStudioProducts(user?.id);
  const create = useCreateCoupon();
  const deactivate = useDeactivateCoupon();
  const remove = useDeleteCoupon();
  const toast = useToastStore((state) => state.show);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      type: "PERCENTAGE",
      value: 20,
      maxDiscountMajor: "",
      minOrderMajor: "",
      maxUses: "100",
      perUserLimit: "1",
      startsAt: "",
      expiresAt: "",
      scope: "creator",
      productIds: [],
    },
  });

  const scope = form.watch("scope");
  const type = form.watch("type");
  const selected = form.watch("productIds");

  const productOptions = useMemo(
    () =>
      (products.data ?? []).map((product) => ({
        id: product.id,
        title: product.title,
      })),
    [products.data],
  );

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync({
        code: values.code.toUpperCase(),
        type: values.type,
        value:
          values.type === "FIXED"
            ? Math.round(values.value * 100)
            : values.value,
        maxDiscount:
          values.type === "PERCENTAGE"
            ? dollarsToCents(values.maxDiscountMajor)
            : null,
        minOrderAmount: dollarsToCents(values.minOrderMajor),
        maxUses: values.maxUses?.trim()
          ? Number(values.maxUses)
          : null,
        perUserLimit: values.perUserLimit?.trim()
          ? Number(values.perUserLimit)
          : null,
        startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
        expiresAt: values.expiresAt
          ? new Date(values.expiresAt).toISOString()
          : null,
        productIds: values.scope === "products" ? values.productIds : [],
      });
      toast({ title: "Coupon created" });
      form.reset();
      setCreating(false);
    } catch (error) {
      toast({
        title:
          error instanceof ApiError ? error.message : "Couldn’t create coupon.",
      });
    }
  }

  if (coupons.isError) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void coupons.refetch()} />
      </StudioPage>
    );
  }

  const items = coupons.data?.items ?? [];

  return (
    <StudioPage>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            Coupons
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Offer your audience a discount and track its impact.
          </p>
        </div>
        <Button
          className="rounded-xl"
          onClick={() => setCreating((open) => !open)}
        >
          <Plus className="size-4" />
          {creating ? "Close" : "Create coupon"}
        </Button>
      </div>

      {creating ? (
        <form
          className="mt-8 space-y-5 rounded-2xl border border-border p-5 sm:p-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="code" label="Code" error={form.formState.errors.code?.message}>
              <input
                id="code"
                className={cn(fieldControlClass(Boolean(form.formState.errors.code)), "font-mono uppercase")}
                {...form.register("code")}
                placeholder="SUMMER20"
              />
            </Field>
            <Field id="type" label="Discount type">
              <select id="type" className={fieldControlClass()} {...form.register("type")}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
            </Field>
            <Field
              id="value"
              label={type === "PERCENTAGE" ? "Percent off" : "Amount off (USD)"}
              error={form.formState.errors.value?.message}
              hint={type === "FIXED" ? "Enter dollars, e.g. 5 for $5.00" : "1–100"}
            >
              <input
                id="value"
                type="number"
                className={fieldControlClass(Boolean(form.formState.errors.value))}
                value={form.watch("value")}
                onChange={(event) =>
                  form.setValue("value", Number(event.target.value) || 0, {
                    shouldValidate: true,
                  })
                }
              />
            </Field>
            {type === "PERCENTAGE" ? (
              <Field id="maxDiscountMajor" label="Max discount (USD)" hint="Optional cap">
                <input
                  id="maxDiscountMajor"
                  className={fieldControlClass()}
                  {...form.register("maxDiscountMajor")}
                  placeholder="50"
                />
              </Field>
            ) : null}
            <Field id="minOrderMajor" label="Minimum order (USD)" hint="Optional">
              <input
                id="minOrderMajor"
                className={fieldControlClass()}
                {...form.register("minOrderMajor")}
                placeholder="10"
              />
            </Field>
            <Field id="maxUses" label="Max total uses" hint="Optional">
              <input id="maxUses" className={fieldControlClass()} {...form.register("maxUses")} />
            </Field>
            <Field id="perUserLimit" label="Per customer limit" hint="Optional">
              <input
                id="perUserLimit"
                className={fieldControlClass()}
                {...form.register("perUserLimit")}
              />
            </Field>
            <Field id="startsAt" label="Starts at" hint="Optional">
              <input
                id="startsAt"
                type="datetime-local"
                className={fieldControlClass()}
                {...form.register("startsAt")}
              />
            </Field>
            <Field id="expiresAt" label="Expires at" hint="Optional">
              <input
                id="expiresAt"
                type="datetime-local"
                className={fieldControlClass()}
                {...form.register("expiresAt")}
              />
            </Field>
          </div>

          <Field id="scope" label="Scope">
            <select id="scope" className={fieldControlClass()} {...form.register("scope")}>
              <option value="creator">All my products</option>
              <option value="products">Specific products</option>
            </select>
          </Field>

          {scope === "products" ? (
            <Field
              label="Products"
              error={form.formState.errors.productIds?.message}
            >
              <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2">
                {productOptions.map((product) => {
                  const checked = selected.includes(product.id);
                  return (
                    <label
                      key={product.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? selected.filter((id) => id !== product.id)
                            : [...selected, product.id];
                          form.setValue("productIds", next, { shouldValidate: true });
                        }}
                      />
                      <span className="truncate">{product.title}</span>
                    </label>
                  );
                })}
              </div>
            </Field>
          ) : null}

          <Button type="submit" className="rounded-xl" disabled={create.isPending}>
            {create.isPending ? <LoaderCircle className="animate-spin" /> : null}
            Create coupon
          </Button>
        </form>
      ) : null}

      {coupons.isPending ? (
        <div className="mt-10 grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <TicketPercent className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 font-display text-2xl tracking-tight">
            Create your first coupon
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Offer your audience a discount and track its impact.
          </p>
          <Button className="mt-6 rounded-xl" onClick={() => setCreating(true)}>
            Create coupon
          </Button>
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {items.map((coupon) => (
            <li
              key={coupon.id}
              className="rounded-2xl border border-border px-5 py-4 transition-colors hover:border-foreground/20"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-lg font-medium tracking-wide">
                      {coupon.code}
                    </p>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase">
                      {statusBadge(coupon.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {coupon.type === "PERCENTAGE"
                      ? `${coupon.value}% off`
                      : `${formatPrice(coupon.value, "USD")} off`}
                    {" · "}
                    {coupon.scope === "creator" ? "All products" : `${coupon.productIds.length} products`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {coupon.usedCount}
                    {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""} uses
                    {coupon.expiresAt
                      ? ` · Expires ${formatDate(coupon.expiresAt)}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {coupon.isActive ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() =>
                        void deactivate.mutateAsync(coupon.id).then(() =>
                          toast({ title: "Coupon deactivated" }),
                        )
                      }
                    >
                      Deactivate
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg"
                    onClick={() =>
                      void remove.mutateAsync(coupon.id).then(() =>
                        toast({ title: "Coupon removed" }),
                      )
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </StudioPage>
  );
}
