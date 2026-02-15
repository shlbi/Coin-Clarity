FROM python:3.11-slim

WORKDIR /app

# Copy requirements from api
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code from api (shared)
COPY apps/api/app ./app

# Copy worker entry point
COPY apps/worker/worker.py ./worker.py

CMD ["python", "worker.py"]
