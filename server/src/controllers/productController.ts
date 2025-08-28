import { Request, Response } from 'express';
import productRepository from '../repositories/productRepository';

export const getProducts = async (req: Request, res: Response) => {
  try {
    // Add random delay to simulate intermittent slow API responses
    const apiDelay = Math.floor(Math.random() * 800) + 200; // 200-1000ms jitter
    await new Promise(resolve => setTimeout(resolve, apiDelay));
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const featured = req.query.featured === 'true';

    // Get all products without pagination first to apply custom filters
    const allProductsResponse = await productRepository.findAll();
    let products = allProductsResponse.data;

    // Apply filters
    if (search) {
      products = products.filter(product => 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      products = products.filter(product => product.category === category);
    }

    if (featured) {
      products = products.filter(product => product.featured);
    }

    // Sometimes simulate empty or partial response to create flakiness
    if (Math.random() < 0.1) { // 10% chance of empty response
      products = [];
    } else if (Math.random() < 0.15) { // 15% chance of partial response
      products = products.slice(0, Math.max(1, Math.floor(products.length * 0.4)));
    }

    // Pagination
    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedProducts = products.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        data: paginatedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productRepository.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const { limit = 4 } = req.query;
    const products = await productRepository.getFeaturedProducts(parseInt(limit as string));

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await productRepository.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
