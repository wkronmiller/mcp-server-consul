#!/bin/bash

set -e

echo "Starting Consul MCP Server Docker Integration Tests..."

# Check if docker compose (new syntax) or docker-compose (legacy) is available
if command -v "docker" &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v "docker-compose" &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' is available"
    exit 1
fi

echo "Using: $DOCKER_COMPOSE"

# Build and start services
echo "Building and starting services..."
$DOCKER_COMPOSE -f test/compose.yml up --build -d

# Wait for services to be healthy
echo "Waiting for Consul to be healthy..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if $DOCKER_COMPOSE -f test/compose.yml exec -T consul consul members > /dev/null 2>&1; then
        echo "Consul is healthy!"
        break
    fi
    echo "Waiting for Consul... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo "Timeout waiting for Consul to be healthy"
    $DOCKER_COMPOSE -f test/compose.yml logs consul
    exit 1
fi

# Function to cleanup containers
cleanup() {
    echo "Cleaning up..."
    $DOCKER_COMPOSE -f test/compose.yml down -v
}

# Set trap to ensure cleanup happens even if tests fail
trap cleanup EXIT

# Run unit tests in the MCP server container
echo "Running unit tests..."
if ! $DOCKER_COMPOSE -f test/compose.yml exec -T consul-mcp-server npm run test; then
    echo "Unit tests failed!"
    exit 1
fi

# Run integration tests
echo "Running Docker integration tests..."
if ! $DOCKER_COMPOSE -f test/compose.yml exec -T consul-mcp-server npm run test:integration; then
    echo "Integration tests failed!"
    exit 1
fi

echo "All tests completed successfully!"