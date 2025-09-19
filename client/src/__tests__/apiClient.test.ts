import apiClient from '../services/apiClient';
import { mockUser, mockProduct, mockCart, mockOrder } from '../utils/test-utils';

// Mock the apiClient module
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    getProducts: jest.fn(),
    getProduct: jest.fn(),
    getFeaturedProducts: jest.fn(),
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
    getOrders: jest.fn(),
    getOrder: jest.fn(),
    createOrder: jest.fn(),
    cancelOrder: jest.fn()
  }
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('API Client Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should login user successfully', async () => {
      const loginData = { email: 'test@example.com', password: 'Ecomm@123' };
      const mockResponse = { user: mockUser, token: 'mock-token' };
      
      mockedApiClient.login.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.login(loginData);
      
      expect(mockedApiClient.login).toHaveBeenCalledWith(loginData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle login error', async () => {
      const loginData = { email: 'test@example.com', password: 'wrong' };
      const mockError = new Error('Invalid credentials');
      
      mockedApiClient.login.mockRejectedValueOnce(mockError);
      
      await expect(apiClient.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should signup user successfully', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'Ecomm@123',
        firstName: 'John',
        lastName: 'Doe'
      };
      const mockResponse = { user: mockUser, token: 'mock-token' };
      
      mockedApiClient.signup.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.signup(signupData);
      
      expect(mockedApiClient.signup).toHaveBeenCalledWith(signupData);
      expect(result).toEqual(mockResponse);
    });

    it('should logout user', async () => {
      mockedApiClient.logout.mockResolvedValueOnce();
      
      await apiClient.logout();
      
      expect(mockedApiClient.logout).toHaveBeenCalled();
    });

    it('should get current user profile', async () => {
      const mockResponse = mockUser;
      
      mockedApiClient.getCurrentUser.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getCurrentUser();
      
      expect(mockedApiClient.getCurrentUser).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Products', () => {
    it('should fetch all products', async () => {
      const mockResponse = {
        data: {
          data: [mockProduct],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1
          }
        }
      };
      
      mockedApiClient.getProducts.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getProducts();
      
      expect(mockedApiClient.getProducts).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should fetch product by id', async () => {
      const mockResponse = mockProduct;
      
      mockedApiClient.getProduct.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getProduct('product-1');
      
      expect(mockedApiClient.getProduct).toHaveBeenCalledWith('product-1');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch featured products', async () => {
      const mockResponse = [mockProduct];
      
      mockedApiClient.getFeaturedProducts.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getFeaturedProducts();
      
      expect(mockedApiClient.getFeaturedProducts).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Cart', () => {
    it('should fetch cart items', async () => {
      const mockResponse = mockCart;
      
      mockedApiClient.getCart.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getCart();
      
      expect(mockedApiClient.getCart).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should add item to cart', async () => {
      const mockResponse = mockCart;
      const productId = 'product-1';
      const quantity = 2;
      
      mockedApiClient.addToCart.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.addToCart(productId, quantity);
      
      expect(mockedApiClient.addToCart).toHaveBeenCalledWith(productId, quantity);
      expect(result).toEqual(mockResponse);
    });

    it('should update cart item quantity', async () => {
      const mockResponse = mockCart;
      
      mockedApiClient.updateCartItem.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.updateCartItem('cart-item-1', 3);
      
      expect(mockedApiClient.updateCartItem).toHaveBeenCalledWith('cart-item-1', 3);
      expect(result).toEqual(mockResponse);
    });

    it('should remove item from cart', async () => {
      const mockResponse = mockCart;
      
      mockedApiClient.removeFromCart.mockResolvedValueOnce(mockResponse);
      
      await apiClient.removeFromCart('cart-item-1');
      
      expect(mockedApiClient.removeFromCart).toHaveBeenCalledWith('cart-item-1');
    });

    it('should clear cart', async () => {
      mockedApiClient.clearCart.mockResolvedValueOnce();
      
      await apiClient.clearCart();
      
      expect(mockedApiClient.clearCart).toHaveBeenCalled();
    });
  });

  describe('Orders', () => {
    it('should create order', async () => {
      const mockResponse = mockOrder;
      const orderData = {
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        },
        paymentMethod: 'credit_card'
      };
      
      mockedApiClient.createOrder.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.createOrder(orderData);
      
      expect(mockedApiClient.createOrder).toHaveBeenCalledWith(orderData);
      expect(result).toEqual(mockResponse);
    });

    it('should fetch user orders', async () => {
      const mockResponse = [mockOrder];
      
      mockedApiClient.getOrders.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getOrders();
      
      expect(mockedApiClient.getOrders).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should fetch order by id', async () => {
      const mockResponse = mockOrder;
      
      mockedApiClient.getOrder.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.getOrder('order-1');
      
      expect(mockedApiClient.getOrder).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(mockResponse);
    });

    it('should cancel order', async () => {
      const mockResponse = { ...mockOrder, status: 'cancelled' as const };
      
      mockedApiClient.cancelOrder.mockResolvedValueOnce(mockResponse);
      
      const result = await apiClient.cancelOrder('order-1');
      
      expect(mockedApiClient.cancelOrder).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(mockResponse);
    });
  });
});