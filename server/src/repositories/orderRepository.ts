import { Order, OrderStatus, PaginationParams, PaginatedResponse } from '../models';
import { v4 as uuidv4 } from 'uuid';

class OrderRepository {
  private orders: Order[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Pre-seed with sample orders (empty for now, will be populated as users place orders)
  }

  async findByUserId(userId: string, params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    const userOrders = this.orders.filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = userOrders.length;
    let paginatedOrders = userOrders;

    if (params) {
      const { page, limit } = params;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      paginatedOrders = userOrders.slice(startIndex, endIndex);
    }

    return {
      data: paginatedOrders,
      pagination: params ? {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      } : {
        page: 1,
        limit: total,
        total,
        totalPages: 1
      }
    };
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find(order => order.id === id) || null;
  }

  async create(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const order: Order = {
      id: uuidv4(),
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.push(order);
    return order;
  }

  async update(id: string, updates: Partial<Order>): Promise<Order | null> {
    const index = this.orders.findIndex(order => order.id === id);
    if (index === -1) return null;

    this.orders[index] = {
      ...this.orders[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.orders[index];
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<boolean> {
    const index = this.orders.findIndex(order => order.id === id);
    if (index === -1) return false;
    
    this.orders.splice(index, 1);
    return true;
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    const allOrders = this.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = allOrders.length;
    let paginatedOrders = allOrders;

    if (params) {
      const { page, limit } = params;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      paginatedOrders = allOrders.slice(startIndex, endIndex);
    }

    return {
      data: paginatedOrders,
      pagination: params ? {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      } : {
        page: 1,
        limit: total,
        total,
        totalPages: 1
      }
    };
  }
}

export default new OrderRepository();