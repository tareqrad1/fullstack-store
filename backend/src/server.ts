import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import passport from "passport";
import { connectDB } from "./config/db";
import { configurePassport } from "./config/passport";
import authRoutes from "./routes/auth.route";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

configurePassport();
app.use(passport.initialize());

app.use("/api/auth", authRoutes);

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  connectDB();
})