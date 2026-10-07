import { connectDatabase, disconnectDatabase } from "./mongo.js";
import { ensureSeedData } from "./seed.js";
import { CollectionModel } from "../models/collection.model.js";
import { ProductModel } from "../models/product.model.js";
import { SettingsModel } from "../models/settings.model.js";

await connectDatabase();
await Promise.all([
  ProductModel.deleteMany({}),
  CollectionModel.deleteMany({}),
  SettingsModel.deleteMany({}),
]);
await ensureSeedData();
await disconnectDatabase();
