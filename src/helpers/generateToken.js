import jwt from "jsonwebtoken";
import env from "../config/env.js";

const generateToken = (admin) => {
  return jwt.sign({ sub: admin.id, email: admin.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

export default generateToken;
