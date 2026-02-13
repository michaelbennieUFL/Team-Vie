import { useState, type FormEvent } from 'react'
import './LoginPage.css'

type LoginPageProps = {
  onBack: () => void
  onLogin: () => void
}

function LoginPage({ onBack, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onLogin()
  }

  return (
    <div className="login-page">
      <button className="ghost-btn login-back" onClick={onBack}>
        <i className="fa-solid fa-arrow-left" />
        Back to main page
      </button>

      <section className="login-shell">
        <div className="login-brand">
          <span className="brand-mark">V</span>
          <div>
            <p className="brand-name">Welcome back to Vie</p>
            <p className="brand-tag">Accountability, turned competitive.</p>
          </div>
        </div>

        <h1>Sign in</h1>
        <p className="login-subtitle">
          Jump back into your streaks, tasks, and leaderboard progress.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="primary-btn full-width">
            Sign in
            <i className="fa-solid fa-arrow-right-to-bracket" />
          </button>
        </form>

        <p className="login-meta">
          New here? <a href="#">Create an account</a>
        </p>
      </section>
    </div>
  )
}

export default LoginPage
