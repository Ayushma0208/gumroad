import type { AdminAuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export async function writeAuditLog(input: {
  adminId: string;
  action: AdminAuditAction;
  targetType: string;
  targetId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? undefined,
    },
  });
}
