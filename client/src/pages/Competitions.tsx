import React, { useState, useEffect } from 'react';
import ProtectedNav from '../components/ProtectedNav';
import { apiService } from '../services/api';
import type { Competition, User, VieServer, UserSearchResult } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';

export default function Competitions() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [opponentQuery, setOpponentQuery] = useState('');
    const [opponentResults, setOpponentResults] = useState<UserSearchResult[]>([]);
    const [selectedOpponent, setSelectedOpponent] = useState<UserSearchResult | null>(null);
    const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [servers, setServers] = useState<VieServer[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<number | undefined>(undefined);
    const { isDarkMode, toggleTheme } = useAppTheme();

    const loadCompetitions = async () => {
        try {
            const data = await apiService.getCompetitions(selectedServerId);
            setCompetitions(data);
            if (selectedCompetition) {
                const updated = data.find(c => c.id === selectedCompetition.id);
                if (updated) setSelectedCompetition(updated);
            }
        } catch (error) {
            console.error('Failed to load competitions:', error);
        }
    };

    const connectWebSocket = (competitionId: number) => {
        if (ws) ws.close();
        
        const websocket = new WebSocket(`ws://localhost:8000/ws/competition/${competitionId}/`);
        
        websocket.onopen = () => {
            console.log('WebSocket connected');
        };
        
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'task_update') {
                loadCompetitions();
            }
        };
        
        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        setWs(websocket);
    };

    const loadUserAndCompetitions = async () => {
        try {
            const user = await apiService.getCurrentUser();
            setCurrentUser(user);
            const serversData = await apiService.getServers();
            setServers(serversData);
            const saved = localStorage.getItem('selectedServerId');
            if (saved) setSelectedServerId(Number(saved));
            await loadCompetitions();
        } catch (error) {
            console.error('Failed to load user:', error);
        }
    };

    useEffect(() => {
        loadUserAndCompetitions();
        return () => {
            if (ws) ws.close();
        };
    }, []);

    useEffect(() => {
        loadCompetitions();
    }, [selectedServerId]);

    useEffect(() => {
        if (selectedCompetition && selectedCompetition.status === 'ACTIVE') {
            connectWebSocket(selectedCompetition.id);
        }
    }, [selectedCompetition]);

    const handleSearchOpponent = async (query: string) => {
        setOpponentQuery(query);
        setSelectedOpponent(null);
        if (query.trim().length < 1) {
            setOpponentResults([]);
            return;
        }
        try {
            const results = await apiService.searchUsers(query);
            setOpponentResults(results);
        } catch (error) {
            console.error('Failed to search users:', error);
        }
    };

    const handleCreateCompetition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOpponent) {
            alert('Please select an opponent from the search results.');
            return;
        }
        try {
            await apiService.createCompetition(selectedOpponent.id, selectedServerId);
            setShowCreate(false);
            setOpponentQuery('');
            setOpponentResults([]);
            setSelectedOpponent(null);
            await loadCompetitions();
            alert('Competition created! Waiting for opponent to accept.');
        } catch (error) {
            alert('Failed to create competition: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleAcceptCompetition = async (id: number) => {
        try {
            await apiService.acceptCompetition(id);
            await loadCompetitions();
            alert('Competition accepted! Let the games begin!');
        } catch (error) {
            alert('Failed to accept competition: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleCompleteTask = async (taskId: number) => {
        if (!selectedCompetition) return;
        
        try {
            await apiService.completeCompetitionTask(selectedCompetition.id, taskId);
            
            // Send WebSocket update
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'task_completed',
                    task_id: taskId,
                    user: 'current_user',
                    challenger_score: selectedCompetition.challenger_score,
                    opponent_score: selectedCompetition.opponent_score
                }));
            }
            
            await loadCompetitions();
            alert('Task completed!');
        } catch (error) {
            alert('Failed to complete task: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    return (
        <div className={`vie-app-page ${isDarkMode ? 'theme-dark' : 'theme-light'}`} style={{ width: '100%', padding: '28px 5vw 48px' }}>
            <ProtectedNav isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
            <div className="page-section page-section-tight" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>⚔️ Competitions</h1>
                <div>
                    <button onClick={() => setShowCreate(!showCreate)} style={{ marginRight: '10px' }}>
                        {showCreate ? 'Cancel' : 'New Competition'}
                    </button>
                </div>
            </div>

            {showCreate && (
                <form className="page-section" onSubmit={handleCreateCompetition} style={{
                    background: 'var(--app-surface-muted)',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: 'var(--app-text)'
                }}>
                    <h3>Create New Competition</h3>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Search opponent by username..."
                            value={opponentQuery}
                            onChange={(e) => handleSearchOpponent(e.target.value)}
                            style={{ padding: '8px', width: '300px' }}
                            autoFocus
                        />
                        {selectedOpponent && (
                            <span style={{ marginLeft: '10px', color: '#4CAF50', fontWeight: 'bold' }}>
                                ✓ {selectedOpponent.username}
                            </span>
                        )}
                        {opponentResults.length > 0 && !selectedOpponent && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                background: 'var(--app-surface)',
                                border: '1px solid var(--app-border)',
                                borderRadius: '6px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                width: '300px',
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                {opponentResults.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => {
                                            setSelectedOpponent(user);
                                            setOpponentQuery(user.username);
                                            setOpponentResults([]);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f0f0f0'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--app-surface-muted)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--app-surface)'}
                                    >
                                        {user.username}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button type="submit" disabled={!selectedOpponent}>Create</button>
                </form>
            )}

            <div className="page-section page-section-tight" style={{ marginBottom: '20px' }}>
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
            </div>

            {selectedCompetition ? (
                <div>
                    <button onClick={() => setSelectedCompetition(null)} style={{ marginBottom: '10px' }}>
                        ← Back to List
                    </button>
                    <div className="page-section" style={{ 
                        background: 'var(--app-surface)', 
                        border: '2px solid #4CAF50',
                        padding: '20px', 
                        borderRadius: '8px',
                        color: 'var(--app-text)'
                    }}>
                        <h2>{selectedCompetition.challenger_username} vs {selectedCompetition.opponent_username}</h2>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-around', 
                            margin: '20px 0',
                            padding: '15px',
                            background: 'var(--app-surface-muted)',
                            borderRadius: '8px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <h3>{selectedCompetition.challenger_username}</h3>
                                <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{selectedCompetition.challenger_score}</p>
                            </div>
                            <div style={{ fontSize: '32px', alignSelf: 'center' }}>VS</div>
                            <div style={{ textAlign: 'center' }}>
                                <h3>{selectedCompetition.opponent_username}</h3>
                                <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{selectedCompetition.opponent_score}</p>
                            </div>
                        </div>
                        
                        <h3>Tasks</h3>
                        {selectedCompetition.tasks && selectedCompetition.tasks.length > 0 ? (
                            selectedCompetition.tasks.map(task => (
                                <div key={task.id} style={{
                                    background: 'var(--app-surface-muted)',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginBottom: '10px',
                                    color: 'var(--app-text)'
                                }}>
                                    <h4>{task.title}</h4>
                                    <p>{task.description}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Points: {task.points_value}</span>
                                        <div>
                                            <span style={{ marginRight: '10px' }}>
                                                {selectedCompetition.challenger_username}: {task.challenger_completed ? '✓' : '○'}
                                            </span>
                                            <span>
                                                {selectedCompetition.opponent_username}: {task.opponent_completed ? '✓' : '○'}
                                            </span>
                                        </div>
                                        {currentUser && (
                                            (currentUser.id === selectedCompetition.challenger && !task.challenger_completed) ||
                                            (currentUser.id === selectedCompetition.opponent && !task.opponent_completed)
                                        ) && (
                                            <button onClick={() => handleCompleteTask(task.id)}>
                                                Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No tasks in this competition yet.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <h2>Active Competitions</h2>
                    {competitions.filter(c => c.status === 'ACTIVE').length > 0 ? (
                        competitions.filter(c => c.status === 'ACTIVE').map(competition => (
                            <div key={competition.id} className="page-section page-section-tight" style={{
                                background: 'var(--app-surface)',
                                border: '2px solid #4CAF50',
                                padding: '15px',
                                borderRadius: '8px',
                                marginBottom: '10px',
                                cursor: 'pointer'
                            }} onClick={() => setSelectedCompetition(competition)}>
                                <h3>{competition.challenger_username} vs {competition.opponent_username}</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
                                    <span>{competition.challenger_username}: {competition.challenger_score}</span>
                                    <span>{competition.opponent_username}: {competition.opponent_score}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No active competitions.</p>
                    )}

                    <h2 style={{ marginTop: '30px' }}>Pending Invitations</h2>
                    {competitions.filter(c => c.status === 'PENDING').length > 0 ? (
                        competitions.filter(c => c.status === 'PENDING').map(competition => (
                            <div key={competition.id} className="page-section page-section-tight" style={{
                                background: 'var(--app-surface)',
                                border: '2px solid #FFA500',
                                padding: '15px',
                                borderRadius: '8px',
                                marginBottom: '10px'
                            }}>
                                <h3>{competition.challenger_username} vs {competition.opponent_username}</h3>
                                <button onClick={() => handleAcceptCompetition(competition.id)}>
                                    Accept Competition
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>No pending invitations.</p>
                    )}

                    <h2 style={{ marginTop: '30px' }}>Completed Competitions</h2>
                    {competitions.filter(c => c.status === 'COMPLETED').length > 0 ? (
                        competitions.filter(c => c.status === 'COMPLETED').map(competition => (
                            <div key={competition.id} className="page-section page-section-tight" style={{
                                background: 'var(--app-surface)',
                                border: '2px solid #888',
                                padding: '15px',
                                borderRadius: '8px',
                                marginBottom: '10px'
                            }}>
                                <h3>{competition.challenger_username} vs {competition.opponent_username}</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
                                    <span>{competition.challenger_username}: {competition.challenger_score}</span>
                                    <span>{competition.opponent_username}: {competition.opponent_score}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No completed competitions.</p>
                    )}
                </div>
            )}
        </div>
    );
}
