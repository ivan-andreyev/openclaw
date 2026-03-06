#!/usr/bin/env node

/**
 * CLI for Workflow Orchestrator state inspection
 * @module cli
 */

import { Command } from 'commander';
import { StateManager } from './state-manager.js';
import { WorkflowStep } from './types.js';

const program = new Command();

program
  .name('orchestrator')
  .description('Workflow Orchestrator CLI')
  .version('0.1.0');

program
  .command('list')
  .description('List all workflows')
  .option('-s, --status <status>', 'Filter by status (pending|running|completed|failed|paused)')
  .action(async (options) => {
    const sm = new StateManager();
    await sm.init();
    
    let workflows = sm.getAll();
    
    // Filter by status if specified
    if (options.status) {
      workflows = workflows.filter(w => w.status === options.status);
    }

    if (workflows.length === 0) {
      console.log('No workflows found.');
      return;
    }

    console.log(`\nFound ${workflows.length} workflow(s):\n`);

    for (const workflow of workflows) {
      const completedSteps = Array.from(workflow.executions.values()).filter(e => e.status === 'success').length;
      const totalSteps = workflow.steps.length;
      
      console.log(`📋 ${workflow.id}`);
      console.log(`   Status: ${getStatusEmoji(workflow.status)} ${workflow.status}`);
      console.log(`   Progress: ${completedSteps}/${totalSteps} steps completed`);
      console.log(`   Created: ${workflow.createdAt.toISOString()}`);
      console.log(`   Updated: ${workflow.updatedAt.toISOString()}`);
      console.log('');
    }
  });

program
  .command('show <id>')
  .description('Show detailed workflow information')
  .option('-j, --json', 'Output as JSON')
  .action(async (id, options) => {
    const sm = new StateManager();
    await sm.init();
    
    const state = sm.get(id);
    
    if (!state) {
      console.error(`❌ Workflow '${id}' not found.`);
      process.exit(1);
    }

    if (options.json) {
      // Convert Map to array for JSON serialization
      const serialized = {
        ...state,
        executions: Array.from(state.executions.entries()).map(([_, execution]) => ({
          ...execution,
          startedAt: execution.startedAt?.toISOString(),
          completedAt: execution.completedAt?.toISOString()
        })),
        createdAt: state.createdAt.toISOString(),
        updatedAt: state.updatedAt.toISOString()
      };
      console.log(JSON.stringify(serialized, null, 2));
      return;
    }

    // Human-readable output
    console.log(`\n📋 Workflow: ${state.id}`);
    console.log(`   Status: ${getStatusEmoji(state.status)} ${state.status}`);
    console.log(`   Created: ${state.createdAt.toISOString()}`);
    console.log(`   Updated: ${state.updatedAt.toISOString()}`);
    
    if (Object.keys(state.metadata).length > 0) {
      console.log(`   Metadata: ${JSON.stringify(state.metadata)}`);
    }

    console.log(`\n📝 Steps (${state.steps.length}):`);
    for (const step of state.steps) {
      const execution = state.executions.get(step.id);
      const statusIcon = execution ? getStepStatusEmoji(execution.status) : '⏸️';
      const statusText = execution?.status || 'not started';
      
      console.log(`\n   ${statusIcon} ${step.id} - ${step.name}`);
      console.log(`      Tool: ${step.tool}`);
      console.log(`      Status: ${statusText}`);
      
      if (step.dependsOn && step.dependsOn.length > 0) {
        console.log(`      Depends on: ${step.dependsOn.join(', ')}`);
      }
      
      if (execution) {
        if (execution.startedAt) {
          console.log(`      Started: ${execution.startedAt.toISOString()}`);
        }
        if (execution.completedAt) {
          console.log(`      Completed: ${execution.completedAt.toISOString()}`);
        }
        if (execution.attempts > 1) {
          console.log(`      Attempts: ${execution.attempts}`);
        }
        if (execution.error) {
          console.log(`      Error: ${execution.error}`);
        }
        if (execution.result) {
          console.log(`      Result: ${JSON.stringify(execution.result)}`);
        }
      }
    }

    console.log('');
  });

program
  .command('create <id>')
  .description('Create a new workflow (for testing)')
  .option('-s, --steps <json>', 'Steps JSON array')
  .action(async (id, options) => {
    const sm = new StateManager();
    await sm.init();
    
    let steps: WorkflowStep[] = [];
    
    if (options.steps) {
      try {
        steps = JSON.parse(options.steps);
      } catch (error) {
        console.error('❌ Invalid steps JSON:', error);
        process.exit(1);
      }
    } else {
      // Default test steps
      steps = [
        {
          id: 'step-1',
          name: 'Example Step',
          tool: 'exec',
          params: { command: 'echo "Hello World"' }
        }
      ];
    }

    const state = await sm.create(id, steps);
    console.log(`✅ Workflow '${state.id}' created with ${steps.length} step(s).`);
  });

program.parse(process.argv);

/**
 * Get emoji for workflow status
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'pending': return '⏸️';
    case 'running': return '▶️';
    case 'completed': return '✅';
    case 'failed': return '❌';
    case 'paused': return '⏸️';
    default: return '❓';
  }
}

/**
 * Get emoji for step status
 */
function getStepStatusEmoji(status: string): string {
  switch (status) {
    case 'pending': return '⏸️';
    case 'running': return '▶️';
    case 'success': return '✅';
    case 'failed': return '❌';
    case 'skipped': return '⏭️';
    default: return '❓';
  }
}
