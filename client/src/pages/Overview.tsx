import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { User, Task, VieServer } from '../services/api';

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
        points_value: 10,
        due_date: '',
        recurrence: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY'
    });
    const navigate = useNavigate();

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
                points_value: 10,
                due_date: '',
                recurrence: 'NONE'
            });
            setSelectedServerId('');
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
            const tasksData = await apiService.getTasks();
            setTasks(tasksData);
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
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowAddTask(!showAddTask)}>
                        {showAddTask ? 'Cancel' : '+ Add Task'}
                    </button>
                    <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
                </div>
            </div>

            {showAddTask && (
                <form onSubmit={handleAddTask} style={{
                    background: '#f9f9f9',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px'
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
                            style={{ padding: '8px', width: '80px' }}
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
                                        {task.recurrence && task.recurrence !== 'NONE' && ` • 🔄 ${task.recurrence}`}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                    {!task.is_completed && (
                                        <button
                                            onClick={() => handleCompleteTask(task.id)}
                                            style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            Complete
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        style={{ background: '#f44336', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
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
                <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
                    No tasks yet. Click "+ Add Task" above to create your first task!
                </p>
            )}
        </div>
    );
}
