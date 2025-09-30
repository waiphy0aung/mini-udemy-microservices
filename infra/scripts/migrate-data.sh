#!/bin/bash
set -e

echo "🔄 Migrating to Database-Per-Service Architecture..."

# 1. Export data from shared database
echo "📤 Exporting data from shared database..."
docker-compose exec postgres pg_dump -U postgres mini_udemy \
  --data-only --table=users --table=user_profiles --table=instructor_profiles \
  > /tmp/user_data.sql

docker-compose exec postgres pg_dump -U postgres mini_udemy \
  --data-only --table=courses --table=course_modules --table=enrollments \
  > /tmp/course_data.sql

# 2. Start new database structure
echo "🏗️  Starting new database services..."
docker-compose -f docker-compose-per-service.yml up -d user-db course-db

# 3. Wait for databases to be ready
sleep 15

# 4. Import data to service-specific databases
echo "📥 Importing data to service databases..."
docker-compose exec user-db psql -U user_service -d user_service < /tmp/user_data.sql
docker-compose exec course-db psql -U course_service -d course_service < /tmp/course_data.sql

# 5. Update application services
echo "🔄 Updating application services..."
docker-compose -f docker-compose-per-service.yml up -d --build user-service course-service

echo "✅ Migration completed successfully!"
