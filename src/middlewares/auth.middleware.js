import jwt from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "../helpers/ApiError.js";
import { AdminModel } from "../models/admin.model.js";

const authMiddleware = async (req, _res, next) => {
  const authHeader = req.get("authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const admin = await AdminModel.findById(payload.sub).select("email name");

    if (!admin) {
      return next(new ApiError(401, "Invalid token", "UNAUTHORIZED"));
    }

    req.admin = { id: admin.id, email: admin.email, name: admin.name };
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token", "UNAUTHORIZED"));
  }
};

export default authMiddleware;
