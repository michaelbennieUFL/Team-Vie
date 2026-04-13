import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProtectedNav from '../components/ProtectedNav';
import { useToast } from '../components/ToastProvider';
import { apiService } from '../services/api';
import type { Competition, User, VieServer, UserSearchResult } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';

const WS_BASE_URL =
    (import.meta.env.VITE_WS_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
    `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

export default function Competitions() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [pointsGoal, setPointsGoal] = useState<number | ''>('');
    const [opponentQuery, setOpponentQuery] = useState('');
    const [opponentResults, setOpponentResults] = useState<UserSearchResult[]>([]);
    const [selectedOpponent, setSelectedOpponent] = useState<UserSearchResult | null>(null);
    const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [servers, setServers] = useState<VieServer[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<number | undefined>(undefined);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', difficulty: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' });
    const { isDarkMode, toggleTheme } = useAppTheme();
    const toast = useToast();

    // ─── Refs to avoid stale closures in WebSocket callbacks ──────────────────
    // Keeping a ref to the latest selectedServerId ensures the WebSocket
    // onmessage handler always re-fetches with the correct server filter,
    // even though the handler is created only once.
    const selectedServerIdRef = useRef(selectedServerId);
    const selectedCompetitionRef = useRef(selectedCompetition);
    useEffect(() => { selectedServerIdRef.current = selectedServerId; }, [selectedServerId]);
    useEffect(() => { selectedCompetitionRef.current = selectedCompetition; }, [selectedCompetition]);

    // ─── Load competitions ─────────────────────────────────────────────────────
    // useCallback so we can safely put it in the WS ref below without
    // recreating the WebSocket on every render.
    const loadCompetitions = useCallback(async (serverId?: number) => {
        try {
            // Use the passed serverId or fall back to the latest ref value
            const sid = serverId !== undefined ? serverId : selectedServerIdRef.current;
            const data = await apiService.getCompetitions(sid);
            setCompetitions(data);

            // Keep the open competition detail in sync with fresh server data
            const current = selectedCompetitionRef.current;
            if (current) {
                const updated = data.find(c => c.id === current.id);
                if (updated) setSelectedCompetition(updated);
            }
        } catch (error) {
            console.error('Failed to load competitions:', error);
        }
    }, []); // no deps — relies on refs for fresh values

    // ─── WebSocket ─────────────────────────────────────────────────────────────
    const connectWebSocket = useCallback((competitionId: number) => {
        // Close any existing socket before opening a new one
        setWs(prev => {
            if (prev) prev.close();
            return null;
        });

        const websocket = new WebSocket(`${WS_BASE_URL}/ws/competition/${competitionId}/`);

        websocket.onopen = () => {
            console.log('WebSocket connected for competition', competitionId);
        };

        websocket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                // FIX: re-fetch the full competition state from the server so
                // both players' scores are always accurate.  The old code called
                // loadCompetitions() captured in an earlier closure which still
                // held a stale selectedServerId, so the re-fetch sometimes used
                // the wrong server filter or used an old function reference.
                if (msg.type === 'task_update') {
                    loadCompetitions(); // always uses ref-based fresh values
                }
            } catch (err) {
                console.error('WebSocket message parse error:', err);
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        websocket.onclose = () => {
            console.log('WebSocket closed for competition', competitionId);
        };

        setWs(websocket);
    }, [loadCompetitions]);

    // ─── Bootstrap ────────────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const [user, serversData] = await Promise.all([
                    apiService.getCurrentUser(),
                    apiService.getServers(),
                ]);
                setCurrentUser(user);
                setServers(serversData);

                const saved = localStorage.getItem('selectedServerId');
                const sid = saved ? Number(saved) : undefined;
                if (sid) setSelectedServerId(sid);

                await loadCompetitions(sid);
            } catch (error) {
                console.error('Failed to initialise competitions page:', error);
            }
        };
        init();

        // Cleanup: close the socket when leaving the page
        return () => {
            setWs(prev => {
                if (prev) prev.close();
                return null;
            });
        };
    }, [loadCompetitions]);

    // Reload when server filter changes
    useEffect(() => {
        loadCompetitions(selectedServerId);
    }, [selectedServerId, loadCompetitions]);

    // Connect/reconnect WebSocket when the active competition changes
    useEffect(() => {
        if (selectedCompetition && selectedCompetition.status === 'ACTIVE') {
            connectWebSocket(selectedCompetition.id);
        } else {
            // Close any open socket when there is no active competition selected
            setWs(prev => {
                if (prev) prev.close();
                return null;
            });
        }
    }, [selectedCompetition?.id, selectedCompetition?.status, connectWebSocket]);

    // ─── Handlers ─────────────────────────────────────────────────────────────
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
            toast.info('Please select an opponent from the search results.');
            return;
        }
        try {
            await apiService.createCompetition(selectedOpponent.id, selectedServerId, pointsGoal ? Number(pointsGoal) : undefined);
            setShowCreate(false);
            setOpponentQuery('');
            setOpponentResults([]);
            setSelectedOpponent(null);
            await loadCompetitions();
            toast.success('Competition created. Waiting for your opponent to accept.');
        } catch (error) {
            toast.error('Failed to create competition: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleAcceptCompetition = async (id: number) => {
        try {
            await apiService.acceptCompetition(id);
            await loadCompetitions();
            toast.success('Competition accepted. Let the games begin.');
        } catch (error) {
            toast.error('Failed to accept competition: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleCompleteTask = async (taskId: number) => {
        if (!selectedCompetition) return;

        try {
            // FIX: use the competition returned by the API to immediately update
            // scores in the UI — no need to wait for the WebSocket round-trip.
            const result = await apiService.completeCompetitionTask(selectedCompetition.id, taskId);

            // Update state directly from the authoritative API response
            setSelectedCompetition(result.competition);
            setCompetitions(prev =>
                prev.map(c => c.id === result.competition.id ? result.competition : c)
            );

            // Also notify the opponent's client via WebSocket
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'task_completed',
                    task_id: taskId,
                }));
            }
        } catch (error) {
            toast.error('Failed to complete task: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    const handleDeleteCompetition = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this competition?')) return;
        try {
            await apiService.deleteCompetition(id);
            await loadCompetitions();
        } catch (error) {
            toast.error('Failed to delete competition: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompetition) return;
        if (!newTask.title.trim()) {
            toast.info('Please enter a task title.');
            return;
        }
        try {
            const result = await apiService.addCompetitionTask(selectedCompetition.id, newTask);
            setSelectedCompetition(result.competition);
            setCompetitions(prev =>
                prev.map(c => c.id === result.competition.id ? result.competition : c)
            );
            setNewTask({ title: '', description: '', difficulty: 'MEDIUM' });
            setShowAddTask(false);
        } catch (error) {
            toast.error('Failed to add task: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const openCompetitionDetail = (competition: Competition, openTaskForm = false) => {
        setSelectedCompetition(competition);
        setShowAddTask(openTaskForm);
    };

    const getGoalProgress = (score: number, goal?: number | null) => {
        if (!goal || goal <= 0) return 0;
        return Math.min(100, (score / goal) * 100);
    };

    return (
        <div className={`vie-app-page ${isDarkMode ? 'theme-dark' : 'theme-light'}`} style={{ width: '100%', padding: '28px 5vw 48px' }}>
            <ProtectedNav isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
            <div className="page-section page-section-tight" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1><i className="fa-solid fa-swords" style={{ marginRight: '10px' }} />Competitions</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                                            borderBottom: '1px solid var(--app-border)'
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
                    <div style={{ marginTop: '10px' }}>
                        <label style={{ color: 'var(--app-text)', marginRight: '10px' }}>
                            🎯 Points goal to win (optional):
                        </label>
                        <input
                            type="number"
                            min={1}
                            placeholder="e.g. 100"
                            value={pointsGoal}
                            onChange={(e) => setPointsGoal(e.target.value ? Number(e.target.value) : '')}
                            style={{ padding: '8px', width: '100px' }}
                        />
                    </div>
                    <button type="submit" disabled={!selectedOpponent} style={{ marginTop: '12px' }}>Create</button>
                </form>
            )}

            {selectedCompetition ? (
                <div>
                    <div className="page-section-tight" style={{ width: 'min(100%, 1400px)', margin: '0 auto 10px', boxSizing: 'border-box' }}>
                        <button onClick={() => setSelectedCompetition(null)}>
                            ← Back to List
                        </button>
                    </div>
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

                        {/* Points Goal Progress */}
                        {selectedCompetition.points_goal && (
                            <div style={{
                                background: 'var(--app-surface-muted)',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                color: 'var(--app-text)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span><i className="fa-solid fa-bullseye" style={{ marginRight: '6px', color: '#e74c3c' }} />First to <strong>{selectedCompetition.points_goal} pts</strong> wins!</span>
                                    <span style={{ fontSize: '13px', color: '#888' }}>
                                        {selectedCompetition.challenger_username}: {selectedCompetition.challenger_score} &nbsp;|&nbsp; {selectedCompetition.opponent_username}: {selectedCompetition.opponent_score}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', marginBottom: '3px' }}>{selectedCompetition.challenger_username}</div>
                                        <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '10px' }}>
                                            <div style={{
                                                width: `${Math.min(100, (selectedCompetition.challenger_score / selectedCompetition.points_goal) * 100)}%`,
                                                background: '#4CAF50', borderRadius: '4px', height: '10px', transition: 'width 0.3s'
                                            }} />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', marginBottom: '3px' }}>{selectedCompetition.opponent_username}</div>
                                        <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '10px' }}>
                                            <div style={{
                                                width: `${Math.min(100, (selectedCompetition.opponent_score / selectedCompetition.points_goal) * 100)}%`,
                                                background: '#2196F3', borderRadius: '4px', height: '10px', transition: 'width 0.3s'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <h3>Tasks</h3>

                        {/* Add Task Button */}
                        <div style={{ marginBottom: '12px' }}>
                            <button onClick={() => setShowAddTask(!showAddTask)} style={{
                                padding: '8px 16px',
                                background: showAddTask ? '#888' : '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}>
                                {showAddTask ? 'Cancel' : '+ Add Task'}
                            </button>
                        </div>

                        {/* Add Task Form */}
                        {showAddTask && (
                            <form onSubmit={handleAddTask} style={{
                                background: 'var(--app-surface-muted)',
                                padding: '15px',
                                borderRadius: '8px',
                                marginBottom: '15px',
                                color: 'var(--app-text)'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Task title *"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    style={{ padding: '8px', width: '100%', marginBottom: '8px', boxSizing: 'border-box' }}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Description (optional)"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    style={{ padding: '8px', width: '100%', marginBottom: '8px', boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label>Difficulty:</label>
                                    <select
                                        value={newTask.difficulty}
                                        onChange={(e) => setNewTask({ ...newTask, difficulty: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                                        style={{ padding: '8px' }}
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                    <span style={{ color: 'var(--app-text-muted)', fontSize: '13px' }}>
                                        Points are assigned automatically from difficulty.
                                    </span>
                                    <button type="submit" style={{
                                        padding: '8px 16px',
                                        background: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}>Add Task</button>
                                </div>
                            </form>
                        )}

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
                    <div className="page-section">
                        <h2 style={{ marginTop: 0 }}>Active Competitions</h2>
                        {competitions.filter(c => c.status === 'ACTIVE').length > 0 ? (
                            competitions.filter(c => c.status === 'ACTIVE').map(competition => (
                                <div key={competition.id} className="page-section-tight" style={{
                                    background: 'var(--app-surface)',
                                    border: '2px solid #4CAF50',
                                    padding: '18px',
                                    borderRadius: '8px',
                                    marginBottom: '10px',
                                    display: 'grid',
                                    gap: '14px'
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline', marginBottom: '6px' }}>
                                                <strong style={{ fontSize: '16px' }}>{competition.challenger_username}</strong>
                                                <strong style={{ fontSize: '14px' }}>{competition.challenger_score} pts</strong>
                                            </div>
                                            <div style={{ background: 'rgba(11, 13, 15, 0.08)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${competition.points_goal ? getGoalProgress(competition.challenger_score, competition.points_goal) : 100}%`,
                                                    background: 'linear-gradient(90deg, #4CAF50, #7AD97A)',
                                                    height: '100%',
                                                    borderRadius: 'inherit'
                                                }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', placeItems: 'center', minWidth: '56px', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--app-text-muted)' }}>VS</span>
                                            <i className="fa-solid fa-bullseye" aria-hidden="true" style={{ color: '#e67e22', fontSize: '18px' }} />
                                        </div>

                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline', marginBottom: '6px' }}>
                                                <strong style={{ fontSize: '14px' }}>{competition.opponent_score} pts</strong>
                                                <strong style={{ fontSize: '16px' }}>{competition.opponent_username}</strong>
                                            </div>
                                            <div style={{ background: 'rgba(11, 13, 15, 0.08)', borderRadius: '999px', height: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                                                <div style={{
                                                    width: `${competition.points_goal ? getGoalProgress(competition.opponent_score, competition.points_goal) : 100}%`,
                                                    background: 'linear-gradient(90deg, #2196F3, #6EC1FF)',
                                                    height: '100%',
                                                    borderRadius: 'inherit'
                                                }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span style={{ color: 'var(--app-text-muted)', fontSize: '13px' }}>
                                            {competition.points_goal
                                                ? `${Math.max(competition.points_goal - Math.max(competition.challenger_score, competition.opponent_score), 0)} pts to win`
                                                : 'Open score challenge'} • {competition.tasks?.length ?? 0} tasks
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button onClick={() => openCompetitionDetail(competition, false)}>
                                                View Tasks
                                            </button>
                                            <button onClick={() => openCompetitionDetail(competition, true)}>
                                                + Add Task
                                            </button>
                                            <button onClick={() => handleDeleteCompetition(competition.id)} style={{
                                                background: '#ff4444', color: 'white', border: 'none',
                                                borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px'
                                            }}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No active competitions.</p>
                        )}
                    </div>

                    <div className="page-section">
                        <h2 style={{ marginTop: 0 }}>Pending Invitations</h2>
                        {competitions.filter(c => c.status === 'PENDING').length > 0 ? (
                            competitions.filter(c => c.status === 'PENDING').map(competition => (
                                <div key={competition.id} className="page-section-tight" style={{
                                    background: 'var(--app-surface)',
                                    border: '2px solid #FFA500',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginBottom: '10px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0 }}>{competition.challenger_username} vs {competition.opponent_username}</h3>
                                        <button onClick={() => handleDeleteCompetition(competition.id)} style={{
                                            background: '#ff4444', color: 'white', border: 'none',
                                            borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px'
                                        }}>Delete</button>
                                    </div>
                                    <button onClick={() => handleAcceptCompetition(competition.id)} style={{ marginTop: '8px' }}>
                                        Accept Competition
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No pending invitations.</p>
                        )}
                    </div>

                    <div className="page-section">
                        <h2 style={{ marginTop: 0 }}>Completed Competitions</h2>
                        {competitions.filter(c => c.status === 'COMPLETED').length > 0 ? (
                            competitions.filter(c => c.status === 'COMPLETED').map(competition => (
                                <div key={competition.id} className="page-section-tight" style={{
                                    background: 'var(--app-surface)',
                                    border: '2px solid #888',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginBottom: '10px'
                                }}>
                                    <h3>{competition.challenger_username} vs {competition.opponent_username}</h3>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                                        <button onClick={() => handleDeleteCompetition(competition.id)} style={{
                                            background: '#ff4444', color: 'white', border: 'none',
                                            borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px'
                                        }}>Delete</button>
                                    </div>
                                    {competition.winner_username && (
                                        <div style={{
                                            background: '#fff8e1',
                                            border: '1px solid #FFD700',
                                            borderRadius: '6px',
                                            padding: '6px 12px',
                                            margin: '8px 0',
                                            fontWeight: 'bold',
                                            color: '#b8860b'
                                        }}>
                                            <i className="fa-solid fa-trophy" style={{ marginRight: '6px', color: '#FFD700' }} />Winner: {competition.winner_username}
                                        </div>
                                    )}
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
                </div>
            )}
        </div>
    );
}
