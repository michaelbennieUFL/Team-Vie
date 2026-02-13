import { useMemo, useState, type FormEvent } from 'react'
import './App.css'

const tourTabs = [
  {
    id: 'tasks',
    label: 'Tasks',
    title: 'Create, edit, complete, repeat',
    copy:
      'Capture what matters, update details anytime, and check tasks off when done. Stay in control of your day.',
    bullets: ['Create and edit tasks', 'Mark complete or delete', 'Organize by focus'],
    image: '/images/mock-tasks.svg',
  },
  {
    id: 'streaks',
    label: 'Streaks',
    title: 'Consistency you can see',
    copy:
      'Track how many days in a row you finish tasks and turn momentum into a habit.',
    bullets: ['Daily streak tracker', 'Streak milestones', 'Keep the chain alive'],
    image: '/images/mock-streak.svg',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    title: 'Compare progress by region',
    copy:
      'See how you stack up against others and filter rankings by geographic area.',
    bullets: ['Global rankings', 'Regional filters', 'Points-based order'],
    image: '/images/mock-leaderboard.svg',
  },
  {
    id: 'duels',
    label: '1v1',
    title: 'Friendly head-to-heads',
    copy:
      'Challenge someone working on the same task and compete to finish stronger.',
    bullets: ['Shared task matches', 'Clear winner by points', 'Instant rematches'],
    image: '/images/mock-duel.svg',
  },
]

const features = [
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Task management',
    copy: 'Create, edit, complete, and delete tasks as your priorities change.',
  },
  {
    icon: 'fa-solid fa-fire',
    title: 'Daily streaks',
    copy: 'Track consecutive days of completed tasks and keep the streak going.',
  },
  {
    icon: 'fa-solid fa-people-group',
    title: 'Reward points',
    copy: 'Earn points every time you complete a task to stay motivated.',
  },
  {
    icon: 'fa-solid fa-trophy',
    title: 'Leaderboards',
    copy: 'Compare progress and filter rankings by geographic region.',
  },
  {
    icon: 'fa-solid fa-bullseye',
    title: '1v1 challenges',
    copy: 'Challenge someone with a shared goal and compete for points.',
  },
  {
    icon: 'fa-solid fa-chart-line',
    title: 'Motivation loop',
    copy: 'Gamification, accountability, and competition keep you consistent.',
  },
]

const testimonials = [
  {
    quote:
      'The leaderboard finally made my study group show up. Nobody wants to be the one who broke a streak.',
    name: 'Jordan R.',
    role: 'Medical Student',
  },
  {
    quote:
      'I use it for gym consistency. The proof requirement keeps me honest and the points keep me hungry.',
    name: 'Keisha M.',
    role: 'Strength Coach',
  },
  {
    quote:
      'Our internship cohort uses 1v1 challenges for accountability. It is fun, but still serious.',
    name: 'Luis T.',
    role: 'Software Intern',
  },
]

const faqs = [
  {
    q: 'Does every task need proof?',
    a: 'No. You decide what needs extra detail and what can be kept simple.',
  },
  {
    q: 'Can I use it for both study and fitness?',
    a: 'Yes. Track any goal and compete with others who share the same focus.',
  },
  {
    q: 'How do 1v1 challenges work?',
    a: 'You match on a shared task, compete to complete more, and points decide the winner.',
  },
]

const categories = ['Study', 'Fitness', 'Work', 'Personal']

const initialTasks = [
  {
    id: 1,
    title: 'Review calculus problem set',
    category: 'Study',
    time: '9:00 AM',
    points: 120,
    done: true,
    notes: 'Focus on integrals 12-18',
  },
  {
    id: 2,
    title: '45 min strength circuit',
    category: 'Fitness',
    time: '12:30 PM',
    points: 90,
    done: false,
    notes: 'Superset legs + core',
  },
  {
    id: 3,
    title: 'Ship weekly sprint recap',
    category: 'Work',
    time: '3:15 PM',
    points: 70,
    done: false,
    notes: 'Highlight blockers + wins',
  },
  {
    id: 4,
    title: 'Read 20 pages',
    category: 'Personal',
    time: '7:30 PM',
    points: 60,
    done: false,
    notes: 'Continue chapter 6',
  },
]

const leaderboardPreview = [
  {
    rank: '01',
    name: 'Camila Reyes',
    points: '1,420',
    streak: '12d',
  },
  {
    rank: '02',
    name: 'Jaden Brooks',
    points: '1,310',
    streak: '10d',
  },
  {
    rank: '03',
    name: 'Priya Nair',
    points: '1,205',
    streak: '9d',
  },
]

