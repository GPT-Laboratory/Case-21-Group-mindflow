export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  timeout: number;
  signal?: AbortSignal;
}

export class RetryManager {
  async executeWithRetry<T>(
    operation: (attempt: number) => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        if (options.signal?.aborted) {
          throw new Error('Operation aborted by user');
        }

        return await this.executeWithTimeout(
          () => operation(attempt),
          options.timeout,
          options.signal
        );
      } catch (caught) {
        const error = caught instanceof Error ? caught : new Error(String(caught));
        lastError = error;
        
        if (error.message === 'Operation aborted by user' || attempt === options.maxAttempts) {
          throw this.standardizeError(error);
        }

        await new Promise(resolve => setTimeout(resolve, options.delayMs));
      }
    }

    throw this.standardizeError(lastError || new Error('Operation failed'));
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T> | T,
    timeoutMs: number,
    signal?: AbortSignal
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const abortHandler = () => {
        clearTimeout(timer);
        reject(new Error('Operation aborted by user'));
      };
      signal?.addEventListener('abort', abortHandler);

      Promise.resolve(operation())
        .then(result => {
          clearTimeout(timer);
          signal?.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          signal?.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }

  private standardizeError(error: any): Error {
    const standardError = new Error(error.message || 'Unknown error');
    standardError.name = error.name || 'ProcessError';
    
    (standardError as any).code = error.code || 'PROCESS_ERROR';
    (standardError as any).details = error.details || {};
    (standardError as any).timestamp = new Date().toISOString();
    
    return standardError;
  }
}