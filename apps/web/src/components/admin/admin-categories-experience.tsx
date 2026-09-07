"use client";

import { useState, type FormEvent } from "react";
import {
  AdminConfirmButton,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminCategories,
  useAdminCategoryMutations,
} from "@/hooks/use-admin";
import { useToastStore } from "@/stores/toast-store";

export function AdminCategoriesExperience() {
  const query = useAdminCategories();
  const mutations = useAdminCategoryMutations();
  const showToast = useToastStore((state) => state.show);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  if (query.isPending) {
    return (
      <AdminPage>
        <AdminPageHeader
          title="Categories"
          description="Marketplace browse taxonomy."
        />
        <div className="mt-8">
          <TableSkeleton />
        </div>
      </AdminPage>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AdminPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const items = query.data.items;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void mutations.create
      .mutateAsync({
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
      })
      .then(() => {
        setName("");
        setDescription("");
        setImageUrl("");
        showToast({ title: "Category created" });
      })
      .catch((error: Error) =>
        showToast({ title: error.message || "Could not create category" }),
      );
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Categories"
        description={`${items.length} categor${items.length === 1 ? "y" : "ies"}.`}
      />

      <form
        onSubmit={submit}
        className="mt-8 grid max-w-xl gap-3 border-b border-border pb-10"
      >
        <h2 className="text-base font-medium">Create category</h2>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          aria-label="Category name"
          required
          className="h-11 rounded-xl"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          aria-label="Category description"
          required
          rows={3}
          className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="Image URL"
          aria-label="Category image URL"
          type="url"
          required
          className="h-11 rounded-xl"
        />
        <Button
          type="submit"
          className="w-fit rounded-xl"
          disabled={mutations.create.isPending}
        >
          {mutations.create.isPending ? "Creating…" : "Create"}
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No categories yet.
        </p>
      ) : (
        <>
          <ul className="mt-8 space-y-3 lg:hidden">
            {items.map((category) => (
              <li key={category.id} className="rounded-xl bg-muted/40 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{category.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {category.productCount} products ·{" "}
                      {category.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <CategoryActions
                    category={category}
                    mutations={mutations}
                    showToast={showToast}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Slug</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Products</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((category) => (
                  <tr key={category.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{category.label}</p>
                      <p className="max-w-sm truncate text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs">{category.slug}</td>
                    <td className="py-3 pr-3">
                      {category.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {category.productCount}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <CategoryActions
                          category={category}
                          mutations={mutations}
                          showToast={showToast}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminPage>
  );
}

function CategoryActions({
  category,
  mutations,
  showToast,
}: {
  category: {
    id: string;
    label: string;
    isActive: boolean;
    productCount: number;
  };
  mutations: ReturnType<typeof useAdminCategoryMutations>;
  showToast: (input: { title: string }) => void;
}) {
  return (
    <>
      <AdminConfirmButton
        label={category.isActive ? "Deactivate" : "Activate"}
        confirmLabel={
          category.isActive
            ? `Deactivate “${category.label}”?`
            : `Activate “${category.label}”?`
        }
        disabled={mutations.update.isPending}
        onConfirm={() => {
          void mutations.update
            .mutateAsync({
              id: category.id,
              body: { isActive: !category.isActive },
            })
            .then(() =>
              showToast({
                title: category.isActive
                  ? "Category deactivated"
                  : "Category activated",
              }),
            )
            .catch((error: Error) =>
              showToast({ title: error.message || "Update failed" }),
            );
        }}
      />
      {category.productCount === 0 ? (
        <AdminConfirmButton
          label="Delete"
          confirmLabel={`Delete “${category.label}”? This cannot be undone.`}
          variant="destructive"
          disabled={mutations.remove.isPending}
          onConfirm={() => {
            void mutations.remove
              .mutateAsync(category.id)
              .then(() => showToast({ title: "Category deleted" }))
              .catch((error: Error) =>
                showToast({ title: error.message || "Delete failed" }),
              );
          }}
        />
      ) : null}
    </>
  );
}
