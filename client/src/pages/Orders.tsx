import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Order, OrderStatus, PaginatedResponse } from '../types';
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

const SuccessMessage = styled.div`
  background-color: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #c3e6cb;
  margin-bottom: 30px;
`;

const OrderCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 25px;
  margin-bottom: 20px;
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const OrderInfo = styled.div`
  h3 {
    margin-bottom: 5px;
    color: #333;
  }
  
  p {
    color: #666;
    font-size: 0.9rem;
  }
`;

const OrderMeta = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const StatusBadge = styled.span<{ status: OrderStatus }>`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  
  ${props => {
    switch (props.status) {
      case OrderStatus.PENDING:
        return 'background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7;';
      case OrderStatus.PROCESSING:
        return 'background-color: #cce5ff; color: #004085; border: 1px solid #b8daff;';
      case OrderStatus.SHIPPED:
        return 'background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;';
      case OrderStatus.DELIVERED:
        return 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;';
      case OrderStatus.CANCELLED:
        return 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;';
      default:
        return 'background-color: #e2e3e5; color: #383d41; border: 1px solid #d6d8db;';
    }
  }}
`;

const TotalAmount = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #007bff;
`;

const OrderItems = styled.div`
  margin-bottom: 20px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f8f9fa;
  
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
  font-weight: 500;
  color: #333;
`;

const ShippingAddress = styled.div`
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
  
  h4 {
    margin-bottom: 10px;
    color: #333;
  }
  
  p {
    color: #666;
    margin: 0;
  }
`;

const CancelButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover:not(:disabled) {
    background-color: #c82333;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
`;

const EmptyOrders = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const Orders: React.FC = () => {
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after showing it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.getOrders();
        console.log('Received orders:', result); // Debug log
        // Ensure result is an array
        setOrders(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error('Error fetching orders:', err); // Debug log
        setError(err instanceof Error ? err.message : 'Failed to load orders');
        setOrders([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await apiClient.cancelOrder(orderId);
      // Refresh orders
      const result = await apiClient.getOrders();
      setOrders(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading orders...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Title>My Orders</Title>
      
      {successMessage && (
        <SuccessMessage>
          {successMessage}
        </SuccessMessage>
      )}

      {error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}

      {orders && orders.length === 0 ? (
        <EmptyOrders>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet.</p>
        </EmptyOrders>
      ) : (
        orders?.map((order) => (
          <OrderCard key={order.id}>
            <OrderHeader>
              <OrderInfo>
                <h3>Order #{order.id.substring(0, 8)}</h3>
                <p>Placed on {formatDate(order.createdAt.toString())}</p>
              </OrderInfo>
              
              <OrderMeta>
                <StatusBadge status={order.status as OrderStatus}>
                  {order.status}
                </StatusBadge>
                <TotalAmount>
                  ${order.totalAmount.toFixed(2)}
                </TotalAmount>
                {order.status === OrderStatus.PENDING && (
                  <CancelButton onClick={() => handleCancelOrder(order.id)}>
                    Cancel Order
                  </CancelButton>
                )}
              </OrderMeta>
            </OrderHeader>

            <OrderItems>
              {order.items.map((item) => (
                <OrderItem key={item.id}>
                  <ItemInfo>
                    <h4>{item.productName}</h4>
                    <p>Qty: {item.quantity} × ${item.productPrice.toFixed(2)}</p>
                  </ItemInfo>
                  <ItemPrice>${item.subtotal.toFixed(2)}</ItemPrice>
                </OrderItem>
              ))}
            </OrderItems>

            <ShippingAddress>
              <h4>Shipping Address</h4>
              <p>
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                {order.shippingAddress.country}
              </p>
            </ShippingAddress>
          </OrderCard>
        ))
      )}
    </Container>
  );
};

export default Orders;