# Prompt

**Project Overview**  
Build a fully functional sample e-commerce application featuring:  
- A responsive user interface (web) supporting product browsing, search, cart management, checkout, and user authentication.  
- A backend API layer (REST) with endpoints for product catalog, cart operations, orders, and user management.  
- A comprehensive testing strategy, including unit tests, integration tests, end-to-end (E2E) tests, and test fixtures.  
- **Use only in-memory mock databases and mock data/actions**—no real database connections.

## Requirements

### 1. Technology Stack  
- UI: React with TypeScript, Styled Components for CSS-in-JS styling  
- API: Node.js with Express, TypeScript  
- Mock Data Layer:  
  - In-memory arrays as "databases" with repository pattern  
  - Repository modules exposing create/read/update/delete operations on mock data  
  - Pre-seeded mock data for products, users, carts, and orders  
- Authentication: JWT-based flows using in-memory user store with bcryptjs password hashing  
- Testing:  
  - Jest + React Testing Library for UI/unit tests  
  - Supertest for API integration tests against mocks  
  - Cypress for E2E tests with mocked APIs  
  - Code coverage reports generated  

### 2. UI Features  
- Home page with featured products carousel and category navigation (mocked data)  
- Product listing page with pagination, search, category filtering, and sorting (reads from mock store)  
- Product detail pages with full product information and add-to-cart functionality  
- Shopping cart with add/remove/update quantity, item management, and price calculations (mock actions)  
- Checkout form with shipping address, payment method selection, and order summary (simulate order placement)  
- User authentication flows (signup/login/logout) backed by mock user service  
- Order history page showing past orders with status tracking  
- Responsive design optimized for desktop and mobile devices  
- Global state management for authentication and cart using React Context  

### 3. Backend API Endpoints  
Implement RESTful endpoints that operate solely on mock data stores:  
- `POST /api/auth/signup` – create new user in in-memory store with password hashing  
- `POST /api/auth/login` – validate credentials against mock store, return JWT token  
- `GET /api/auth/profile` – get current user profile using JWT authentication  
- `POST /api/auth/logout` – logout endpoint (client-side token removal)  
- `GET /api/products` – return paginated mock product list with search and filtering  
- `GET /api/products/featured` – return featured products for home page  
- `GET /api/products/categories` – return available product categories  
- `GET /api/products/:id` – return single product details from mock list  
- `GET /api/cart` – return current user's cart state from mock store  
- `POST /api/cart` – add item to user's mock cart with quantity  
- `PUT /api/cart/:itemId` – update mock cart item quantity  
- `DELETE /api/cart/:itemId` – remove item from mock cart  
- `DELETE /api/cart` – clear entire cart  
- `POST /api/orders` – simulate order creation in mock orders store with cart processing  
- `GET /api/orders` – return user's mock order history  
- `GET /api/orders/:id` – return specific order details  
- `PUT /api/orders/:id/cancel` – cancel pending order  

### 4. Testing Setup  
- Configure Jest for both UI and API tests with TypeScript support  
- Provide comprehensive test coverage:  
  - UI unit tests for components (Header, ProductCard, Cart, etc.) using React Testing Library  
  - Hook tests for useAuth and useCart with mocked contexts  
  - API integration tests for all endpoints using Supertest with mocked data services  
  - Page-level tests for authentication flows, product browsing, and cart operations  
- Cypress E2E tests covering complete user journeys with API interception  
- Test utilities and setup files for consistent testing environment  
- Coverage reports with detailed metrics  

### 5. Project Structure & Scripts  
- Monorepo structure with `/client` and `/server` folders  
- Root-level package.json with workspace management:  
  - `dev` (runs both client & server concurrently in development)  
  - `build` (builds both client and server)  
  - `test` (runs all Jest test suites)  
  - `test:coverage` (generates coverage reports)  
  - `cypress:open` (opens Cypress test runner)  
  - `server:dev` (runs server in development mode)  
  - `client:dev` (runs client in development mode)  
- Mock data repositories initialize with realistic sample data  
- Environment configuration for development and production  

### 6. Architecture & Implementation Details  
- **Frontend**: React with TypeScript, React Router for navigation, Styled Components for styling  
- **Backend**: Express with TypeScript, JWT authentication middleware, CORS configuration  
- **Data Layer**: Repository pattern with in-memory stores for users, products, carts, and orders  
- **Authentication**: JWT tokens with configurable secrets, password hashing with bcryptjs  
- **API Design**: RESTful endpoints with consistent response formats and error handling  
- **State Management**: React Context for global state (auth, cart) with custom hooks  
- **Responsive Design**: Mobile-first approach with styled-components breakpoints  

### 7. Deliverables  
- A fully functional e-commerce application ready to run locally  
- Comprehensive README with setup instructions, API documentation, and testing guide  
- Configuration files: ESLint, TypeScript configs, Jest setup, Cypress configuration  
- Sample data and realistic product catalog with images and descriptions  
- Complete test suite with high coverage demonstrating testing best practices  

**Implementation Notes**  
The application demonstrates modern full-stack development practices using TypeScript throughout, comprehensive testing strategies, and realistic e-commerce functionality while maintaining the requirement of using only mock data stores without external database dependencies.