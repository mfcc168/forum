/**
 * Global test setup and configuration
 * Runs before all tests to set up the testing environment
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupTestEnvironment, teardownTestEnvironment } from './utils/db-utils'

// Setup test environment before all tests
beforeAll(async () => {
  // Setup global test configurations first
  setupGlobalMocks()

  // Setup test database ONLY for integration tests
  if (process.env.TEST_TYPE === 'integration') {
    try {
      await setupTestEnvironment()
      console.log('✅ Test database setup complete')
    } catch (error) {
      console.error('❌ Failed to setup test database:', error)
      throw error // Fail integration tests if database setup fails
    }
  }
})

// Cleanup after all tests
afterAll(async () => {
  // Cleanup test database ONLY for integration tests
  if (process.env.TEST_TYPE === 'integration') {
    try {
      await teardownTestEnvironment()
      console.log('✅ Test database cleanup complete')
    } catch (error) {
      console.error('❌ Failed to cleanup test database:', error)
    }
  }
})

// Reset mocks before each test
beforeEach(() => {
  // Reset all fetch mocks
  if (global.fetch && typeof global.fetch.mockReset === 'function') {
    global.fetch.mockReset()
  }
})

// Cleanup after each test
afterEach(() => {
  // Clear any pending timers
  if (typeof vi !== 'undefined') {
    vi.clearAllTimers()
    vi.resetAllMocks()
  }
})

/**
 * Setup global mocks that are needed across all tests
 */
function setupGlobalMocks() {
  // Mock window object properties
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock clipboard API
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
  })

  // Mock console methods to reduce noise in tests (optional)
  if (process.env.TEST_SILENCE_CONSOLE === 'true') {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    // Don't mock console.error as we want to see actual errors
  }

  // Mock environment variables for consistent testing
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.NODE_ENV = 'test'
}

/**
 * Custom error handler for unhandled promise rejections in tests
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit in test environment, just log the error
})

/**
 * Extend global types for better TypeScript support in tests
 */
declare global {
  interface Global {
    fetch: any
  }
  
  namespace Vi {
    interface Assertion<T = any> {
      toBeInTheDocument(): T
      toHaveAttribute(attr: string, value?: string): T
      toHaveClass(className: string): T
      toHaveStyle(style: string | object): T
      toHaveValue(value: string | number): T
      toBeChecked(): T
      toBeDisabled(): T
      toBeEnabled(): T
      toBeVisible(): T
      toHaveAccessibleName(name: string): T
    }
  }
}

export {}