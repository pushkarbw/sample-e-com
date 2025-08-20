import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { Product } from '../types';

const Card = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  ${Card}:hover & {
    transform: scale(1.05);
  }
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 14px;
`;

const CardContent = styled.div`
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ProductTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProductCategory = styled.span`
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 10px;
  display: block;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const Price = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #28a745;
`;

const OriginalPrice = styled.span`
  font-size: 1rem;
  color: #6c757d;
  text-decoration: line-through;
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 15px;
`;

const StarRating = styled.div`
  display: flex;
  gap: 2px;
`;

const Star = styled.span<{ filled: boolean }>`
  color: ${props => props.filled ? '#ffc107' : '#e9ecef'};
  font-size: 16px;
`;

const ReviewCount = styled.span`
  color: #6c757d;
  font-size: 0.9rem;
`;

const StockStatus = styled.span<{ inStock: boolean }>`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.inStock ? '#28a745' : '#dc3545'};
  margin-bottom: 15px;
  display: block;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: auto;
`;

const AddToCartButton = styled.button`
  flex: 1;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const ViewDetailsButton = styled(Link)`
  flex: 1;
  background-color: #28a745;
  color: white;
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 5px;
  font-weight: 600;
  text-align: center;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #218838;
    color: white;
  }
`;

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated || !product.stock || product.stock <= 0) return;
    
    try {
      setIsAddingToCart(true);
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} filled={true}>★</Star>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} filled={true}>☆</Star>);
      } else {
        stars.push(<Star key={i} filled={false}>☆</Star>);
      }
    }
    
    return stars;
  };

  const isOutOfStock = !product.stock || product.stock <= 0;

  return (
    <Card data-testid="product-card">
      <ImageContainer>
        {imageError ? (
          <ImagePlaceholder>No Image Available</ImagePlaceholder>
        ) : (
          <ProductImage
            src={product.imageUrl || 'https://via.placeholder.com/300x250?text=No+Image'}
            alt={product.name}
            onError={handleImageError}
          />
        )}
      </ImageContainer>
      
      <CardContent>
        <ProductTitle data-testid="product-name">{product.name}</ProductTitle>
        <ProductCategory>{product.category}</ProductCategory>
        
        <PriceContainer>
          <Price data-testid="product-price">${product.price.toFixed(2)}</Price>
          {product.originalPrice && product.originalPrice > product.price && (
            <OriginalPrice>${product.originalPrice.toFixed(2)}</OriginalPrice>
          )}
        </PriceContainer>
        
        {product.rating && (
          <RatingContainer>
            <StarRating>
              {renderStars(product.rating)}
            </StarRating>
            {product.reviewCount && (
              <ReviewCount>({product.reviewCount} reviews)</ReviewCount>
            )}
          </RatingContainer>
        )}
        
        <StockStatus inStock={!isOutOfStock}>
          {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
        </StockStatus>
        
        <ButtonContainer>
          {isAuthenticated && (
            <AddToCartButton
              data-testid="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
            >
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </AddToCartButton>
          )}
          
          <ViewDetailsButton to={`/products/${product.id}`} data-testid="view-details-button">
            View Details
          </ViewDetailsButton>
        </ButtonContainer>
      </CardContent>
    </Card>
  );
};