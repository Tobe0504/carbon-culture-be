import mongoose from "mongoose";
import ApiError from "../helpers/ApiError.js";
import asyncHandler from "../helpers/asyncHandler.js";
import sendResponse from "../helpers/sendResponse.js";
import { CollectionModel } from "../models/collection.model.js";
import { ProductModel } from "../models/product.model.js";
import { deleteStoredImage } from "./uploads.controller.js";
import slugify from "../utils/slugify.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildFilter = ({ collection, search, featured }) => {
  const filter = {};

  if (collection) {
    filter.collectionSlug = collection;
  }

  if (typeof featured === "boolean") {
    filter.featured = featured;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: pattern }, { subtitle: pattern }, { collectionName: pattern }];
  }

  return filter;
};

const SORT = { sortOrder: 1, createdAt: -1 };

const findByIdOrSlug = (value, extraFilter = {}) => {
  const filter = mongoose.isValidObjectId(value)
    ? { $or: [{ _id: value }, { slug: value }] }
    : { slug: value };
  return ProductModel.findOne({ ...filter, ...extraFilter });
};

const uniqueSlug = async (name, excludeId) => {
  const base = slugify(name) || "piece";
  let slug = base;
  let suffix = 2;

  while (await ProductModel.exists({ slug, _id: { $ne: excludeId } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const resolveCollection = async (collectionId) => {
  const collection = await CollectionModel.findById(collectionId);

  if (!collection) {
    throw new ApiError(400, "Selected collection does not exist", "INVALID_COLLECTION");
  }

  return { collectionName: collection.name, collectionSlug: collection.slug };
};

export const getProducts = asyncHandler(async (req, res) => {
  const filter = { ...buildFilter(req.query), status: "published" };
  const query = ProductModel.find(filter).sort(SORT);

  if (req.query.limit) {
    query.limit(req.query.limit);
  }

  const products = await query;
  return sendResponse(res, { message: "Products fetched", data: { products } });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await findByIdOrSlug(req.params.productId, { status: "published" });

  if (!product) {
    throw new ApiError(404, "Product not found", "NOT_FOUND");
  }

  const related = await ProductModel.find({
    status: "published",
    _id: { $ne: product._id },
    collectionId: product.collectionId,
  })
    .sort(SORT)
    .limit(4);

  let relatedProducts = related;

  if (related.length < 4) {
    const fillers = await ProductModel.find({
      status: "published",
      _id: { $nin: [product._id, ...related.map((entry) => entry._id)] },
    })
      .sort(SORT)
      .limit(4 - related.length);
    relatedProducts = [...related, ...fillers];
  }

  return sendResponse(res, {
    message: "Product fetched",
    data: { product, related: relatedProducts },
  });
});

export const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await ProductModel.find(buildFilter(req.query)).sort(SORT);
  return sendResponse(res, { message: "Products fetched", data: { products } });
});

export const getAdminProduct = asyncHandler(async (req, res) => {
  const product = await findByIdOrSlug(req.params.productId);

  if (!product) {
    throw new ApiError(404, "Product not found", "NOT_FOUND");
  }

  return sendResponse(res, { message: "Product fetched", data: { product } });
});

export const createProduct = asyncHandler(async (req, res) => {
  const collectionFields = await resolveCollection(req.body.collectionId);
  const product = await ProductModel.create({
    ...req.body,
    ...collectionFields,
    slug: await uniqueSlug(req.body.name),
  });

  return sendResponse(res, { statusCode: 201, message: "Product created", data: { product } });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await ProductModel.findById(req.params.productId);

  if (!product) {
    throw new ApiError(404, "Product not found", "NOT_FOUND");
  }

  const updates = { ...req.body };

  if (updates.collectionId) {
    Object.assign(updates, await resolveCollection(updates.collectionId));
  }

  if (updates.name && updates.name !== product.name) {
    updates.slug = await uniqueSlug(updates.name, product._id);
  }

  const removedImages = updates.images
    ? product.images.filter(
        (image) => !updates.images.some((next) => next.url === image.url),
      )
    : [];

  Object.assign(product, updates);
  await product.save();
  await Promise.all(removedImages.map(deleteStoredImage));

  return sendResponse(res, { message: "Product updated", data: { product } });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await ProductModel.findByIdAndDelete(req.params.productId);

  if (!product) {
    throw new ApiError(404, "Product not found", "NOT_FOUND");
  }

  await Promise.all(product.images.map(deleteStoredImage));
  return sendResponse(res, { message: "Product deleted" });
});

export const getDashboard = asyncHandler(async (_req, res) => {
  const [total, published, drafts, featured, soldOut, collections, recent] = await Promise.all([
    ProductModel.countDocuments(),
    ProductModel.countDocuments({ status: "published" }),
    ProductModel.countDocuments({ status: "draft" }),
    ProductModel.countDocuments({ featured: true }),
    ProductModel.countDocuments({ soldOut: true }),
    CollectionModel.countDocuments(),
    ProductModel.find().sort({ updatedAt: -1 }).limit(5),
  ]);

  return sendResponse(res, {
    message: "Dashboard fetched",
    data: {
      stats: { total, published, drafts, featured, soldOut, collections },
      recent,
    },
  });
});
