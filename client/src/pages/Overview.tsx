import React, { useState, useEffect } from 'react';
import ProtectedNav from '../components/ProtectedNav';
import { useToast } from '../components/ToastProvider';
import { apiService } from '../services/api';
import type { User, Task, VieServer } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';

export default function Overview() {
    const [user, setUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [servers, setServers] = useState<VieServer[]>([]);
    const [showAddTask, setShowAddTask] = useState(false);
    const [selectedServerId, setSelectedServerId] = useState<number | ''>('');
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
        due_date: '',
        recurrence: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY'
    });
    const { isDarkMode, toggleTheme } = useAppTheme();
    const toast = useToast();

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
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getServerName = (serverId: number | null) => {
        if (!serverId) return 'Unassigned';
        const server = servers.find(s => s.id === serverId);
        return server?.name || 'Unknown';
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const taskData = {
                ...newTask,
                server: selectedServerId || null,
            };
            const task = await apiService.createTask(taskData);
            setTasks([task, ...tasks]);
            setShowAddTask(false);
            setNewTask({
                title: '',
                description: '',
                priority: 'MEDIUM',
                due_date: '',
                recurrence: 'NONE'
            });
            setSelectedServerId('');
        } catch (error) {
            toast.error('Failed to create task: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleCompleteTask = async (taskId: number) => {
        try {
            const response = await apiService.completeTask(taskId);
            toast.success(`Task completed. You earned ${response.points_earned} points.`);
            const userData = await apiService.getCurrentUser();
            setUser(userData);
            const tasksData = await apiService.getTasks();
            setTasks(tasksData);
        } catch (error) {
            toast.error('Failed to complete task: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await apiService.deleteTask(taskId);
                setTasks(tasks.filter(t => t.id !== taskId));
            } catch (error) {
                toast.error('Failed to delete task: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        }
    };

    const tasksByServer: Record<string, Task[]> = {};
    tasks.forEach(task => {
        const name = getServerName(task.server);
        if (!tasksByServer[name]) tasksByServer[name] = [];
        tasksByServer[name].push(task);
    });

    Object.values(tasksByServer).forEach((serverTasks) => {
        serverTasks.sort((a, b) => Number(a.is_completed) - Number(b.is_completed));
    });

    const pendingTasks = tasks.filter(t => !t.is_completed);
    const completedTasks = tasks.filter(t => t.is_completed);

    return (
        <div className={`vie-app-page ${isDarkMode ? 'theme-dark' : 'theme-light'}`} style={{ width: '100%', padding: '28px 5vw 48px' }}>
            <ProtectedNav isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
            <div className="page-section page-section-tight" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>📋 All Tasks</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="primary-btn" onClick={() => setShowAddTask(!showAddTask)}>
                        {showAddTask ? 'Cancel' : '+ Add Task'}
                    </button>
                </div>
            </div>

            {showAddTask && (
                <form className="page-section" onSubmit={handleAddTask} style={{
                    background: 'var(--app-surface-muted)',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: 'var(--app-text)'
                }}>
                    <h3>Add New Task</h3>
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
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <select
                            value={selectedServerId}
                            onChange={(e) => setSelectedServerId(e.target.value ? Number(e.target.value) : '')}
                            style={{ padding: '8px' }}
                        >
                            <option value="">No Server</option>
                            {servers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <select
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                            style={{ padding: '8px' }}
                        >
                            <option value="LOW">Low Difficulty</option>
                            <option value="MEDIUM">Medium Difficulty</option>
                            <option value="HIGH">High Difficulty</option>
                        </select>
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
                    <p style={{ margin: '0 0 12px', color: 'var(--app-text-muted)', fontSize: '13px' }}>
                        Points are assigned automatically from difficulty.
                    </p>
                    <button type="submit">Create Task</button>
                </form>
            )}

            {user && (
                <div className="page-section" style={{
                    background: 'var(--app-surface-muted)',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-around',
                    color: 'var(--app-text)'
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
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#b15a27' }}>{completedTasks.length}</p>
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
                <div key={serverName} className="page-section" style={{ marginBottom: '30px' }}>
                    <h2 style={{ borderBottom: '2px solid #b15a27', paddingBottom: '8px' }}>
                        <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }} />{serverName}
                        <span style={{ fontSize: '14px', color: 'var(--app-text-muted)', marginLeft: '10px' }}>
                            ({serverTasks.filter(t => !t.is_completed).length} pending)
                        </span>
                    </h2>
                    {serverTasks.map(task => (
                        <div key={task.id} style={{
                            background: task.is_completed ? 'var(--app-success-surface)' : 'var(--app-surface)',
                            border: '1px solid var(--app-border)',
                            padding: '12px 15px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            color: 'var(--app-text)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {task.title}
                                        {task.is_completed && ' ✓'}
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'var(--app-text-muted)', marginLeft: '10px' }}>
                                        {task.priority} • {task.awarded_points ?? task.points_value} pts
                                        {task.due_date && ` • Due: ${task.due_date}`}
                                        {task.recurrence && task.recurrence !== 'NONE' && ` • 🔄 ${task.recurrence}`}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                    {!task.is_completed && (
                                        <button
                                            className="overview-action-btn overview-action-btn-success"
                                            onClick={() => handleCompleteTask(task.id)}
                                        >
                                            Complete
                                        </button>
                                    )}
                                    <button
                                        className="overview-action-btn overview-action-btn-danger"
                                        onClick={() => handleDeleteTask(task.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {tasks.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--app-text-muted)', marginTop: '40px' }}>
                    No tasks yet. Click "+ Add Task" above to create your first task!
                </p>
            )}
        </div>
    );
}
