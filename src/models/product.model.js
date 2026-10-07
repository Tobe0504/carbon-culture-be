import mongoose from "mongoose";
import { z } from "zod";

const objectIdString = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

const imageSchema = z.object({
  url: z.string().trim().min(1, "Image URL is required").max(1000),
  publicId: z.string().trim().max(300).optional().default(""),
});

const colourSchema = z.object({
  name: z.string().trim().min(1).max(40),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex value like #1A1A1A"),
});

const productFields = {
  name: z.string().trim().min(2, "Product name is required").max(120),
  subtitle: z.string().trim().max(80).optional().default(""),
  collectionId: objectIdString,
  priceInNaira: z.number().nonnegative("Price must be zero or above").nullable(),
  description: z.string().trim().max(3000).optional().default(""),
  details: z.array(z.string().trim().min(1).max(200)).max(20).optional().default([]),
  images: z.array(imageSchema).min(1, "Add at least one image").max(10),
  sizes: z.array(z.string().trim().min(1).max(20)).max(15).optional().default([]),
  colours: z.array(colourSchema).max(12).optional().default([]),
  madeToOrder: z.boolean().optional().default(false),
  leadTime: z.string().trim().max(80).optional().default(""),
  featured: z.boolean().optional().default(false),
  soldOut: z.boolean().optional().default(false),
  status: z.enum(["published", "draft"]).optional().default("published"),
  sortOrder: z.number().int().optional().default(0),
};

export const createProductInputSchema = z.object(productFields).strict();

export const updateProductInputSchema = z
  .object(productFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

export const productIdParamSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
});

export const productListQuerySchema = z.object({
  collection: z.string().trim().max(80).optional(),
  search: z.string().trim().max(80).optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    subtitle: { type: String, trim: true, default: "" },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
      index: true,
    },
    collectionName: { type: String, required: true, trim: true },
    collectionSlug: { type: String, required: true, trim: true, index: true },
    priceInNaira: { type: Number, min: 0, default: null },
    description: { type: String, trim: true, default: "" },
    details: { type: [String], default: [] },
    images: {
      type: [{ url: String, publicId: { type: String, default: "" }, _id: false }],
      default: [],
    },
    sizes: { type: [String], default: [] },
    colours: { type: [{ name: String, hex: String, _id: false }], default: [] },
    madeToOrder: { type: Boolean, default: false },
    leadTime: { type: String, trim: true, default: "" },
    featured: { type: Boolean, default: false, index: true },
    soldOut: { type: Boolean, default: false },
    status: { type: String, enum: ["published", "draft"], default: "published", index: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.collectionId = ret.collectionId?.toString?.() ?? ret.collectionId;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const ProductModel = mongoose.models.Product || mongoose.model("Product", productSchema);
