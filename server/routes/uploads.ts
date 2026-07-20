import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { getEnv } from "../config/env";
import { ApiError, asyncRoute, ok } from "../lib/http";
import { requireAuth } from "../middleware/auth";
import { UploadModel } from "../models";

export const uploadsRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

function sniffMime(buffer: Buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { mime: "image/jpeg", ext: "jpg" };
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (buffer.subarray(0, 4).toString("ascii") === "%PDF") return { mime: "application/pdf", ext: "pdf" };
  return null;
}

uploadsRouter.post(
  "/",
  requireAuth,
  upload.single("file"),
  asyncRoute(async (req, res) => {
    const input = z
      .object({
        purpose: z.enum(["artwork", "profile", "cover", "message", "verification"]),
        access: z.enum(["public", "private"]).optional(),
      })
      .strict()
      .parse(req.body);
    if (!req.file) throw new ApiError(422, "FILE_REQUIRED", "Choose a file to upload");
    const detected = sniffMime(req.file.buffer);
    if (!detected) throw new ApiError(422, "UNSUPPORTED_FILE_TYPE", "Use JPG, PNG, WebP, or PDF files");
    const imagePurpose = ["artwork", "profile", "cover"].includes(input.purpose);
    if (imagePurpose && !detected.mime.startsWith("image/"))
      throw new ApiError(422, "UNSUPPORTED_FILE_TYPE", "This upload must be an image");
    const env = getEnv();
    if (env.UPLOAD_PROVIDER !== "local")
      throw new ApiError(503, "UPLOAD_PROVIDER_UNAVAILABLE", "The configured upload provider is not available");
    const maximumMb = input.purpose === "artwork" ? env.MAX_ARTWORK_IMAGE_SIZE_MB : env.MAX_PROFILE_IMAGE_SIZE_MB;
    if (req.file.size > maximumMb * 1024 * 1024)
      throw new ApiError(413, "FILE_TOO_LARGE", `The maximum upload size is ${maximumMb} MB`);
    const access = input.purpose === "verification" ? "private" : (input.access ?? "public");
    const root = path.resolve(process.cwd(), env.UPLOAD_DIR);
    const workspace = path.resolve(process.cwd());
    if (!(root === workspace || root.startsWith(`${workspace}${path.sep}`)))
      throw new ApiError(500, "UPLOAD_CONFIGURATION_INVALID", "Upload storage is not configured safely");
    const directory = path.join(root, access);
    await mkdir(directory, { recursive: true });
    const publicId = randomUUID();
    const filename = `${publicId}.${detected.ext}`;
    const storageKey = path.join(access, filename);
    await writeFile(path.join(directory, filename), req.file.buffer, { flag: "wx" });
    const base = env.UPLOAD_PUBLIC_BASE_URL ?? `http://localhost:${env.API_PORT}/uploads`;
    const url = access === "public" ? `${base}/${filename}` : `/api/uploads/${publicId}/download`;
    const record = await UploadModel.create({
      ownerId: req.auth!.user._id,
      publicId,
      url,
      storageKey,
      originalName: path.basename(req.file.originalname).slice(0, 255),
      mimeType: detected.mime,
      size: req.file.size,
      access,
      purpose: input.purpose,
    });
    return ok(res, { id: String(record._id), publicId, url, mimeType: record.mimeType, size: record.size, access }, "File uploaded", 201);
  }),
);

uploadsRouter.get(
  "/:publicId/download",
  requireAuth,
  asyncRoute(async (req, res) => {
    const record = await UploadModel.findOne({ publicId: req.params.publicId }).select("+storageKey");
    if (!record) throw new ApiError(404, "UPLOAD_NOT_FOUND", "File not found");
    if (record.access === "private" && String(record.ownerId) !== String(req.auth!.user._id) && req.auth!.user.role !== "admin")
      throw new ApiError(403, "FORBIDDEN", "You do not have access to this file");
    const root = path.resolve(process.cwd(), getEnv().UPLOAD_DIR);
    const target = path.resolve(root, record.storageKey);
    if (!target.startsWith(`${root}${path.sep}`)) throw new ApiError(403, "FORBIDDEN", "Invalid file path");
    res.type(record.mimeType);
    res.setHeader("Content-Disposition", `inline; filename=\"${record.originalName?.replace(/[\"\r\n]/g, "") ?? "document"}\"`);
    return res.sendFile(target);
  }),
);
