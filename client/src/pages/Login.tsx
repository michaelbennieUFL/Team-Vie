import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import './Login.css';
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

    return(
        <div className='login-container'>
        <h1>WELCOME TO VIE</h1>
        <h3>Gamify your learning experience!</h3>
        
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        
        <form className='login-form' onSubmit={handleLogin}>
            <input 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
            />
            <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
            />
            <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <a href="/register">Register here</a></p>

        
        </div>
    )
}