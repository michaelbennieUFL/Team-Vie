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
  };
}

export interface VieServer {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  member_count: number;
  role: string | null;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  points_value: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  server: number | null;
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
  points_value: number;
  challenger_completed: boolean;
  opponent_completed: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  username: string;
  points: number;
  current_streak: number;
  region: string;
  rank: number;
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
    
    // Get CSRF token from cookie
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

  private async handleResponse<T>(response: Response): Promise<T> {
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

  async createTask(data: Omit<Task, 'id' | 'is_completed' | 'completed_at' | 'created_at' | 'updated_at'>) {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async completeTask(id: number) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/complete/`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<{ message: string; points_earned: number; task: Task }>(response);
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

  async createCompetition(opponentId: number, serverId?: number) {
    const body: Record<string, number> = { opponent: opponentId };
    if (serverId) body.server = serverId;
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

  // Servers
  async getServers() {
    const response = await fetch(`${API_BASE_URL}/servers/`, {
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
}

export const apiService = new ApiService();
