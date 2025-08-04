import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Product } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import apiClient from '../services/apiClient';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const ProductLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  margin-bottom: 60px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
`;

const ImageSection = styled.div`
  display: flex;
  justify-content: center;
`;

const ProductImage = styled.img`
  width: 100%;
  max-width: 500px;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const ProductInfo = styled.div`
  padding: 20px 0;
`;

const Category = styled.span`
  background-color: #f8f9fa;
  color: #6c757d;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 15px;
  display: inline-block;
`;

const ProductName = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: #333;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Price = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 20px;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 1rem;
  color: #666;
`;

const Stars = styled.span`
  color: #ffc107;
  font-size: 1.2rem;
`;

const Description = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 30px;
`;

const Stock = styled.div<{ inStock: boolean }>`
  font-weight: 500;
  margin-bottom: 30px;
  color: ${props => props.inStock ? '#28a745' : '#dc3545'};
`;

const Actions = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
`;

const QuantitySelector = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const QuantityButton = styled.button`
  width: 35px;
  height: 35px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  
  &:hover:not(:disabled) {
    background-color: #f8f9fa;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuantityInput = styled.input`
  width: 60px;
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const AddToCartButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BackButton = styled.button`
  background-color: transparent;
  color: #007bff;
  border: 2px solid #007bff;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 20px;
  
  &:hover {
    background-color: #007bff;
    color: white;
  }
`;

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const productData = await apiClient.getProduct(id);
        setProduct(productData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || !isAuthenticated) return;
    
    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const adjustQuantity = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && (!product || newQuantity <= product.stock)) {
      setQuantity(newQuantity);
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (loading) {
    return (
      <Container>
        <div className="loading">Loading product...</div>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container>
        <BackButton onClick={() => navigate(-1)}>← Back</BackButton>
        <div style={{ textAlign: 'center', color: '#dc3545', padding: '40px' }}>
          {error || 'Product not found'}
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>← Back</BackButton>
      
      <ProductLayout>
        <ImageSection>
          <ProductImage 
            src={product.imageUrl} 
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/500x400?text=No+Image';
            }}
          />
        </ImageSection>

        <ProductInfo>
          <Category>{product.category}</Category>
          <ProductName>{product.name}</ProductName>
          <Price>${product.price.toFixed(2)}</Price>
          
          <Rating>
            <Stars>{renderStars(product.rating || 0)}</Stars>
            <span>{product.rating}/5 ({product.reviewCount} reviews)</span>
          </Rating>
          
          <Description>{product.description}</Description>
          
          <Stock inStock={product.stock > 0}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </Stock>

          {isAuthenticated && product.stock > 0 && (
            <Actions>
              <QuantitySelector>
                <span>Quantity:</span>
                <QuantityButton 
                  onClick={() => adjustQuantity(-1)}
                  disabled={quantity <= 1}
                >
                  -
                </QuantityButton>
                <QuantityInput 
                  type="number" 
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= product.stock) {
                      setQuantity(val);
                    }
                  }}
                  min={1}
                  max={product.stock}
                />
                <QuantityButton 
                  onClick={() => adjustQuantity(1)}
                  disabled={quantity >= product.stock}
                >
                  +
                </QuantityButton>
              </QuantitySelector>
              
              <AddToCartButton
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </AddToCartButton>
            </Actions>
          )}

          {!isAuthenticated && (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              Please log in to add items to cart
            </div>
          )}
        </ProductInfo>
      </ProductLayout>
    </Container>
  );
};

export default ProductDetail;