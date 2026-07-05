export interface UserProfile {
  id: number;
  email: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  id: number;
  email: string;
  username: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  id: number;
  email: string;
  username: string;
  roles: string[];
}
