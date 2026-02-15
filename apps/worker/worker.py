"""
RQ Worker entry point
"""
import sys
import os

# Add app directory to path so we can import app.worker
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import redis
from rq import Worker, Queue, Connection

listen = ['analysis']

redis_url = os.getenv('REDIS_URL', 'redis://redis:6379/0')
conn = redis.from_url(redis_url)

if __name__ == '__main__':
    with Connection(conn):
        worker = Worker(listen)
        worker.work()
