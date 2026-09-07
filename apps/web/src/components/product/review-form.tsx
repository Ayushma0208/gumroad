"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Field } from "@/components/studio/field";
import { Textarea } from "@/components/studio/textarea";
import { StarRating } from "@/components/product/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import {
  reviewFormSchema,
  type ReviewFormValues,
} from "@/lib/reviews/schema";

export function ReviewForm({
  defaultValues,
  submitLabel = "Submit review",
  onSubmit,
  onCancel,
}: {
  defaultValues?: Partial<ReviewFormValues>;
  submitLabel?: string;
  onSubmit: (values: ReviewFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: defaultValues?.rating ?? 0,
      title: defaultValues?.title ?? "",
      comment: defaultValues?.comment ?? "",
    },
  });
  const rating = form.watch("rating");

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          form.setError("root", {
            message: error instanceof ApiError ? error.message : "Could not save your review.",
          });
        }
      })}
    >
      <div>
        <p id="review-rating-label" className="text-sm font-medium">
          How would you rate this product?
        </p>
        <StarRating
          className="mt-2"
          value={rating}
          size="lg"
          interactive
          onChange={(value) => form.setValue("rating", value, { shouldValidate: true })}
        />
        {form.formState.errors.rating ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {form.formState.errors.rating.message}
          </p>
        ) : null}
      </div>
      <Field id="review-title" label="Title" error={form.formState.errors.title?.message}>
        <Input
          id="review-title"
          className="h-11 rounded-xl"
          maxLength={120}
          {...form.register("title")}
        />
      </Field>
      <Field id="review-comment" label="Your review" error={form.formState.errors.comment?.message}>
        <Textarea id="review-comment" className="min-h-32" maxLength={5000} {...form.register("comment")} />
      </Field>
      {form.formState.errors.root ? (
        <p className="text-sm text-destructive" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" className="rounded-xl" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" size="lg" className="rounded-xl" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
