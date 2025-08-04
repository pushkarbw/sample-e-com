import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCart } from '../hooks/useCart';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  margin-bottom: 30px;
  color: #333;
`;

const EmptyCart = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const CartItems = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 30px;
`;

const CartItem = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr auto auto auto;
  gap: 15px;
  padding: 20px;
  border-bottom: 1px solid #eee;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
    text-align: center;
  }
`;

const ProductImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
`;

const ProductInfo = styled.div`
  h3 {
    margin-bottom: 5px;
    color: #333;
  }
  
  p {
    color: #666;
    font-size: 0.9rem;
  }
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const QuantityButton = styled.button`
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    background-color: #f8f9fa;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Quantity = styled.span`
  font-weight: 500;
  min-width: 30px;
  text-align: center;
`;

const Price = styled.div`
  font-weight: bold;
  color: #007bff;
`;

const RemoveButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: #c82333;
  }
`;

const CartSummary = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  
  &:last-child {
    border-top: 1px solid #eee;
    padding-top: 15px;
    margin-top: 15px;
    font-size: 1.2rem;
    font-weight: bold;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, loading, updateCartItem, removeFromCart, clearCart } = useCart();

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Failed to remove cart item:', error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="loading">Loading cart...</div>
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container>
        <Title>Shopping Cart</Title>
        <EmptyCart>
          <h3>Your cart is empty</h3>
          <p>Add some products to get started!</p>
          <Link to="/products" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '20px' }}>
            Shop Now
          </Link>
        </EmptyCart>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Shopping Cart ({cart.totalItems} items)</Title>
      
      <CartItems>
        {cart.items.map((item) => (
          <CartItem key={item.id}>
            <ProductImage 
              src={item.product?.imageUrl} 
              alt={item.product?.name}
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/80x80?text=No+Image';
              }}
            />
            
            <ProductInfo>
              <h3>{item.product?.name}</h3>
              <p>${(item.product?.price || 0).toFixed(2)} each</p>
            </ProductInfo>
            
            <QuantityControls>
              <QuantityButton
                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                -
              </QuantityButton>
              <Quantity>{item.quantity}</Quantity>
              <QuantityButton
                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                disabled={item.quantity >= (item.product?.stock || 0)}
              >
                +
              </QuantityButton>
            </QuantityControls>
            
            <Price>${(item.subtotal || 0).toFixed(2)}</Price>
            
            <RemoveButton onClick={() => handleRemoveItem(item.id)}>
              Remove
            </RemoveButton>
          </CartItem>
        ))}
      </CartItems>

      <CartSummary>
        <SummaryRow>
          <span>Subtotal:</span>
          <span>${(cart.totalAmount || 0).toFixed(2)}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Shipping:</span>
          <span>Free</span>
        </SummaryRow>
        <SummaryRow>
          <span>Total:</span>
          <span>${(cart.totalAmount || 0).toFixed(2)}</span>
        </SummaryRow>
        
        <Actions>
          <button 
            className="btn-secondary" 
            onClick={handleClearCart}
          >
            Clear Cart
          </button>
          <Link 
            to="/products" 
            className="btn-outline" 
            style={{ textDecoration: 'none', textAlign: 'center' }}
          >
            Continue Shopping
          </Link>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/checkout')}
            style={{ flex: 1 }}
          >
            Proceed to Checkout
          </button>
        </Actions>
      </CartSummary>
    </Container>
  );
};

export default Cart;