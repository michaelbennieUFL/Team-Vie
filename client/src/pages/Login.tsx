import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../LoginPage.css';
import { apiService } from '../services/api';


export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await apiService.login(username, password);
            localStorage.setItem('user', JSON.stringify(response.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        }
    };

    return (
        <div className="login-page">
            <Link className="ghost-btn login-back" to="/">
                <i className="fa-solid fa-arrow-left" />
                Back to main page
            </Link>

            <section className="login-shell">
                <div className="login-brand">
                    <span className="brand-mark">V</span>
                    <div>
                        <p className="brand-name">Welcome back to Vie</p>
                        <p className="brand-tag">Accountability, turned competitive.</p>
                    </div>
                </div>

                <h1>Sign in</h1>
                <p className="login-subtitle">Use your username and password to continue.</p>

                {error && (
                    <div style={{ color: '#c5203f', fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleLogin}>
                    <label>
                        Username
                        <input
                            type="text"
                            placeholder="demo"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit" className="primary-btn full-width">
                        Sign in
                        <i className="fa-solid fa-arrow-right-to-bracket" />
                    </button>
                </form>
                <p className="login-meta">
                    Don&apos;t have an account? <Link to="/register">Register here</Link>
                </p>
            </section>
        </div>
    );
}
