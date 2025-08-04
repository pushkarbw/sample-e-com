import { CartItem } from '../models';
import { v4 as uuidv4 } from 'uuid';

class CartRepository {
  private cartItems: CartItem[] = [];

  async findByUserId(userId: string): Promise<CartItem[]> {
    return this.cartItems.filter(item => item.userId === userId);
  }

  async findByUserIdAndProductId(userId: string, productId: string): Promise<CartItem | null> {
    return this.cartItems.find(item => 
      item.userId === userId && item.productId === productId
    ) || null;
  }

  async create(cartData: Omit<CartItem, 'id' | 'addedAt'>): Promise<CartItem> {
    const cartItem: CartItem = {
      id: uuidv4(),
      ...cartData,
      addedAt: new Date()
    };
    this.cartItems.push(cartItem);
    return cartItem;
  }

  async update(id: string, updates: Partial<CartItem>): Promise<CartItem | null> {
    const index = this.cartItems.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.cartItems[index] = {
      ...this.cartItems[index],
      ...updates
    };
    return this.cartItems[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.cartItems.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.cartItems.splice(index, 1);
    return true;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const initialLength = this.cartItems.length;
    this.cartItems = this.cartItems.filter(item => item.userId !== userId);
    return this.cartItems.length < initialLength;
  }

  async deleteByUserIdAndProductId(userId: string, productId: string): Promise<boolean> {
    const index = this.cartItems.findIndex(item => 
      item.userId === userId && item.productId === productId
    );
    if (index === -1) return false;
    
    this.cartItems.splice(index, 1);
    return true;
  }

  async findById(id: string): Promise<CartItem | null> {
    return this.cartItems.find(item => item.id === id) || null;
  }
}

export default new CartRepository();