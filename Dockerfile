
# Use Debian-based Node.js 25.8.2
FROM node:25.8.2-slim

# Set the working directory
WORKDIR /app

# Install build tools for native modules (Debian/Bookworm)
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        build-essential \
        python3 \
        make \
        g++ \
        pkg-config && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install corepack and configure yarn
RUN npm install -g --force corepack && \
    corepack enable && \
    corepack prepare yarn@4.9.2 --activate && \
    rm -rf /usr/local/lib/node_modules/npm && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx

# Copy package files
COPY package*.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install --immutable --inline-builds

# Add non-root user
RUN groupadd -g 1001 appuser && \
    useradd -u 1001 -g 1001 -m appuser

# Copy application code
COPY --chown=1001:1001 . .

# Build the app
RUN yarn build

# Switch to non-root user
USER 1001

# Fix corepack cache issues
ENV HOME=/app

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "public/app.js"]

