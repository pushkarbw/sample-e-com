// Cypress fixtures for consistent test data
export const users = {
  testUser: {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'password123'
  },
  adminUser: {
    id: 'admin-1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123'
  }
};

export const products = [
  {
    id: 'product-1',
    name: 'Laptop Computer',
    description: 'High-performance laptop for work and gaming',
    price: 999.99,
    originalPrice: 1299.99,
    category: 'Electronics',
    stock: 15,
    rating: 4.5,
    reviewCount: 123,
    imageUrl: '/images/laptop.jpg',
    images: [
      '/images/laptop-1.jpg',
      '/images/laptop-2.jpg',
      '/images/laptop-3.jpg'
    ],
    specifications: {
      'CPU': 'Intel i7-12700H',
      'RAM': '16GB DDR4',
      'Storage': '512GB NVMe SSD',
      'Display': '15.6" Full HD',
      'Graphics': 'RTX 3060'
    },
    features: [
      'High-performance processor',
      'Dedicated graphics card',
      'Fast SSD storage',
      'Full HD display',
      'Backlit keyboard'
    ]
  },
  {
    id: 'product-2',
    name: 'Wireless Headphones',
    description: 'Premium noise-canceling wireless headphones',
    price: 199.99,
    category: 'Electronics',
    stock: 25,
    rating: 4.8,
    reviewCount: 89,
    imageUrl: '/images/headphones.jpg'
  },
  {
    id: 'product-3',
    name: 'Running Shoes',
    description: 'Comfortable running shoes for daily training',
    price: 129.99,
    category: 'Sports',
    stock: 0,
    rating: 4.2,
    reviewCount: 67,
    imageUrl: '/images/shoes.jpg'
  }
];

export const categories = [
  'Electronics',
  'Clothing',
  'Sports',
  'Books',
  'Home & Garden'
];

export const cart = {
  id: 'cart-1',
  userId: 'user-1',
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      quantity: 1,
      price: 999.99,
      product: products[0]
    },
    {
      id: 'item-2',
      productId: 'product-2',
      quantity: 2,
      price: 199.99,
      product: products[1]
    }
  ],
  totalItems: 3,
  totalPrice: 1399.97,
  subtotal: 1399.97,
  tax: 111.98,
  shipping: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const orders = [
  {
    id: 'order-1',
    userId: 'user-1',
    status: 'delivered',
    total: 1399.97,
    subtotal: 1399.97,
    tax: 111.98,
    shipping: 0,
    items: cart.items,
    shippingAddress: {
      firstName: 'Test',
      lastName: 'User',
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'United States',
      phone: '(555) 123-4567'
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'order-2',
    userId: 'user-1',
    status: 'processing',
    total: 199.99,
    subtotal: 199.99,
    tax: 16.00,
    shipping: 9.99,
    items: [cart.items[1]],
    shippingAddress: {
      firstName: 'Test',
      lastName: 'User',
      street: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'United States',
      phone: '(555) 987-6543'
    },
    createdAt: '2024-01-20T14:20:00Z',
    updatedAt: '2024-01-20T14:20:00Z'
  }
];

export const apiResponses = {
  auth: {
    loginSuccess: {
      user: users.testUser,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    loginError: {
      message: 'Invalid credentials'
    },
    signupSuccess: {
      user: users.testUser,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    signupError: {
      message: 'Email already exists'
    }
  },
  products: {
    list: {
      data: products,
      pagination: {
        page: 1,
        totalPages: 1,
        totalItems: products.length,
        limit: 12
      }
    },
    detail: products[0],
    categories: categories
  },
  cart: {
    get: cart,
    empty: {
      id: 'cart-1',
      userId: 'user-1',
      items: [],
      totalItems: 0,
      totalPrice: 0
    },
    addItem: {
      message: 'Product added to cart successfully'
    },
    updateItem: {
      message: 'Cart item updated successfully'
    },
    removeItem: {
      message: 'Item removed from cart successfully'
    },
    clear: {
      message: 'Cart cleared successfully'
    }
  },
  orders: {
    list: orders,
    detail: orders[0],
    create: {
      id: 'order-123',
      status: 'confirmed',
      message: 'Order placed successfully'
    },
    createError: {
      message: 'Payment processing failed'
    }
  }
};