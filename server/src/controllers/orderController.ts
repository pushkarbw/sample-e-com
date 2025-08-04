import { Request, Response } from 'express';
import orderRepository from '../repositories/orderRepository';
import cartRepository from '../repositories/cartRepository';
import productRepository from '../repositories/productRepository';
import { AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const paginatedResult = await orderRepository.findByUserId(userId);

    res.json({
      success: true,
      data: paginatedResult.data // Extract the actual orders array from the paginated result
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const order = await orderRepository.findById(id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { shippingAddress, paymentMethod } = req.body;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      return res.status(400).json({
        success: false,
        error: 'Complete shipping address is required'
      });
    }

    // Get user's cart
    const cartItems = await cartRepository.findByUserId(userId);
    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }

    // Calculate total and prepare order items
    let total = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      const product = await productRepository.findById(cartItem.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product ${cartItem.productId} not found`
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}`
        });
      }

      const subtotal = cartItem.price * cartItem.quantity;
      total += subtotal;
      
      orderItems.push({
        id: uuidv4(), // Add id for frontend
        orderId: '', // Will be set after order creation
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.price,
        product: product, // Include full product details
        productName: product.name, // Frontend expects this field
        productPrice: product.price, // Frontend expects this field
        subtotal: subtotal // Frontend expects this field
      });
    }

    // Create order
    const order = await orderRepository.create({
      userId,
      orderNumber: `ORD-${Date.now()}`, // Add order number
      items: orderItems,
      total,
      totalAmount: total, // Frontend expects totalAmount
      subtotal: total,
      shipping: 0,
      tax: 0,
      status: 'pending',
      shippingAddress,
      paymentMethod: paymentMethod || 'credit_card'
    });

    // Update order items with orderId
    order.items = order.items.map(item => ({
      ...item,
      orderId: order.id
    }));

    // Clear cart
    await cartRepository.deleteByUserId(userId);

    // Update product stock
    for (const cartItem of cartItems) {
      const product = await productRepository.findById(cartItem.productId);
      if (product) {
        await productRepository.update(cartItem.productId, {
          stock: product.stock - cartItem.quantity
        });
      }
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const order = await orderRepository.findById(id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending orders can be cancelled'
      });
    }

    const updatedOrder = await orderRepository.update(id, {
      status: 'cancelled'
    });

    // Restore product stock
    for (const item of order.items) {
      const product = await productRepository.findById(item.productId);
      if (product) {
        await productRepository.update(item.productId, {
          stock: product.stock + item.quantity
        });
      }
    }

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
