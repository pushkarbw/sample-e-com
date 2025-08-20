import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

const HeaderContainer = styled.header`
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Nav = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
`;

const Logo = styled(Link)`
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  text-decoration: none;
  
  &:hover {
    color: #0056b3;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  
  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const NavLink = styled(Link)`
  color: #333;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
    color: #007bff;
  }
`;

const CartBadge = styled.span`
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  position: absolute;
  top: -8px;
  right: -8px;
`;

const CartLink = styled(Link)`
  position: relative;
  color: #333;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
    color: #007bff;
  }
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <HeaderContainer>
      <Nav>
        <Logo to="/">E-Commerce</Logo>
        
        <NavLinks>
          <NavLink to="/" data-testid="home-link">Home</NavLink>
          <NavLink to="/products" data-testid="products-link">Products</NavLink>
          
          {isAuthenticated ? (
            <>
              <CartLink to="/cart" data-testid="cart-link">
                Cart
                {cart && cart.totalItems > 0 && (
                  <CartBadge data-testid="cart-badge">{cart.totalItems}</CartBadge>
                )}
              </CartLink>
              <NavLink to="/orders" data-testid="orders-link">Orders</NavLink>
            </>
          ) : null}
        </NavLinks>

        <UserActions>
          {isAuthenticated ? (
            <>
              <span data-testid="user-greeting">Hi, {user?.firstName}!</span>
              <button 
                className="btn-outline" 
                data-testid="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" data-testid="login-link">Login</NavLink>
              <NavLink to="/signup" data-testid="signup-link">Sign Up</NavLink>
            </>
          )}
        </UserActions>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;