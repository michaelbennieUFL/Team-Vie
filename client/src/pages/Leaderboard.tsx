import { useState, useEffect } from 'react';
import ProtectedNav from '../components/ProtectedNav';
import { apiService } from '../services/api';
import type { LeaderboardEntry, VieServer } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [region, setRegion] = useState('');
    const [servers, setServers] = useState<VieServer[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<number | undefined>(undefined);
    const { isDarkMode, toggleTheme } = useAppTheme();

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadServers();
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadLeaderboard();
    }, [region, selectedServerId]);

    return (
        <div className={`vie-app-page ${isDarkMode ? 'theme-dark' : 'theme-light'}`} style={{ width: '100%', padding: '28px 5vw 48px' }}>
            <ProtectedNav isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
            <div className="page-section page-section-tight" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0 }}><i className="fa-solid fa-trophy" style={{ marginRight: '10px', color: '#FFD700' }} />Leaderboard</h1>
                    <p style={{ margin: '8px 0 0', color: 'var(--app-text-muted)' }}>
                        Ranked by this week&apos;s competitive points and who reaches the finish line first.
                    </p>
                </div>
            </div>

            <div className="page-section page-section-tight" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
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

            <div className="page-section page-section-tight">
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--app-text)' }}>
                    <thead>
                        <tr style={{ background: 'var(--app-surface-muted)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--app-border)' }}>Rank</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--app-border)' }}>Username</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--app-border)' }}>Weekly Points</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--app-border)' }}>Streak <i className="fa-solid fa-fire" style={{ color: '#FF6B35' }} /></th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--app-border)' }}>Region</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry, index) => (
                            <tr key={index} style={{
                                background: index % 2 === 0 ? 'var(--app-surface)' : 'var(--app-surface-subtle)',
                                borderBottom: '1px solid var(--app-border)'
                            }}>
                                <td style={{ padding: '12px' }}>
                                    {entry.rank === 1 && '🥇'}
                                    {entry.rank === 2 && '🥈'}
                                    {entry.rank === 3 && '🥉'}
                                    {entry.rank > 3 && entry.rank}
                                </td>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{entry.username}</td>
                                <td style={{ padding: '12px' }}>
                                    {entry.points}
                                    {entry.goal_reached ? (
                                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#2d9d5b', fontWeight: 600 }}>Finished</span>
                                    ) : null}
                                </td>
                                <td style={{ padding: '12px' }}>{entry.current_streak} days</td>
                                <td style={{ padding: '12px' }}>{entry.region || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {leaderboard.length === 0 && (
                <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--app-text-muted)' }}>
                    No users on the leaderboard yet.
                </p>
            )}
        </div>
    );
}
