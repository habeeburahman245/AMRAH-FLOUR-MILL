export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  imageUrls: string[];
  category: string;
  brand: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Review {
  username: string;
  rating: number;
  comment: string;
}

export type UserStatus = 'active' | 'blocked';
export type UserRole = 'admin' | 'manager' | 'editor';

export interface User {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: UserStatus;
  orderCount: number;
  avatar: string;
}

export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

export interface Order {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: OrderStatus;
  itemsList: OrderItem[];
  shippingAddress: string;
}

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  newCustomers: number;
  salesByDay: number[];
  topProducts: { name: string; sales: number }[];
  salesByCategory: { category: string; sales: number }[];
}

export interface Banner {
    id: string;
    title: string;
    link: string;
    imageUrl: string;
    isActive: boolean;
}

export type NotificationType = 'order' | 'stock' | 'review';

export interface AdminNotification {
    id: string;
    type: NotificationType;
    message: string;
    date: string; // ISO 8601 string
    isRead: boolean;
}