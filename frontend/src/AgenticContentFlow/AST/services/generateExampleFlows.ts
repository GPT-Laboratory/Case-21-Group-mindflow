/** @format */

import { flowGenerator } from './FlowGenerator';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Generate flows from the example JavaScript files
 */
export function generateExampleFlows(): any[] {
  try {
    // Read the example files
    const loggerPath = join(process.cwd(), '.kiro/specs/direct-function-calling-architecture/example/logger.js');
    const stringStatsPath = join(process.cwd(), '.kiro/specs/direct-function-calling-architecture/example/stringStatsStandard.js');
    
    const loggerCode = readFileSync(loggerPath, 'utf8');
    const stringStatsCode = readFileSync(stringStatsPath, 'utf8');

    // Generate flows
    const flows = flowGenerator.generateFlows([
      { code: stringStatsCode, fileName: 'stringStatsStandard.js' },
      { code: loggerCode, fileName: 'logger.js' }
    ]);

    return flows;
  } catch (error) {
    console.error('Error generating example flows:', error);
    return [];
  }
}

/**
 * Generate and save flows to a JSON file (for demonstration)
 */
export function generateAndSaveExampleFlows(): void {
  const flows = generateExampleFlows();
  
  if (flows.length > 0) {
    console.log('Generated flows:');
    console.log(JSON.stringify(flows, null, 2));
  } else {
    console.log('No flows generated');
  }
}

// Run if this file is executed directly
generateAndSaveExampleFlows();