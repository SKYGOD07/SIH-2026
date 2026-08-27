export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER';
}

export interface GeolocationPayload {
  orderId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}
