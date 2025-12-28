/**
 * Parse markdown tables and convert to HTML
 */
export function parseMarkdownTables(text: string): { type: 'text' | 'table'; content: string | string[][] }[] {
  const lines = text.split('\n');
  const result: { type: 'text' | 'table'; content: string | string[][] }[] = [];
  let currentText: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if this line starts a markdown table (contains |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // Save any accumulated text
      if (currentText.length > 0) {
        result.push({ type: 'text', content: currentText.join('\n') });
        currentText = [];
      }

      // Parse the table
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      // Convert table lines to 2D array
      const tableData = tableLines
        .filter(line => !line.match(/^\s*\|[\s\-:]+\|\s*$/)) // Skip separator lines (|---|---|)
        .map(line => {
          return line
            .split('|')
            .slice(1, -1) // Remove first and last empty elements
            .map(cell => cell.trim());
        });

      if (tableData.length > 0) {
        result.push({ type: 'table', content: tableData });
      }
      continue;
    }

    // Regular text line
    currentText.push(line);
    i++;
  }

  // Add any remaining text
  if (currentText.length > 0) {
    result.push({ type: 'text', content: currentText.join('\n') });
  }

  return result;
}

/**
 * Check if text contains markdown tables
 */
export function hasMarkdownTable(text: string): boolean {
  const lines = text.split('\n');
  return lines.some(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length > 2;
  });
}
