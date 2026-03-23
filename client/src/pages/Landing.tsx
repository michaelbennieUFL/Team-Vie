import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppTheme } from '../hooks/useAppTheme';

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
];

export default function Landing() {
  const [activeTab, setActiveTab] = useState('tasks');
  const { isDarkMode } = useAppTheme();
  const activeTour = useMemo(
    () => tourTabs.find((tab) => tab.id === activeTab) ?? tourTabs[0],
    [activeTab]
  );

  return (
    <div className={`page ${isDarkMode ? 'page-dark' : ''}`}>
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" onClick={() => {
            window.scrollTo(0, 0);}}>V</span>
          <div>
            <p className="brand-name">Vie</p>
            <p className="brand-tag">Accountability, turned competitive.</p>
          </div>
        </div>
        <nav className="nav-links">
          <a href="#tour">Product</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="nav-actions">
          <Link className="secondary-btn" to="/login">
            Sign in
          </Link>
          <Link className="primary-btn" to="/register">
            Start your streak
            <i className="fa-solid fa-arrow-right" />
          </Link>
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
              Vie turns daily tasks into points, streaks, and friendly competition.
            </p>
            <div className="hero-actions">
              <Link className="primary-btn" to="/dashboard">
                Go to dashboard
                <i className="fa-solid fa-circle-play" />
              </Link>
              <Link className="secondary-btn" to="/leaderboard">
                View leaderboard
                <i className="fa-solid fa-chart-simple" />
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/images/mock-hero.svg" alt="Vie dashboard preview" />
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
              </div>
              <div className="tour-image">
                <img src={activeTour.image} alt={`${activeTour.label} preview`} />
              </div>
            </div>
          </div>
        </section>

        <section className="cta" id="faq">
          <div>
            <h2>Bring a friend. Build a streak.</h2>
            <p>Stay motivated with points, streaks, and friendly competition.</p>
          </div>
          <div className="cta-actions">
            <Link className="primary-btn" to="/register">
              Create account
            </Link>
            <Link className="ghost-btn" to="/login">
              Sign in
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
