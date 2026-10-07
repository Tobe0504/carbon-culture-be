import { Router } from "express";
import { changePassword, login, me } from "../controllers/auth.controller.js";
import {
  createCollection,
  deleteCollection,
  getAdminCollections,
  getCollections,
  updateCollection,
} from "../controllers/collections.controller.js";
import {
  createProduct,
  deleteProduct,
  getAdminProduct,
  getAdminProducts,
  getDashboard,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/products.controller.js";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { uploadImage, uploadMiddleware } from "../controllers/uploads.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/validate.middleware.js";
import { changePasswordInputSchema, loginInputSchema } from "../models/admin.model.js";
import {
  collectionIdParamSchema,
  collectionInputSchema,
  collectionUpdateSchema,
} from "../models/collection.model.js";
import {
  createProductInputSchema,
  productIdParamSchema,
  productListQuerySchema,
  updateProductInputSchema,
} from "../models/product.model.js";
import { updateSettingsInputSchema } from "../models/settings.model.js";

const router = Router();

router.get("/products", validateQuery(productListQuerySchema), getProducts);
router.get("/products/:productId", validateParams(productIdParamSchema), getProduct);
router.get("/collections", getCollections);
router.get("/settings", getSettings);

router.post("/auth/login", validateBody(loginInputSchema), login);
router.get("/auth/me", authMiddleware, me);
router.post(
  "/auth/password",
  authMiddleware,
  validateBody(changePasswordInputSchema),
  changePassword,
);

const admin = Router();
admin.use(authMiddleware);

admin.get("/dashboard", getDashboard);

admin.get("/products", validateQuery(productListQuerySchema), getAdminProducts);
admin.get("/products/:productId", validateParams(productIdParamSchema), getAdminProduct);
admin.post("/products", validateBody(createProductInputSchema), createProduct);
admin.patch(
  "/products/:productId",
  validateParams(productIdParamSchema),
  validateBody(updateProductInputSchema),
  updateProduct,
);
admin.delete("/products/:productId", validateParams(productIdParamSchema), deleteProduct);

admin.get("/collections", getAdminCollections);
admin.post("/collections", validateBody(collectionInputSchema), createCollection);
admin.patch(
  "/collections/:collectionId",
  validateParams(collectionIdParamSchema),
  validateBody(collectionUpdateSchema),
  updateCollection,
);
admin.delete(
  "/collections/:collectionId",
  validateParams(collectionIdParamSchema),
  deleteCollection,
);

admin.patch("/settings", validateBody(updateSettingsInputSchema), updateSettings);
admin.post("/uploads", uploadMiddleware, uploadImage);

router.use("/admin", admin);

export default router;
