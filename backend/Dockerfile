# Use a slim Python image
FROM python:3.9-slim

# Install git and git-lfs
RUN apt-get update && apt-get install -y git git-lfs && git lfs install

# Set working directory
WORKDIR /app

# Copy all files from the local backend directory
COPY . .

# Install dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Run the app using gunicorn
# The port is provided by Railway as an environment variable
CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 120 app:app
