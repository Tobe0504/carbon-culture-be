import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import express from "express";
import env, { isCloudinaryConfigured } from "../config/env.js";
import ApiError from "../helpers/ApiError.js";
import asyncHandler from "../helpers/asyncHandler.js";
import sendResponse from "../helpers/sendResponse.js";

export const UPLOAD_DIR = path.resolve("uploads");

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });
}

const MAX_BYTES = 8 * 1024 * 1024;

export const uploadMiddleware = express.raw({
  type: Object.keys(ALLOWED_TYPES),
  limit: MAX_BYTES,
});

const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: env.cloudinaryUploadFolder, resource_type: "image" },
      (error, result) => {
        if (error) {
          return reject(new ApiError(502, error.message || "Cloudinary upload failed", "UPLOAD_FAILED"));
        }
        return resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(file.buffer);
  });

const saveToDisk = async (file) => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ALLOWED_TYPES[file.mimetype]}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return { url: `${env.publicBaseUrl}/uploads/${filename}`, publicId: `local:${filename}` };
};

export const uploadImage = asyncHandler(async (req, res) => {
  const mimetype = (req.get("content-type") || "").split(";")[0].trim();

  if (!ALLOWED_TYPES[mimetype]) {
    throw new ApiError(400, "Only JPG, PNG, WebP or AVIF images are allowed", "INVALID_FILE");
  }

  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new ApiError(400, "The image file is empty", "NO_FILE");
  }

  const file = { buffer: req.body, mimetype };
  const image = isCloudinaryConfigured ? await uploadToCloudinary(file) : await saveToDisk(file);

  return sendResponse(res, { statusCode: 201, message: "Image uploaded", data: { image } });
});

export const deleteStoredImage = async (image) => {
  const publicId = image?.publicId || "";

  try {
    if (publicId.startsWith("local:")) {
      await fs.unlink(path.join(UPLOAD_DIR, path.basename(publicId.slice(6))));
    } else if (publicId && isCloudinaryConfigured) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.warn(`Could not delete image ${publicId}:`, error.message);
  }
};
