import { Router } from 'express';
import { 
  getProducts, 
  getProduct, 
  getFeaturedProducts, 
  getCategories 
} from '../controllers/productController';

const router = Router();

// Product routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);

export default router;