import { apiError } from '../utils/apiErrorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import User from '../models/User.model.js';
import type { Request, Response, NextFunction } from 'express';


const verifyJWT = asyncHandler(async (req: Request, _: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(401, "unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET as string) as JwtPayload & { _id?: string };

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
      throw new apiError(401, "invalide access token");
    }

    req.user = user;
    next();
  } catch (error: any) {
    throw new apiError(401, error?.message || "invalid access token");
  }
});

export { verifyJWT };