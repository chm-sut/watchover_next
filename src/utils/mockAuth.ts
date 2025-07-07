export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const mockUser: MockUser = {
  id: "1",
  name: "John Doe",
  email: "john.doe@example.com",
  role: "Admin"
};

export const isAuthenticated = (): boolean => {
  return true;
};

export const getCurrentUser = (): MockUser => {
  return mockUser;
};