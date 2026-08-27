export class AuthService {
  async register(data: { email: string; firstName: string; lastName: string; role?: string }) {
    return {
      user: {
        id: 'mock-user-id',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'CUSTOMER',
      },
      token: 'mock-jwt-token-placeholder',
    };
  }

  async login(data: { email: string }) {
    return {
      user: {
        id: 'mock-user-id',
        email: data.email,
        role: 'CUSTOMER',
      },
      token: 'mock-jwt-token-placeholder',
    };
  }

  async getSession(userId: string) {
    return {
      id: userId,
      email: 'user@example.com',
      role: 'CUSTOMER',
    };
  }
}

export const authService = new AuthService();
