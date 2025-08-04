import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';
import { mockUser } from '../utils/test-utils';
import apiClient from '../services/apiClient';

// Mock the API client
jest.mock('../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with no user and not loading', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login user successfully', async () => {
    const loginData = { email: 'test@example.com', password: 'password123' };
    mockedApiClient.login.mockResolvedValueOnce({ user: mockUser, token: 'mock-token' });
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login(loginData.email, loginData.password);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('should handle login error', async () => {
    const loginData = { email: 'test@example.com', password: 'wrong' };
    mockedApiClient.login.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      try {
        await result.current.login(loginData.email, loginData.password);
      } catch (error) {
        // Error expected
      }
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should signup user successfully', async () => {
    const signupData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe'
    };
    mockedApiClient.signup.mockResolvedValueOnce({ user: mockUser, token: 'mock-token' });
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signup(signupData);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('should logout user successfully', async () => {
    localStorage.setItem('token', 'mock-token');
    mockedApiClient.logout.mockResolvedValueOnce(undefined);
    
    const { result } = renderHook(() => useAuth());
    
    // Set initial user state
    await act(async () => {
      result.current.user = mockUser;
    });
    
    await act(async () => {
      await result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should check auth status on mount when token exists', async () => {
    localStorage.setItem('token', 'mock-token');
    mockedApiClient.getProfile.mockResolvedValueOnce(mockUser);
    
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isLoading).toBe(true);
    
    await act(async () => {
      // Wait for initial auth check
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle invalid token on mount', async () => {
    localStorage.setItem('token', 'invalid-token');
    mockedApiClient.getProfile.mockRejectedValueOnce(new Error('Unauthorized'));
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      // Wait for initial auth check
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should update loading state during operations', async () => {
    const { result } = renderHook(() => useAuth());
    
    const loginPromise = act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    expect(result.current.isLoading).toBe(true);
    
    await loginPromise;
    
    expect(result.current.isLoading).toBe(false);
  });

  it('should refresh user profile', async () => {
    localStorage.setItem('token', 'mock-token');
    mockedApiClient.getProfile.mockResolvedValueOnce(mockUser);
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.refreshUser();
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(mockedApiClient.getProfile).toHaveBeenCalled();
  });
});