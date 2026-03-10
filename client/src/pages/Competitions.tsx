import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Competition, VieServer, UserSearchResult } from '../services/api';

export default function Competitions() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [opponentQuery, setOpponentQuery] = useState('');
    const [opponentResults, setOpponentResults] = useState<UserSearchResult[]>([]);
    const [selectedOpponent, setSelectedOpponent] = useState<UserSearchResult | null>(null);
    const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [servers, setServers] = useState<VieServer[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<number | undefined>(undefined);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [gameActive, setGameActive] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const navigate = useNavigate();

    const loadCompetitions = async () => {
        try {
            const data = await apiService.getCompetitions(selectedServerId);
            setCompetitions(data);
            if (selectedCompetition) {
                const updated = data.find(c => c.id === selectedCompetition.id);
                if (updated) {
                    setSelectedCompetition(updated);
                    if (updated.status === 'COMPLETED') {
                        setGameActive(false);
                        if (timerRef.current) clearInterval(timerRef.current);
                    }
                }
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
            const serversData = await apiService.getServers();
            setServers(serversData);
            const saved = localStorage.getItem('selectedServerId');
            if (saved) setSelectedServerId(Number(saved));
            await loadCompetitions();
        } catch (error) {
            console.error('Failed to load data:', error);
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

    const startGame = useCallback((competition: Competition) => {
        if (!competition.started_at) return;
        const startedAt = new Date(competition.started_at).getTime();
        const duration = competition.duration_seconds * 1000;
        const endTime = startedAt + duration;
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

        if (remaining <= 0) {
            setTimeLeft(0);
            setGameActive(false);
            loadCompetitions();
            return;
        }

        setTimeLeft(remaining);
        setGameActive(true);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            const now = Date.now();
            const left = Math.max(0, Math.ceil((endTime - now) / 1000));
            setTimeLeft(left);
            if (left <= 0) {
                setGameActive(false);
                if (timerRef.current) clearInterval(timerRef.current);
                loadCompetitions();
            }
        }, 200);
    }, []);

    const handleCircleClick = async () => {
        if (!selectedCompetition || !gameActive) return;
        try {
            const result = await apiService.clickCompetition(selectedCompetition.id);
            setSelectedCompetition(result.competition);
            if (result.competition.status === 'COMPLETED') {
                setGameActive(false);
                if (timerRef.current) clearInterval(timerRef.current);
                setTimeLeft(0);
            }
            // Send WebSocket update
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'task_completed',
                    task_id: 0,
                    user: 'current_user',
                    challenger_score: result.competition.challenger_score,
                    opponent_score: result.competition.opponent_score
                }));
            }
        } catch (error) {
            console.error('Failed to record click:', error);
        }
    };

    useEffect(() => {
        if (selectedCompetition && selectedCompetition.status === 'ACTIVE' && selectedCompetition.started_at) {
            startGame(selectedCompetition);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [selectedCompetition?.id, selectedCompetition?.status, startGame]);

    return (
        <div className='vie-app-page' style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>⚔️ Competitions</h1>
                <div>
                    <button onClick={() => setShowCreate(!showCreate)} style={{ marginRight: '10px' }}>
                        {showCreate ? 'Cancel' : 'New Competition'}
                    </button>
                    <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
                </div>
            </div>

            {showCreate && (
                <form onSubmit={handleCreateCompetition} style={{
                    background: '#f9f9f9',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <h3>Create New Competition</h3>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Search opponent by name or username..."
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
                                background: 'white',
                                border: '1px solid #ddd',
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
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <strong>{user.username}</strong>
                                        {(user.first_name || user.last_name) && (
                                            <span style={{ color: '#666', marginLeft: '8px' }}>
                                                {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button type="submit" disabled={!selectedOpponent}>Create</button>
                </form>
            )}

            <div style={{ marginBottom: '20px' }}>
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
                    <button onClick={() => {
                        setSelectedCompetition(null);
                        setGameActive(false);
                        setTimeLeft(null);
                        if (timerRef.current) clearInterval(timerRef.current);
                    }} style={{ marginBottom: '10px' }}>
                        ← Back to List
                    </button>
                    <div style={{ 
                        background: 'white', 
                        border: '2px solid #4CAF50',
                        padding: '20px', 
                        borderRadius: '8px'
                    }}>
                        <h2>{selectedCompetition.challenger_username} vs {selectedCompetition.opponent_username}</h2>

                        {/* Timer display */}
                        {selectedCompetition.status === 'ACTIVE' && timeLeft !== null && (
                            <div style={{ textAlign: 'center', margin: '10px 0' }}>
                                <span style={{
                                    fontSize: '48px',
                                    fontWeight: 'bold',
                                    color: timeLeft <= 5 ? '#f44336' : '#333'
                                }}>
                                    ⏱ {timeLeft}s
                                </span>
                            </div>
                        )}

                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-around', 
                            margin: '20px 0',
                            padding: '15px',
                            background: '#f5f5f5',
                            borderRadius: '8px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <h3>{selectedCompetition.challenger_username}</h3>
                                <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{selectedCompetition.challenger_score}</p>
                                <p style={{ color: '#888' }}>clicks</p>
                            </div>
                            <div style={{ fontSize: '32px', alignSelf: 'center' }}>VS</div>
                            <div style={{ textAlign: 'center' }}>
                                <h3>{selectedCompetition.opponent_username}</h3>
                                <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{selectedCompetition.opponent_score}</p>
                                <p style={{ color: '#888' }}>clicks</p>
                            </div>
                        </div>

                        {/* Circle clicking area */}
                        {selectedCompetition.status === 'ACTIVE' && gameActive && (
                            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                <p style={{ marginBottom: '15px', fontSize: '18px' }}>Click the circle as fast as you can!</p>
                                <div
                                    onClick={handleCircleClick}
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                                        margin: '0 auto',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        userSelect: 'none',
                                        boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                                        transition: 'transform 0.1s',
                                    }}
                                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                >
                                    TAP!
                                </div>
                            </div>
                        )}

                        {/* Completed state */}
                        {selectedCompetition.status === 'COMPLETED' && (
                            <div style={{ textAlign: 'center', margin: '20px 0', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
                                <h3>🏆 Competition Complete!</h3>
                                {selectedCompetition.challenger_score > selectedCompetition.opponent_score ? (
                                    <p style={{ fontSize: '20px', color: '#4CAF50' }}>
                                        {selectedCompetition.challenger_username} wins!
                                    </p>
                                ) : selectedCompetition.opponent_score > selectedCompetition.challenger_score ? (
                                    <p style={{ fontSize: '20px', color: '#4CAF50' }}>
                                        {selectedCompetition.opponent_username} wins!
                                    </p>
                                ) : (
                                    <p style={{ fontSize: '20px', color: '#FFA500' }}>It's a tie!</p>
                                )}
                            </div>
                        )}

                        {/* Waiting state */}
                        {selectedCompetition.status === 'ACTIVE' && !gameActive && timeLeft === 0 && (
                            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                <p>⏳ Time's up! Loading final results...</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <h2>Active Competitions</h2>
                    {competitions.filter(c => c.status === 'ACTIVE').length > 0 ? (
                        competitions.filter(c => c.status === 'ACTIVE').map(competition => (
                            <div key={competition.id} style={{
                                background: 'white',
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
                            <div key={competition.id} style={{
                                background: 'white',
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
                            <div key={competition.id} style={{
                                background: 'white',
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
