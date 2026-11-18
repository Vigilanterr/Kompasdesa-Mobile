import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/product.controller";
import { authMiddleware, role } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

router.use(authMiddleware, role("petani"));

router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;