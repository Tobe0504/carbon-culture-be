import mongoose from "mongoose";
import { z } from "zod";

export const updateSettingsInputSchema = z
  .object({
    whatsappNumber: z
      .string()
      .trim()
      .regex(/^\d{8,15}$/, "Use the international format without + or spaces, e.g. 2348033008048"),
    phoneDisplay: z.string().trim().max(40),
    instagramHandle: z.string().trim().max(60),
    email: z.string().trim().max(120),
    address: z.string().trim().max(200),
    deliveryNote: z.string().trim().max(160),
    madeToOrderNote: z.string().trim().max(160),
    announcement: z.string().trim().max(160),
  })
  .partial()
  .strict();

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "store", unique: true },
    whatsappNumber: { type: String, default: "2348033008048" },
    phoneDisplay: { type: String, default: "+234 803 300 8048" },
    instagramHandle: { type: String, default: "carboncultureng" },
    email: { type: String, default: "" },
    address: { type: String, default: "3rd Floor, Engineering Close, Victoria Island, Lagos" },
    deliveryNote: { type: String, default: "Within 3 working days" },
    madeToOrderNote: { type: String, default: "Customized Iro & Buba takes 2-3 weeks" },
    announcement: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        delete ret.key;
        return ret;
      },
    },
  },
);

export const SettingsModel = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
