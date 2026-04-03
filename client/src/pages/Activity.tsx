import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProtectedNav from '../components/ProtectedNav';
import { apiService } from '../services/api';
import type { ActivityResponse, UserSearchResult, VieServer } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';

export default function Activity() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [servers, setServers] = useState<VieServer[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [serversData, activityData] = await Promise.all([
          apiService.getServers(),
          apiService.getActivity(userId ? Number(userId) : undefined, selectedServerId),
        ]);
        setServers(serversData);
        setActivity(activityData);
      } catch (error) {
        console.error('Failed to load progress:', error);
      }
    };
    loadPageData();
  }, [userId, selectedServerId]);

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await apiService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  return (
    <div className={`vie-app-page ${isDarkMode ? 'theme-dark' : 'theme-light'}`} style={{ width: '100%', padding: '28px 5vw 48px' }}>
      <ProtectedNav isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />

      <div className="page-section page-section-tight" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>Progress</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--app-text-muted)' }}>
            Track the weekly finish line, personal bests, and recent completed work.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
          <select
            value={selectedServerId || ''}
            onChange={(e) => setSelectedServerId(e.target.value ? Number(e.target.value) : undefined)}
            style={{ padding: '8px' }}
          >
            <option value="">All Servers</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>{server.name}</option>
            ))}
          </select>
          <div style={{ position: 'relative' }}>
            <input
              value={searchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
              placeholder="Search user progress"
              style={{ width: '220px' }}
            />
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                width: '100%',
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(11, 13, 15, 0.12)',
                zIndex: 20,
                overflow: 'hidden',
              }}>
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => {
                      setSearchResults([]);
                      setSearchQuery(result.username);
                      navigate(`/progress/${result.id}`);
                    }}
                    style={{ width: '100%', textAlign: 'left', borderRadius: 0, border: 'none', borderBottom: '1px solid var(--app-border)' }}
                  >
                    {result.username}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activity && (
        <>
          <div className="page-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '8px' }}>{activity.user.username}</h3>
              <p style={{ margin: 0, color: 'var(--app-text-muted)' }}>Weekly progress view</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '8px' }}>{activity.summary.weekly_competitive_points} / {activity.summary.weekly_goal_points}</h3>
              <p style={{ margin: 0, color: 'var(--app-text-muted)' }}>Weekly finish line</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '8px' }}>{activity.summary.weekly_goal_reached ? 'Reached' : activity.summary.weekly_goal_remaining}</h3>
              <p style={{ margin: 0, color: 'var(--app-text-muted)' }}>
                {activity.summary.weekly_goal_reached ? 'Goal hit this week' : 'Points remaining'}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '8px' }}>{activity.summary.weekly_personal_points}</h3>
              <p style={{ margin: 0, color: 'var(--app-text-muted)' }}>Personal points this week</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '8px' }}>{activity.summary.best_weekly_personal_points}</h3>
              <p style={{ margin: 0, color: 'var(--app-text-muted)' }}>Best weekly personal score</p>
            </div>
          </div>

          <div className="page-section">
            <h2 style={{ marginTop: 0 }}>Recent Completed Work</h2>
            <p style={{ margin: '0 0 14px', color: 'var(--app-text-muted)' }}>
              Full-value completions push the public finish line. Extra work after the daily cap still builds your personal weekly score.
            </p>
            <div style={{ display: 'grid', gap: '12px' }}>
              {activity.entries.length === 0 && (
                <p style={{ margin: 0, color: 'var(--app-text-muted)' }}>No completed work to show yet.</p>
              )}
              {activity.entries.map((entry) => (
                <div key={entry.id} style={{
                  border: '1px solid var(--app-border)',
                  background: 'var(--app-surface-subtle)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'grid',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{entry.title}</h3>
                      <p style={{ margin: '6px 0 0', color: 'var(--app-text-muted)' }}>
                        {entry.source === 'competition' ? 'Competition task' : 'Personal task'}
                        {entry.competition_label ? ` • ${entry.competition_label}` : ''}
                        {entry.server_name ? ` • ${entry.server_name}` : ''}
                      </p>
                    </div>
                    <strong>{entry.awarded_points} pts</strong>
                  </div>
                  {entry.description && <p style={{ margin: 0 }}>{entry.description}</p>}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', color: 'var(--app-text-muted)', fontSize: '13px' }}>
                    <span>Difficulty: {entry.difficulty}</span>
                    <span>{entry.score_reason?.includes('daily_cap') ? 'Reduced personal points' : 'Full-value completion'}</span>
                    <span>Completed: {new Date(entry.completed_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
