/**
 * Diff Engine - Core diff algorithms for text comparison
 * Implements a lightweight Myers diff algorithm without external dependencies
 */

export interface DiffChange {
  type: 'added' | 'deleted' | 'modified' | 'unchanged';
  leftLineNumber?: number;
  rightLineNumber?: number;
  leftContent?: string;
  rightContent?: string;
}

export interface DiffResult {
  changes: DiffChange[];
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
    unchanged: number;
  };
}

export interface DiffOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
  ignoreBlankLines?: boolean;
}

/**
 * Compute line-by-line diff between two strings
 */
export const diffLines = (left: string, right: string, options: DiffOptions = {}): DiffResult => {
  let leftLines = left.split('\n');
  let rightLines = right.split('\n');

  // Apply options preprocessing
  if (options.ignoreBlankLines) {
    leftLines = leftLines.filter((line) => line.trim() !== '');
    rightLines = rightLines.filter((line) => line.trim() !== '');
  }

  // Normalize lines for comparison
  const normalizeLine = (line: string): string => {
    let normalized = line;
    if (options.ignoreWhitespace) {
      normalized = normalized.trim();
    }
    if (options.ignoreCase) {
      normalized = normalized.toLowerCase();
    }
    return normalized;
  };

  const normalizedLeft = leftLines.map(normalizeLine);
  const normalizedRight = rightLines.map(normalizeLine);

  const lcs = computeLCS(normalizedLeft, normalizedRight);
  const changes: DiffChange[] = [];

  let leftIdx = 0;
  let rightIdx = 0;
  let lcsIdx = 0;

  let stats = {
    additions: 0,
    deletions: 0,
    modifications: 0,
    unchanged: 0,
  };

  while (leftIdx < leftLines.length || rightIdx < rightLines.length) {
    const leftLine = leftLines[leftIdx];
    const rightLine = rightLines[rightIdx];
    const normalizedLeftLine = normalizedLeft[leftIdx];
    const normalizedRightLine = normalizedRight[rightIdx];

    // Both lines match the LCS - unchanged
    if (
      lcsIdx < lcs.length &&
      normalizedLeftLine === lcs[lcsIdx] &&
      normalizedRightLine === lcs[lcsIdx]
    ) {
      changes.push({
        type: 'unchanged',
        leftLineNumber: leftIdx + 1,
        rightLineNumber: rightIdx + 1,
        leftContent: leftLine,
        rightContent: rightLine,
      });
      stats.unchanged++;
      leftIdx++;
      rightIdx++;
      lcsIdx++;
    }
    // Left line matches LCS but right doesn't - right is added
    else if (
      lcsIdx < lcs.length &&
      normalizedLeftLine === lcs[lcsIdx] &&
      normalizedRightLine !== lcs[lcsIdx]
    ) {
      changes.push({
        type: 'added',
        rightLineNumber: rightIdx + 1,
        rightContent: rightLine,
      });
      stats.additions++;
      rightIdx++;
    }
    // Right line matches LCS but left doesn't - left is deleted
    else if (
      lcsIdx < lcs.length &&
      normalizedRightLine === lcs[lcsIdx] &&
      normalizedLeftLine !== lcs[lcsIdx]
    ) {
      changes.push({
        type: 'deleted',
        leftLineNumber: leftIdx + 1,
        leftContent: leftLine,
      });
      stats.deletions++;
      leftIdx++;
    }
    // Both lines exist but neither matches LCS - check if they're similar (modification)
    else if (leftIdx < leftLines.length && rightIdx < rightLines.length) {
      // Lines are different - treat as modification
      changes.push({
        type: 'modified',
        leftLineNumber: leftIdx + 1,
        rightLineNumber: rightIdx + 1,
        leftContent: leftLine,
        rightContent: rightLine,
      });
      stats.modifications++;
      leftIdx++;
      rightIdx++;
    }
    // Only left lines remaining - deletions
    else if (leftIdx < leftLines.length) {
      changes.push({
        type: 'deleted',
        leftLineNumber: leftIdx + 1,
        leftContent: leftLine,
      });
      stats.deletions++;
      leftIdx++;
    }
    // Only right lines remaining - additions
    else if (rightIdx < rightLines.length) {
      changes.push({
        type: 'added',
        rightLineNumber: rightIdx + 1,
        rightContent: rightLine,
      });
      stats.additions++;
      rightIdx++;
    }
  }

  return { changes, stats };
};

/**
 * Compute character-level diff between two strings (Advanced mode)
 * Uses a simplified Myers algorithm for character-by-character comparison
 */
