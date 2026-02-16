# Vie: A Competitive Productivity App

Vie is a gamified productivity application that helps users stay motivated through task management, reward systems, streak tracking, and friendly 1v1 competitions.

## Features

### ✅ User Authentication
- Registration with email verification
- Secure login/logout system
- Password management

### 📝 Task Management
- Create, edit, and delete tasks
- Assign priority levels (Low, Medium, High)
- Set due dates
- Custom point values for tasks
- Complete tasks to earn points

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
- Filter by region
- Real-time ranking updates
- See user points and streaks

### ⚔️ 1v1 Competitions
- Challenge other users to friendly competitions
- Real-time updates using WebSocket
- Track scores live as tasks are completed
- Accept or decline competition invites

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

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Docker and Docker Compose
- Redis (for WebSocket support)

### Installation

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

#### 3. Set up the backend
```bash
cd server

# Install dependencies
pip install -r requirements.txt

cd VieBackend

# Run migrations
python manage.py migrate

# Create a superuser (optional, for admin access)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

#### 4. Set up the frontend
Open a new terminal:
```bash
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

#### 5. (Optional) Set up Redis for WebSocket support
For 1v1 competition real-time updates:
```bash
# Install and start Redis
# On Ubuntu/Debian:
sudo apt-get install redis-server
sudo systemctl start redis

# On macOS:
brew install redis
brew services start redis

# On Windows:
# Download from https://redis.io/download
```

### Testing the Connection

Run the connection test script to verify everything is set up correctly:
```bash
./test_connection.sh
```

## Usage

### Creating a Task
1. Log in to your account
2. Navigate to the Dashboard
3. Click "Add Task"
4. Fill in the task details (title, description, priority, points, due date)
5. Click "Create Task"

### Completing a Task
1. Find the task on your Dashboard
2. Click the "Complete" button
3. Earn points and maintain your streak!

### Viewing the Leaderboard
1. From the Dashboard, click "Leaderboard"
2. View rankings by points
3. (Optional) Filter by region

### Starting a Competition
1. From the Dashboard, click "Competitions"
2. Click "New Competition"
3. Enter the opponent's User ID
4. Wait for them to accept
5. Complete tasks together and see scores update in real-time!

## API Endpoints

### Authentication
- `POST /api/users/register/` - Register a new user
- `POST /api/users/login/` - Login
- `POST /api/users/logout/` - Logout
- `GET /api/users/me/` - Get current user info
- `GET /api/users/csrf/` - Get CSRF token

### Tasks
- `GET /api/tasks/` - List all user's tasks
- `POST /api/tasks/` - Create a new task
- `GET /api/tasks/{id}/` - Get task details
- `PATCH /api/tasks/{id}/` - Update a task
- `DELETE /api/tasks/{id}/` - Delete a task
- `POST /api/tasks/{id}/complete/` - Complete a task

### Leaderboard
- `GET /api/users/leaderboard/` - Get leaderboard (optional `?region=` filter)

### Competitions
- `GET /api/competitions/` - List all competitions
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
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── ...
│   └── ...
├── server/                # Django backend
│   ├── VieBackend/
│   │   ├── users/        # User authentication app
│   │   ├── tasks/        # Task management app
│   │   ├── competitions/ # Competition app
│   │   └── VieBackend/   # Main settings
│   └── requirements.txt
├── database/             # Database configuration
│   └── compose.yml
└── test_connection.sh   # Connection test script
```

## Development

### Running Tests
```bash
# Backend tests
cd server/VieBackend
python manage.py test

# Frontend tests
cd client
npm test
```

### Building for Production
```bash
# Frontend
cd client
npm run build

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