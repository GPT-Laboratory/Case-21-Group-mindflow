/**
 * @title String Statistics with Logging
 * @description Provides functions to sanitize strings, compute statistics, and log each operation via an external logger.
 */
import { log } from './logger.js';

/**
 * @title defaultDelimiter
 * @description Delimiter used to split words.
 */
const defaultDelimiter = ' ';

/**
 * @title sanitizeString
 * @description Removes punctuation and converts a string to lowercase.
 * @param {string} str - The input string to sanitize.
 * @returns {string} - The sanitized string.
 */
function sanitizeString(str) {
  const result = str.replace(/[^\w\s]|_/g, '').toLowerCase().trim();
  log('sanitizeString', { input: str, output: result });
  return result;
}

/**
 * @title countWords
 * @description Counts the number of words in a string.
 * @param {string} str - The input string.
 * @param {string} [delimiter=defaultDelimiter] - Delimiter to split words.
 * @returns {number} - The word count.
 */
function countWords(str, delimiter = defaultDelimiter) {
  const sanitized = sanitizeString(str);
  const count = sanitized ? sanitized.split(delimiter).length : 0;
  log('countWords', { input: str, count });
  return count;
}

/**
 * @title sumWordLengths
 * @description Sums the lengths of all words in a string.
 * @param {string} str - The input string.
 * @param {string} [delimiter=defaultDelimiter] - Delimiter to split words.
 * @returns {number} - The sum of word lengths.
 */
function sumWordLengths(str, delimiter = defaultDelimiter) {
  const sanitized = sanitizeString(str);
  const words = sanitized ? sanitized.split(delimiter) : [];
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  log('sumWordLengths', { input: str, totalLength });
  return totalLength;
}

/**
 * @title averageWordLength
 * @description Calculates the average word length in a string.
 * @param {string} str - The input string.
 * @param {string} [delimiter=defaultDelimiter] - Delimiter to split words.
 * @returns {number} - The average word length.
 */
function averageWordLength(str, delimiter = defaultDelimiter) {
  const totalWords = countWords(str, delimiter);
  if (!totalWords) {
    log('averageWordLength', { input: str, average: 0 });
    return 0;
  }
  const totalLength = sumWordLengths(str, delimiter);
  const avg = totalLength / totalWords;
  log('averageWordLength', { input: str, average: avg });
  return avg;
}



export {
  defaultDelimiter,
  sanitizeString,
  countWords,
  sumWordLengths,
  averageWordLength,
};