const activeChallenges = [
  {
    id: 1,
    opponent: 'Riley Park',
    task: 'Study for Exam',
    status: '3 days left',
    yourScore: 320,
    theirScore: 300,
  },
  {
    id: 2,
    opponent: 'Noah Brooks',
    task: 'Gym',
    status: 'Ends tomorrow',
    yourScore: 210,
    theirScore: 240,
  },
]

function LandingPage({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  const [activeTab, setActiveTab] = useState('tasks')
  const activeTour = useMemo(
    () => tourTabs.find((tab) => tab.id === activeTab) ?? tourTabs[0],
    [activeTab]
  )

  return (
    <div className="page">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">V</span>
          <div>
            <p className="brand-name">Vie</p>
            <p className="brand-tag">Accountability, turned competitive.</p>
          </div>
        </div>
        <nav className="nav-links">
          <a href="#tour">Product</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="nav-actions">
          <button className="primary-btn" onClick={onOpenDashboard}>
            Start your streak
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="pill">
              <i className="fa-solid fa-bolt" />
              New: 1v1 challenges by shared tasks
            </div>
            <h1>
              Consistency wins. <span>Competition keeps it honest.</span>
            </h1>
            <p className="hero-subtitle">
              Vie turns daily tasks into points, streaks, and friendly competition. Stay
              motivated with clear progress and shared goals.
            </p>
            <div className="hero-actions">
              <button className="primary-btn" onClick={onOpenDashboard}>
                Create a task
                <i className="fa-solid fa-circle-play" />
              </button>
              <button className="secondary-btn">
                View leaderboards
                <i className="fa-solid fa-chart-simple" />
              </button>
            </div>
            <div className="hero-stats">
              <div>
                <h3>Tasks</h3>
                <p>create, edit, complete, delete</p>
              </div>
              <div>
                <h3>Points</h3>
                <p>earned on completion</p>
              </div>
              <div>
                <h3>Streaks</h3>
                <p>track daily consistency</p>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/images/mock-hero.svg" alt="Vie app dashboard preview" />
            <div className="hero-card">
              <p>Today</p>
              <h4>Streak secured</h4>
              <span>+120 pts for verified study block</span>
            </div>
          </div>
        </section>

        <section id="tour" className="product-tour">
          <div className="section-head">
            <p className="section-kicker">Product tour</p>
            <h2>From tasks to trophies in one flow</h2>
            <p>
              Everything you do gets scored, verified, and ranked. Move between tasks,
              streaks, leaderboards, and challenges without losing context.
            </p>
          </div>
          <div className="tour-body">
            <div className="tour-tabs">
              {tourTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? 'tab active' : 'tab'}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="tour-panel">
              <div className="tour-copy">
                <h3>{activeTour.title}</h3>
                <p>{activeTour.copy}</p>
                <ul>
                  {activeTour.bullets.map((item) => (
                    <li key={item}>
                      <i className="fa-solid fa-check" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button className="secondary-btn">
                  Explore {activeTour.label}
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
              <div className="tour-image">
                <img src={activeTour.image} alt={`${activeTour.label} preview`} />
              </div>
            </div>
          </div>
        </section>

        <section id="leaderboard" className="leaderboard-preview">
          <div className="section-head">
            <p className="section-kicker">Live leaderboard</p>
            <h2>Compare progress by region</h2>
            <p>
              See how you rank globally or filter by geographic area to find your
              closest competition.
            </p>
          </div>
          <div className="leaderboard-grid">
            <div className="leaderboard-filters">
              <h3>Filter leaderboards</h3>
              <div className="filter-chips">
                <button className="chip active">Worldwide</button>
                <button className="chip">United States</button>
                <button className="chip">Florida</button>
                <button className="chip">Texas</button>
                <button className="chip">Miami</button>
                <button className="chip">Gainesville</button>
                <button className="chip">University of Florida</button>
                <button className="chip">University of Texas</button>
                <button className="chip">Study for Exam</button>
                <button className="chip">Gym</button>
              </div>
              <div className="filter-list">
                <div>
                  <p className="label">Sort by</p>
                  <span className="value">Points earned</span>
                </div>
                <div>
                  <p className="label">Timeframe</p>
                  <span className="value">This week</span>
                </div>
                <div>
                  <p className="label">Major</p>
                  <span className="value">Computer Science</span>
                </div>
                <div>
                  <p className="label">Age group</p>
                  <span className="value">18–24</span>
                </div>
                <div>
                  <p className="label">Profession</p>
                  <span className="value">Students</span>
                </div>
                <div>
                  <p className="label">Interest group</p>
                  <span className="value">Study</span>
                </div>
              </div>
              <button className="ghost-btn full-width">
                View full leaderboard
                <i className="fa-solid fa-arrow-up-right-from-square" />
              </button>
            </div>
            <div className="leaderboard-table">
              <div className="table-head">
                <span>Rank</span>
                <span>Competitor</span>
                <span>Points</span>
                <span>Streak</span>
              </div>
              {[
                {
                  rank: '01',
                  name: 'Camila Reyes',
                  title: 'Miami · Study for Exam',
                  points: '4,960',
                  streak: '21d',
                },
                {
                  rank: '02',
                  name: 'Jaden Brooks',
                  title: 'Gainesville · Gym',
                  points: '4,680',
                  streak: '18d',
                },
                {
                  rank: '03',
                  name: 'Priya Nair',
                  title: 'University of Florida · Study for Exam',
                  points: '4,410',
                  streak: '16d',
                },
                {
                  rank: '04',
                  name: 'Ethan Walker',
                  title: 'University of Texas · Daily Reading',
                  points: '4,120',
                  streak: '14d',
                },
                {
                  rank: '05',
                  name: 'Sofia Alvarez',
                  title: 'Texas · Coding',
                  points: '3,980',
                  streak: '12d',
                },
              ].map((row) => (
                <div className="table-row" key={row.rank}>
                  <span className="rank">#{row.rank}</span>
                  <div>
                    <p>{row.name}</p>
                    <span>{row.title}</span>
                  </div>
                  <span className="points">{row.points}</span>
                  <span className="streak">
                    <i className="fa-solid fa-fire" /> {row.streak}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <div className="section-head">
            <p className="section-kicker">Why Vie</p>
            <h2>Built for motivated, competitive people</h2>
            <p>Gamification, accountability, and friendly competition keep you moving.</p>
          </div>
          <div className="grid">
            {features.map((feature) => (
              <article key={feature.title}>
                <i className={feature.icon} />
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="testimonials">
          <div className="section-head">
            <p className="section-kicker">Testimonials</p>
            <h2>Motivation that lasts</h2>
            <p>From exam prep to fitness goals, progress is more fun together.</p>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <article key={item.name}>
                <p className="quote">“{item.quote}”</p>
                <div>
                  <p className="name">{item.name}</p>
                  <span>{item.role}</span>
                </div>
              </article>
            ))}
            <div className="testimonial-image">
              <img
                src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80"
                alt="Friends studying together"
              />
            </div>
          </div>
        </section>

        <section className="faq" id="faq">
          <div className="section-head">
            <p className="section-kicker">FAQ</p>
            <h2>Everything you need to know</h2>
            <p>Built for accountability-first teams and solo challengers alike.</p>
          </div>
          <div className="faq-grid">
            {faqs.map((item) => (
              <article key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta">
          <div>
            <h2>Bring a friend. Build a streak.</h2>
            <p>
              Stay motivated with points, streaks, and friendly competition on shared
              goals.
            </p>
          </div>
          <div className="cta-actions">
            <button className="primary-btn" onClick={onOpenDashboard}>
              Create your first task
            </button>
            <button className="ghost-btn">Join the community</button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <h3>Vie</h3>
          <p>Accountability for teams that want to win.</p>
        </div>
        <div className="footer-links">
          <a href="#tour">Product tour</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="footer-meta">
          <span>contact@teamvie.app</span>
          <span>Built for students and competitors</span>
        </div>
      </footer>
    </div>
  )
}

function DashboardPage({ onBack }: { onBack: () => void }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [editTask, setEditTask] = useState<typeof initialTasks[number] | null>(null)
  const [createForm, setCreateForm] = useState({
    title: '',
    category: 'Study',
    points: '80',
    notes: '',
  })
  const [editForm, setEditForm] = useState({
    title: '',
    category: 'Study',
    points: '80',
    notes: '',
  })
  const [inviteCode, setInviteCode] = useState('VIE-4821')

  const pointsToday = useMemo(
    () => tasks.filter((task) => task.done).reduce((sum, task) => sum + task.points, 0),
    [tasks]
  )
  const currentStreak = 12
  const nextTier = 600
  const progress = Math.min((pointsToday / nextTier) * 100, 100)

  const categoryCounts = useMemo(() => {
    return categories.map((category) => ({
      category,
      count: tasks.filter((task) => task.category === category).length,
    }))
  }, [tasks])

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    )
  }

  const openEdit = (task: typeof initialTasks[number]) => {
    setEditTask(task)
    setEditForm({
      title: task.title,
      category: task.category,
      points: task.points.toString(),
      notes: task.notes,
    })
  }

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.title.trim()) return

    const nextTask = {
      id: tasks.length + 1,
      title: createForm.title.trim(),
      category: createForm.category,
      time: 'Today',
      points: Number(createForm.points) || 0,
      done: false,
      notes: createForm.notes,
    }

    setTasks((prev) => [nextTask, ...prev])
    setCreateForm({ title: '', category: 'Study', points: '80', notes: '' })
    setIsCreateOpen(false)
  }

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editTask) return

    setTasks((prev) =>
      prev.map((task) =>
        task.id === editTask.id
          ? {
              ...task,
              title: editForm.title.trim() || task.title,
              category: editForm.category,
              points: Number(editForm.points) || task.points,
              notes: editForm.notes,
            }
          : task
      )
    )
    setEditTask(null)
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="brand">
          <span className="brand-mark">V</span>
          <div>
            <p className="brand-name">Good afternoon, Camila</p>
            <p className="brand-tag">Ready to stack points and keep the streak alive.</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="ghost-btn" onClick={onBack}>
            Back to main page
          </button>
          <button className="primary-btn" onClick={() => setIsCreateOpen(true)}>
            Quick add task
            <i className="fa-solid fa-circle-plus" />
          </button>
        </div>
      </header>

      <main className="dash-main">
        <section className="panel tasks-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Today</p>
              <h2>Today&apos;s tasks</h2>
              <p className="panel-subtitle">
                Keep momentum with points, streaks, and friendly competition.
              </p>
            </div>
            <button className="ghost-btn" onClick={() => setIsCreateOpen(true)}>
              New task
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>

          <div className="category-row">
            {categoryCounts.map((item) => (
              <div key={item.category} className="category-pill">
                <span>{item.category}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>

          <div className="tasks-list">
            {tasks.map((task) => (
              <article
                key={task.id}
                className={`task-card ${task.done ? 'done' : ''}`}
              >
                <button
                  className="check-btn"
                  onClick={() => toggleTask(task.id)}
                  aria-label={`Mark ${task.title} complete`}
                >
                  {task.done ? <i className="fa-solid fa-check" /> : ''}
                </button>
                <div className="task-main">
                  <div className="task-title">
                    <h3>{task.title}</h3>
                    <span className={`tag tag-${task.category.toLowerCase()}`}>
                      {task.category}
                    </span>
                  </div>
                  <p className="task-notes">{task.notes}</p>
                  <div className="task-meta">
                    <span>
                      <i className="fa-solid fa-clock" /> {task.time}
                    </span>
                    <span>
                      <i className="fa-solid fa-star" /> {task.points} pts
                    </span>
                  </div>
                </div>
                <button className="edit-btn" onClick={() => openEdit(task)}>
                  Edit
                  <i className="fa-solid fa-sliders" />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel insight-panel">
          <div className="stats-grid">
            <div className="stat-card">
              <p className="panel-kicker">Points earned today</p>
              <h3>{pointsToday}</h3>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <p className="panel-subtitle">
                {nextTier - pointsToday} points to reach the next reward tier.
              </p>
            </div>
            <div className="stat-card">
              <p className="panel-kicker">Current streak</p>
              <h3>{currentStreak} days</h3>
              <p className="panel-subtitle">
                Keep your streak alive by completing at least one task today.
              </p>
              <div className="streak-strip">
                {Array.from({ length: 7 }).map((_, index) => (
                  <span key={index} className={index < 5 ? 'active' : ''} />
                ))}
              </div>
            </div>
          </div>

          <div className="leaderboard-card">
            <div className="panel-head compact">
              <div>
                <p className="panel-kicker">Leaderboard preview</p>
                <h2>Top competitors</h2>
              </div>
              <button className="ghost-btn">View all</button>
            </div>
            <div className="leaderboard-list">
              {leaderboardPreview.map((entry) => (
                <div key={entry.rank} className="leader-row">
                  <div className="rank">#{entry.rank}</div>
                  <div>
                    <p>{entry.name}</p>
                    <span>{entry.streak} streak</span>
                  </div>
                  <strong>{entry.points} pts</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="reward-card">
            <div>
              <p className="panel-kicker">Next reward tier</p>
              <h3>Momentum Badge</h3>
              <p className="panel-subtitle">
                Unlock at 600 points and keep the leaderboard glow all week.
              </p>
            </div>
            <div className="reward-token">MB</div>
          </div>
        </section>

        <section className="panel challenge-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">1v1 challenges</p>
              <h2>Friendly competition</h2>
              <p className="panel-subtitle">
                Match with a friend on a shared task and climb the points ladder.
              </p>
            </div>
            <div className="challenge-actions">
              <button className="secondary-btn">
                Start a 1v1 challenge
                <i className="fa-solid fa-crosshairs" />
              </button>
              <button className="ghost-btn" onClick={() => setIsInviteOpen(true)}>
                Invite friend with code
                <i className="fa-solid fa-link" />
              </button>
            </div>
          </div>
          <div className="challenge-cards">
            {activeChallenges.map((challenge) => (
              <article key={challenge.id} className="challenge-card">
                <div className="challenge-head">
                  <div>
                    <p className="panel-kicker">Active</p>
                    <h3>{challenge.task}</h3>
                  </div>
                  <span className="status-pill">{challenge.status}</span>
                </div>
                <div className="challenge-players">
                  <div>
                    <p>You</p>
                    <strong>{challenge.yourScore} pts</strong>
                  </div>
                  <div>
                    <p>{challenge.opponent}</p>
                    <strong>{challenge.theirScore} pts</strong>
                  </div>
                </div>
                <button className="ghost-btn">View matchup</button>
              </article>
            ))}
          </div>
        </section>
      </main>

      <button className="fab" onClick={() => setIsCreateOpen(true)}>
        <i className="fa-solid fa-plus" />
      </button>

      {isCreateOpen && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <div>
                <p className="panel-kicker">Create task</p>
                <h2>Quick add a new task</h2>
              </div>
              <button className="icon-btn" onClick={() => setIsCreateOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleCreateSubmit}>
              <label>
                Task name
                <input
                  type="text"
                  placeholder="Finish biology notes"
                  value={createForm.title}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </label>
              <label>
                Category
                <select
                  value={createForm.category}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Points
                <input
                  type="number"
                  value={createForm.points}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, points: event.target.value }))
                  }
                />
              </label>
              <label>
                Notes
                <textarea
                  rows={3}
                  placeholder="Add a quick note"
                  value={createForm.notes}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Add task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInviteOpen && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <div>
                <p className="panel-kicker">Invite code</p>
                <h2>Invite a friend to a 1v1</h2>
              </div>
              <button className="icon-btn" onClick={() => setIsInviteOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form className="modal-form" onSubmit={(event) => event.preventDefault()}>
              <label>
                Share this code
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                />
              </label>
              <label>
                Friend name
                <input type="text" placeholder="Who are you inviting?" />
              </label>
              <label>
                Shared task
                <input type="text" placeholder="Study for Exam" />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setIsInviteOpen(false)}
                >
                  Close
                </button>
                <button type="button" className="primary-btn">
                  Copy code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <aside className={`edit-panel ${editTask ? 'open' : ''}`}>
        <div className="edit-head">
          <div>
            <p className="panel-kicker">Edit task</p>
            <h2>Update details</h2>
          </div>
          <button className="icon-btn" onClick={() => setEditTask(null)}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <form className="modal-form" onSubmit={handleEditSubmit}>
          <label>
            Task name
            <input
              type="text"
              value={editForm.title}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </label>
          <label>
            Category
            <select
              value={editForm.category}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, category: event.target.value }))
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Points
            <input
              type="number"
              value={editForm.points}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, points: event.target.value }))
              }
            />
          </label>
          <label>
            Notes
            <textarea
              rows={3}
              value={editForm.notes}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={() => setEditTask(null)}>
              Close
            </button>
            <button type="submit" className="primary-btn">
              Save changes
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

function App() {
  const [page, setPage] = useState<'landing' | 'dashboard'>('landing')

  return page === 'landing' ? (
    <LandingPage onOpenDashboard={() => setPage('dashboard')} />
  ) : (
    <DashboardPage onBack={() => setPage('landing')} />
  )
}

export default App
