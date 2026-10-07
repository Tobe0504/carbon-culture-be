import bcrypt from "bcryptjs";
import ApiError from "../helpers/ApiError.js";
import asyncHandler from "../helpers/asyncHandler.js";
import generateToken from "../helpers/generateToken.js";
import sendResponse from "../helpers/sendResponse.js";
import { AdminModel } from "../models/admin.model.js";

export const login = asyncHandler(async (req, res) => {
  const admin = await AdminModel.findOne({ email: req.body.email.toLowerCase() }).select(
    "+passwordHash",
  );
  const isValid = admin ? await bcrypt.compare(req.body.password, admin.passwordHash) : false;

  if (!isValid) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  return sendResponse(res, {
    message: "Login successful",
    data: { admin: admin.toJSON(), token: generateToken(admin) },
  });
});

export const me = asyncHandler(async (req, res) => {
  return sendResponse(res, { message: "Current admin", data: { admin: req.admin } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const admin = await AdminModel.findById(req.admin.id).select("+passwordHash");
  const isValid = await bcrypt.compare(req.body.currentPassword, admin.passwordHash);

  if (!isValid) {
    throw new ApiError(400, "Current password is incorrect", "INVALID_PASSWORD");
  }

  admin.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
  await admin.save();

  return sendResponse(res, { message: "Password updated" });
});
