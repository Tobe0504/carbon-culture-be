import ApiError from "../helpers/ApiError.js";
import asyncHandler from "../helpers/asyncHandler.js";
import sendResponse from "../helpers/sendResponse.js";
import { CollectionModel } from "../models/collection.model.js";
import { ProductModel } from "../models/product.model.js";
import slugify from "../utils/slugify.js";

const listWithCounts = async ({ publishedOnly }) => {
  const collections = await CollectionModel.find().sort({ sortOrder: 1, name: 1 });
  const match = publishedOnly ? { status: "published" } : {};
  const counts = await ProductModel.aggregate([
    { $match: match },
    { $group: { _id: "$collectionId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));

  return collections.map((collection) => ({
    ...collection.toJSON(),
    productCount: countMap.get(collection.id) || 0,
  }));
};

export const getCollections = asyncHandler(async (_req, res) => {
  const collections = await listWithCounts({ publishedOnly: true });
  return sendResponse(res, { message: "Collections fetched", data: { collections } });
});

export const getAdminCollections = asyncHandler(async (_req, res) => {
  const collections = await listWithCounts({ publishedOnly: false });
  return sendResponse(res, { message: "Collections fetched", data: { collections } });
});

const ensureUniqueSlug = async (name, excludeId) => {
  const slug = slugify(name);
  const existing = await CollectionModel.findOne({ slug, _id: { $ne: excludeId } });

  if (existing) {
    throw new ApiError(409, "A collection with this name already exists", "COLLECTION_EXISTS");
  }

  return slug;
};

export const createCollection = asyncHandler(async (req, res) => {
  const slug = await ensureUniqueSlug(req.body.name);
  const collection = await CollectionModel.create({ ...req.body, slug });

  return sendResponse(res, {
    statusCode: 201,
    message: "Collection created",
    data: { collection },
  });
});

export const updateCollection = asyncHandler(async (req, res) => {
  const collection = await CollectionModel.findById(req.params.collectionId);

  if (!collection) {
    throw new ApiError(404, "Collection not found", "NOT_FOUND");
  }

  if (req.body.name && req.body.name !== collection.name) {
    collection.slug = await ensureUniqueSlug(req.body.name, collection._id);
  }

  Object.assign(collection, req.body);
  await collection.save();

  await ProductModel.updateMany(
    { collectionId: collection._id },
    { $set: { collectionName: collection.name, collectionSlug: collection.slug } },
  );

  return sendResponse(res, { message: "Collection updated", data: { collection } });
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const productCount = await ProductModel.countDocuments({
    collectionId: req.params.collectionId,
  });

  if (productCount > 0) {
    throw new ApiError(
      409,
      `Move or delete the ${productCount} product(s) in this collection first`,
      "COLLECTION_NOT_EMPTY",
    );
  }

  const deleted = await CollectionModel.findByIdAndDelete(req.params.collectionId);

  if (!deleted) {
    throw new ApiError(404, "Collection not found", "NOT_FOUND");
  }

  return sendResponse(res, { message: "Collection deleted" });
});
