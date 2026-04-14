import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import ProtectedNav from '../components/ProtectedNav';
import { useToast } from '../components/ToastProvider';
import { apiService } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';
import type {
  CelebrationPayload,
  Competition,
  LeaderboardEntry,
  MotivationQuote,
  Task,
  User,
  VieServer,
} from '../services/api';

const fireCelebrationConfetti = () => {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const shared = {
    zIndex: 80,
    ticks: 220,
    gravity: 0.9,
    startVelocity: 34,
    scalar: 0.96,
    disableForReducedMotion: true,
    colors: ['#23526f', '#b15a27', '#673610', '#f5d2b7', '#fcf284', '#dce9f6'],
  };

  void confetti({
    ...shared,
    particleCount: 30,
    spread: 78,
    angle: 90,
    origin: { x: 0.5, y: 0.12 },
  });

  void confetti({
    ...shared,
    particleCount: 18,
    spread: 56,
    angle: 62,
    origin: { x: 0.2, y: 0.1 },
  });

  void confetti({
    ...shared,
    particleCount: 18,
    spread: 56,
    angle: 118,
    origin: { x: 0.8, y: 0.1 },
  });
};

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
    due_date: '',
    recurrence: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY',
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [leaderboardPreview, setLeaderboardPreview] = useState<LeaderboardEntry[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [motivation, setMotivation] = useState<MotivationQuote | null>(null);
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);
  const { isDarkMode, toggleTheme } = useAppTheme();
  const navigate = useNavigate();
  const toast = useToast();

  const loadTasks = async (serverId?: number) => {
    try {
      const tasksData = await apiService.getTasks(serverId);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadSidebarData = async (serverId?: number) => {
    try {
      const [leaderboardData, competitionData] = await Promise.all([
        apiService.getLeaderboard(undefined, serverId),
        apiService.getCompetitions(serverId),
      ]);
      setLeaderboardPreview(leaderboardData.slice(0, 5));
      setCompetitions(competitionData);
    } catch (error) {
      console.error('Failed to load sidebar data:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      const [userData, quoteData] = await Promise.all([
        apiService.getCurrentUser(),
        apiService.getMotivationalQuote(),
      ]);
      setUser(userData);
      setMotivation(quoteData);
      const serversData = await apiService.getServers();
      setServers(serversData);
      if (serversData.length > 0) {
        const saved = localStorage.getItem('selectedServerId');
        const found = saved ? serversData.find((s) => s.id === Number(saved)) : null;
        const initial = found || serversData[0];
        setSelectedServer(initial);
        await loadTasks(initial.id);
        await loadSidebarData(initial.id);
      } else {
        await loadTasks();
        await loadSidebarData();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadTasks(selectedServer.id);
      loadSidebarData(selectedServer.id);
    }
  }, [selectedServer]);

  useEffect(() => {
    if (!celebration) return;
    fireCelebrationConfetti();
    const timer = window.setTimeout(() => setCelebration(null), 4800);
    return () => window.clearTimeout(timer);
  }, [celebration]);

  const refreshMotivation = async () => {
    try {
      const nextQuote = await apiService.getMotivationalQuote();
      setMotivation(nextQuote);
    } catch (error) {
      console.error('Failed to load motivational quote:', error);
    }
  };

  const handleSelectServer = (server: VieServer) => {
    setSelectedServer(server);
    localStorage.setItem('selectedServerId', String(server.id));
    setShowServerDropdown(false);
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const server = await apiService.createServer({ name: newServerName, description: newServerDesc });
      setServers((prev) => [...prev, server]);
      setSelectedServer(server);
      localStorage.setItem('selectedServerId', String(server.id));
      setShowCreateServer(false);
      setNewServerName('');
      setNewServerDesc('');
    } catch (error) {
      toast.error(`Failed to create server: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const joined = serversData.find((s) => s.id === serverId);
      if (joined) {
        setSelectedServer(joined);
        localStorage.setItem('selectedServerId', String(joined.id));
      }
      setShowJoinServer(false);
      setJoinServerQuery('');
      setJoinServerResults([]);
    } catch (error) {
      toast.error(`Failed to join server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const task = await apiService.createTask({
        ...newTask,
        server: selectedServer?.id || null,
      });
      setTasks((prev) => [task, ...prev]);
      setShowAddTask(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        due_date: '',
        recurrence: 'NONE',
      });
    } catch (error) {
      toast.error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStartTask = async (taskId: number) => {
    try {
      const response = await apiService.startTask(taskId);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? response.task : task)));
    } catch (error) {
      toast.error(`Failed to start task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      const response = await apiService.completeTask(taskId);
      setCelebration(response.celebration);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? response.task : task)));
      const userData = await apiService.getCurrentUser();
      setUser(userData);
      await Promise.all([
        loadTasks(selectedServer?.id),
        loadSidebarData(selectedServer?.id),
        refreshMotivation(),
      ]);
    } catch (error) {
      toast.error(`Failed to complete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await apiService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      toast.error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        due_date: editingTask.due_date,
        recurrence: editingTask.recurrence,
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTask(null);
    } catch (error) {
      toast.error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const weeklyProgress = user?.profile.weekly_progress;
  const weeklyCompetitivePoints = weeklyProgress?.competitive_points ?? 0;
  const weeklyPersonalPoints = weeklyProgress?.personal_points ?? 0;
  const weeklyGoalPoints = weeklyProgress?.weekly_goal_points ?? user?.profile.default_weekly_goal_points ?? 120;
  const weeklyPointsRemaining = weeklyProgress?.competitive_points_remaining ?? Math.max(weeklyGoalPoints - weeklyCompetitivePoints, 0);
  const progress = Math.min((weeklyCompetitivePoints / weeklyGoalPoints) * 100, 100);
  const isTaskInProgress = (task: Task) => (task.lifecycle_state ?? 'NOT_STARTED') === 'IN_PROGRESS';
  const priorityCounts = useMemo(
    () => ({
      high: tasks.filter((t) => t.priority === 'HIGH').length,
      medium: tasks.filter((t) => t.priority === 'MEDIUM').length,
      low: tasks.filter((t) => t.priority === 'LOW').length,
    }),
    [tasks]
  );
  const activeInProgressTasks = useMemo(
    () => tasks.filter((task) => isTaskInProgress(task) && !task.is_completed),
    [tasks]
  );
  const activeInProgressTasksRef = useRef<Task[]>([]);

  useEffect(() => {
    activeInProgressTasksRef.current = activeInProgressTasks;
  }, [activeInProgressTasks, toast]);
  const activeChallenges = useMemo(() => {
    if (!user) return [];
    return competitions
      .filter((competition) => competition.status !== 'COMPLETED')
      .map((competition) => {
        const youAreChallenger = competition.challenger === user.id;
        return {
          id: competition.id,
          opponent: youAreChallenger ? competition.opponent_username : competition.challenger_username,
          task: selectedServer?.name || 'General competition',
          status: competition.status === 'ACTIVE' ? 'Active' : 'Pending',
          yourScore: youAreChallenger ? competition.challenger_score : competition.opponent_score,
          theirScore: youAreChallenger ? competition.opponent_score : competition.challenger_score,
        };
      })
      .slice(0, 4);
  }, [competitions, user, selectedServer]);

  const tagClassForPriority = (priority: Task['priority']) => {
    if (priority === 'HIGH') return 'tag tag-high';
    if (priority === 'LOW') return 'tag tag-low';
    return 'tag tag-medium';
  };

  const formatDuration = (totalSeconds: number) => {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!activeInProgressTasks.length) return;
    const intervalId = window.setInterval(async () => {
      try {
        const updates = await Promise.all(
          activeInProgressTasksRef.current
            .filter((task) => !task.is_completed && isTaskInProgress(task))
            .map((task) => apiService.heartbeatTask(task.id))
        );
        const updateMap = new Map(updates.map((u) => [u.task.id, u.task]));
        setTasks((prev) => prev.map((task) => updateMap.get(task.id) ?? task));
      } catch (error) {
        console.error('Heartbeat update failed', error);
        toast.error('Live timer sync failed. Please refresh to resume accurate tracking.');
      }
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, [activeInProgressTasks]);

  return (
    <div className={`dashboard ${isDarkMode ? 'dashboard-dark' : ''}`}>
      <ProtectedNav isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />

      {celebration && (
        <div className="celebration-overlay celebration-banner-layer" aria-live="polite">
          <div className="celebration-popup">
            <p className="panel-kicker">Keep it up</p>
            <h2>{celebration.headline}</h2>
            <p>{celebration.phrase}</p>
            {celebration.limit_note && (
              <p className="celebration-note">{celebration.limit_note}</p>
            )}
            <div className="celebration-stats">
              <strong>+{celebration.points_earned} pts</strong>
              <span>{celebration.current_streak} day streak</span>
            </div>
          </div>
        </div>
      )}

      <main className="dash-main">
        <section className="dashboard-context">
          <div className="panel welcome-panel">
            <p className="panel-kicker">Welcome back</p>
            <h2>
              <span className="welcome-greeting">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
              </span>
              <span className="welcome-name">{user?.first_name || user?.username || 'there'}</span>
            </h2>
            <p className="panel-subtitle">Reach the weekly finish line and keep the streak alive.</p>
          </div>
          <div className="context-side">
            <div className="motivation-card">
              <div className="panel-head compact">
                <div>
                  <p className="panel-kicker">Quote bank</p>
                  <h2>Today&apos;s push</h2>
                  <p className="panel-subtitle">A short reminder to keep the pace up today.</p>
                </div>
                <button className="ghost-btn" onClick={refreshMotivation}>Refresh quote</button>
              </div>
              {motivation ? (
                <div className="motivation-body">
                  <p className="motivation-quote">&ldquo;{motivation.quote}&rdquo;</p>
                  <div className="motivation-meta">
                    <strong>{motivation.author}</strong>
                    <span>{motivation.tone}</span>
                  </div>
                </div>
              ) : (
                <p className="panel-subtitle">Loading a fresh reminder...</p>
              )}
            </div>

            <div className="stats-grid context-stats">
              <div className="stat-card">
                <p className="panel-kicker">Weekly finish line</p>
                <h3>{weeklyCompetitivePoints} / {weeklyGoalPoints}</h3>
                <div className="progress"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
                <p className="panel-subtitle">
                  {weeklyProgress?.goal_reached
                    ? 'Finish line reached. Keep going for a new personal best.'
                    : `${weeklyPointsRemaining} points to reach this week's goal.`}
                </p>
              </div>
              <div className="stat-card">
                <p className="panel-kicker">Current streak</p>
                <h3>{user?.profile.current_streak ?? 0} days</h3>
                <p className="panel-subtitle">
                  {weeklyPersonalPoints} personal pts this week. Best week: {user?.profile.best_weekly_personal_points ?? 0}.
                </p>
                <div className="streak-strip">
                  {Array.from({ length: 7 }).map((_, idx) => (
                    <span key={idx} className={idx < Math.min((user?.profile.current_streak ?? 0), 7) ? 'active' : ''} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-work-row">
          <section className="panel tasks-panel">
            <div className="panel-head">
              <div>
                <p className="panel-kicker">Today</p>
                <h2>Today&apos;s tasks</h2>
                <p className="panel-subtitle">Your main focus area for today. Add, finish, and manage tasks here.</p>
              </div>
              <div className="header-actions tasks-panel-actions">
                <button className="primary-btn" onClick={() => setShowAddTask(true)}>
                  Quick add task
                  <i className="fa-solid fa-circle-plus" />
                </button>
              </div>
            </div>

            <div className="category-row">
              <div className="category-pill"><span>High difficulty</span><strong>{priorityCounts.high}</strong></div>
              <div className="category-pill"><span>Medium difficulty</span><strong>{priorityCounts.medium}</strong></div>
              <div className="category-pill"><span>Low difficulty</span><strong>{priorityCounts.low}</strong></div>
            </div>

            <div className="tasks-list">
              {tasks.length === 0 && <p className="panel-subtitle">No tasks yet. Add your first task.</p>}
              {tasks.map((task) => (
                <article key={task.id} className={`task-card ${task.is_completed ? 'done' : ''}`}>
                  <button
                    className="check-btn"
                    onClick={() => handleCompleteTask(task.id)}
                    aria-label={`Mark ${task.title} complete`}
                    disabled={task.is_completed || !isTaskInProgress(task)}
                  >
                    {task.is_completed ? <i className="fa-solid fa-check" /> : ''}
                  </button>
                  <div className="task-main">
                    <div className="task-title">
                      <h3>{task.title}</h3>
                      <span className={tagClassForPriority(task.priority)}>{task.priority}</span>
                    </div>
                    {task.description && <p className="task-notes">{task.description}</p>}
                    <div className="task-meta">
                      <span><i className="fa-solid fa-star" /> {task.awarded_points ?? task.points_value} pts</span>
                      {task.due_date && <span><i className="fa-solid fa-clock" /> Due {task.due_date}</span>}
                      {task.recurrence !== 'NONE' && <span>🔄 {task.recurrence}</span>}
                      {!task.is_completed && (
                        <span>
                          <i className="fa-solid fa-stopwatch" /> {formatDuration(task.active_seconds ?? 0)}
                        </span>
                      )}
                      {!task.is_completed && task.projected_points != null && (
                        <span>
                          <i className="fa-solid fa-chart-line" /> Projected: {task.projected_points} pts
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {!task.is_completed && (
                      <button className="ghost-btn" onClick={() => handleStartTask(task.id)} disabled={isTaskInProgress(task)}>
                        {isTaskInProgress(task) ? 'In progress' : 'Start'}
                      </button>
                    )}
                    {!task.is_completed && (
                      <button className="edit-btn" onClick={() => setEditingTask(task)}>
                        Edit
                        <i className="fa-solid fa-sliders" />
                      </button>
                    )}
                    <button className="ghost-btn" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="leaderboard-card work-leaderboard-card">
            <div className="panel-head compact">
              <div>
                <p className="panel-kicker">Leaderboard</p>
                <h2>Server leaderboard preview</h2>
                <p className="panel-subtitle">A quick look at the top standings for this server.</p>
              </div>
              <button className="ghost-btn" onClick={() => navigate('/leaderboard')}>View leaderboard</button>
            </div>
            <div className="leaderboard-list">
              {leaderboardPreview.length === 0 && (
                <p className="panel-subtitle">No leaderboard data yet for this server.</p>
              )}
              {leaderboardPreview.map((entry) => (
                <div className="leader-row" key={`${entry.rank}-${entry.username}`}>
                  <div className="rank">#{String(entry.rank).padStart(2, '0')}</div>
                  <div>
                    <p>{entry.username}</p>
                    <span>{entry.current_streak} day streak</span>
                  </div>
                  <strong>{entry.points} pts</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-competition-row">
          <section className="panel challenge-panel">
            <div className="panel-head">
              <div>
                <p className="panel-kicker">1v1 challenges</p>
                <h2>Friendly competition</h2>
                <p className="panel-subtitle">Match with a friend on a shared task and climb the points ladder.</p>
              </div>
              <div className="challenge-actions">
                <button className="secondary-btn" onClick={() => navigate('/competitions')}>
                  Start a 1v1 challenge
                  <i className="fa-solid fa-crosshairs" />
                </button>
              </div>
            </div>
            <div className="challenge-cards">
              {activeChallenges.length === 0 && (
                <p className="panel-subtitle">No active challenges right now. Start one from Competitions.</p>
              )}
              {activeChallenges.map((challenge) => (
                <article key={challenge.id} className="challenge-card">
                  <div className="challenge-row">
                    <div className="challenge-summary">
                      <h3>{challenge.task}</h3>
                      <span className={`status-pill status-${challenge.status.toLowerCase()}`}>{challenge.status}</span>
                    </div>
                    <div className="challenge-players">
                      <div><p>You</p><strong>{challenge.yourScore} pts</strong></div>
                      <div><p>{challenge.opponent}</p><strong>{challenge.theirScore} pts</strong></div>
                    </div>
                    <button className="ghost-btn" onClick={() => navigate('/competitions')}>View matchup</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="panel workspace-panel">
            <div className="panel-head compact">
              <div>
                <p className="panel-kicker">Workspace</p>
                <h2>Server controls</h2>
                <p className="panel-subtitle">Switch context or create a new server without interrupting the main task view.</p>
              </div>
            </div>
            <div className="workspace-control-row">
              <div style={{ position: 'relative' }}>
                <button className="secondary-btn workspace-menu-btn" onClick={() => setShowServerDropdown((v) => !v)}>
                  <span><i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }} />{selectedServer?.name || 'Select Server'}</span>
                  <i className={`fa-solid ${showServerDropdown ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                </button>
                {showServerDropdown && (
                  <div className="workspace-dropdown leaderboard-card" style={{ position: 'absolute', top: '110%', left: 0, minWidth: 260, zIndex: 30 }}>
                    <div className="workspace-dropdown-actions">
                      <button className="ghost-btn workspace-action-btn" onClick={() => { setShowCreateServer(true); setShowServerDropdown(false); }}>
                        + Create Server
                      </button>
                      <button className="ghost-btn workspace-action-btn" onClick={() => { setShowJoinServer(true); setShowServerDropdown(false); }}>
                        <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '6px' }} /> Join Server
                      </button>
                    </div>
                    <div className="workspace-server-list">
                      {servers.map((server) => (
                        <button
                          key={server.id}
                          className="ghost-btn full-width workspace-server-option"
                          onClick={() => handleSelectServer(server)}
                          style={{ justifyContent: 'space-between', marginBottom: 6 }}
                        >
                          <span>{server.name}</span>
                          {selectedServer?.id === server.id ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {showAddTask && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <div>
                <p className="panel-kicker">Create task</p>
                <h2>Quick add a new task</h2>
              </div>
              <button className="icon-btn" onClick={() => setShowAddTask(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleAddTask}>
              <label>Task name
                <input type="text" placeholder="Finish biology notes" value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} required />
              </label>
              <label>Description
                <textarea rows={3} placeholder="Add context" value={newTask.description} onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))} />
              </label>
              <label>Difficulty
                <select value={newTask.priority} onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' }))}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </label>
              <p className="panel-subtitle" style={{ margin: 0 }}>Points are assigned automatically from difficulty.</p>
              <label>Due date
                <input type="date" value={newTask.due_date} onChange={(e) => setNewTask((p) => ({ ...p, due_date: e.target.value }))} />
              </label>
              <label>Recurrence
                <select value={newTask.recurrence} onChange={(e) => setNewTask((p) => ({ ...p, recurrence: e.target.value as 'NONE' | 'DAILY' | 'WEEKLY' }))}>
                  <option value="NONE">One-time</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setShowAddTask(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Add task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <div>
                <p className="panel-kicker">Edit task</p>
                <h2>Update details</h2>
              </div>
              <button className="icon-btn" onClick={() => setEditingTask(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleUpdateTask}>
              <label>Task name
                <input type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} />
              </label>
              <label>Description
                <textarea rows={3} value={editingTask.description} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} />
              </label>
              <label>Difficulty
                <select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </label>
              <p className="panel-subtitle" style={{ margin: 0 }}>Points are assigned automatically from difficulty.</p>
              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setEditingTask(null)}>Close</button>
                <button type="submit" className="primary-btn">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateServer && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <div><p className="panel-kicker">Workspace</p><h2>Create server</h2></div>
              <button className="icon-btn" onClick={() => setShowCreateServer(false)}><i className="fa-solid fa-xmark" /></button>
            </div>
            <form className="modal-form" onSubmit={handleCreateServer}>
              <label>Server name
                <input value={newServerName} onChange={(e) => setNewServerName(e.target.value)} required />
              </label>
              <label>Description
                <textarea rows={3} value={newServerDesc} onChange={(e) => setNewServerDesc(e.target.value)} />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setShowCreateServer(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinServer && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <div><p className="panel-kicker">Workspace</p><h2>Join server</h2></div>
              <button className="icon-btn" onClick={() => setShowJoinServer(false)}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="modal-form">
              <label>Search
                <input value={joinServerQuery} onChange={(e) => handleSearchServers(e.target.value)} placeholder="Search by name..." />
              </label>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {joinServerResults.length > 0 ? (
                  joinServerResults.map((server) => (
                    <div key={server.id} className="leader-row" style={{ marginBottom: 8 }}>
                      <div>
                        <p>{server.name}</p>
                        <span>{server.member_count} members</span>
                      </div>
                      <button className="secondary-btn" onClick={() => handleJoinServer(server.id)}>Join</button>
                    </div>
                  ))
                ) : (
                  <p className="panel-subtitle">{joinServerQuery ? 'No servers found.' : 'Type to search servers.'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
