import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

interface RegisterProps {
    onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres');
            return;
        }

        setLoading(true);

        try {
            await register({ email, password });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao registrar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Crie uma conta</h2>
                <p className="auth-subtitle">Junte-se a nós para começar a planejar sua aposentadoria!</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                            disabled={loading}
                            autoComplete="username"
                            onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Por favor, preencha este campo.')}
                            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Pelo menos 8 caracteres"
                            disabled={loading}
                            minLength={8}
                            autoComplete="new-password"
                            onInvalid={(e) => {
                                const target = e.target as HTMLInputElement;
                                if (target.validity.valueMissing) {
                                    target.setCustomValidity('Por favor, preencha este campo.');
                                } else if (target.validity.tooShort) {
                                    target.setCustomValidity('A senha deve ter pelo menos 8 caracteres.');
                                }
                            }}
                            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmar Senha</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-insira sua senha"
                            disabled={loading}
                            minLength={8}
                            autoComplete="new-password"
                            onInvalid={(e) => {
                                const target = e.target as HTMLInputElement;
                                if (target.validity.valueMissing) {
                                    target.setCustomValidity('Por favor, preencha este campo.');
                                } else if (target.validity.tooShort) {
                                    target.setCustomValidity('A senha deve ter pelo menos 8 caracteres.');
                                }
                            }}
                            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Criando conta...' : 'Criar Conta'}
                    </button>
                </form>

                <div className="auth-links">
                    <span>Já tem uma conta?</span>
                    <button onClick={onSwitchToLogin} className="link-button">
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};
