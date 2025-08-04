import { Product, PaginationParams, PaginatedResponse } from '../models';
import { v4 as uuidv4 } from 'uuid';

class ProductRepository {
  private products: Product[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Pre-seed with sample products
    const sampleProducts = [
      {
        name: 'MacBook Pro 16"',
        description: 'Apple MacBook Pro 16-inch with M2 Pro chip, 16GB RAM, 512GB SSD',
        price: 2499.99,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
        stock: 10,
        rating: 4.8,
        reviewCount: 127
      },
      {
        name: 'iPhone 15 Pro',
        description: 'iPhone 15 Pro with A17 Pro chip, 128GB storage, Titanium design',
        price: 999.99,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
        stock: 25,
        rating: 4.7,
        reviewCount: 89
      },
      {
        name: 'Nike Air Max 270',
        description: 'Comfortable running shoes with Air Max cushioning technology',
        price: 149.99,
        category: 'Footwear',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        stock: 50,
        rating: 4.5,
        reviewCount: 203
      },
      {
        name: 'Levi\'s 501 Jeans',
        description: 'Classic straight-fit jeans made from premium denim',
        price: 89.99,
        category: 'Clothing',
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
        stock: 75,
        rating: 4.3,
        reviewCount: 156
      },
      {
        name: 'The Great Gatsby',
        description: 'Classic novel by F. Scott Fitzgerald - Paperback edition',
        price: 12.99,
        category: 'Books',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
        stock: 100,
        rating: 4.6,
        reviewCount: 342
      },
      {
        name: 'Samsung 4K Smart TV 55"',
        description: '55-inch 4K UHD Smart TV with HDR and built-in streaming apps',
        price: 799.99,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
        stock: 15,
        rating: 4.4,
        reviewCount: 67
      },
      {
        name: 'Adidas Ultraboost 22',
        description: 'Premium running shoes with Boost midsole technology',
        price: 189.99,
        category: 'Footwear',
        imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400',
        stock: 40,
        rating: 4.6,
        reviewCount: 178
      },
      {
        name: 'Coffee Table Book: Nature Photography',
        description: 'Stunning collection of nature photographs from around the world',
        price: 39.99,
        category: 'Books',
        imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
        stock: 30,
        rating: 4.8,
        reviewCount: 45
      }
    ];

    this.products = sampleProducts.map(product => ({
      id: uuidv4(),
      ...product,
      featured: product.rating >= 4.5, // Mark high-rated products as featured
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  async findAll(params?: PaginationParams, search?: string, category?: string): Promise<PaginatedResponse<Product>> {
    let filteredProducts = this.products;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    const total = filteredProducts.length;

    // Apply pagination
    if (params) {
      const { page, limit } = params;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      filteredProducts = filteredProducts.slice(startIndex, endIndex);
    }

    return {
      data: filteredProducts,
      pagination: params ? {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      } : {
        page: 1,
        limit: total,
        total,
        totalPages: 1
      }
    };
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find(product => product.id === id) || null;
  }

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const product: Product = {
      id: uuidv4(),
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.push(product);
    return product;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) return null;

    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.products[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) return false;
    
    this.products.splice(index, 1);
    return true;
  }

  async getCategories(): Promise<string[]> {
    const categories = [...new Set(this.products.map(product => product.category))];
    return categories.sort();
  }

  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    return this.products
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }
}

export default new ProductRepository();