import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { User, Task, VieServer } from '../services/api';

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [servers, setServers] = useState<VieServer[]>([]);
    const [selectedServer, setSelectedServer] = useState<VieServer | null>(null);
    const [showServerDropdown, setShowServerDropdown] = useState(false);
    const [showCreateServer, setShowCreateServer] = useState(false);
    const [showJoinServer, setShowJoinServer] = useState(false);
    const [joinServerQuery, setJoinServerQuery] = useState('');
    const [joinServerResults, setJoinServerResults] = useState<VieServer[]>([]);
    const [newServerName, setNewServerName] = useState('');
    const [newServerDesc, setNewServerDesc] = useState('');
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
        points_value: 10,
        due_date: '',
        recurrence: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY'
    });
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const navigate = useNavigate();

    const loadInitialData = async () => {
        try {
            const userData = await apiService.getCurrentUser();
            setUser(userData);
            const serversData = await apiService.getServers();
            setServers(serversData);
            if (serversData.length > 0) {
                const saved = localStorage.getItem('selectedServerId');
                const found = saved ? serversData.find(s => s.id === Number(saved)) : null;
                setSelectedServer(found || serversData[0]);
            }
            const tasksData = await apiService.getTasks();
            setTasks(tasksData);
        } catch (error) {
            console.error('Failed to load data:', error);
            navigate('/login');
        }
    };

    const loadTasks = async () => {
        try {
            const tasksData = await apiService.getTasks(selectedServer?.id);
            setTasks(tasksData);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (user) {
            loadTasks();
        }
    }, [selectedServer]);

    const handleSelectServer = (server: VieServer) => {
        setSelectedServer(server);
        localStorage.setItem('selectedServerId', String(server.id));
        setShowServerDropdown(false);
    };

    const handleCreateServer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const server = await apiService.createServer({ name: newServerName, description: newServerDesc });
            setServers([...servers, server]);
            setSelectedServer(server);
            localStorage.setItem('selectedServerId', String(server.id));
            setShowCreateServer(false);
            setNewServerName('');
            setNewServerDesc('');
        } catch (error) {
            alert('Failed to create server: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleSearchServers = async (query: string) => {
        setJoinServerQuery(query);
        if (query.trim().length < 1) {
            setJoinServerResults([]);
            return;
        }
        try {
            const results = await apiService.searchServers(query);
            setJoinServerResults(results);
        } catch (error) {
            console.error('Failed to search servers:', error);
        }
    };

    const handleJoinServer = async (serverId: number) => {
        try {
            await apiService.joinServer(serverId);
            const serversData = await apiService.getServers();
            setServers(serversData);
            const joined = serversData.find(s => s.id === serverId);
            if (joined) {
                setSelectedServer(joined);
                localStorage.setItem('selectedServerId', String(joined.id));
            }
            setShowJoinServer(false);
            setJoinServerQuery('');
            setJoinServerResults([]);
            alert('Successfully joined server!');
        } catch (error) {
            alert('Failed to join server: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleLogout = async () => {
        try {
            await apiService.logout();
            localStorage.removeItem('user');
            localStorage.removeItem('selectedServerId');
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const taskData = {
                ...newTask,
                server: selectedServer?.id || null,
            };
            const task = await apiService.createTask(taskData);
            setTasks([task, ...tasks]);
            setShowAddTask(false);
            setNewTask({
                title: '',
                description: '',
                priority: 'MEDIUM',
                points_value: 10,
                due_date: '',
                recurrence: 'NONE'
            });
        } catch (error) {
            alert('Failed to create task: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleCompleteTask = async (taskId: number) => {
        try {
            const response = await apiService.completeTask(taskId);
            alert(`Task completed! You earned ${response.points_earned} points!`);
            const userData = await apiService.getCurrentUser();
            setUser(userData);
            await loadTasks();
        } catch (error) {
            alert('Failed to complete task: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await apiService.deleteTask(taskId);
                setTasks(tasks.filter(t => t.id !== taskId));
            } catch (error) {
                alert('Failed to delete task: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        }
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask) return;
        
        try {
            const updated = await apiService.updateTask(editingTask.id, {
                title: editingTask.title,
                description: editingTask.description,
                priority: editingTask.priority,
                points_value: editingTask.points_value,
                due_date: editingTask.due_date
            });
            setTasks(tasks.map(t => t.id === updated.id ? updated : t));
            setEditingTask(null);
        } catch (error) {
            alert('Failed to update task: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h1>Dashboard</h1>
                    {/* Server Selector Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowServerDropdown(!showServerDropdown)}
                            style={{
                                padding: '8px 16px',
                                background: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            📂 {selectedServer?.name || 'Select Server'}
                            <span style={{ fontSize: '10px' }}>▼</span>
                        </button>
                        {showServerDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                background: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                minWidth: '220px',
                                marginTop: '4px'
                            }}>
                                <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                    <span style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>YOUR SERVERS</span>
                                </div>
                                {servers.map(server => (
                                    <div
                                        key={server.id}
                                        onClick={() => handleSelectServer(server)}
                                        style={{
                                            padding: '10px 12px',
                                            cursor: 'pointer',
                                            background: selectedServer?.id === server.id ? '#e8f5e9' : 'white',
                                            borderBottom: '1px solid #f0f0f0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = selectedServer?.id === server.id ? '#e8f5e9' : 'white'}
                                    >
                                        <span>{server.name}</span>
                                        {selectedServer?.id === server.id && <span>✓</span>}
                                    </div>
                                ))}
                                <div
                                    onClick={() => { setShowCreateServer(true); setShowServerDropdown(false); }}
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        color: '#4CAF50',
                                        fontWeight: 'bold',
                                        borderTop: '1px solid #eee'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    + Create Server
                                </div>
                                <div
                                    onClick={() => { setShowJoinServer(true); setShowServerDropdown(false); }}
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        color: '#2196F3',
                                        fontWeight: 'bold',
                                        borderTop: '1px solid #eee'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    🔍 Join Server
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <button onClick={() => navigate('/overview')} style={{ marginRight: '10px' }}>
                        Overview
                    </button>
                    <button onClick={() => navigate('/schedule')} style={{ marginRight: '10px' }}>
                        Schedule
                    </button>
                    <button onClick={() => navigate('/leaderboard')} style={{ marginRight: '10px' }}>
                        Leaderboard
                    </button>
                    <button onClick={() => navigate('/competitions')} style={{ marginRight: '10px' }}>
                        Competitions
                    </button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </div>

            {/* Create Server Modal */}
            {showCreateServer && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px' }}>
                        <h3>Create New Server</h3>
                        <form onSubmit={handleCreateServer}>
                            <input
                                type="text"
                                placeholder="Server Name"
                                value={newServerName}
                                onChange={(e) => setNewServerName(e.target.value)}
                                required
                                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                            />
                            <textarea
                                placeholder="Description (optional)"
                                value={newServerDesc}
                                onChange={(e) => setNewServerDesc(e.target.value)}
                                style={{ width: '100%', marginBottom: '10px', padding: '8px', minHeight: '60px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit">Create</button>
                                <button type="button" onClick={() => setShowCreateServer(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Server Modal */}
            {showJoinServer && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px' }}>
                        <h3>🔍 Join a Server</h3>
                        <input
                            type="text"
                            placeholder="Search servers by name..."
                            value={joinServerQuery}
                            onChange={(e) => handleSearchServers(e.target.value)}
                            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                            autoFocus
                        />
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {joinServerResults.length > 0 ? (
                                joinServerResults.map(server => (
                                    <div key={server.id} style={{
                                        padding: '10px 12px',
                                        border: '1px solid #eee',
                                        borderRadius: '6px',
                                        marginBottom: '6px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{server.name}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>
                                                {server.member_count} member{server.member_count !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleJoinServer(server.id)}
                                            style={{ background: '#2196F3', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Join
                                        </button>
                                    </div>
                                ))
                            ) : joinServerQuery.trim() ? (
                                <p style={{ color: '#888', textAlign: 'center' }}>No servers found</p>
                            ) : (
                                <p style={{ color: '#888', textAlign: 'center' }}>Type to search for servers</p>
                            )}
                        </div>
                        <button type="button" onClick={() => { setShowJoinServer(false); setJoinServerQuery(''); setJoinServerResults([]); }}
                            style={{ marginTop: '10px' }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {user && (
                <div style={{ 
                    background: '#f5f5f5', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-around'
                }}>
                    <div>
                        <h3>Welcome, {user.username}!</h3>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h4>Points</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.profile.points}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h4>Current Streak 🔥</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.profile.current_streak} days</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h4>Longest Streak</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.profile.longest_streak} days</p>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>My Tasks</h2>
                    <button onClick={() => setShowAddTask(!showAddTask)}>
                        {showAddTask ? 'Cancel' : 'Add Task'}
                    </button>
                </div>

                {showAddTask && (
                    <form onSubmit={handleAddTask} style={{ 
                        background: '#f9f9f9', 
                        padding: '20px', 
                        borderRadius: '8px',
                        marginTop: '10px'
                    }}>
                        <input
                            type="text"
                            placeholder="Task Title"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            required
                            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                        />
                        <textarea
                            placeholder="Description"
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            style={{ width: '100%', marginBottom: '10px', padding: '8px', minHeight: '60px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <select
                                value={newTask.priority}
                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                                style={{ padding: '8px' }}
                            >
                                <option value="LOW">Low Priority</option>
                                <option value="MEDIUM">Medium Priority</option>
                                <option value="HIGH">High Priority</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Points"
                                value={newTask.points_value}
                                onChange={(e) => setNewTask({ ...newTask, points_value: parseInt(e.target.value) })}
                                min="1"
                                style={{ padding: '8px' }}
                            />
                            <input
                                type="date"
                                value={newTask.due_date}
                                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                style={{ padding: '8px' }}
                            />
                            <select
                                value={newTask.recurrence}
                                onChange={(e) => setNewTask({ ...newTask, recurrence: e.target.value as 'NONE' | 'DAILY' | 'WEEKLY' })}
                                style={{ padding: '8px' }}
                            >
                                <option value="NONE">One-time</option>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                            </select>
                        </div>
                        <button type="submit">Create Task</button>
                    </form>
                )}
            </div>

            {editingTask && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '500px' }}>
                        <h3>Edit Task</h3>
                        <form onSubmit={handleUpdateTask}>
                            <input
                                type="text"
                                value={editingTask.title}
                                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                            />
                            <textarea
                                value={editingTask.description}
                                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                style={{ width: '100%', marginBottom: '10px', padding: '8px', minHeight: '60px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <select
                                    value={editingTask.priority}
                                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                                    style={{ padding: '8px' }}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                                <input
                                    type="number"
                                    value={editingTask.points_value}
                                    onChange={(e) => setEditingTask({ ...editingTask, points_value: parseInt(e.target.value) })}
                                    style={{ padding: '8px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit">Save</button>
                                <button type="button" onClick={() => setEditingTask(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div>
                {tasks.length === 0 ? (
                    <p>No tasks yet. Create your first task to get started!</p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} style={{
                            background: task.is_completed ? '#e8f5e9' : 'white',
                            border: '1px solid #ddd',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '10px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 5px 0' }}>
                                        {task.title}
                                        {task.is_completed && ' ✓'}
                                    </h3>
                                    {task.description && <p style={{ margin: '5px 0', color: '#666' }}>{task.description}</p>}
                                    <div style={{ fontSize: '14px', color: '#888' }}>
                                        <span>Priority: {task.priority} | </span>
                                        <span>Points: {task.points_value} | </span>
                                        {task.due_date && <span>Due: {task.due_date} | </span>}
                                        {task.recurrence && task.recurrence !== 'NONE' && (
                                            <span>🔄 {task.recurrence} | </span>
                                        )}
                                        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {!task.is_completed && (
                                        <>
                                            <button onClick={() => handleCompleteTask(task.id)} style={{ background: '#4CAF50', color: 'white' }}>
                                                Complete
                                            </button>
                                            <button onClick={() => setEditingTask(task)}>
                                                Edit
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => handleDeleteTask(task.id)} style={{ background: '#f44336', color: 'white' }}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}