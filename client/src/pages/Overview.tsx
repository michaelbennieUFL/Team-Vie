import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { User, Task, VieServer } from '../services/api';

export default function Overview() {
    const [user, setUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [servers, setServers] = useState<VieServer[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userData = await apiService.getCurrentUser();
            setUser(userData);
            const serversData = await apiService.getServers();
            setServers(serversData);
            const tasksData = await apiService.getTasks();
            setTasks(tasksData);
        } catch (error) {
            console.error('Failed to load data:', error);
            navigate('/login');
        }
    };

    const getServerName = (serverId: number | null) => {
        if (!serverId) return 'Unassigned';
        const server = servers.find(s => s.id === serverId);
        return server?.name || 'Unknown';
    };

    const tasksByServer: Record<string, Task[]> = {};
    tasks.forEach(task => {
        const name = getServerName(task.server);
        if (!tasksByServer[name]) tasksByServer[name] = [];
        tasksByServer[name].push(task);
    });

    const pendingTasks = tasks.filter(t => !t.is_completed);
    const completedTasks = tasks.filter(t => t.is_completed);

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>📋 Overview — All Tasks</h1>
                <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>

            {user && (
                <div style={{
                    background: '#f5f5f5',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-around'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <h4>Total Tasks</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{tasks.length}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h4>Pending</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFA500' }}>{pendingTasks.length}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h4>Completed</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{completedTasks.length}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h4>Points</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.profile.points}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h4>Servers</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{servers.length}</p>
                    </div>
                </div>
            )}

            {Object.entries(tasksByServer).map(([serverName, serverTasks]) => (
                <div key={serverName} style={{ marginBottom: '30px' }}>
                    <h2 style={{ borderBottom: '2px solid #4CAF50', paddingBottom: '8px' }}>
                        📂 {serverName}
                        <span style={{ fontSize: '14px', color: '#888', marginLeft: '10px' }}>
                            ({serverTasks.filter(t => !t.is_completed).length} pending)
                        </span>
                    </h2>
                    {serverTasks.map(task => (
                        <div key={task.id} style={{
                            background: task.is_completed ? '#e8f5e9' : 'white',
                            border: '1px solid #ddd',
                            padding: '12px 15px',
                            borderRadius: '8px',
                            marginBottom: '8px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {task.title}
                                        {task.is_completed && ' ✓'}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#888', marginLeft: '10px' }}>
                                        {task.priority} • {task.points_value} pts
                                        {task.due_date && ` • Due: ${task.due_date}`}
                                    </span>
                                </div>
                                {task.is_completed && (
                                    <span style={{ color: '#4CAF50', fontSize: '12px' }}>Completed</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {tasks.length === 0 && (
                <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
                    No tasks yet. Go to the Dashboard to create your first task!
                </p>
            )}
        </div>
    );
}
