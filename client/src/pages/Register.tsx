import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

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
        <div className='login-container'>
            <h1>Register for VIE</h1>
            <h3>Join the competitive productivity community!</h3>
            
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            
            <form className='login-form' onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    name="username"
                    placeholder="Username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    required 
                />
                <input 
                    type="email" 
                    name="email"
                    placeholder="Email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                />
                <input 
                    type="text" 
                    name="first_name"
                    placeholder="First Name" 
                    value={formData.first_name} 
                    onChange={handleChange} 
                />
                <input 
                    type="text" 
                    name="last_name"
                    placeholder="Last Name" 
                    value={formData.last_name} 
                    onChange={handleChange} 
                />
                <input 
                    type="password" 
                    name="password"
                    placeholder="Password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                />
                <input 
                    type="password" 
                    name="password_confirm"
                    placeholder="Confirm Password" 
                    value={formData.password_confirm} 
                    onChange={handleChange} 
                    required 
                />
                <button type="submit">Register</button>
            </form>
            
            <p>Already have an account? <a href="/login">Login here</a></p>
        </div>
    );
}
