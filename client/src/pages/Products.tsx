import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Product, ProductsResponse } from '../types';
import apiClient from '../services/apiClient';
import { ProductCard } from '../components/ProductCard';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  margin-bottom: 20px;
  color: #333;
`;

const Filters = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 250px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const Select = styled.select`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 40px;
`;

const PageButton = styled.button<{ active?: boolean }>`
  padding: 8px 12px;
  border: 1px solid #ddd;
  background-color: ${props => props.active ? '#007bff' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  border-radius: 4px;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.active ? '#0056b3' : '#f8f9fa'};
  }
  
  &:disabled {
    opacity: 0.5;
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
  margin: 20px 0;
`;

const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const limit = 12;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const result = await apiClient.getProducts({
        page: currentPage,
        limit,
        search: search || undefined,
        category: selectedCategory || undefined
      });
      setProducts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await apiClient.getCategories();
      setCategories(result);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, search, selectedCategory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const renderPagination = () => {
    if (!products || products.data.pagination.totalPages <= 1) return null;

    const { page, totalPages } = products.data.pagination;
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <PageButton
          key={i}
          active={i === page}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </PageButton>
      );
    }

    return (
      <Pagination>
        <PageButton
          onClick={() => setCurrentPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </PageButton>
        {pages}
        <PageButton
          onClick={() => setCurrentPage(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </PageButton>
      </Pagination>
    );
  };

  return (
    <Container>
      <Header>
        <Title>Products</Title>
        <Filters>
          <SearchInput
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={handleSearchChange}
          />
          <Select value={selectedCategory} onChange={handleCategoryChange}>
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Filters>
      </Header>

      {loading ? (
        <LoadingMessage>Loading products...</LoadingMessage>
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : products && products.data.data.length > 0 ? (
        <>
          <ProductGrid>
            {products.data.data.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>
          {renderPagination()}
        </>
      ) : (
        <LoadingMessage>No products found.</LoadingMessage>
      )}
    </Container>
  );
};

export default Products;