export const diffChars = (left: string, right: string): DiffResult => {
  const changes: DiffChange[] = [];
  let stats = {
    additions: 0,
    deletions: 0,
    modifications: 0,
    unchanged: 0,
  };

  // For character diff, we'll treat each character as a "line"
  const leftChars = left.split('');
  const rightChars = right.split('');

  const lcs = computeLCS(leftChars, rightChars);

  let leftIdx = 0;
  let rightIdx = 0;
  let lcsIdx = 0;

  let leftBuffer = '';
  let rightBuffer = '';
  let unchangedBuffer = '';

  const flushBuffers = () => {
    if (unchangedBuffer) {
      changes.push({
        type: 'unchanged',
        leftContent: unchangedBuffer,
        rightContent: unchangedBuffer,
      });
      stats.unchanged++;
      unchangedBuffer = '';
    }
    if (leftBuffer && rightBuffer) {
      changes.push({
        type: 'modified',
        leftContent: leftBuffer,
        rightContent: rightBuffer,
      });
      stats.modifications++;
      leftBuffer = '';
      rightBuffer = '';
    } else if (leftBuffer) {
      changes.push({
        type: 'deleted',
        leftContent: leftBuffer,
      });
      stats.deletions++;
      leftBuffer = '';
    } else if (rightBuffer) {
      changes.push({
        type: 'added',
        rightContent: rightBuffer,
      });
      stats.additions++;
      rightBuffer = '';
    }
  };

  while (leftIdx < leftChars.length || rightIdx < rightChars.length) {
    const leftChar = leftChars[leftIdx];
    const rightChar = rightChars[rightIdx];

    // Both chars match the LCS - unchanged
    if (lcsIdx < lcs.length && leftChar === lcs[lcsIdx] && rightChar === lcs[lcsIdx]) {
      flushBuffers();
      unchangedBuffer += leftChar;
      leftIdx++;
      rightIdx++;
      lcsIdx++;
    }
    // Left char matches LCS but right doesn't - right is added
    else if (lcsIdx < lcs.length && leftChar === lcs[lcsIdx] && rightChar !== lcs[lcsIdx]) {
      if (unchangedBuffer) {
        changes.push({
          type: 'unchanged',
          leftContent: unchangedBuffer,
          rightContent: unchangedBuffer,
        });
        stats.unchanged++;
        unchangedBuffer = '';
      }
      rightBuffer += rightChar;
      rightIdx++;
    }
    // Right char matches LCS but left doesn't - left is deleted
    else if (lcsIdx < lcs.length && rightChar === lcs[lcsIdx] && leftChar !== lcs[lcsIdx]) {
      if (unchangedBuffer) {
        changes.push({
          type: 'unchanged',
          leftContent: unchangedBuffer,
          rightContent: unchangedBuffer,
        });
        stats.unchanged++;
        unchangedBuffer = '';
      }
      leftBuffer += leftChar;
      leftIdx++;
    }
    // Both chars exist but different
    else if (leftIdx < leftChars.length && rightIdx < rightChars.length) {
      if (unchangedBuffer) {
        changes.push({
          type: 'unchanged',
          leftContent: unchangedBuffer,
          rightContent: unchangedBuffer,
        });
        stats.unchanged++;
        unchangedBuffer = '';
      }
      leftBuffer += leftChar;
      rightBuffer += rightChar;
      leftIdx++;
      rightIdx++;
    }
    // Only left chars remaining - deletions
    else if (leftIdx < leftChars.length) {
      if (unchangedBuffer) {
        changes.push({
          type: 'unchanged',
          leftContent: unchangedBuffer,
          rightContent: unchangedBuffer,
        });
        stats.unchanged++;
        unchangedBuffer = '';
      }
      leftBuffer += leftChar;
      leftIdx++;
    }
    // Only right chars remaining - additions
    else if (rightIdx < rightChars.length) {
      if (unchangedBuffer) {
        changes.push({
          type: 'unchanged',
          leftContent: unchangedBuffer,
          rightContent: unchangedBuffer,
        });
        stats.unchanged++;
        unchangedBuffer = '';
      }
      rightBuffer += rightChar;
      rightIdx++;
    }
  }

  flushBuffers();

  return { changes, stats };
};

/**
 * Compute Longest Common Subsequence (LCS) using dynamic programming
 * This is the foundation of the Myers diff algorithm
 */
function computeLCS<T>(left: T[], right: T[]): T[] {
  const m = left.length;
  const n = right.length;

  // Create DP table
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (left[i - 1] === right[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: T[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      lcs.unshift(left[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}
