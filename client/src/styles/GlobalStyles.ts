import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
  }

  main {
    min-height: calc(100vh - 80px);
    padding: 20px;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  button {
    border: none;
    border-radius: 4px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .btn-primary {
    background-color: #007bff;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #0056b3;
    }
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #545b62;
    }
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #c82333;
    }
  }

  .btn-outline {
    background-color: transparent;
    border: 2px solid #007bff;
    color: #007bff;
    
    &:hover:not(:disabled) {
      background-color: #007bff;
      color: white;
    }
  }

  input, textarea, select {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: #007bff;
    }
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #555;
  }

  .error-message {
    color: #dc3545;
    font-size: 12px;
    margin-top: 5px;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
  }

  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 20px;
  }

  .grid {
    display: grid;
    gap: 20px;
  }

  .grid-2 {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .grid-3 {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .grid-4 {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  @media (max-width: 768px) {
    .container {
      padding: 0 15px;
    }
    
    main {
      padding: 15px;
    }
    
    .grid-2, .grid-3, .grid-4 {
      grid-template-columns: 1fr;
    }
  }
`;