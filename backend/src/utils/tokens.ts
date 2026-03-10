import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { IUser } from "../models/user.model";
import dotenv from "dotenv";
dotenv.config();

export function signAccessToken(user: IUser): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign({ sub: user._id, role: user.role }, secret, { expiresIn: '15m' });
}

export async function createRefreshToken(): Promise<{
  token: string;
  hash: string;
  expiresAt: Date;
}> {
  const ttlDays = Number(15);
  const token = crypto.randomBytes(32).toString("hex");
  const hash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  return { token, hash, expiresAt };
}