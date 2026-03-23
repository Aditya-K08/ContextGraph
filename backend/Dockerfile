# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and database
COPY . .

# Expose port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV GOOGLE_API_KEY=""

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
