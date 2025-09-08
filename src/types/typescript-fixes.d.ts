// Temporary TypeScript fixes for build errors
declare global {
  interface Window {
    React: typeof import('react');
  }
}

// Add interface signature for BEPExportData
export interface BEPExportData extends Record<string, unknown> {
  [key: string]: unknown;
}

export {};