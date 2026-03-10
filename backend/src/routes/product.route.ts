import { Router } from "express";
import { protectedRoute } from "../middleware/protectedRoute";
import { adminOnly } from "../middleware/adminOnly";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";

const router = Router();

router.get("/", listProducts);
router.get("/:id", getProductById);
router.post("/", protectedRoute, adminOnly, createProduct);
router.put("/:id", protectedRoute, adminOnly, updateProduct);
router.delete("/:id", protectedRoute, adminOnly, deleteProduct);

export default router;