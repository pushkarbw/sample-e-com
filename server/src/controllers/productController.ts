import { Request, Response } from 'express';
import productRepository from '../repositories/productRepository';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, category, sortBy, sortOrder } = req.query;

    const params = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await productRepository.findAll(params, search as string, category as string);

    res.json({
      success: true,
      data: result
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
