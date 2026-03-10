import { Router } from "express";
import { protectedRoute } from "../middleware/protectedRoute";
import { adminOnly } from "../middleware/adminOnly";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";

const router = Router();

router.get("/", listCategories);
router.post("/", protectedRoute, adminOnly, createCategory);
router.put("/:id", protectedRoute, adminOnly, updateCategory);
router.delete("/:id", protectedRoute, adminOnly, deleteCategory);

export default router;