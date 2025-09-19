import { User } from '../models';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

class UserRepository {
  private users: User[] = [];

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Pre-seed with test users
    const testUsers = [
      {
        email: 'john@example.com',
        password: 'Ecomm@123',
        firstName: 'John',
        lastName: 'Doe'
      },
      {
        email: 'jane@example.com',
        password: 'Ecomm@123',
        firstName: 'Jane',
        lastName: 'Smith'
      }
    ];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      this.users.push({
        id: uuidv4(),
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return null;

    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.users[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }
}

export default new UserRepository();