import { afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Worker for tests
class MockWorker {
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  
  constructor() {}
  
  postMessage() {}
  terminate() {}
}

// Mock global objects
beforeAll(() => {
  // Mock Worker
  global.Worker = MockWorker as any;
  
  // Mock ResizeObserver
  global.ResizeObserver = class MockResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
  
  // Mock IntersectionObserver
  global.IntersectionObserver = class MockIntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});