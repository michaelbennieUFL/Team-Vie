# Vie: A Competitive Productivity App

Vie is a gamified productivity application that helps users stay motivated through task management, reward systems, streak tracking, and friendly 1v1 competitions. Organize your work into **servers** (like Discord) — each with its own tasks, leaderboard, and competitions.

## Features

### ✅ User Authentication
- Registration with email verification
- Secure login/logout system
- Password management

### 📂 Servers (Workspaces)
- Create and join servers (like Discord)
- Default servers: **COP 2000**, **ANT 3030**, **Personal**
- Dropdown server selector on Dashboard
- Each server has its own tasks, leaderboard, and competitions
- Overview page shows all tasks across all servers

### 📝 Task Management
- Create, edit, and delete tasks
- Assign priority levels (Low, Medium, High)
- Set due dates
- Custom point values for tasks
- Complete tasks to earn points
- Tasks are scoped to the selected server

### 🏆 Reward & Point System
- Earn points by completing tasks
- Track your total points
- Points contribute to leaderboard ranking

### 🔥 Streak Tracking
- Track consecutive days of task completion
- View current and longest streak
- Maintain motivation through daily engagement

### 📊 Leaderboards
- Global leaderboard with top users
- Filter by server or region
- Real-time ranking updates
- See user points and streaks

### ⚔️ 1v1 Competitions
- Challenge other users to friendly competitions
- Real-time updates using WebSocket
- Track scores live as tasks are completed
- Accept or decline competition invites
- Competitions are scoped to servers

## Default Login Credentials

| Username | Password   |
|----------|------------|
| **demo** | **demo1234** |

Additional seeded users: `alice`, `bob`, `charlie`, `diana` (passwords follow the pattern `{username}1234`, e.g., `alice1234`).

## Technology Stack

### Backend
- **Django 6.0.2** - Web framework
- **Django REST Framework** - API endpoints
- **Django Channels** - WebSocket support for real-time features
- **PostgreSQL** - Database
- **Redis** - Channel layer for WebSocket
- **Docker** - Database containerization

### Frontend
- **React 19.2** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation

### Environment
- **Mamba / Conda** - Python environment management
- **uv** - Fast Python package installer

## Getting Started

