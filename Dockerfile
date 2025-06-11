# Use the official Node.js image as the base image
FROM node:24.1.0-slim
# Set the working directory inside the container
WORKDIR /app
# Copy package.json and yarn.lock to the working directory
COPY package*.json yarn.lock .yarnrc.yml ./
# Enable Corepack to use the correct Yarn version
RUN corepack enable
# Install dependencies
RUN if [ "$CI" = "True" ]; then \
        yarn install --immutable; \
    else \
        yarn install; \
    fi
# Create a non-root user  
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 --gid 1001 appuser
# Copy the rest of the application code to the working directory
# and set ownership to the non-root user
COPY --chown=1001:1001 . .
# Build the application
RUN yarn build
# Set ownership of all generated files to the non-root user
RUN chown -R 1001:1001 /app
# Switch to the non-root user by ID (not name)
USER 1001
# Set HOME environment variable to fix corepack cache issues
ENV HOME=/app
# Expose the port the app runs on
EXPOSE 3000
# Define the command that preserves full development functionality
# CMD ["sh", "-c", "if [ \"$CI\" = \"true\" ]; then node public/app.js; else node -e \"const { spawn } = require('child_process'); const tsc = spawn('npx', ['tsc', '--watch']); tsc.stdout.on('data', data => console.log('\\x1b[36m%s\\x1b[0m', data)); const nodemon = spawn('npx', ['nodemon', 'public/app.js']); nodemon.stdout.on('data', data => console.log(data.toString())); nodemon.stderr.on('data', data => console.error(data.toString()));});\"; fi"]
# CMD ["sh", "-c", "if [ \"$CI\" = \"true\" ]; then \ 
#         node public/app.js; \
#     else \
#         node -e \"const { spawn } = require('child_process'); const tsc = spawn('npx', ['tsc', '--watch']); tsc.stdout.on('data', data => console.log('\\x1b[36m%s\\x1b[0m', data)); const nodemon = spawn('npx', ['nodemon', 'public/app.js']); nodemon.stdout.on('data', data => console.log(data.toString())); nodemon.stderr.on('data', data => console.error(data.toString()));\"; \
#     fi"]
CMD ["sh", "-c", "if [ \"$CI\" = \"true\" ]; then \ 
        node public/app.js; \
    else \
        echo \"test\"; \
        echo $NODE_ENV; \
        echo $CI; \
        echo \"end test\"; \
    fi"]