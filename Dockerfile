FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git iproute2 curl nmap libcap2-bin procps \
    && rm -rf /var/lib/apt/lists/*

# Install Docker static binary (client only)
RUN curl -fsSL https://download.docker.com/linux/static/stable/aarch64/docker-27.3.1.tgz | tar -xz -C /tmp \
    && mv /tmp/docker/docker /usr/bin/docker \
    && rm -rf /tmp/docker

# Set capabilities for nmap (to allow ping scans as non-root, though we run as root now)
RUN setcap cap_net_raw,cap_net_admin,cap_net_bind_service+eip /usr/bin/nmap

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# We use docker-compose to override the user if needed, but default to root for tactical features
USER root

CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:5000", "--timeout", "120", "--access-logfile", "-", "app:app"]
