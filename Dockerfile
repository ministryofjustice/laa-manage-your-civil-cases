# Use the official Node.js image as the base image
FROM node:24.4.1-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package*.json yarn.lock .yarnrc.yml ./

# Enable Corepack to use the correct Yarn version
RUN corepack enable

# Install dependencies
RUN yarn install --immutable

# Create a non-root user  
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -G appuser -S appuser

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

# Define the command to run the application
CMD ["node", "public/app.js"]
