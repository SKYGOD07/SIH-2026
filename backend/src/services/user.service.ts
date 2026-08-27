export class UserService {
  async getAllUsers() {
    return [
      {
        id: 'usr-1',
        email: 'admin@logistics.com',
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    ];
  }

  async getUserById(id: string) {
    return {
      id,
      email: 'customer@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
    };
  }
}

export const userService = new UserService();
