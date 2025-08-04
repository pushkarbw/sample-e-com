# Sample E-Commerce Application

A full-stack e-commerce application built with Node.js, Express, TypeScript (backend) and React, TypeScript (frontend).

## Features

### Backend (Server)
- **Authentication**: JWT-based user authentication with signup/login
- **Products**: CRUD operations, search, filtering, pagination, featured products
- **Shopping Cart**: Add/remove items, update quantities, cart management
- **Orders**: Order creation, history, status tracking, cancellation
- **Database**: In-memory storage with repository pattern (easily extensible to real databases)
- **Testing**: Comprehensive unit tests with Jest
- **Type Safety**: Full TypeScript implementation

### Frontend (Client)
- **Modern React**: Hooks, Context API, functional components
- **Routing**: React Router with protected routes
- **Styling**: Styled Components with responsive design
- **State Management**: Custom hooks for auth and cart management
- **Testing**: React Testing Library with component tests
- **Type Safety**: Full TypeScript implementation

## Project Structure

```
sample-e-com/
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access layer
│   │   ├── models/         # Data models and types
│   │   ├── middleware/     # Auth and other middleware
│   │   ├── routes/         # API route definitions
│   │   └── __tests__/      # Backend tests
│   └── package.json
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript type definitions
│   │   ├── styles/         # Global styles
│   │   └── __tests__/      # Frontend tests
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd sample-e-com
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

3. **Set up environment variables**

Create a `.env` file in the `server` directory:
```
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Create a `.env` file in the `client` directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Running the Application

#### Development Mode (Both Server and Client)
```bash
npm run dev
```

#### Server Only
```bash
npm run server
```

#### Client Only
```bash
npm run client
```

#### Production Build
```bash
npm run build
npm start
```

### Testing

#### Run All Tests
```bash
npm test
```

#### Server Tests Only
```bash
npm run test:server
```

#### Client Tests Only
```bash
npm run test:client
```

#### Test Coverage
```bash
npm run test:coverage
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Products
- `GET /api/products` - Get products with pagination, search, filtering
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/featured` - Get featured products
- `GET /api/products/categories` - Get product categories

### Cart (Protected Routes)
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Orders (Protected Routes)
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/cancel` - Cancel order

## Features Walkthrough

### User Journey
1. **Browse Products**: View featured products on homepage, browse all products with search/filter
2. **Authentication**: Sign up or log in to access cart and orders
3. **Shopping**: Add products to cart, adjust quantities
4. **Checkout**: Enter shipping address, select payment method
5. **Order Management**: View order history, track status, cancel pending orders

### Technical Features
- **Responsive Design**: Mobile-first approach with breakpoints
- **Error Handling**: Comprehensive error handling on both client and server
- **Loading States**: Loading indicators throughout the application
- **Form Validation**: Client-side and server-side validation
- **Protected Routes**: Authentication required for cart, checkout, orders
- **Pagination**: Efficient loading of large product lists
- **Search & Filter**: Real-time product search and category filtering

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **Testing**: Jest, Supertest
- **Validation**: Manual validation (easily extensible to libraries like Joi)
- **CORS**: Enabled for cross-origin requests

### Frontend
- **Library**: React 18
- **Language**: TypeScript
- **Routing**: React Router v6
- **Styling**: Styled Components
- **HTTP Client**: Axios
- **Testing**: React Testing Library, Jest
- **Build Tool**: Create React App

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for both server and client
- **Prettier**: Code formatting (can be added)
- **Naming**: Consistent camelCase for variables, PascalCase for components

### Testing Strategy
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and user flows
- **Coverage**: Aim for >80% test coverage
- **Mocking**: API calls mocked in frontend tests

### Deployment Considerations
- **Environment Variables**: Separate configs for dev/prod
- **Build Process**: Optimized production builds
- **CORS**: Configured for production domains
- **Error Handling**: Production-safe error messages
- **Logging**: Console logging (extensible to proper logging services)

## Extending the Application

### Adding a Real Database
1. Install database driver (e.g., `pg` for PostgreSQL, `mysql2` for MySQL)
2. Update repository classes to use database queries instead of in-memory storage
3. Add database connection configuration
4. Implement migrations for schema management

### Adding More Features
- **Payment Integration**: Stripe, PayPal, etc.
- **Email Notifications**: Order confirmations, shipping updates
- **Admin Panel**: Product management, order management
- **Reviews & Ratings**: Product reviews and ratings
- **Inventory Management**: Stock tracking, low stock alerts
- **Wishlist**: Save products for later
- **Discounts & Coupons**: Promotional codes and discounts

### Performance Optimizations
- **Caching**: Redis for session and data caching
- **CDN**: For static assets and images
- **Database Indexing**: Optimize query performance
- **Code Splitting**: Lazy load React components
- **Image Optimization**: Compress and resize product images

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues, please open an issue on the GitHub repository.