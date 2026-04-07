const API_BASE_URL = 'http://localhost:8000/api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: {
    points: number;
    current_streak: number;
    longest_streak: number;
    last_task_completed_date: string | null;
    region: string;
    default_weekly_goal_points: number;
    best_weekly_personal_points: number;
    weekly_progress: WeeklyProgressSnapshot;
  };
}

export interface WeeklyProgressSnapshot {
  week_start: string;
  competitive_points: number;
  personal_points: number;
  weekly_goal_points: number;
  goal_reached: boolean;
  competitive_points_remaining: number;
  reached_goal_at: string | null;
}

export interface VieServer {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  member_count: number;
  role: string | null;
  active_competition: number | null;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  points_value: number;
  awarded_points: number | null;
  score_reason: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  server: number | null;
  recurrence: 'NONE' | 'DAILY' | 'WEEKLY';
}

export interface Competition {
  id: number;
  challenger: number;
  challenger_username: string;
  opponent: number;
  opponent_username: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  challenger_score: number;
  opponent_score: number;
  points_goal: number | null;
  winner: number | null;
  winner_username: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  tasks: CompetitionTask[];
  server: number | null;
}

export interface CompetitionTask {
  id: number;
  title: string;
  description: string;
  difficulty: 'LOW' | 'MEDIUM' | 'HIGH';
  points_value: number;
  score_reason: string;
  challenger_completed: boolean;
  challenger_completed_at: string | null;
  opponent_completed: boolean;
  opponent_completed_at: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  username: string;
  points: number;
  current_streak: number;
  region: string;
  rank: number;
  goal_reached?: boolean;
  reached_goal_at?: string | null;
  weekly_goal_points?: number;
}

export interface MotivationQuote {
  quote: string;
  author: string;
  tone: string;
}

export interface CelebrationPayload {
  headline: string;
  phrase: string;
  points_earned: number;
  current_streak: number;
  daily_limit_reached?: boolean;
  limit_note?: string;
}

export interface UserSearchResult {
  id: number;
  username: string;
}

export interface ActivityEntry {
  id: string;
  source: 'personal' | 'competition';
  title: string;
  description: string;
  difficulty: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  awarded_points: number;
  score_reason: string;
  completed_at: string;
  server_id: number | null;
  server_name: string;
  competition_id: number | null;
  competition_label: string;
}

export interface ActivitySummary {
  total_points: number;
  personal_points: number;
  competition_points: number;
  completed_count: number;
  personal_completed_count: number;
  competition_completed_count: number;
  low_count: number;
  medium_count: number;
  high_count: number;
  weekly_goal_points: number;
  weekly_competitive_points: number;
  weekly_personal_points: number;
  weekly_goal_remaining: number;
  weekly_goal_reached: boolean;
  reached_goal_at: string | null;
  best_weekly_personal_points: number;
}

export interface ActivityResponse {
  user: User;
  summary: ActivitySummary;
  entries: ActivityEntry[];
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date: string | null;
  server: number | null;
  recurrence: 'NONE' | 'DAILY' | 'WEEKLY';
}

export interface CreateCompetitionTaskInput {
  title: string;
  description?: string;
  difficulty?: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ─── Auth redirect helper ────────────────────────────────────────────────────
// Called whenever the server returns 401 or 403 so the client is always
// returned to the login page when a session expires or becomes invalid.
function handleUnauthenticated() {
  localStorage.removeItem('user');
  localStorage.removeItem('selectedServerId');
  // Only redirect when we are not already on a public page
  const publicPaths = ['/', '/login', '/register'];
  if (!publicPaths.includes(window.location.pathname)) {
    window.location.href = '/login';
  }
}

class ApiService {
  private csrfTokenFetched = false;

  private async ensureCsrfToken() {
    if (!this.csrfTokenFetched) {
      try {
        await fetch(`${API_BASE_URL}/users/csrf/`, {
          credentials: 'include',
        });
        this.csrfTokenFetched = true;
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const csrfToken = this.getCookie('csrftoken');
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    return headers;
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const part = parts.pop();
      return part ? part.split(';').shift() || null : null;
    }
    return null;
  }

  // FIX: Auth state inconsistency — redirect to login on 401/403
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401 || response.status === 403) {
      handleUnauthenticated();
      throw new Error('Session expired. Please log in again.');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication
  async register(data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
  }) {
    await this.ensureCsrfToken();
    const response = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; user: User }>(response);
  }

