import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { LeaderboardEntry, VieServer } from '../services/api';

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [region, setRegion] = useState('');
    const [servers, setServers] = useState<VieServer[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<number | undefined>(undefined);
    const navigate = useNavigate();

    const loadServers = async () => {
        try {
            const data = await apiService.getServers();
            setServers(data);
            const saved = localStorage.getItem('selectedServerId');
            if (saved) setSelectedServerId(Number(saved));
        } catch (error) {
            console.error('Failed to load servers:', error);
        }
    };

    const loadLeaderboard = async () => {
        try {
            const data = await apiService.getLeaderboard(region || undefined, selectedServerId);
            setLeaderboard(data);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    };

    useEffect(() => {
        loadServers();
    }, []);

    useEffect(() => {
        loadLeaderboard();
    }, [region, selectedServerId]);

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>🏆 Leaderboard</h1>
                <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                    value={selectedServerId || ''}
                    onChange={(e) => setSelectedServerId(e.target.value ? Number(e.target.value) : undefined)}
                    style={{ padding: '8px' }}
                >
                    <option value="">All Servers</option>
                    {servers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Filter by region (optional)"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    style={{ padding: '8px', width: '200px' }}
                />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Rank</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Username</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Points</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Streak 🔥</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Region</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((entry, index) => (
                        <tr key={index} style={{ 
                            background: index % 2 === 0 ? 'white' : '#f9f9f9',
                            borderBottom: '1px solid #eee'
                        }}>
                            <td style={{ padding: '12px' }}>
                                {entry.rank === 1 && '🥇'}
                                {entry.rank === 2 && '🥈'}
                                {entry.rank === 3 && '🥉'}
                                {entry.rank > 3 && entry.rank}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{entry.username}</td>
                            <td style={{ padding: '12px' }}>{entry.points}</td>
                            <td style={{ padding: '12px' }}>{entry.current_streak} days</td>
                            <td style={{ padding: '12px' }}>{entry.region || 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {leaderboard.length === 0 && (
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
                    No users on the leaderboard yet.
                </p>
            )}
        </div>
    );
}
