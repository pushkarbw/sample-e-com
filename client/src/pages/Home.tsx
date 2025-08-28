import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ProductCard } from '../components/ProductCard';
import apiClient from '../services/apiClient';
import { Product } from '../types';

const HomeContainer = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroSection = styled.section`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 80px 20px;
  margin-bottom: 60px;
  border-radius: 10px;
  
  h1 {
    font-size: 3rem;
    margin-bottom: 20px;
    font-weight: 700;
  }
  
  p {
    font-size: 1.25rem;
    margin-bottom: 30px;
    opacity: 0.9;
  }
  
  @media (max-width: 768px) {
    padding: 60px 20px;
    
    h1 {
      font-size: 2rem;
    }
    
    p {
      font-size: 1rem;
    }
  }
`;

const CTAButton = styled(Link)`
  display: inline-block;
  background-color: #ff6b6b;
  color: white;
  padding: 15px 30px;
  text-decoration: none;
  border-radius: 30px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  
  &:hover {
    background-color: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }
  
  &.btn-primary {
    background-color: #007bff;
    
    &:hover {
      background-color: #0056b3;
    }
  }
`;

const FeaturedSection = styled.section`
  margin-bottom: 60px;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 50px;
  color: #333;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 3px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 5px;
  text-align: center;
  margin: 20px 0;
  border: 1px solid #f5c6cb;
`;

const ViewAllButton = styled(Link)`
  display: block;
  width: fit-content;
  margin: 40px auto 0;
  background-color: #28a745;
  color: white;
  padding: 12px 30px;
  text-decoration: none;
  border-radius: 5px;
  font-weight: 600;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #218838;
  }
`;

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const products = await apiClient.getFeaturedProducts();
        setFeaturedProducts(products);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load featured products';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <HomeContainer role="main">
      <HeroSection role="banner" data-testid="hero-section">
        <h1>Welcome to Our Store</h1>
        <p>Discover amazing products at great prices</p>
        <CTAButton to="/products" className="btn-primary" data-testid="cta-button">
          Shop Now
        </CTAButton>
      </HeroSection>

      <FeaturedSection>
        <SectionTitle>Featured Products</SectionTitle>
        
        {loading && (
          <LoadingSpinner>Loading...</LoadingSpinner>
        )}
        
        {error && (
          <ErrorMessage>{error}</ErrorMessage>
        )}
        
        {!loading && !error && featuredProducts.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '1.1rem' }}>
            No featured products available at the moment.
          </div>
        )}
        
        {!loading && !error && featuredProducts.length > 0 && (
          <>
            <ProductGrid data-testid="featured-products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ProductGrid>
            
            <ViewAllButton to="/products">
              View All Products
            </ViewAllButton>
          </>
        )}
      </FeaturedSection>
    </HomeContainer>
  );
};

export default Home;