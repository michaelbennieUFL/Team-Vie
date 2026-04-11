
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
    apiService: {
        logout: vi.fn().mockResolvedValue({ message: 'ok' }),
        login: vi.fn(),
        register: vi.fn(),
        getCurrentUser: vi.fn(),
        getServers: vi.fn().mockResolvedValue([]),
        getCompetitions: vi.fn().mockResolvedValue([]),
        getLeaderboard: vi.fn().mockResolvedValue([]),
        getTasks: vi.fn().mockResolvedValue([]),
        getMotivationalQuote: vi.fn().mockResolvedValue({ quote: '', author: '', tone: '' }),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
        completeTask: vi.fn(),
        startTask: vi.fn(),
        heartbeatTask: vi.fn(),
        searchServers: vi.fn().mockResolvedValue([]),
        joinServer: vi.fn(),
        createServer: vi.fn(),
        acceptCompetition: vi.fn(),
        createCompetition: vi.fn(),
        searchUsers: vi.fn().mockResolvedValue([]),
        completeCompetitionTask: vi.fn(),
        addCompetitionTask: vi.fn(),
    },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => mockNavigate };
});

import { apiService } from '../services/api';
import ProtectedNav from '../components/ProtectedNav';
import Login from '../pages/Login';
import Competitions from '../pages/Competitions';
import Dashboard from '../pages/Dashboard';
import Overview from '../pages/Overview';
import Leaderboard from '../pages/Leaderboard';
import Schedule from '../pages/Schedule';

