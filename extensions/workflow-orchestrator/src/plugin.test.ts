/**
 * Plugin Initialization Tests
 */

import workflowOrchestratorPlugin, { version } from './plugin';
import type { OpenClawPluginApi, PluginLogger } from './plugin-types';

describe('workflowOrchestratorPlugin', () => {
  let mockLogger: PluginLogger;
  let mockApi: OpenClawPluginApi;
  let mockOn: jest.Mock;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockOn = jest.fn();

    mockApi = {
      logger: mockLogger,
      on: mockOn,
    };
  });

  it('should export version', () => {
    expect(version).toBe('0.1.0-phase1');
  });

  it('should initialize without errors', () => {
    expect(() => workflowOrchestratorPlugin(mockApi)).not.toThrow();
  });

  it('should log initialization start', () => {
    workflowOrchestratorPlugin(mockApi);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Initializing v0.1.0-phase1')
    );
  });

  it('should register hooks', () => {
    workflowOrchestratorPlugin(mockApi);

    expect(mockOn).toHaveBeenCalledTimes(3);
    expect(mockOn).toHaveBeenCalledWith(
      'subagent_spawned',
      expect.any(Function),
      { priority: 100 }
    );
    expect(mockOn).toHaveBeenCalledWith(
      'subagent_ended',
      expect.any(Function),
      { priority: 100 }
    );
    expect(mockOn).toHaveBeenCalledWith(
      'message_sending',
      expect.any(Function),
      { priority: 200 }
    );
  });

  it('should log initialization complete with features and limitations', () => {
    workflowOrchestratorPlugin(mockApi);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Initialization complete'),
      expect.objectContaining({
        version: '0.1.0-phase1',
        phase: 1,
        features: expect.arrayContaining([
          'subagent-tracking',
          'message-interception',
        ]),
        limitations: expect.arrayContaining([
          'no-auto-wake',
          'no-dod-validation',
          'no-persistence',
        ]),
      })
    );
  });
});
