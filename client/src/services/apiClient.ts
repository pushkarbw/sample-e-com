import axios from 'axios';
import {
  User,
  Product,
  Cart,
  Order,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  ProductsResponse,
  CheckoutRequest,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5010/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class ApiClient {
  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', userData);
    return response.data.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    return response.data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.data;
  }

  // Product endpoints
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProductsResponse> {
    const response = await api.get('/products', { params });
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await api.get('/products/featured');
    return response.data.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await api.get('/products/categories');
    return response.data.data;
  }

  // Cart endpoints
  async getCart(): Promise<Cart | null> {
    try {
      const response = await api.get('/cart');
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async addToCart(productId: string, quantity: number): Promise<Cart> {
    const response = await api.post('/cart', { productId, quantity });
    return response.data.data;
  }

  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    const response = await api.put(`/cart/${itemId}`, { quantity });
    return response.data.data;
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    const response = await api.delete(`/cart/${itemId}`);
    return response.data.data;
  }

  async clearCart(): Promise<void> {
    await api.delete('/cart');
  }

  // Order endpoints
  async getOrders(): Promise<Order[]> {
    const response = await api.get('/orders');
    return response.data.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  }

  async createOrder(checkoutData: CheckoutRequest): Promise<Order> {
    const response = await api.post('/orders', checkoutData);
    return response.data.data;
  }

  async cancelOrder(id: string): Promise<Order> {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data.data;
  }
}

const apiClient = new ApiClient();
export default apiClient;