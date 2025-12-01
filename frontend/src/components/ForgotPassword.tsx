import React, { useState } from 'react';
import { authService } from '../services/authService';
import './Auth.css';

interface ForgotPasswordProps {
    onSwitchToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [resetLink, setResetLink] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            const response = await authService.requestPasswordReset(email);
            setResetLink(response.resetLink);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Forgot Password</h2>
                <p className="auth-subtitle">Enter your email to receive a password reset link.</p>

                {error && <div className="error-message">{error}</div>}
                {success && (
                    <div className="success-message">
                        <p>Password reset link has been generated!</p>
                        <div className="reset-link-box">
                            <p><strong>Reset Link:</strong></p>
                            <a href={resetLink} target="_blank" rel="noopener noreferrer" className="reset-link">
                                {resetLink}
                            </a>
                            <p className="note">
                                Note: In production, this link would be sent to your email.
                                For now, please click the link above or copy it.
                            </p>
                        </div>
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="your@email.com"
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div className="auth-links">
                    <button onClick={onSwitchToLogin} className="link-button">
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};
