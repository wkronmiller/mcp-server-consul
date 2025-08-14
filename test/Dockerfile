FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY test/ ./test/

# Build the application
RUN npm run build

# Install test dependencies
RUN npm install --save-dev @types/node vitest tsx

# Expose port for debugging if needed
EXPOSE 3000

# Default command for running tests
CMD ["npm", "test"]