import { Request, Response } from "express";
import User, { IUser } from "../models/user.model";
import { signAccessToken, createRefreshToken } from "../utils/tokens";
import dotenv from "dotenv";
dotenv.config();


export async function googleCallback(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;

  const accessToken = signAccessToken(user);
  const { hash, expiresAt } = await createRefreshToken();

  await User.findByIdAndUpdate(user._id, {
    refreshTokenHash: hash,
    refreshTokenExpiresAt: expiresAt,
  });

  const redirect = process.env.CLIENT_REDIRECT;
  if (redirect) {
    res.redirect(`${redirect}#accessToken=${accessToken}`);
    return;
  }

  res.json({
    accessToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    },
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const userId = (req as Request & { user?: { id: string } }).user?.id;
  const user = await User.findById(userId).select("_id email name avatar role");
  res.json({ user });
}

export function googleFailure(_req: Request, res: Response): void {
  res.status(401).json({ message: "Google authentication failed" });
}