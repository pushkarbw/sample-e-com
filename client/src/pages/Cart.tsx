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
      // Add random delay to simulate intermittent slow cart updates
      const updateDelay = Math.floor(Math.random() * 400) + 100; // 100-500ms jitter
      await new Promise(resolve => setTimeout(resolve, updateDelay));
      
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      // Add random delay for remove operations
      const removeDelay = Math.floor(Math.random() * 300) + 50; // 50-350ms jitter
      await new Promise(resolve => setTimeout(resolve, removeDelay));
      
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
      
      <CartItems data-testid="cart-items">
        {cart.items.map((item) => (
          <CartItem key={item.id} data-testid="cart-item">
            <ProductImage 
              src={item.product?.imageUrl} 
              alt={item.product?.name}
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/80x80?text=No+Image';
              }}
            />
            
            <ProductInfo>
              <h3 data-testid="item-name">{item.product?.name}</h3>
              <p>${(item.product?.price || 0).toFixed(2)} each</p>
            </ProductInfo>
            
            <QuantityControls>
              <QuantityButton
                data-testid="decrease-quantity"
                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                -
              </QuantityButton>
              <Quantity data-testid="item-quantity">{item.quantity}</Quantity>
              <QuantityButton
                data-testid="increase-quantity"
                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                disabled={item.quantity >= (item.product?.stock || 0)}
              >
                +
              </QuantityButton>
            </QuantityControls>
            
            <Price data-testid="item-price">${(item.subtotal || 0).toFixed(2)}</Price>
            
            <RemoveButton data-testid="remove-item" onClick={() => handleRemoveItem(item.id)}>
              Remove
            </RemoveButton>
          </CartItem>
        ))}
      </CartItems>

      <CartSummary data-testid="cart-summary">
        <SummaryRow>
          <span>Subtotal:</span>
          <span data-testid="cart-subtotal">${(cart.totalAmount || 0).toFixed(2)}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Shipping:</span>
          <span>Free</span>
        </SummaryRow>
        <SummaryRow>
          <span>Total:</span>
          <span data-testid="cart-total">${(cart.totalAmount || 0).toFixed(2)}</span>
        </SummaryRow>
        
        <Actions>
          <button 
            className="btn-secondary" 
            data-testid="clear-cart"
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
            data-testid="checkout-button"
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