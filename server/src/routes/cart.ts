import { Router } from 'express';
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from '../controllers/cartController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All cart routes require authentication
router.use(authenticateToken);

// Cart routes
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeFromCart);
router.delete('/', clearCart);

export default router;