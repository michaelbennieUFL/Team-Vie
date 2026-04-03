import { useState } from 'react';
import { Link } from 'react-router-dom';

const tourTabs = [
  {
    id: 'tasks',
    label: 'Tasks',
    title: 'From tasks to trophies in one flow.',
    copy:
      'Start with the work in front of you. Vie turns everyday tasks into a clean system of points, progress, and momentum without making the day feel overly complicated.',
    bullets: [
      'Quickly add what matters today',
      'See points and difficulty without manual scoring',
      'Keep personal work organized by day and by server',
    ],
    image: '/images/mock-tasks.svg?v=2',
  },
  {
    id: 'streaks',
    label: 'Streaks',
    title: 'Consistency wins when momentum stays visible.',
    copy:
      'Streaks are there to keep the week honest. You can see your rhythm, protect your momentum, and keep showing up without the app turning into a grindy scoreboard.',
    bullets: [
      'Track your daily streak at a glance',
      'Watch weekly progress toward the finish line',
      'Use personal records as the next milestone after the cap',
    ],
    image: '/images/mock-streak.svg?v=2',
  },
  {
    id: 'competition',
    label: 'Competition',
    title: 'Competition keeps it honest, not hostile.',
    copy:
      'Challenge a friend through shared goals and clear point targets. Friendly 1v1s give structure to accountability without turning the app into endless farming.',
    bullets: [
      'First-to-target competition flow',
      'Shared goals that are easy to understand',
      'A better fit for accountability partners and classmates',
    ],
    image: '/images/mock-duel.svg?v=2',
  },
  {
    id: 'fair-play',
    label: 'Fair Play',
    title: 'Vie takes cheating seriously.',
    copy:
      'The system is designed to reduce obvious gaming. Points come from the backend, not the user, and repeated low-value grinding loses public weight over time.',
    bullets: [
      'Backend-owned point assignment',
      'Cooldowns that reduce instant task loops',
      'Reduced public scoring after daily full-point limits',
    ],
    image: '/images/mock-leaderboard.svg?v=2',
  },
];

export default function Landing() {
  const [activeTab, setActiveTab] = useState(tourTabs[0].id);
  const activeTour = tourTabs.find((tab) => tab.id === activeTab) ?? tourTabs[0];

  return (
    <div className="page cinematic-landing">
      <section className="cinematic-stage" id="home">
        <video
          className="cinematic-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
            type="video/mp4"
          />
        </video>

        <header className="cinematic-nav">
          <div className="cinematic-brand">
            <span className="cinematic-brand-mark">V</span>
            <div>
              <p className="cinematic-brand-name">Vie<sup>®</sup></p>
              <p className="cinematic-brand-tag">Finish lines, streaks, friendly rivalry.</p>
            </div>
          </div>
          <nav className="cinematic-links liquid-glass" aria-label="Landing">
            <a href="#home" className="active">Home</a>
            <a href="#tour">Product</a>
            <a href="#features">Friends</a>
            <a href="#access">Access</a>
          </nav>
          <div className="cinematic-actions">
            <Link className="secondary-btn liquid-glass nav-glass-btn" to="/login">
              Sign in
            </Link>
            <Link className="primary-btn liquid-glass nav-glass-btn" to="/register">
              Start your streak
            </Link>
          </div>
        </header>

        <main className="cinematic-main">
          <section className="cinematic-hero">
            <div className="cinematic-eyebrow animate-fade-rise">
              New: 1v1 challenges by shared tasks
            </div>
            <h1 className="animate-fade-rise" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Consistency wins.
              <br />
              <em>Competition keeps it honest.</em>
            </h1>
            <p className="cinematic-subtitle animate-fade-rise-delay">
              Vie turns daily tasks into points, streaks, and friendly competition.
            </p>
            <div className="cinematic-cta-row animate-fade-rise-delay-2">
              <Link className="liquid-glass cinematic-hero-cta" to="/register">
                Start your streak
              </Link>
              <Link className="liquid-glass cinematic-hero-cta subtle" to="/leaderboard">
                View leaderboard
              </Link>
            </div>

            <div className="cinematic-metrics">
              <article className="liquid-glass metric-card">
                <span className="metric-label">Consistency</span>
                <strong>Daily work, visible momentum</strong>
                <p>Turn ordinary tasks into a streak system that keeps the week moving.</p>
              </article>
              <article className="liquid-glass metric-card">
                <span className="metric-label">Competition</span>
                <strong>Friendly rivalry with real targets</strong>
                <p>Bring structure to accountability through clear goals instead of noisy score inflation.</p>
              </article>
              <article className="liquid-glass metric-card">
                <span className="metric-label">Fair play</span>
                <strong>Built to stay honest</strong>
                <p>Backend scoring and anti-farming rules keep public progress more trustworthy.</p>
              </article>
            </div>

            <div className="cinematic-access" id="access">
              <p>Already in the arena?</p>
              <Link to="/dashboard">Go to dashboard</Link>
            </div>
          </section>
        </main>
      </section>

      <section className="landing-story" id="tour">
        <div className="landing-story-shell">
          <section className="product-tour liquid-glass">
            <div className="section-head">
              <p className="section-kicker">Product tour</p>
              <h2>From tasks to trophies in one flow</h2>
            </div>
            <div className="tour-body">
              <div className="tour-tabs">
                {tourTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
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

          <section className="cta liquid-glass" id="features">
            <div>
              <p className="section-kicker">Built for friends</p>
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
        </div>
      </section>
    </div>
  );
}
