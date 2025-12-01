import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export interface User {
    id: string;
    email: string;
    role: string;
    createdAt: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface RegisterData {
    email: string;
    password: string;
    role?: 'user' | 'admin';
}

export interface LoginData {
    email: string;
    password: string;
}

class AuthService {
    private tokenKey = 'auth_token';

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
    }

    removeToken(): void {
        localStorage.removeItem(this.tokenKey);
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, data);
        this.setToken(response.data.token);
        return response.data;
    }

    async login(data: LoginData): Promise<AuthResponse> {
        const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, data);
        this.setToken(response.data.token);
        return response.data;
    }

    logout(): void {
        this.removeToken();
    }

    async getCurrentUser(): Promise<User> {
        const token = this.getToken();
        if (!token) {
            throw new Error('No token found');
        }
        const response = await axios.get<User>(`${API_BASE_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }

    async requestPasswordReset(email: string): Promise<{ resetToken: string; resetLink: string }> {
        const response = await axios.post(`${API_BASE_URL}/auth/request-password-reset`, { email });
        return response.data;
    }

    async resetPassword(email: string, token: string, newPassword: string): Promise<{ message: string }> {
        const response = await axios.post(`${API_BASE_URL}/auth/reset-password/${email}`, {
            token,
            newPassword,
        });
        return response.data;
    }

    async adminResetPassword(email: string): Promise<{ resetToken: string; resetLink: string }> {
        const token = this.getToken();
        if (!token) {
            throw new Error('No token found');
        }
        const response = await axios.post(
            `${API_BASE_URL}/auth/admin/reset-password`,
            { email },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}

export const authService = new AuthService();
