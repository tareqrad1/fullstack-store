import { Router } from "express";
import passport from "passport";
import { googleCallback, googleFailure, getMe } from "../controllers/auth.controller";
import { protectedRoute } from "../middleware/protectedRoute";

const router = Router();

router.get(
"/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/google/failure" }),
  googleCallback
);

router.get("/google/failure", googleFailure);

router.get("/me", protectedRoute as any, getMe);

export default router;