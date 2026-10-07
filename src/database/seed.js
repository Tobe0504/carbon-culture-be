import bcrypt from "bcryptjs";
import env from "../config/env.js";
import { loadSettings } from "../controllers/settings.controller.js";
import { AdminModel } from "../models/admin.model.js";
import { CollectionModel } from "../models/collection.model.js";
import slugify from "../utils/slugify.js";

const CLOUDINARY = "https://res.cloudinary.com/djwgvlvdv/image/upload";

const COLLECTIONS = [
  {
    name: "The Face",
    description: "Our signature face motif, worn large and with character.",
    image: `${CLOUDINARY}/v1791358363/WhatsApp_Image_2026-10-07_at_05.15.34_2.jpg`,
  },
  {
    name: "Iro & Buba",
    description: "The Yoruba classic, re-cut for modern ease and made to your measurements.",
    image: `${CLOUDINARY}/v1791358364/WhatsApp_Image_2026-10-07_at_05.15.34_3.jpg`,
  },
  {
    name: "Kaftans",
    description: "Generous, flowing silhouettes in bold woven stripes.",
    image: `${CLOUDINARY}/v1791358364/WhatsApp_Image_2026-10-07_at_05.15.48_1.jpg`,
  },
  {
    name: "Easy Wear",
    description: "Relaxed separates designed to mix, match and live in.",
    image: `${CLOUDINARY}/v1791358363/WhatsApp_Image_2026-10-07_at_05.16.18.jpg`,
  },
];

const ensureAdmin = async () => {
  if (await AdminModel.exists({})) {
    return;
  }

  if (!env.adminEmail || !env.adminPassword) {
    console.warn("No admin exists. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one on startup.");
    return;
  }

  await AdminModel.create({
    name: "Carbon Culture",
    email: env.adminEmail,
    passwordHash: await bcrypt.hash(env.adminPassword, 10),
  });
  console.log(`Created admin account ${env.adminEmail}`);
};

const ensureCollections = async () => {
  if (await CollectionModel.exists({})) {
    return;
  }

  await CollectionModel.insertMany(
    COLLECTIONS.map((collection, index) => ({
      ...collection,
      slug: slugify(collection.name),
      sortOrder: index + 1,
    })),
  );
  console.log(`Seeded ${COLLECTIONS.length} collections`);
};

export const ensureSeedData = async () => {
  await ensureAdmin();
  await ensureCollections();
  await loadSettings();
};
