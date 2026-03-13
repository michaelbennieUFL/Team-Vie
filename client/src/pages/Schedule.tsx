import { useState, useEffect } from 'react';
import ProtectedNav from '../components/ProtectedNav';
import { apiService } from '../services/api';
import type { Task } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';

export default function Schedule() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const { isDarkMode, toggleTheme } = useAppTheme();

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const tasksData = await apiService.getTasks();
                setTasks(tasksData);
            } catch (error) {
                console.error('Failed to load tasks:', error);
            }
        };
        loadTasks();
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const today = () => {
        setCurrentDate(new Date());
    };

    const getTasksForDate = (dateStr: string): Task[] => {
        return tasks.filter(t => t.due_date === dateStr);
    };

    const formatDateStr = (day: number): string => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    const todayStr = (() => {
        const now = new Date();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${now.getFullYear()}-${m}-${d}`;
    })();

    const calendarCells: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) {
        calendarCells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        calendarCells.push(d);
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return '#f44336';
            case 'MEDIUM': return '#FFA500';
            case 'LOW': return '#4CAF50';
            default: return '#888';
        }
    };

    return (
        <div className={`vie-app-page ${isDarkMode ? 'theme-dark' : 'theme-light'}`} style={{ width: '100%', padding: '28px 5vw 48px' }}>
            <ProtectedNav isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
            <div className="page-section page-section-tight" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>📅 Schedule</h1>
            </div>

            <div className="page-section" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '10px 20px',
                background: 'var(--app-surface-muted)',
                borderRadius: '8px'
            }}>
                <button onClick={prevMonth} style={{ padding: '8px 16px', cursor: 'pointer' }}>← Prev</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ margin: 0 }}>{monthNames[month]} {year}</h2>
                    <button onClick={today} style={{ padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}>Today</button>
                </div>
                <button onClick={nextMonth} style={{ padding: '8px 16px', cursor: 'pointer' }}>Next →</button>
            </div>

            <div className="page-section" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '1px',
                background: 'var(--app-border)',
                border: '1px solid var(--app-border)',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                {dayNames.map(day => (
                    <div key={day} style={{
                        padding: '10px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        background: 'var(--app-surface-muted)',
                        color: 'var(--app-text)',
                        fontSize: '14px'
                    }}>
                        {day}
                    </div>
                ))}

                {calendarCells.map((day, index) => {
                    const dateStr = day ? formatDateStr(day) : '';
                    const dayTasks = day ? getTasksForDate(dateStr) : [];
                    const isToday = dateStr === todayStr;
                    const pendingCount = dayTasks.filter(t => !t.is_completed).length;

                    return (
                        <div
                            key={index}
                            style={{
                                background: isToday ? 'var(--app-calendar-today)' : day ? 'var(--app-surface)' : 'var(--app-surface-subtle)',
                                minHeight: '100px',
                                padding: '4px',
                                verticalAlign: 'top'
                            }}
                        >
                            {day && (
                                <>
                                    <div style={{
                                        fontWeight: isToday ? 'bold' : 'normal',
                                        fontSize: '14px',
                                        padding: '2px 6px',
                                        color: isToday ? 'var(--app-calendar-today-text)' : 'var(--app-text)',
                                        display: 'inline-block',
                                        borderRadius: isToday ? '50%' : '0',
                                        background: isToday ? 'var(--app-calendar-today-pill)' : 'transparent',
                                        marginBottom: '2px'
                                    }}>
                                        {day}
                                        {pendingCount > 0 && (
                                            <span style={{
                                                fontSize: '10px',
                                                background: '#f44336',
                                                color: 'white',
                                                borderRadius: '50%',
                                                padding: '1px 5px',
                                                marginLeft: '4px'
                                            }}>
                                                {pendingCount}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        {dayTasks.slice(0, 3).map(task => (
                                            <div
                                                key={task.id}
                                                style={{
                                                    fontSize: '11px',
                                                    padding: '2px 4px',
                                                    marginBottom: '1px',
                                                    borderRadius: '3px',
                                                    background: task.is_completed ? 'var(--app-success-surface)' : 'var(--app-warning-surface)',
                                                    borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    textDecoration: task.is_completed ? 'line-through' : 'none',
                                                    color: task.is_completed ? 'var(--app-text-muted)' : 'var(--app-text)'
                                                }}
                                                title={`${task.title} (${task.priority}, ${task.points_value} pts)${task.recurrence !== 'NONE' ? ` 🔄 ${task.recurrence}` : ''}`}
                                            >
                                                {task.recurrence !== 'NONE' && '🔄 '}
                                                {task.title}
                                            </div>
                                        ))}
                                        {dayTasks.length > 3 && (
                                            <div style={{ fontSize: '10px', color: 'var(--app-text-muted)', padding: '1px 4px' }}>
                                                +{dayTasks.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="page-section" style={{ marginTop: '20px', padding: '15px', background: 'var(--app-surface-muted)', borderRadius: '8px', color: 'var(--app-text)' }}>
                <h3>Legend</h3>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#f44336', borderRadius: '2px', marginRight: '4px' }}></span> High Priority</span>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#FFA500', borderRadius: '2px', marginRight: '4px' }}></span> Medium Priority</span>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#4CAF50', borderRadius: '2px', marginRight: '4px' }}></span> Low Priority</span>
                    <span>🔄 Recurring Task</span>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#c8e6c9', borderRadius: '2px', marginRight: '4px' }}></span> Completed</span>
                </div>
            </div>
        </div>
    );
}
