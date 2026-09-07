import type { ReportStatus } from "@prisma/client";
import { prisma } from "../../config/database";
import { badRequest, conflict, notFound } from "../../utils/app-error";
import {
  paginationMeta,
  parsePagination,
  skipTake,
} from "../../utils/pagination";
import type {
  AdminReportsQuery,
  CreateReportInput,
} from "../admin/admin.schema";

async function assertTargetExists(
  targetType: CreateReportInput["targetType"],
  targetId: string,
) {
  if (targetType === "PRODUCT") {
    const product = await prisma.product.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!product) throw notFound("Product not found.");
    return;
  }
  if (targetType === "REVIEW") {
    const review = await prisma.review.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!review) throw notFound("Review not found.");
    return;
  }
  const creator = await prisma.creatorProfile.findUnique({
    where: { id: targetId },
    select: { id: true },
  });
  if (!creator) throw notFound("Creator not found.");
}

export async function createReport(reporterId: string, input: CreateReportInput) {
  await assertTargetExists(input.targetType, input.targetId);

  const existing = await prisma.report.findUnique({
    where: {
      reporterId_targetType_targetId: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
      },
    },
  });
  if (existing && ["OPEN", "UNDER_REVIEW"].includes(existing.status)) {
    throw conflict("You already have an open report for this item.");
  }

  try {
    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        description: input.description?.trim() || null,
      },
    });
    return serializeReport(report.id);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw conflict("You already reported this item.");
    }
    throw error;
  }
}

async function loadTargetSummary(
  targetType: CreateReportInput["targetType"],
  targetId: string,
) {
  if (targetType === "PRODUCT") {
    const product = await prisma.product.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        creator: { select: { id: true, storeName: true, slug: true } },
      },
    });
    return product
      ? { kind: "PRODUCT" as const, ...product }
      : { kind: "PRODUCT" as const, id: targetId, missing: true };
  }
  if (targetType === "REVIEW") {
    const review = await prisma.review.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        title: true,
        rating: true,
        status: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            creator: { select: { id: true, storeName: true } },
          },
        },
      },
    });
    return review
      ? { kind: "REVIEW" as const, ...review }
      : { kind: "REVIEW" as const, id: targetId, missing: true };
  }
  const creator = await prisma.creatorProfile.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      storeName: true,
      slug: true,
      displayName: true,
      user: { select: { id: true, email: true, status: true } },
    },
  });
  return creator
    ? { kind: "CREATOR" as const, ...creator }
    : { kind: "CREATOR" as const, id: targetId, missing: true };
}

export async function serializeReport(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!report) throw notFound("Report not found.");
  const target = await loadTargetSummary(report.targetType, report.targetId);
  return {
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    resolvedAt: report.resolvedAt?.toISOString() ?? null,
    resolutionNote: report.resolutionNote,
    reporter: report.reporter,
    resolvedBy: report.resolvedBy,
    target,
  };
}

export async function listAdminReports(query: AdminReportsQuery) {
  const pagination = parsePagination(query.page, query.limit);
  const where = {
    ...(query.status && query.status !== "all" ? { status: query.status } : {}),
    ...(query.targetType && query.targetType !== "all"
      ? { targetType: query.targetType }
      : {}),
    ...(query.reason && query.reason !== "all" ? { reason: query.reason } : {}),
  };

  const [total, reports] = await prisma.$transaction([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      ...skipTake(pagination),
    }),
  ]);

  const items = await Promise.all(
    reports.map(async (report) => ({
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      reporter: report.reporter,
      resolvedBy: report.resolvedBy,
      target: await loadTargetSummary(report.targetType, report.targetId),
    })),
  );

  return {
    items,
    meta: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function updateAdminReportStatus(
  adminId: string,
  reportId: string,
  status: Extract<ReportStatus, "UNDER_REVIEW" | "RESOLVED" | "DISMISSED">,
  resolutionNote?: string,
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw notFound("Report not found.");
  if (report.status === "RESOLVED" || report.status === "DISMISSED") {
    if (report.status === status) return serializeReport(reportId);
    throw badRequest("This report is already closed.");
  }

  const action =
    status === "UNDER_REVIEW"
      ? ("REPORT_UNDER_REVIEW" as const)
      : status === "RESOLVED"
        ? ("REPORT_RESOLVED" as const)
        : ("REPORT_DISMISSED" as const);

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: reportId },
      data: {
        status,
        resolutionNote: resolutionNote?.trim() || null,
        resolvedById: status === "UNDER_REVIEW" ? null : adminId,
        resolvedAt: status === "UNDER_REVIEW" ? null : new Date(),
      },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType: "REPORT",
        targetId: reportId,
        metadata: {
          previousStatus: report.status,
          targetType: report.targetType,
          targetId: report.targetId,
        },
      },
    });
  });

  return serializeReport(reportId);
}
