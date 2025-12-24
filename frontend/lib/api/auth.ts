const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  email: string;
  first_name:  string;
  last_name:  string;
  full_name: string;
  avatar?:  string;
  provider?:  string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
  is_new_user?:  boolean;
}

// Email/Password Auth
export async function register(data: {
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/users/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.email?.[0] || error.password?.[0] || 'Registration failed');
  }
  
  return res.json();
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/users/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON. stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  
  return res. json();
}

// Google OAuth
export async function googleAuth(idToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/users/auth/google/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error. error || 'Google authentication failed');
  }
  
  return res.json();
}

// Get user profile
export async function getProfile(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/profile/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

// Logout
export async function logout(refreshToken: string): Promise<void> {
  await fetch(`${API_URL}/users/logout/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON. stringify({ refresh: refreshToken }),
  });
}