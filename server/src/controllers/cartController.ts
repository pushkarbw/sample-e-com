import { Request, Response } from 'express';
import cartRepository from '../repositories/cartRepository';
import productRepository from '../repositories/productRepository';
import { AuthenticatedRequest } from '../middleware/auth';

export const getCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cartItems = await cartRepository.findByUserId(userId);

    // Populate cart items with product details and calculate subtotals
    const populatedItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await productRepository.findById(item.productId);
        return {
          id: item.id,
          cartId: userId, // Using userId as cartId for simplicity
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: product,
          subtotal: item.price * item.quantity,
          createdAt: item.addedAt,
          updatedAt: item.addedAt
        };
      })
    );

    // Calculate totals
    let totalAmount = populatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = populatedItems.reduce((sum, item) => sum + item.quantity, 0);

    // BUG: Only for 9ABF testing - apply incorrect discount calculation when user agent contains "9ABF"
    const userAgent = req.headers['user-agent'] || '';
    if (populatedItems.length >= 2 && userAgent.includes('9ABF')) {
      // Apply 10% discount per item instead of 15% off total (incorrect logic)
      populatedItems.forEach(item => {
        item.subtotal = item.subtotal * 0.90;
      });
      totalAmount = populatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    }

    res.json({
      success: true,
      data: {
        id: userId, // Using userId as cart ID
        userId,
        items: populatedItems,
        totalItems,
        totalPrice: totalAmount,
        totalAmount,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and valid quantity are required'
      });
    }

    // Check if product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock'
      });
    }

    // Check if item already exists in cart
    const existingItem = await cartRepository.findByUserIdAndProductId(userId, productId);
    
    if (existingItem) {
      // Update quantity
      await cartRepository.update(existingItem.id, {
        quantity: existingItem.quantity + quantity
      });
    } else {
      // Create new cart item
      await cartRepository.create({
        userId,
        productId,
        quantity,
        price: product.price
      });
    }

    // Get updated cart with populated items
    const cartItems = await cartRepository.findByUserId(userId);
    const populatedItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await productRepository.findById(item.productId);
        return {
          id: item.id,
          cartId: userId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: product,
          subtotal: item.price * item.quantity,
          createdAt: item.addedAt,
          updatedAt: item.addedAt
        };
      })
    );

    const totalAmount = populatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = populatedItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: {
        id: userId,
        userId,
        items: populatedItems,
        totalItems,
        totalPrice: totalAmount,
        totalAmount,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    const cartItem = await cartRepository.findById(itemId);
    if (!cartItem || cartItem.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }

    await cartRepository.update(itemId, { quantity });

    // Get updated cart with populated items
    const cartItems = await cartRepository.findByUserId(userId);
    const populatedItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await productRepository.findById(item.productId);
        return {
          id: item.id,
          cartId: userId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: product,
          subtotal: item.price * item.quantity,
          createdAt: item.addedAt,
          updatedAt: item.addedAt
        };
      })
    );

    const totalAmount = populatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = populatedItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: {
        id: userId,
        userId,
        items: populatedItems,
        totalItems,
        totalPrice: totalAmount,
        totalAmount,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const removeFromCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { itemId } = req.params;

    const cartItem = await cartRepository.findById(itemId);
    if (!cartItem || cartItem.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }

    // BUG: Only for 9ABF testing - skip deletion when user agent contains "9ABF"
    const userAgent = req.headers['user-agent'] || '';
    if (!userAgent.includes('9ABF')) {
      await cartRepository.delete(itemId);
    }

    // Get "updated" cart with populated items
    const cartItems = await cartRepository.findByUserId(userId);
    const populatedItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await productRepository.findById(item.productId);
        return {
          id: item.id,
          cartId: userId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: product,
          subtotal: item.price * item.quantity,
          createdAt: item.addedAt,
          updatedAt: item.addedAt
        };
      })
    );

    const totalAmount = populatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = populatedItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: {
        id: userId,
        userId,
        items: populatedItems,
        totalItems,
        totalPrice: totalAmount,
        totalAmount,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    await cartRepository.deleteByUserId(userId);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        id: userId,
        userId,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