function renderWithRouter(ui: React.ReactElement, { route = '/' } = {}) {
    return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

const mockCompetition = (overrides = {}) => ({
    id: 42,
    challenger: 2,
    challenger_username: 'alice',
    opponent: 1,
    opponent_username: 'demo',
    status: 'PENDING' as const,
    challenger_score: 0,
    opponent_score: 0,
    points_goal: null,
    winner: null,
    winner_username: null,
    created_at: '',
    started_at: null,
    completed_at: null,
    tasks: [],
    server: null,
    ...overrides,
});

describe('ProtectedNav', () => {
    const toggleTheme = vi.fn();
    beforeEach(() => { localStorage.setItem('user', JSON.stringify({ username: 'demo' })); });
    afterEach(() => { localStorage.clear(); vi.clearAllMocks(); });

    it('renders all nav links', () => {
        renderWithRouter(<ProtectedNav isDarkMode={false} onToggleTheme={toggleTheme} />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Schedule')).toBeInTheDocument();
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        expect(screen.getByText('Competitions')).toBeInTheDocument();
    });

    it('shows moon icon in light mode and sun icon in dark mode', () => {
        const { rerender } = renderWithRouter(<ProtectedNav isDarkMode={false} onToggleTheme={toggleTheme} />);
        expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
        rerender(<MemoryRouter><ProtectedNav isDarkMode={true} onToggleTheme={toggleTheme} /></MemoryRouter>);
        expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
    });

    it('calls toggleTheme when theme button is clicked', async () => {
        renderWithRouter(<ProtectedNav isDarkMode={false} onToggleTheme={toggleTheme} />);
        await userEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }));
        expect(toggleTheme).toHaveBeenCalledOnce();
    });

    it('calls logout API, clears localStorage, and navigates to /login on logout', async () => {
        renderWithRouter(<ProtectedNav isDarkMode={false} onToggleTheme={toggleTheme} />);
        await userEvent.click(screen.getByRole('button', { name: /logout/i }));
        await waitFor(() => {
            expect(apiService.logout).toHaveBeenCalledOnce();
            expect(localStorage.getItem('user')).toBeNull();
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });
});

describe('Login page', () => {
    afterEach(() => { localStorage.clear(); vi.clearAllMocks(); });

    it('renders sign-in form fields', () => {
        renderWithRouter(<Login />);
        expect(screen.getByPlaceholderText('demo')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows a theme toggle button', () => {
        renderWithRouter(<Login />);
        expect(screen.getByRole('button', { name: /switch to (dark|light) mode/i })).toBeInTheDocument();
    });

    it('navigates to /dashboard on successful login', async () => {
        vi.mocked(apiService.login).mockResolvedValueOnce({ message: 'ok', user: { id: 1, username: 'demo' } as never });
        renderWithRouter(<Login />);
        await userEvent.type(screen.getByPlaceholderText('demo'), 'demo');
        await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'demo1234');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        await waitFor(() => {
            expect(apiService.login).toHaveBeenCalledWith('demo', 'demo1234');
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('shows an error message on failed login', async () => {
        vi.mocked(apiService.login).mockRejectedValueOnce(new Error('Invalid credentials'));
        renderWithRouter(<Login />);
        await userEvent.type(screen.getByPlaceholderText('demo'), 'wrong');
        await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        await waitFor(() => { expect(screen.getByText('Invalid credentials')).toBeInTheDocument(); });
    });
});

describe('Register page', () => {
    let Register: typeof import('../pages/Register').default;
    beforeEach(async () => { Register = (await import('../pages/Register')).default; });
    afterEach(() => { localStorage.clear(); vi.clearAllMocks(); });

    it('renders all registration fields', () => {
        renderWithRouter(<Register />);
        expect(screen.getByPlaceholderText('choose a username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Repeat password')).toBeInTheDocument();
    });

    it('shows a theme toggle button', () => {
        renderWithRouter(<Register />);
        expect(screen.getByRole('button', { name: /switch to (dark|light) mode/i })).toBeInTheDocument();
    });

    it('calls register API and navigates to /login on success', async () => {
        vi.mocked(apiService.register).mockResolvedValueOnce({ message: 'ok', user: {} as never });
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        renderWithRouter(<Register />);
        await userEvent.type(screen.getByPlaceholderText('choose a username'), 'newuser');
        await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'new@example.com');
        await userEvent.type(screen.getByPlaceholderText('Create a password'), 'pass1234');
        await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'pass1234');
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));
        await waitFor(() => {
            expect(apiService.register).toHaveBeenCalledOnce();
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });
});

describe('Competitions page', () => {
    const mockUser = {
        id: 1, username: 'demo', email: 'demo@test.com', first_name: 'Demo', last_name: 'User',
        profile: {
            points: 100,
            current_streak: 3,
            longest_streak: 5,
            last_task_completed_date: null,
            region: 'FL',
            default_weekly_goal_points: 120,
            best_weekly_personal_points: 160,
            weekly_progress: {
                week_start: '2026-03-30',
                competitive_points: 40,
                personal_points: 55,
                weekly_goal_points: 120,
                goal_reached: false,
                competitive_points_remaining: 80,
                reached_goal_at: null,
            },
        },
    };

    beforeEach(() => {
        vi.mocked(apiService.getCurrentUser).mockResolvedValue(mockUser);
        vi.mocked(apiService.getServers).mockResolvedValue([]);
        vi.mocked(apiService.getCompetitions).mockResolvedValue([]);
    });
    afterEach(() => { vi.clearAllMocks(); });

    it('renders the Competitions heading', async () => {
        renderWithRouter(<Competitions />);
        await waitFor(() => { expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(); });
    });

    it('shows "No active competitions" when list is empty', async () => {
        renderWithRouter(<Competitions />);
        await waitFor(() => { expect(screen.getByText('No active competitions.')).toBeInTheDocument(); });
    });

    it('shows a pending competition and Accept button', async () => {
        vi.mocked(apiService.getCompetitions).mockResolvedValue([mockCompetition()]);
        renderWithRouter(<Competitions />);
        await waitFor(() => {
            expect(screen.getByText('alice vs demo')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /accept competition/i })).toBeInTheDocument();
        });
    });

    it('calls acceptCompetition API when Accept is clicked', async () => {
        vi.mocked(apiService.acceptCompetition).mockResolvedValue({ message: 'ok', competition: { id: 42 } as never });
        vi.mocked(apiService.getCompetitions).mockResolvedValue([mockCompetition()]);
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        renderWithRouter(<Competitions />);
        await waitFor(() => screen.getByRole('button', { name: /accept competition/i }));
        await userEvent.click(screen.getByRole('button', { name: /accept competition/i }));
        await waitFor(() => { expect(apiService.acceptCompetition).toHaveBeenCalledWith(42); });
    });

    it('shows New Competition form when button is clicked', async () => {
        renderWithRouter(<Competitions />);
        await waitFor(() => screen.getByRole('button', { name: /new competition/i }));
        await userEvent.click(screen.getByRole('button', { name: /new competition/i }));
        expect(screen.getByPlaceholderText(/search opponent/i)).toBeInTheDocument();
    });

    it('toggles dark/light theme via ProtectedNav', async () => {
        renderWithRouter(<Competitions />);
        await waitFor(() => screen.getByRole('button', { name: /switch to (dark|light) mode/i }));
        const toggle = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
        const before = toggle.getAttribute('aria-label');
        await userEvent.click(toggle);
        await waitFor(() => { expect(toggle.getAttribute('aria-label')).not.toEqual(before); });
    });
});

describe('Dashboard page', () => {
    const mockDashboardUser = {
        id: 1,
        username: 'demo',
        email: 'demo@test.com',
        first_name: 'Demo',
        last_name: 'User',
        profile: {
            points: 120,
            current_streak: 2,
            longest_streak: 4,
            last_task_completed_date: null,
            region: 'FL',
        },
    };

    const mockServer = {
        id: 10,
        name: 'Dev server',
        description: 'A test workspace',
        created_by: 1,
        created_at: '',
        member_count: 1,
        role: 'OWNER',
        active_competition: null,
    };

    const mockTask = {
        id: 101,
        title: 'Finish biology notes',
        description: 'Read chapter 4 and summarize',
        priority: 'MEDIUM' as const,
        points_value: 15,
        is_completed: false,
        completed_at: null,
        created_at: '',
        updated_at: '',
        due_date: null,
        server: 10,
        recurrence: 'NONE' as const,
    };

    const mockJoinServer = {
        id: 20,
        name: 'Alpha Server',
        description: 'Join this team',
        created_by: 2,
        created_at: '',
        member_count: 8,
        role: null,
        active_competition: null,
    };

    const mockMotivation = {
        quote: 'Keep going, one step at a time.',
        author: 'Coach',
        tone: 'Encouraging',
    };

    beforeEach(() => {
        vi.mocked(apiService.getCurrentUser).mockResolvedValue(mockDashboardUser);
        vi.mocked(apiService.getServers).mockResolvedValue([mockServer]);
        vi.mocked(apiService.getTasks).mockResolvedValue([mockTask]);
        vi.mocked(apiService.getLeaderboard).mockResolvedValue([]);
        vi.mocked(apiService.getCompetitions).mockResolvedValue([]);
        vi.mocked(apiService.getMotivationalQuote).mockResolvedValue(mockMotivation);
        vi.mocked(apiService.createTask).mockResolvedValue({
            ...mockTask,
            id: 202,
            title: 'Create React tests',
            is_completed: false,
        });
        vi.mocked(apiService.searchServers).mockResolvedValue([]);
        vi.mocked(apiService.joinServer).mockResolvedValue({ message: 'ok' });
        vi.mocked(apiService.getServers).mockResolvedValue([mockServer]);
    });

    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders dashboard greeting, tasks, and quote', async () => {
        renderWithRouter(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText(/Good (morning|afternoon|evening), Demo/i)).toBeInTheDocument();
            expect(screen.getByText('Finish biology notes')).toBeInTheDocument();
            expect(screen.getByText(/Keep going, one step at a time\./i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Dev server/i })).toBeInTheDocument();
        });
    });

    it('opens the quick add task modal and creates a new task', async () => {
        renderWithRouter(<Dashboard />);
        await waitFor(() => screen.getByRole('button', { name: /quick add task/i }));
        await userEvent.click(screen.getByRole('button', { name: /quick add task/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await userEvent.type(screen.getByPlaceholderText('Finish biology notes'), 'Create React tests');
        const addTaskDialog = within(screen.getByRole('dialog'));
        await userEvent.click(addTaskDialog.getByRole('button', { name: /add task/i }));

        await waitFor(() => {
            expect(apiService.createTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Create React tests' }));
            expect(screen.getByText('Create React tests')).toBeInTheDocument();
        });
    });

    it('completes a task and shows celebration overlay', async () => {
        vi.mocked(apiService.completeTask).mockResolvedValueOnce({
            message: 'ok',
            points_earned: 25,
            task: { ...mockTask, is_completed: true, completed_at: '2026-04-04T12:00:00Z' },
            celebration: {
                headline: 'Nice work',
                phrase: 'You earned points',
                points_earned: 25,
                current_streak: 3,
            },
        });
        vi.mocked(apiService.getCurrentUser).mockResolvedValueOnce({
            ...mockDashboardUser,
            profile: { ...mockDashboardUser.profile, points: 145, current_streak: 3 },
        });

        renderWithRouter(<Dashboard />);
        await waitFor(() => screen.getByRole('button', { name: /Mark Finish biology notes complete/i }));
        await userEvent.click(screen.getByRole('button', { name: /Mark Finish biology notes complete/i }));

        await waitFor(() => {
            expect(apiService.completeTask).toHaveBeenCalledWith(mockTask.id);
            expect(screen.getByText('Nice work')).toBeInTheDocument();
            expect(screen.getByText('+25 pts')).toBeInTheDocument();
        });
    });

    it('searches for a server and joins it', async () => {
        vi.mocked(apiService.searchServers).mockResolvedValue([mockJoinServer]);
        vi.mocked(apiService.getServers).mockResolvedValueOnce([mockServer, mockJoinServer]);

        renderWithRouter(<Dashboard />);
        await waitFor(() => screen.getByRole('button', { name: /Dev server/i }));
        await userEvent.click(screen.getByRole('button', { name: /Dev server/i }));
        await userEvent.click(screen.getByRole('button', { name: /join server/i }));

        const searchInput = screen.getByPlaceholderText(/Search by name.../i);
        await userEvent.type(searchInput, 'Alpha');

        const joinDialog = within(screen.getByRole('dialog'));
        await waitFor(() => expect(joinDialog.getByText(/Alpha Server/i)).toBeInTheDocument());
        await userEvent.click(joinDialog.getByRole('button', { name: /join/i }));

        await waitFor(() => {
            expect(apiService.joinServer).toHaveBeenCalledWith(mockJoinServer.id);
            expect(apiService.getServers).toHaveBeenCalled();
        });
    });
});

describe('Overview page', () => {
    const mockOverviewUser = {
        id: 1,
        username: 'demo',
        email: 'demo@test.com',
        first_name: 'Demo',
        last_name: 'User',
        profile: {
            points: 150,
            current_streak: 3,
            longest_streak: 5,
            last_task_completed_date: null,
            region: 'FL',
        },
    };

    const mockServer = {
        id: 10,
        name: 'Dev server',
        description: 'A test workspace',
        created_by: 1,
        created_at: '',
        member_count: 1,
        role: 'OWNER',
        active_competition: null,
    };

    const mockTask = {
        id: 101,
        title: 'Finish biology notes',
        description: 'Read chapter 4 and summarize',
        priority: 'MEDIUM' as const,
        points_value: 15,
        is_completed: false,
        completed_at: null,
        created_at: '',
        updated_at: '',
        due_date: null,
        server: 10,
        recurrence: 'NONE' as const,
    };

    beforeEach(() => {
        vi.mocked(apiService.getCurrentUser).mockResolvedValue(mockOverviewUser);
        vi.mocked(apiService.getServers).mockResolvedValue([mockServer]);
        vi.mocked(apiService.getTasks).mockResolvedValue([mockTask]);
        vi.mocked(apiService.createTask).mockResolvedValue({
            ...mockTask,
            id: 202,
            title: 'Create React tests',
            is_completed: false,
        });
        vi.mocked(apiService.completeTask).mockResolvedValue({
            message: 'ok',
            points_earned: 15,
            task: { ...mockTask, is_completed: true },
            celebration: { headline: '', phrase: '', points_earned: 15, current_streak: 4 },
        });
        vi.mocked(apiService.deleteTask).mockResolvedValue(undefined);
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('renders overview stats and tasks', async () => {
        renderWithRouter(<Overview />);
        await waitFor(() => {
            expect(screen.getByText('📋 Overview — All Tasks')).toBeInTheDocument();
            expect(screen.getByText('Total Tasks')).toBeInTheDocument();
            expect(screen.getByText('150')).toBeInTheDocument(); // points
            expect(screen.getByText('Finish biology notes')).toBeInTheDocument();
        });
    });

    it('adds a new task', async () => {
        renderWithRouter(<Overview />);
        await waitFor(() => screen.getByRole('button', { name: /\+ Add Task/i }));
        await userEvent.click(screen.getByRole('button', { name: /\+ Add Task/i }));

        await userEvent.type(screen.getByPlaceholderText('Task Title'), 'Create React tests');
        await userEvent.click(screen.getByRole('button', { name: /Create Task/i }));

        await waitFor(() => {
            expect(apiService.createTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Create React tests' }));
            expect(screen.getByText('Create React tests')).toBeInTheDocument();
        });
    });

    it('completes a task', async () => {
        renderWithRouter(<Overview />);
        await waitFor(() => screen.getByRole('button', { name: /Complete/i }));
        await userEvent.click(screen.getByRole('button', { name: /Complete/i }));

        await waitFor(() => {
            expect(apiService.completeTask).toHaveBeenCalledWith(mockTask.id);
            expect(window.alert).toHaveBeenCalledWith('Task completed! You earned 15 points!');
        });
    });

    it('deletes a task', async () => {
        renderWithRouter(<Overview />);
        await waitFor(() => screen.getByRole('button', { name: /Delete/i }));
        await userEvent.click(screen.getByRole('button', { name: /Delete/i }));

        await waitFor(() => {
            expect(apiService.deleteTask).toHaveBeenCalledWith(mockTask.id);
            expect(screen.queryByText('Finish biology notes')).not.toBeInTheDocument();
        });
    });
});

describe('Leaderboard page', () => {
    const mockLeaderboardEntries = [
        { username: 'alice', points: 200, current_streak: 5, region: 'CA', rank: 1 },
        { username: 'demo', points: 150, current_streak: 3, region: 'FL', rank: 2 },
    ];

    const mockServer = {
        id: 10,
        name: 'Dev server',
        description: 'A test workspace',
        created_by: 1,
        created_at: '',
        member_count: 1,
        role: 'OWNER',
        active_competition: null,
    };

    beforeEach(() => {
        vi.mocked(apiService.getServers).mockResolvedValue([mockServer]);
        vi.mocked(apiService.getLeaderboard).mockResolvedValue(mockLeaderboardEntries);
    });

    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders leaderboard table', async () => {
        renderWithRouter(<Leaderboard />);
        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
            expect(screen.getByText('alice')).toBeInTheDocument();
            expect(screen.getByText('demo')).toBeInTheDocument();
            expect(screen.getByText('200')).toBeInTheDocument();
        });
    });

    it('filters by server', async () => {
        renderWithRouter(<Leaderboard />);
        await waitFor(() => screen.getByRole('combobox'));
        await userEvent.selectOptions(screen.getByRole('combobox'), '10');

        await waitFor(() => {
            expect(apiService.getLeaderboard).toHaveBeenCalledWith(undefined, 10);
        });
    });

    it('filters by region', async () => {
        renderWithRouter(<Leaderboard />);
        await waitFor(() => screen.getByPlaceholderText(/Filter by region/i));
        await userEvent.type(screen.getByPlaceholderText(/Filter by region/i), 'FL');

        await waitFor(() => {
            expect(apiService.getLeaderboard).toHaveBeenCalledWith('FL', undefined);
        });
    });
});

describe('Schedule page', () => {
    const mockTask = {
        id: 101,
        title: 'Finish biology notes',
        description: 'Read chapter 4 and summarize',
        priority: 'MEDIUM' as const,
        points_value: 15,
        is_completed: false,
        completed_at: null,
        created_at: '',
        updated_at: '',
        due_date: '2026-04-04',
        server: null,
        recurrence: 'NONE' as const,
    };

    beforeEach(() => {
        vi.mocked(apiService.getTasks).mockResolvedValue([mockTask]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders calendar with tasks', async () => {
        renderWithRouter(<Schedule />);
        await waitFor(() => {
            expect(screen.getByText('📅 Schedule')).toBeInTheDocument();
            expect(screen.getByText('April 2026')).toBeInTheDocument();
            expect(screen.getByText('Finish biology notes')).toBeInTheDocument();
        });
    });

    it('navigates to previous month', async () => {
        renderWithRouter(<Schedule />);
        await waitFor(() => screen.getByRole('button', { name: /← Prev/i }));
        await userEvent.click(screen.getByRole('button', { name: /← Prev/i }));

        await waitFor(() => {
            expect(screen.getByText('March 2026')).toBeInTheDocument();
        });
    });

    it('navigates to next month', async () => {
        renderWithRouter(<Schedule />);
        await waitFor(() => screen.getByRole('button', { name: /Next →/i }));
        await userEvent.click(screen.getByRole('button', { name: /Next →/i }));

        await waitFor(() => {
            expect(screen.getByText('May 2026')).toBeInTheDocument();
        });
    });
});

describe('apiService auth redirect', () => {
    it('redirects to /login and clears storage on 401', async () => {
        localStorage.setItem('user', 'somebody');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }),
        }));
        const { apiService: realApi } = await vi.importActual<typeof import('../services/api')>('../services/api');
        await expect(realApi.getCurrentUser()).rejects.toThrow('Session expired');
        expect(localStorage.getItem('user')).toBeNull();
        vi.unstubAllGlobals();
    });
});