### Prerequisites
- [Mamba](https://mamba.readthedocs.io/) or [Conda](https://docs.conda.io/) (for Python environment)
- [Bun](https://bun.sh) (JavaScript runtime and package manager)
- Docker and Docker Compose
- Redis (optional, for WebSocket support)

### Quick Install

```bash
git clone https://github.com/michaelbennieUFL/Team-Vie.git
cd Team-Vie
./install.sh
```

The install script will:
1. Start the PostgreSQL database via Docker
2. Create a `vie` Python environment using mamba/conda
3. Install Python dependencies with uv
4. Run Django migrations
5. Seed the database with default users, servers, tasks, and competitions
6. Install frontend Bun dependencies

### Quick Start

```bash
./start.sh
```

This starts both the frontend and backend servers. Press **Ctrl+C** to stop both.

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000

### Manual Installation

#### 1. Clone the repository
```bash
git clone https://github.com/michaelbennieUFL/Team-Vie.git
cd Team-Vie
```

#### 2. Set up the database
```bash
cd database
docker compose up -d
cd ..
```

Wait a few seconds for the database to initialize, then create the database and user:
```bash
docker exec vie-db psql -U postgres -c "CREATE DATABASE \"vie-db\";"
docker exec vie-db psql -U postgres -c "CREATE USER vie WITH PASSWORD 'CompeteToAdvance';"
docker exec vie-db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"vie-db\" TO vie;"
docker exec vie-db psql -U postgres -d vie-db -c "GRANT ALL ON SCHEMA public TO vie;"
```

#### 3. Set up the Python environment
```bash
# Using mamba (recommended)
mamba env create -f environment.yml
mamba activate vie

# Or using conda
conda env create -f environment.yml
conda activate vie
```

Install Python dependencies with uv:
```bash
uv pip install -r server/requirements.txt
```

#### 4. Set up the backend
```bash
cd server/VieBackend

# Run migrations
python manage.py migrate

# Seed the database with default data
python manage.py seed_data

# Start the development server
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

#### 5. Set up the frontend
Open a new terminal:
```bash
cd client

# Install dependencies
bun install

# Start the development server
bun run dev
```

The frontend will be available at `http://localhost:5173`

#### 6. (Optional) Set up Redis for WebSocket support
For 1v1 competition real-time updates:
```bash
# On Ubuntu/Debian:
sudo apt-get install redis-server
sudo systemctl start redis

# On macOS:
brew install redis
brew services start redis
```

### Testing the Connection

Run the connection test script to verify everything is set up correctly:
```bash
./test_connection.sh
```

## Usage

### Selecting a Server
1. Log in to your account
2. On the Dashboard, use the **server dropdown** (top-left) to select a server
3. Tasks, leaderboard, and competitions will be scoped to that server
4. Use **"+ Create Server"** to add a new server

### Viewing All Tasks
1. Click **"Overview"** in the navigation bar
2. See all tasks grouped by server across all your servers

### Creating a Task
1. Select a server from the dropdown
2. Click "Add Task"
3. Fill in the task details (title, description, priority, points, due date)
4. Click "Create Task" — the task will be associated with the selected server

### Completing a Task
1. Find the task on your Dashboard
2. Click the "Complete" button
3. Earn points and maintain your streak!

### Viewing the Leaderboard
1. From the Dashboard, click "Leaderboard"
2. Filter by server using the dropdown
3. (Optional) Filter by region
4. View rankings by points

### Starting a Competition
1. From the Dashboard, click "Competitions"
2. Select a server to scope the competition
3. Click "New Competition"
4. Enter the opponent's User ID
5. Wait for them to accept
6. Complete tasks together and see scores update in real-time!

## API Endpoints

### Authentication
- `POST /api/users/register/` - Register a new user
- `POST /api/users/login/` - Login
- `POST /api/users/logout/` - Logout
- `GET /api/users/me/` - Get current user info
- `GET /api/users/csrf/` - Get CSRF token

### Servers
- `GET /api/servers/` - List user's servers
- `POST /api/servers/` - Create a new server
- `GET /api/servers/{id}/` - Get server details
- `POST /api/servers/{id}/join/` - Join a server
- `POST /api/servers/{id}/leave/` - Leave a server

### Tasks
- `GET /api/tasks/` - List all user's tasks (optional `?server=` filter)
- `POST /api/tasks/` - Create a new task
- `GET /api/tasks/{id}/` - Get task details
- `PATCH /api/tasks/{id}/` - Update a task
- `DELETE /api/tasks/{id}/` - Delete a task
- `POST /api/tasks/{id}/complete/` - Complete a task

### Leaderboard
- `GET /api/users/leaderboard/` - Get leaderboard (optional `?region=` and `?server=` filters)

### Competitions
- `GET /api/competitions/` - List all competitions (optional `?server=` filter)
- `POST /api/competitions/` - Create a new competition
- `GET /api/competitions/{id}/` - Get competition details
- `POST /api/competitions/{id}/accept/` - Accept a competition
- `POST /api/competitions/{id}/complete_task/` - Complete a competition task

### WebSocket
- `ws://localhost:8000/ws/competition/{id}/` - Real-time competition updates

## Project Structure
```
Team-Vie/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components (Dashboard, Overview, Leaderboard, etc.)
│   │   ├── services/      # API service layer
│   │   └── ...
│   └── ...
├── server/                # Django backend
│   ├── VieBackend/
│   │   ├── servers/      # Server/workspace management app
│   │   ├── users/        # User authentication app
│   │   ├── tasks/        # Task management app
│   │   ├── competitions/ # Competition app
│   │   └── VieBackend/   # Main settings
│   └── requirements.txt
├── database/             # Database configuration
│   └── compose.yml
├── environment.yml       # Mamba/Conda Python environment
├── install.sh            # One-command install script
├── start.sh              # Start frontend + backend together
└── test_connection.sh    # Connection test script
```

## Development

### Running Tests
```bash
# Backend tests
cd server/VieBackend
python manage.py test

# Frontend tests
cd client
bun test
```

### Building for Production
```bash
# Frontend
cd client
bun run build

# The build files will be in client/dist/
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Django, React, and TypeScript
- WebSocket support powered by Django Channels
- Database: PostgreSQL
- Containerization: Docker
- Python environment: Mamba/Conda + uv