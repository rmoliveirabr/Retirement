import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading, logout } = useAuth();
    const [authView, setAuthView] = useState<AuthView>('login');

    // Check if we're on a password reset URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasResetToken = urlParams.has('token') && urlParams.has('email');

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '24px',
                fontWeight: 600
            }}>
                Loading...
            </div>
        );
    }

    // If user is not authenticated, show auth screens
    if (!user) {
        if (hasResetToken) {
            return <ResetPassword onSuccess={() => setAuthView('login')} />;
        }

        switch (authView) {
            case 'register':
                return <Register onSwitchToLogin={() => setAuthView('login')} />;
            case 'forgot-password':
                return <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />;
            case 'login':
            default:
                return (
                    <Login
                        onSwitchToRegister={() => setAuthView('register')}
                        onSwitchToForgotPassword={() => setAuthView('forgot-password')}
                    />
                );
        }
    }

    // User is authenticated, show the main app with a logout button
    return (
        <div>
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                background: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                <div style={{ fontSize: '14px', color: '#666' }}>
                    <strong>{user.email}</strong>
                    {user.role === 'admin' && (
                        <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            background: '#667eea',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600
                        }}>
                            ADMIN
                        </span>
                    )}
                </div>
                <button
                    onClick={logout}
                    style={{
                        padding: '8px 16px',
                        background: '#f56565',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e53e3e'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#f56565'}
                >
                    Logout
                </button>
            </div>
            {children}
        </div>
    );
};
