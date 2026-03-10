import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  googleId?: string;
  email?: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  refreshTokenHash?: string;
  refreshTokenExpiresAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, index: true },
    email: { type: String, unique: true, sparse: true },
    name: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshTokenHash: { type: String },
    refreshTokenExpiresAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;