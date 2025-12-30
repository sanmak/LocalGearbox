/**
 * CSV Parser - RFC 4180 compliant parser with auto-detection
 */

import type { ParsedCSV, ParseOptions, ParseError, ParseState } from './csv-types';
import { detectDelimiter } from './csv-heuristics';
import { buildSchema } from './csv-schema';

/**
 * Parse CSV string into structured data
 */
export function parseCSV(csvString: string, options: ParseOptions = {}): ParsedCSV {
  // Remove UTF-8 BOM if present
  const cleanedCsv = csvString.startsWith('\uFEFF') ? csvString.slice(1) : csvString;

  // Detect delimiter if not specified
  const delimiter =
    options.delimiter === 'auto' || !options.delimiter
      ? detectDelimiter(cleanedCsv)[0]?.delimiter || ','
      : options.delimiter;

  const quoteChar = options.quoteChar || '"';

  // Parse rows
  const { rows, errors } = parseRows(cleanedCsv, delimiter, quoteChar);

  if (rows.length === 0) {
    return {
      rows: [],
      schema: { columns: [] },
      metadata: {
        delimiter,
        quoteChar,
        rowCount: 0,
        columnCount: 0,
        hasHeader: false,
        encoding: 'utf-8',
      },
      errors,
    };
  }

  // Build schema (includes header detection)
  const schema = buildSchema(rows, options.hasHeader);

  // Calculate metadata
  const columnCount = Math.max(...rows.map((row) => row.length));
  const hasHeader = schema.headerRow !== undefined;

  return {
    rows,
    schema,
    metadata: {
      delimiter,
      quoteChar,
      rowCount: rows.length,
      columnCount,
      hasHeader,
      encoding: 'utf-8',
    },
    errors,
  };
}

/**
 * Parse CSV string into rows using state machine
 */
function parseRows(
  csv: string,
  delimiter: string,
  quoteChar: string,
): { rows: string[][]; errors: ParseError[] } {
  const rows: string[][] = [];
  const errors: ParseError[] = [];

  let currentRow: string[] = [];
  let currentField = '';
  let state: ParseState = 0; // START_FIELD = 0
  let rowNumber = 0;
  let colNumber = 0;

  // Normalize line endings
  const normalizedCsv = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalizedCsv.length; i++) {
    const char = normalizedCsv[i];
    const nextChar = normalizedCsv[i + 1];

    switch (state) {
      case 0: // START_FIELD
        colNumber++;
        if (char === quoteChar) {
          state = 2; // IN_QUOTED_FIELD
        } else if (char === delimiter) {
          currentRow.push('');
        } else if (char === '\n') {
          if (currentField || currentRow.length > 0) {
            currentRow.push(currentField);
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
            rowNumber++;
            colNumber = 0;
          }
          // Skip empty lines
        } else {
          currentField = char;
          state = 1; // IN_FIELD
        }
        break;

      case 1: // IN_FIELD
        if (char === delimiter) {
          currentRow.push(currentField);
          currentField = '';
          state = 0; // START_FIELD
        } else if (char === '\n') {
          currentRow.push(currentField);
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
          rowNumber++;
          colNumber = 0;
          state = 0; // START_FIELD
        } else {
          currentField += char;
        }
        break;

      case 2: // IN_QUOTED_FIELD
        if (char === quoteChar) {
          if (nextChar === quoteChar) {
            // Escaped quote
            currentField += quoteChar;
            i++; // Skip next quote
          } else {
            state = 3; // QUOTE_IN_QUOTED_FIELD
          }
        } else {
          currentField += char;
        }
        break;

      case 3: // QUOTE_IN_QUOTED_FIELD
        if (char === delimiter) {
          currentRow.push(currentField);
          currentField = '';
          state = 0; // START_FIELD
        } else if (char === '\n') {
          currentRow.push(currentField);
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
          rowNumber++;
          colNumber = 0;
          state = 0; // START_FIELD
        } else if (char === quoteChar) {
          // Invalid: quote after closing quote
          errors.push({
            row: rowNumber,
            col: colNumber,
            message: 'Unexpected quote after closing quote',
            severity: 'warning',
          });
          currentField += char;
          state = 2; // IN_QUOTED_FIELD (recovery)
        } else if (char.trim() === '') {
          // Ignore whitespace after closing quote
        } else {
          // Invalid: content after closing quote
          errors.push({
            row: rowNumber,
            col: colNumber,
            message: 'Unexpected content after closing quote',
            severity: 'warning',
          });
          currentField += char;
          state = 1; // IN_FIELD (recovery)
        }
        break;
    }
  }

  // Handle final field/row
  if (currentField || currentRow.length > 0 || state === 3) {
    currentRow.push(currentField);
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return { rows, errors };
}

/**
 * Format row back to CSV string
 */
export function formatRow(row: string[], delimiter: string = ',', quoteChar: string = '"'): string {
  return row
    .map((cell) => {
      // Quote if contains delimiter, newline, or quote
      if (cell.includes(delimiter) || cell.includes('\n') || cell.includes(quoteChar)) {
        // Escape quotes by doubling them
        const escaped = cell.replace(new RegExp(quoteChar, 'g'), quoteChar + quoteChar);
        return `${quoteChar}${escaped}${quoteChar}`;
      }
      return cell;
    })
    .join(delimiter);
}
