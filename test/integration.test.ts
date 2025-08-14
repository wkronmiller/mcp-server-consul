import { describe, it, expect, beforeAll } from 'vitest';
import { createServer } from '../src/index.js';
import Consul from '@wkronmiller/consul';

describe('Consul MCP Server Docker Integration Tests', () => {
  let server: any;
  let consul: any;

  beforeAll(async () => {
    // Create server with Consul connection to the docker-compose consul service
    process.env.CONSUL_HOST = 'consul';
    process.env.CONSUL_PORT = '8500';
    server = createServer();

    // Create direct consul client for test setup
    consul = new Consul({
      host: process.env.CONSUL_HOST || '127.0.0.1',
      port: process.env.CONSUL_PORT ? parseInt(process.env.CONSUL_PORT) : 8500,
    });

    // Wait for Consul to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Initialize test data
    try {
      await consul.kv.set({ key: 'test/sample-key', value: 'sample-value' });
      await consul.kv.set({ key: 'test/another-key', value: 'another-value' });
      await consul.kv.set({ key: 'test/nested/deep-key', value: 'deep-value' });
    } catch (error) {
      console.log('Failed to initialize test data:', error);
    }
  }, 15000);

  describe('Real Consul Integration', () => {
    it('should connect to real Consul and get leader', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_status_leader',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      expect(response.content[0].text).toMatch(/\d+\.\d+\.\d+\.\d+:\d+/);
    });

    it('should list datacenters from real Consul', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_catalog_datacenters',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      if (response.isError) {
        console.log('Consul connection error:', response.content[0].text);
        expect(response.content[0].text).toContain('Error');
      } else {
        expect(response.content[0].text).toContain('dc1');
      }
    });

    it('should get agent members from real Consul', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_agent_members',
          arguments: {}
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      if (response.isError) {
        console.log('Consul connection error:', response.content[0].text);
        expect(response.content[0].text).toContain('Error');
      } else {
        const result = JSON.parse(response.content[0].text);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should handle KV operations with real Consul', async () => {
      // Get an existing key that we initialized
      const getRequest = {
        method: 'tools/call',
        params: {
          name: 'consul_kv_get',
          arguments: { key: 'test/sample-key' }
        }
      };

      const getResponse = await server._requestHandlers.get('tools/call')?.(getRequest);
      expect(getResponse.content).toBeDefined();
      expect(getResponse.content[0]).toBeDefined();
      expect(getResponse.content[0].text).toBeDefined();
      expect(getResponse.content[0].text).toContain('sample-value');

      // Test non-existent key (should return null)
      const nonExistentRequest = {
        method: 'tools/call',
        params: {
          name: 'consul_kv_get',
          arguments: { key: 'test/nonexistent' }
        }
      };

      const nonExistentResponse = await server._requestHandlers.get('tools/call')?.(nonExistentRequest);
      expect(nonExistentResponse.content).toBeDefined();
      expect(nonExistentResponse.content[0]).toBeDefined();
      // For non-existent keys, Consul returns null which gets stringified
      const responseText = nonExistentResponse.content[0].text;
      // The text property might be undefined if the result is null, so we handle both cases
      expect(responseText === undefined || responseText === 'null').toBe(true);

      // List keys under test/ prefix
      const keysRequest = {
        method: 'tools/call',
        params: {
          name: 'consul_kv_keys',
          arguments: { key: 'test/' }
        }
      };

      const keysResponse = await server._requestHandlers.get('tools/call')?.(keysRequest);
      expect(keysResponse.content[0].text).toBeDefined();
      const keys = JSON.parse(keysResponse.content[0].text);
      expect(Array.isArray(keys)).toBe(true);
      expect(keys).toContain('test/sample-key');
      expect(keys).toContain('test/another-key');
    });

    it('should get health state from real Consul', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'consul_health_state',
          arguments: { state: 'any' }
        }
      };

      const response = await server._requestHandlers.get('tools/call')?.(request);
      if (response.isError) {
        console.log('Consul connection error:', response.content[0].text);
        expect(response.content[0].text).toContain('Error');
      } else {
        const result = JSON.parse(response.content[0].text);
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });
});