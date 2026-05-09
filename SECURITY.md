# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues. Instead, contact the maintainer directly.

## Best Practices for Deployment

1. **Environment Variables**: Never commit your `.env` file. Use the provided `.env.example` as a template and ensure your production secrets are stored securely (e.g., using Docker Secrets or encrypted environment variables).
2. **Authentication**: This dashboard provides significant control over server infrastructure and hardware. Always deploy behind a secure reverse proxy with SSL (e.g., Nginx Proxy Manager, Traefik) and ensure strong passwords are set in the `.env` file.
3. **Internal Network**: If possible, keep the dashboard accessible only via a VPN (like Tailscale or WireGuard) or within your local home network.
4. **API Keys**: Ensure all API keys (Gemini, Groq, OpenRouter, etc.) have appropriate usage limits set in their respective provider consoles to prevent abuse.
5. **Docker Socket**: Mounting `/var/run/docker.sock` allows the container to control the host Docker daemon. Use this feature with caution and only if you trust the network environment.

6. **No Public Exposure**: Do not expose this dashboard directly to the public internet. Always use a VPN (Tailscale, WireGuard) or an authenticated reverse proxy (Nginx Proxy Manager, Traefik) in front of it.
7. **No Secrets in Git**: Never commit API keys, passwords, session secrets, or any credentials to this repository. The `.env` file must remain local and untracked.
8. **No Production API Keys**: Use test/sandbox keys during development. Apply rate limits and IP restrictions in your API provider consoles.

## Docker Security Notes

- **Docker Socket (`/var/run/docker.sock`)**: The `docker-compose.yml` may mount the Docker socket to allow container management via the UI. This grants the container full control over the host Docker daemon. Only use this feature in a trusted, isolated network environment.
- **Root Containers**: Avoid running containers as root in production. Review the `Dockerfile` and `docker-compose.yml` before deploying in shared or sensitive environments.

## Secrets Cleanup

This repository has been sanitized for public release. If you find any leaked secrets or private information in the history or code, please report it immediately.