  async login(username: string, password: string) {
    await this.ensureCsrfToken();
    const response = await fetch(`${API_BASE_URL}/users/login/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    return this.handleResponse<{ message: string; user: User }>(response);
  }

  async logout() {
    const response = await fetch(`${API_BASE_URL}/users/logout/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/users/me/`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<User>(response);
  }

  async getMotivationalQuote() {
    const response = await fetch(`${API_BASE_URL}/users/motivation/`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<MotivationQuote>(response);
  }

  // Tasks
  async getTasks(serverId?: number) {
    const url = serverId
      ? `${API_BASE_URL}/tasks/?server=${serverId}`
      : `${API_BASE_URL}/tasks/`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<Task[]>(response);
  }

  async createTask(data: CreateTaskInput) {
    const response = await fetch(`${API_BASE_URL}/tasks/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse<Task>(response);
  }

  async updateTask(id: number, data: Partial<Task>) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse<Task>(response);
  }

  async deleteTask(id: number) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleUnauthenticated();
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async completeTask(id: number) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/complete/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<{ message: string; points_earned: number; task: Task; celebration: CelebrationPayload }>(response);
  }

  // Leaderboard
  async getLeaderboard(region?: string, serverId?: number) {
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (serverId) params.set('server', String(serverId));
    const query = params.toString();
    const url = query
      ? `${API_BASE_URL}/users/leaderboard/?${query}`
      : `${API_BASE_URL}/users/leaderboard/`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<LeaderboardEntry[]>(response);
  }

  async getActivity(userId?: number, serverId?: number) {
    const params = new URLSearchParams();
    if (serverId) params.set('server', String(serverId));
    const query = params.toString();
    const base = userId
      ? `${API_BASE_URL}/users/activity/${userId}/`
      : `${API_BASE_URL}/users/activity/`;
    const url = query ? `${base}?${query}` : base;
    const response = await fetch(url, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<ActivityResponse>(response);
  }

  // Competitions
  async getCompetitions(serverId?: number) {
    const url = serverId
      ? `${API_BASE_URL}/competitions/?server=${serverId}`
      : `${API_BASE_URL}/competitions/`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<Competition[]>(response);
  }

  async createCompetition(opponentId: number, serverId?: number, pointsGoal?: number) {
    const body: Record<string, number> = { opponent: opponentId };
    if (serverId) body.server = serverId;
    if (pointsGoal) body.points_goal = pointsGoal;
    const response = await fetch(`${API_BASE_URL}/competitions/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return this.handleResponse<Competition>(response);
  }

  async acceptCompetition(id: number) {
    const response = await fetch(`${API_BASE_URL}/competitions/${id}/accept/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<{ message: string; competition: Competition }>(response);
  }

  async completeCompetitionTask(competitionId: number, taskId: number) {
    const response = await fetch(`${API_BASE_URL}/competitions/${competitionId}/complete_task/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ task_id: taskId }),
    });
    return this.handleResponse<{ message: string; competition: Competition }>(response);
  }

  async deleteCompetition(id: number) {
    const response = await fetch(`${API_BASE_URL}/competitions/${id}/delete_competition/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleUnauthenticated();
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async addCompetitionTask(competitionId: number, data: CreateCompetitionTaskInput) {
    const response = await fetch(`${API_BASE_URL}/competitions/${competitionId}/add_task/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; competition: Competition }>(response);
  }

  // Servers
  async getServers() {
    const response = await fetch(`${API_BASE_URL}/servers/`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<VieServer[]>(response);
  }

  async searchServers(query: string) {
    const response = await fetch(`${API_BASE_URL}/servers/search/?q=${encodeURIComponent(query)}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<VieServer[]>(response);
  }

  async createServer(data: { name: string; description?: string }) {
    const response = await fetch(`${API_BASE_URL}/servers/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse<VieServer>(response);
  }

  async joinServer(serverId: number) {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/join/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async leaveServer(serverId: number) {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/leave/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async setActiveCompetition(serverId: number, competitionId: number | null) {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/set_active_competition/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ competition_id: competitionId }),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // Users
  async searchUsers(query: string) {
    const response = await fetch(`${API_BASE_URL}/users/search/?q=${encodeURIComponent(query)}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<UserSearchResult[]>(response);
  }
}

export const apiService = new ApiService();
