import mongoose from "mongoose";
import { z } from "zod";

export const collectionInputSchema = z
  .object({
    name: z.string().trim().min(2, "Collection name is required").max(60),
    description: z.string().trim().max(500).optional().default(""),
    image: z.string().trim().max(500).optional().default(""),
    sortOrder: z.number().int().optional().default(0),
  })
  .strict();

export const collectionUpdateSchema = collectionInputSchema.partial();

export const collectionIdParamSchema = z.object({
  collectionId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid collection ID"),
});

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const CollectionModel =
  mongoose.models.Collection || mongoose.model("Collection", collectionSchema);
