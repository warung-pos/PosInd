// Knuth-Morris-Pratt (KMP) String Matching Algorithm
function buildLPSTable(pattern) {
  const lps = Array(pattern.length).fill(0);
  let len = 0;
  let i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }
  return lps;
}

/**
 * Searches for a pattern within a text using the KMP algorithm.
 * @param {string} text 
 * @param {string} pattern 
 * @returns {boolean} true if match found, false otherwise
 */
export const kmpSearch = (text, pattern) => {
  if (pattern.length === 0) return true;
  if (text.length < pattern.length) return false;

  const lps = buildLPSTable(pattern);
  let i = 0; // index for text
  let j = 0; // index for pattern

  while (i < text.length) {
    if (text[i] === pattern[j]) {
      i++;
      j++;
    }
    if (j === pattern.length) {
      return true; // Match found
    } else if (i < text.length && text[i] !== pattern[j]) {
      if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
  }
  return false;
};
