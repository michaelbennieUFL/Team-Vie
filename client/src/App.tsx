import { useMemo, useState, type FormEvent } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Leaderboard from './pages/Leaderboard';
import Competitions from './pages/Competitions';
import Overview from './pages/Overview';
import Schedule from './pages/Schedule';

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/competitions" element={<Competitions />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

function App() {
  const [page, setPage] = useState<'landing' | 'login' | 'dashboard'>('landing')

  if (page === 'landing') {
    return (
      <LandingPage
        onOpenDashboard={() => setPage('dashboard')}
        onOpenLogin={() => setPage('login')}
      />
    )
  }

  if (page === 'login') {
    return <LoginPage onBack={() => setPage('landing')} onLogin={() => setPage('dashboard')} />
  }

  return <DashboardPage onBack={() => setPage('landing')} />
}

export default App
