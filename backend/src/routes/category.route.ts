import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authMiddleware, role } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);

router.use(authMiddleware, role('petani'));

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
