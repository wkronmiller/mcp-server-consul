# Consul MCP Server Integration Tests

This directory contains dockerized integration tests for the Consul MCP Server.

## Test Structure

- `compose.yml` - Docker Compose configuration for test environment
- `Dockerfile` - Container for running the MCP server in test mode
- `integration.test.ts` - Real Consul integration tests
- `docker-test.sh` - Script to run full Docker-based test suite
- `README.md` - This documentation

## Running Tests

### Unit Tests (with mocks)
```bash
npm test
```

### Integration Tests (with real Consul)
```bash
npm run test:integration
```

### Docker Integration Tests
```bash
npm run test:docker
```

### All Tests
```bash
npm run test:all
```

## Test Environment

The Docker Compose setup includes:

1. **Consul Server** (`hashicorp/consul:1.21`)
   - Runs in development mode
   - Exposed on port 8500
   - Health checks enabled
   - UI available at http://localhost:8500

2. **MCP Server Container**
   - Built from project source
   - Connects to Consul container
   - Runs tests against real Consul instance

## Test Coverage

The integration tests cover all MCP server tools:

### KV Store Operations
- `consul_kv_get` - Get key-value pairs
- `consul_kv_keys` - List keys with prefix

### Status Operations
- `consul_status_leader` - Get Raft leader
- `consul_status_peers` - Get Raft peer set

### Agent Operations
- `consul_agent_members` - Get cluster members
- `consul_agent_self` - Get agent configuration

### Catalog Operations
- `consul_catalog_datacenters` - List datacenters
- `consul_catalog_nodes` - List nodes
- `consul_catalog_node_services` - Get node services
- `consul_catalog_services` - List services
- `consul_catalog_service_nodes` - Get service nodes

### Health Operations
- `consul_health_node` - Get node health
- `consul_health_checks` - Get service health checks
- `consul_health_service` - Get service health info
- `consul_health_state` - Get checks by state

## Environment Variables

The following environment variables are used in tests:

- `CONSUL_HOST` - Consul server hostname (default: consul)
- `CONSUL_PORT` - Consul server port (default: 8500)
- `NODE_ENV` - Set to 'test' to disable connection logging

## Troubleshooting

### Consul Connection Issues
Check Consul logs:
```bash
docker-compose -f test/compose.yml logs consul
```

### Test Failures
Run tests with verbose output:
```bash
docker-compose -f test/compose.yml exec consul-mcp-server npm run test -- --reporter=verbose
```

### Container Issues
Rebuild containers:
```bash
docker-compose -f test/compose.yml up --build --force-recreate
```

## Cleanup

Remove test containers and volumes:
```bash
docker-compose -f test/compose.yml down -v
```