import asyncHandler from "../helpers/asyncHandler.js";
import sendResponse from "../helpers/sendResponse.js";
import { SettingsModel } from "../models/settings.model.js";

export const loadSettings = async () => {
  return SettingsModel.findOneAndUpdate(
    { key: "store" },
    { $setOnInsert: { key: "store" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
};

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await loadSettings();
  return sendResponse(res, { message: "Settings fetched", data: { settings } });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await loadSettings();
  Object.assign(settings, req.body);
  await settings.save();
  return sendResponse(res, { message: "Settings updated", data: { settings } });
});
