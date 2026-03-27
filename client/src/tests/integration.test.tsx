
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
        acceptCompetition: vi.fn(),
        createCompetition: vi.fn(),
        searchUsers: vi.fn().mockResolvedValue([]),
        completeCompetitionTask: vi.fn(),
    },
}));

// ─── Mock react-router navigate ───────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

import { apiService } from '../services/api';
import ProtectedNav from '../components/ProtectedNav';
import Login from '../pages/Login';
import Competitions from '../pages/Competitions';


function renderWithRouter(ui: React.ReactElement, { route = '/' } = {}) {
    return render(
        <MemoryRouter initialEntries={[route]}>
            {ui}
        </MemoryRouter>
    );
}

describe('ProtectedNav', () => {
    const toggleTheme = vi.fn();

    beforeEach(() => {
        localStorage.setItem('user', JSON.stringify({ username: 'demo' }));
    });

    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders all nav links', () => {
        renderWithRouter(<ProtectedNav isDarkMode={false} onToggleTheme={toggleTheme} />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Schedule')).toBeInTheDocument();
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        expect(screen.getByText('Competitions')).toBeInTheDocument();
    });

    it('shows moon icon in light mode and sun icon in dark mode', () => {
        const { rerender } = renderWithRouter(
            <ProtectedNav isDarkMode={false} onToggleTheme={toggleTheme} />
        );
        expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <ProtectedNav isDarkMode={true} onToggleTheme={toggleTheme} />
            </MemoryRouter>
        );
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

// ─────────────────────────────────────────────────────────────────────────────
// Login page
// ─────────────────────────────────────────────────────────────────────────────
describe('Login page', () => {
    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders sign-in form fields', () => {
        renderWithRouter(<Login />);
        expect(screen.getByPlaceholderText('demo')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows a theme toggle button', () => {
        renderWithRouter(<Login />);
        const toggleBtn = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
        expect(toggleBtn).toBeInTheDocument();
    });

    it('navigates to /dashboard on successful login', async () => {
        vi.mocked(apiService.login).mockResolvedValueOnce({
            message: 'ok',
            user: { id: 1, username: 'demo' } as never,
        });

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

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Register page
// ─────────────────────────────────────────────────────────────────────────────
describe('Register page', () => {
    // Dynamically import to avoid hoisting issues with the mock
    let Register: typeof import('../pages/Register').default;

    beforeEach(async () => {
        Register = (await import('../pages/Register')).default;
    });

    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

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
        // suppress the alert
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

// ─────────────────────────────────────────────────────────────────────────────
// Competitions page
// ─────────────────────────────────────────────────────────────────────────────
describe('Competitions page', () => {
    const mockUser = {
        id: 1,
        username: 'demo',
        email: 'demo@test.com',
        first_name: 'Demo',
        last_name: 'User',
        profile: { points: 100, current_streak: 3, longest_streak: 5, last_task_completed_date: null, region: 'FL' },
    };

    beforeEach(() => {
        vi.mocked(apiService.getCurrentUser).mockResolvedValue(mockUser);
        vi.mocked(apiService.getServers).mockResolvedValue([]);
        vi.mocked(apiService.getCompetitions).mockResolvedValue([]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders the Competitions heading', async () => {
    renderWithRouter(<Competitions />);
    await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
});

    it('shows "No active competitions" when list is empty', async () => {
        renderWithRouter(<Competitions />);
        await waitFor(() => {
            expect(screen.getByText('No active competitions.')).toBeInTheDocument();
        });
    });

    it('shows a pending competition and Accept button', async () => {
        vi.mocked(apiService.getCompetitions).mockResolvedValue([
            {
                id: 42,
                challenger: 2,
                challenger_username: 'alice',
                opponent: 1,
                opponent_username: 'demo',
                status: 'PENDING',
                challenger_score: 0,
                opponent_score: 0,
                created_at: '',
                started_at: null,
                completed_at: null,
                tasks: [],
                server: null,
            },
        ]);

        renderWithRouter(<Competitions />);

        await waitFor(() => {
            expect(screen.getByText('alice vs demo')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /accept competition/i })).toBeInTheDocument();
        });
    });

    it('calls acceptCompetition API when Accept is clicked', async () => {
        vi.mocked(apiService.acceptCompetition).mockResolvedValue({
            message: 'ok',
            competition: { id: 42 } as never,
        });
        vi.mocked(apiService.getCompetitions).mockResolvedValue([
            {
                id: 42,
                challenger: 2,
                challenger_username: 'alice',
                opponent: 1,
                opponent_username: 'demo',
                status: 'PENDING',
                challenger_score: 0,
                opponent_score: 0,
                created_at: '',
                started_at: null,
                completed_at: null,
                tasks: [],
                server: null,
            },
        ]);
        vi.spyOn(window, 'alert').mockImplementation(() => {});

        renderWithRouter(<Competitions />);

        await waitFor(() => screen.getByRole('button', { name: /accept competition/i }));
        await userEvent.click(screen.getByRole('button', { name: /accept competition/i }));

        await waitFor(() => {
            expect(apiService.acceptCompetition).toHaveBeenCalledWith(42);
        });
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
        // aria-label flips after click (component re-renders)
        await waitFor(() => {
            expect(toggle.getAttribute('aria-label')).not.toEqual(before);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// api.ts — auth redirect behaviour
// ─────────────────────────────────────────────────────────────────────────────
describe('apiService auth redirect', () => {
    it('redirects to /login and clears storage on 401', async () => {
        localStorage.setItem('user', 'somebody');

        // Stub fetch to return a 401
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Unauthorized' }),
        }));

        // Import the real api module fresh
        const { apiService: realApi } = await import('../services/api');

        await expect(realApi.getCurrentUser()).rejects.toThrow('Session expired');
        expect(localStorage.getItem('user')).toBeNull();

        vi.unstubAllGlobals();
    });
});
