/**
 * Usage Tracking Module
 * 
 * Handles provider usage statistics and validation tracking.
 * 
 * @author Agentic Content Flow Team
 * @version 2.0.0
 * @since 2025-06-16
 */

import { LLMProvider } from '../../../generatortypes';

const PROVIDER_USAGE_KEY = 'agentic_flow_provider_usage';

export interface ProviderUsage {
  lastUsed: string;
  usageCount: number;
  isValid: boolean;
  lastError?: string;
}

/**
 * Usage Tracking Service
 */
export class UsageTracker {
  private usage: Map<LLMProvider, ProviderUsage> = new Map();

  constructor() {
    this.loadUsageData();
  }

  /**
   * Mark provider as used successfully
   */
  markAsUsed(provider: LLMProvider): void {
    this.updateUsage(provider, {
      isValid: true,
      lastError: undefined
    });
  }

  /**
   * Mark provider as invalid
   */
  markAsInvalid(provider: LLMProvider, error?: string): void {
    this.updateUsage(provider, {
      isValid: false,
      lastError: error
    });
  }

  /**
   * Check if provider is valid
   */
  isProviderValid(provider: LLMProvider): boolean {
    const usage = this.usage.get(provider);
    return usage?.isValid !== false;
  }

  /**
   * Get usage statistics for a provider
   */
  getProviderUsage(provider: LLMProvider): ProviderUsage | undefined {
    return this.usage.get(provider);
  }

  /**
   * Get all provider statistics
   */
  getAllStats(): Record<LLMProvider, { usageCount: number; lastUsed?: string; isValid: boolean }> {
    const stats: Record<string, any> = {};
    
    for (const [provider, usage] of this.usage.entries()) {
      stats[provider] = {
        usageCount: usage.usageCount,
        lastUsed: usage.lastUsed,
        isValid: usage.isValid
      };
    }
    
    return stats;
  }

  /**
   * Clear usage data for a provider
   */
  clearProvider(provider: LLMProvider): void {
    this.usage.delete(provider);
    this.persistUsageData();
  }

  /**
   * Clear all usage data
   */
  clearAll(): void {
    this.usage.clear();
    localStorage.removeItem(PROVIDER_USAGE_KEY);
  }

  /**
   * Get most recently used valid provider
   */
  getMostRecentlyUsed(validProviders: LLMProvider[]): LLMProvider | null {
    const validUsage = validProviders
      .map(provider => ({
        provider,
        usage: this.usage.get(provider)
      }))
      .filter(({ usage }) => usage?.isValid !== false)
      .sort((a, b) => {
        const dateA = a.usage?.lastUsed ? new Date(a.usage.lastUsed).getTime() : 0;
        const dateB = b.usage?.lastUsed ? new Date(b.usage.lastUsed).getTime() : 0;
        return dateB - dateA;
      });

    return validUsage.length > 0 ? validUsage[0].provider : null;
  }

  private updateUsage(provider: LLMProvider, updates: Partial<ProviderUsage>): void {
    const current = this.usage.get(provider) || {
      lastUsed: new Date().toISOString(),
      usageCount: 0,
      isValid: true
    };

    this.usage.set(provider, {
      ...current,
      ...updates,
      lastUsed: new Date().toISOString(),
      usageCount: current.usageCount + 1
    });

    this.persistUsageData();
  }

  private loadUsageData(): void {
    try {
      const stored = localStorage.getItem(PROVIDER_USAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.usage = new Map(Object.entries(data) as [LLMProvider, ProviderUsage][]);
      }
    } catch (error) {
      console.error('Failed to load usage data:', error);
      this.usage = new Map();
    }
  }

  private persistUsageData(): void {
    try {
      const data = Object.fromEntries(this.usage.entries());
      localStorage.setItem(PROVIDER_USAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist usage data:', error);
    }
  }
}