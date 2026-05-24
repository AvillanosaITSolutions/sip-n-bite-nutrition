#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu/Debian VPS at 88.222.245.88.
# Run as root or with sudo: bash vps-bootstrap.sh

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

# ---------- 1. System packages ----------
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw

# ---------- 2. Docker Engine + Compose plugin ----------
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc 2>/dev/null \
  || curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

DISTRO_ID=$(. /etc/os-release && echo "$ID")
CODENAME=$(. /etc/os-release && echo "${VERSION_CODENAME:-stable}")

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/${DISTRO_ID} ${CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ---------- 3. Deploy user ----------
if ! id -u deploy >/dev/null 2>&1; then
  useradd -m -s /bin/bash deploy
  usermod -aG docker deploy
fi
mkdir -p /home/deploy/snb /home/deploy/.ssh
chown -R deploy:deploy /home/deploy/snb /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# ---------- 4. Firewall ----------
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "================================================="
echo "Bootstrap complete."
echo ""
echo "Next steps (run as the 'deploy' user):"
echo "  1. Add your GitHub Actions public key to /home/deploy/.ssh/authorized_keys"
echo "  2. cd ~/snb"
echo "  3. cp .env.production.example .env  (then fill in the values)"
echo "  4. The first CI deploy run will scp docker-compose.prod.yml and bring it up."
echo ""
echo "DNS reminder: point sipnbite.example.com and api.sipnbite.example.com"
echo "              A records at this server's IP before the first deploy."
echo "================================================="
