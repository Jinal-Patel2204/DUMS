/**
 * AUTH API — Java Backend se baat karne wale functions
 *
 * Yeh file frontend (Next.js) se backend (Java Spring Boot) ke beech
 * ka bridge hai.
 *
 * Flow:
 * Frontend (React) → auth.ts → Java Backend (localhost:8080)
 *
 * fetch() = JavaScript ka built-in tool jo HTTP requests bhejta hai
 * (jaise Postman karta hai, but code se)
 */

// Java backend ka base URL
const API_URL = 'http://localhost:8080/api';

// ─────────────────────────────────────────────
// TYPES — Data ka format define karo
// ─────────────────────────────────────────────

/** Login ke liye kya bhejenge */
export interface LoginData {
  email: string;
  password: string;
}

/** Register ke liye kya bhejenge */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/** Backend se kya aayega (response) */
export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  role: string;
}

// ─────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────

/**
 * LOGIN — Java backend se login karo
 *
 * Yeh function:
 * 1. Email + password backend ko bhejta hai
 * 2. Backend check karta hai (password match karta hai?)
 * 3. Agar sahi → token return hota hai
 * 4. Token localStorage mein save karte hain
 *
 * fetch() ka breakdown:
 * - URL: kahan bhejni hai request
 * - method: POST (data bhej rahe hain)
 * - headers: "Main JSON bhej raha hoon" batata hai
 * - body: actual data (JSON string mein convert)
 */
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',  // "Mera data JSON format mein hai"
    },
    body: JSON.stringify(data),  // {email, password} → '{"email":"..","password":".."}'
  });

  // Agar response OK nahi hai (401, 403, 500 etc.)
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  // Success → token + user info milega
  const result: AuthResponse = await response.json();

  // Token browser mein save karo (next requests mein use hoga)
  localStorage.setItem('token', result.token);
  localStorage.setItem('user', JSON.stringify(result));

  // Cookie mein bhi save karo (middleware ke liye)
  document.cookie = `auth-token=${result.token}; path=/; max-age=86400`;

  return result;
}

/**
 * REGISTER — Naya account banao
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  const result: AuthResponse = await response.json();

  // Token save karo
  localStorage.setItem('token', result.token);
  localStorage.setItem('user', JSON.stringify(result));

  // Cookie mein bhi save karo (middleware ke liye)
  document.cookie = `auth-token=${result.token}; path=/; max-age=86400`;

  return result;
}

/**
 * LOGOUT — Token delete karo (locally)
 */
export function logoutUser(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Cookie bhi delete karo
  document.cookie = 'auth-token=; path=/; max-age=0';
}

/**
 * GET TOKEN — Saved token lo (protected API calls ke liye)
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null; // Server-side pe localStorage nahi hota
  return localStorage.getItem('token');
}

/**
 * GET USER — Current logged-in user ki info
 */
export function getCurrentUser(): AuthResponse | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

/**
 * AUTHENTICATED FETCH — Token ke saath API call karo
 *
 * Protected endpoints ke liye use hoga:
 * "Authorization: Bearer eyJhbGci..."
 *
 * Jaise concert mein wristband dikhate ho gate pe,
 * yeh har request mein token header mein bhejta hai
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',  // Token header mein bhejo
      ...options.headers,
    },
  });

  // Agar 401/403 aaye → token expired ya invalid → logout
  if (response.status === 401 || response.status === 403) {
    logoutUser();
    window.location.href = '/login';  // Login page pe bhej do
  }

  return response;
}
