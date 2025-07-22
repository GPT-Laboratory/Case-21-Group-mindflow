/**
 * @title Logger Utilities
 * @description Provides a `log` function to record operation names and payloads, sending them to the console or an external monitoring service.
 */

/**
 * @title log
 * @description Logs a given operation name and associated data.
 * @param {string} operation - The name of the operation being logged.
 * @param {Object} data - The data payload to record with the log.
 * @returns {void}
 */
function log(operation, data) {
    // Example: output to console. Replace with external service integration as needed.
    console.log(`[${operation}]`, JSON.stringify(data));
    // TODO: send to remote monitoring endpoint, e.g.:
    // fetch('/api/logs', { method: 'POST', body: JSON.stringify({ operation, data }) });
  }
  
  export { log };
  