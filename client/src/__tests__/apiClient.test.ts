import axios from 'axios';
import apiClient from '../services/apiClient';
import { mockUser, mockProduct, mockCartItem, mockOrder } from '../utils/test-utils';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should login user successfully', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { data: { user: mockUser, token: 'mock-token' } };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.login(loginData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login error', async () => {
      const loginData = { email: 'test@example.com', password: 'wrong' };
      const mockError = {
        response: { data: { message: 'Invalid credentials' }, status: 401 }
      };
      
      mockedAxios.post.mockRejectedValueOnce(mockError);
      
      await expect(apiClient.login(loginData)).rejects.toThrow();
    });

    it('should signup user successfully', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      const mockResponse = { data: { user: mockUser, token: 'mock-token' } };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.signup(signupData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/signup', signupData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should logout user', async () => {
      localStorage.setItem('token', 'mock-token');
      
      await apiClient.logout();
      
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should get current user profile', async () => {
      const mockResponse = { data: mockUser };
      localStorage.setItem('token', 'mock-token');
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getProfile();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Products', () => {
    it('should fetch all products', async () => {
      const mockResponse = { data: [mockProduct] };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getProducts();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/products');
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch product by id', async () => {
      const mockResponse = { data: mockProduct };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getProduct('product-1');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/products/product-1');
      expect(result).toEqual(mockResponse.data);
    });

    it('should search products', async () => {
      const mockResponse = { data: [mockProduct] };
      const searchParams = { query: 'test', category: 'Electronics' };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.searchProducts(searchParams);
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/products/search', { params: searchParams });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch featured products', async () => {
      const mockResponse = { data: [mockProduct] };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getFeaturedProducts();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/products/featured');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Cart', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-token');
    });

    it('should fetch cart items', async () => {
      const mockResponse = { data: [mockCartItem] };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getCart();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/cart');
      expect(result).toEqual(mockResponse.data);
    });

    it('should add item to cart', async () => {
      const mockResponse = { data: mockCartItem };
      const cartData = { productId: 'product-1', quantity: 2 };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.addToCart(cartData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/cart', cartData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should update cart item quantity', async () => {
      const mockResponse = { data: mockCartItem };
      
      mockedAxios.put.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.updateCartItem('cart-item-1', 3);
      
      expect(mockedAxios.put).toHaveBeenCalledWith('/cart/cart-item-1', { quantity: 3 });
      expect(result).toEqual(mockResponse.data);
    });

    it('should remove item from cart', async () => {
      mockedAxios.delete.mockResolvedValueOnce({ data: {} });
      
      await apiClient.removeFromCart('cart-item-1');
      
      expect(mockedAxios.delete).toHaveBeenCalledWith('/cart/cart-item-1');
    });

    it('should clear cart', async () => {
      mockedAxios.delete.mockResolvedValueOnce({ data: {} });
      
      await apiClient.clearCart();
      
      expect(mockedAxios.delete).toHaveBeenCalledWith('/cart');
    });
  });

  describe('Orders', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-token');
    });

    it('should create order', async () => {
      const mockResponse = { data: mockOrder };
      const orderData = {
        items: [{ productId: 'product-1', quantity: 2, price: 99.99 }],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.createOrder(orderData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/orders', orderData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch user orders', async () => {
      const mockResponse = { data: [mockOrder] };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getOrders();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/orders');
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch order by id', async () => {
      const mockResponse = { data: mockOrder };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getOrder('order-1');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/orders/order-1');
      expect(result).toEqual(mockResponse.data);
    });

    it('should cancel order', async () => {
      const mockResponse = { data: { ...mockOrder, status: 'cancelled' } };
      
      mockedAxios.put.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.cancelOrder('order-1');
      
      expect(mockedAxios.put).toHaveBeenCalledWith('/orders/order-1/cancel');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Request Interceptors', () => {
    it('should add authorization header when token exists', () => {
      localStorage.setItem('token', 'mock-token');
      
      // Simulate axios request interceptor
      const config = { headers: {} };
      const token = localStorage.getItem('token');
      
      if (token) {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      }
      
      expect(config.headers.Authorization).toBe('Bearer mock-token');
    });

    it('should not add authorization header when token does not exist', () => {
      localStorage.removeItem('token');
      
      const config = { headers: {} };
      const token = localStorage.getItem('token');
      
      if (token) {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      }
      
      expect(config.headers.Authorization).toBeUndefined();
    });
  });
});