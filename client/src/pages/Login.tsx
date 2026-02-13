import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import './Login.css';


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement actual login logic here 
        // using temporary console log for now for testing
        if (email === 'test@gmail.com' && password === 'test') {
            navigate('/dashboard');
        } else {
            alert('Invalid credentials');
        }
    };

    // apply css styles to login page ./pages/Login.css
    return(
        <div className='login-container'>
        <h1>WELCOME TO VIE</h1>
        <h3>Gamify your learning experience!</h3>
        <form className='login-form' onSubmit={handleLogin}>
            <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
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