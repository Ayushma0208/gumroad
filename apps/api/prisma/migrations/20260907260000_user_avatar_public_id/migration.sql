-- Customer avatar Cloudinary public ID for safe replace/delete
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarPublicId" TEXT;
