import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, User, Task } from '../services/api';

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
        points_value: 10,
        due_date: ''
    });
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadUserAndTasks();
    }, []);

    const loadUserAndTasks = async () => {
        try {
            const userData = await apiService.getCurrentUser();
            setUser(userData);
            const tasksData = await apiService.getTasks();
            setTasks(tasksData);
        } catch (error) {
            console.error('Failed to load data:', error);
            navigate('/login');
        }
    };

    const handleLogout = async () => {
        try {
            await apiService.logout();
            localStorage.removeItem('user');
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const task = await apiService.createTask(newTask);
            setTasks([task, ...tasks]);
            setShowAddTask(false);
            setNewTask({
                title: '',
                description: '',
                priority: 'MEDIUM',
                points_value: 10,
                due_date: ''
            });
        } catch (error) {
            alert('Failed to create task: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleCompleteTask = async (taskId: number) => {
        try {
            const response = await apiService.completeTask(taskId);
            alert(`Task completed! You earned ${response.points_earned} points!`);
            await loadUserAndTasks();
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
                <h1>Dashboard</h1>
                <div>
                    <button onClick={() => navigate('/leaderboard')} style={{ marginRight: '10px' }}>
                        Leaderboard
                    </button>
                    <button onClick={() => navigate('/competitions')} style={{ marginRight: '10px' }}>
                        Competitions
                    </button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
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