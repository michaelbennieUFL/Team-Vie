# Team-Vie Release Runbook

## 1) Scope
- **dev**: local/feature testing
- **staging**: pre-release validation
- **prod**: user-facing

## 2) Configuration
- Copy `.env.production.example` to `.env.production`.
- Set real values for:
  - `DJANGO_SECRET_KEY`
  - `DB_PASSWORD`
  - `DJANGO_ALLOWED_HOSTS`
  - `DJANGO_CORS_ALLOWED_ORIGINS`
  - `DJANGO_CSRF_TRUSTED_ORIGINS`

## 3) Build + Start
```bash
docker compose -f compose.prod.yml up -d --build
```

## 4) Release Steps
1. Apply migrations:
   ```bash
   docker compose -f compose.prod.yml exec backend python manage.py migrate
   ```
2. Seed data (dev/staging only):
   ```bash
   docker compose -f compose.prod.yml exec backend python manage.py seed_data
   ```
3. Verify health:
   - Backend: `GET /api/health/`
   - Frontend serves `/`

## 5) Restart Policy
- Services use `restart: unless-stopped`.
- Rolling restart:
```bash
docker compose -f compose.prod.yml restart backend frontend
```

## 6) Backup / Restore Checks
### Backup
```bash
docker compose -f compose.prod.yml exec database pg_dump -U "$DB_USER" "$DB_NAME" > backup.sql
```

### Restore (staging validation first)
```bash
cat backup.sql | docker compose -f compose.prod.yml exec -T database psql -U "$DB_USER" "$DB_NAME"
```

### Verification
- Log in and load dashboard
- Create/start/complete a task
- Confirm points update and server access rules
