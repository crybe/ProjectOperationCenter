# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues. Instead, contact the maintainer directly.

## Best Practices for Deployment

1. **Environment Variables**: Never commit your `.env` file. Use the provided `.env.example` as a template and ensure your production secrets are stored securely (e.g., using Docker Secrets or encrypted environment variables).
2. **Authentication**: This dashboard provides significant control over server infrastructure and hardware. Always deploy behind a secure reverse proxy with SSL (e.g., Nginx Proxy Manager, Traefik) and ensure strong passwords are set in the `.env` file.
3. **Internal Network**: If possible, keep the dashboard accessible only via a VPN (like Tailscale or WireGuard) or within your local home network.
4. **API Keys**: Ensure all API keys (Gemini, Groq, OpenRouter, etc.) have appropriate usage limits set in their respective provider consoles to prevent abuse.
5. **Docker Socket**: Mounting `/var/run/docker.sock` allows the container to control the host Docker daemon. Use this feature with caution and only if you trust the network environment.

## Secrets Cleanup

This repository has been sanitized for public release. If you find any leaked secrets or private information in the history or code, please report it immediately.
