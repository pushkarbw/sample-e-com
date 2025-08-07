import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCart } from '../hooks/useCart';
import { Address } from '../types';
import apiClient from '../services/apiClient';

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  margin-bottom: 30px;
  color: #333;
`;

const CheckoutLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
`;

const Section = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  margin-bottom: 20px;
  color: #333;
  font-size: 1.3rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const OrderSummary = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
  position: sticky;
  top: 100px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
  
  h4 {
    margin-bottom: 5px;
    color: #333;
  }
  
  p {
    color: #666;
    font-size: 0.9rem;
  }
`;

const ItemPrice = styled.div`
  font-weight: bold;
  color: #007bff;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  
  &.total {
    border-top: 1px solid #eee;
    padding-top: 15px;
    margin-top: 20px;
    font-size: 1.2rem;
    font-weight: bold;
  }
`;

const PlaceOrderButton = styled.button`
  width: 100%;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 15px;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 20px;
  
  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 14px;
  margin-top: 10px;
  padding: 10px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
`;

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  
  const [shippingAddress, setShippingAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });
  
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const order = await apiClient.createOrder({
        shippingAddress,
        paymentMethod
      });
      
      await clearCart();
      navigate('/orders', { 
        state: { 
          message: `Order #${order.id} placed successfully!` 
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <Container>
        <Title>Checkout</Title>
        <Section>
          <p>Your cart is empty. Please add some items before checking out.</p>
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Checkout</Title>
      
      <CheckoutLayout>
        <div>
          <Section>
            <SectionTitle>Shipping Address</SectionTitle>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  type="text"
                  value={shippingAddress.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  required
                />
              </FormGroup>
              
              <FormRow>
                <FormGroup>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    required
                  />
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={shippingAddress.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="country">Country</Label>
                  <Select
                    id="country"
                    value={shippingAddress.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    required
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </Select>
                </FormGroup>
              </FormRow>
            </Form>
          </Section>

          <Section>
            <SectionTitle>Payment Method</SectionTitle>
            <FormGroup>
              <Label htmlFor="paymentMethod">Payment Type</Label>
              <Select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                <option value="credit-card">Credit Card</option>
                <option value="debit-card">Debit Card</option>
                <option value="paypal">PayPal</option>
              </Select>
            </FormGroup>
          </Section>
        </div>

        <OrderSummary>
          <SectionTitle>Order Summary</SectionTitle>
          
          {cart.items.map((item) => (
            <OrderItem key={item.id}>
              <ItemInfo>
                <h4>{item.product?.name}</h4>
                <p>Qty: {item.quantity} × ${item.product?.price.toFixed(2)}</p>
              </ItemInfo>
              <ItemPrice>${item.subtotal?.toFixed(2)}</ItemPrice>
            </OrderItem>
          ))}
          
          <SummaryRow>
            <span>Subtotal:</span>
            <span>${cart.totalAmount.toFixed(2)}</span>
          </SummaryRow>
          
          <SummaryRow>
            <span>Shipping:</span>
            <span>Free</span>
          </SummaryRow>
          
          <SummaryRow>
            <span>Tax:</span>
            <span>${(cart.totalAmount * 0.08).toFixed(2)}</span>
          </SummaryRow>
          
          <SummaryRow className="total">
            <span>Total:</span>
            <span>${(cart.totalAmount * 1.08).toFixed(2)}</span>
          </SummaryRow>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <PlaceOrderButton
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </PlaceOrderButton>
        </OrderSummary>
      </CheckoutLayout>
    </Container>
  );
};

export default Checkout;