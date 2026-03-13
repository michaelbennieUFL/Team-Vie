import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import '../LoginPage.css';
import { useAppTheme } from '../hooks/useAppTheme';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isDarkMode } = useAppTheme();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            await apiService.register(formData);
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        }
    };

    return (
        <div className={`login-page ${isDarkMode ? 'login-page-dark' : ''}`}>
            <Link className="ghost-btn login-back" to="/">
                <i className="fa-solid fa-arrow-left" />
                Back to main page
            </Link>

            <section className="login-shell">
                <div className="login-brand">
                    <span className="brand-mark">V</span>
                    <div>
                        <p className="brand-name">Create your Vie account</p>
                        <p className="brand-tag">Compete, track streaks, and stay consistent.</p>
                    </div>
                </div>

                <h1>Register</h1>
                <p className="login-subtitle">Create your profile and start earning points.</p>

                {error && (
                    <div style={{ color: '#c5203f', fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <label>
                        Username
                        <input
                            type="text"
                            name="username"
                            placeholder="choose a username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label>
                        Email
                        <input
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label>
                        First Name
                        <input
                            type="text"
                            name="first_name"
                            placeholder="Jane"
                            value={formData.first_name}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Last Name
                        <input
                            type="text"
                            name="last_name"
                            placeholder="Doe"
                            value={formData.last_name}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label>
                        Confirm Password
                        <input
                            type="password"
                            name="password_confirm"
                            placeholder="Repeat password"
                            value={formData.password_confirm}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <button type="submit" className="primary-btn full-width">
                        Create account
                        <i className="fa-solid fa-user-plus" />
                    </button>
                </form>

                <p className="login-meta">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </section>
        </div>
    );
}
