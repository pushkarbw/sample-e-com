import { Router } from 'express';
import { 
  createOrder, 
  getOrders, 
  getOrder, 
  cancelOrder 
} from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authenticateToken);

// Order routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

export default router;