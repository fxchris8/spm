# backend/Dockerfile
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --default-timeout=100 --no-cache-dir -r requirements.txt

# Environment variables
ENV FLASK_APP=app
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=development
ENV PYTHONUNBUFFERED=1

# Copy the rest of the backend code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Expose the port Flask runs on
EXPOSE 5000

# Health check (akan di-override untuk scheduler)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# Default command (akan di-override oleh docker-compose)
CMD ["python", "app.py"]