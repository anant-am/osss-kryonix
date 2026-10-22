/**
 * CRISP-L Measurement & Metric Unit Formatters
 * Strict scientific unit conversion and display utilities.
 */

export const formatDurationMs = (ms: number, precision: number = 2): string => {
  if (ms === undefined || ms === null || isNaN(ms)) return '0.00 ms';
  if (ms < 0.001) return `${(ms * 1000).toFixed(precision)} µs`;
  if (ms < 1.0) return `${ms.toFixed(precision)} ms`;
  if (ms < 1000) return `${ms.toFixed(precision)} ms`;
  return `${(ms / 1000).toFixed(precision)} s`;
};

export const formatDurationUs = (us: number): string => {
  if (us === undefined || us === null || isNaN(us)) return '0 µs';
  if (us < 1000) return `${us.toFixed(0)} µs`;
  if (us < 1000000) return `${(us / 1000).toFixed(2)} ms`;
  return `${(us / 1000000).toFixed(2)} s`;
};

export const formatBytes = (bytes: number, precision: number = 1): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(precision))} ${sizes[i]}`;
};

export const formatPagesToKb = (pages: number): string => {
  if (pages === undefined || pages === null || isNaN(pages)) return '0 KB';
  return `${(pages * 4).toLocaleString()} KB (${pages.toLocaleString()} pages)`;
};

export const formatThroughput = (opsSec: number): string => {
  if (opsSec === undefined || opsSec === null || isNaN(opsSec)) return '0 ops/s';
  return `${opsSec.toLocaleString(undefined, { maximumFractionDigits: 1 })} ops/s`;
};

export const formatPercentage = (val: number, precision: number = 1): string => {
  if (val === undefined || val === null || isNaN(val)) return '0.0%';
  return `${val.toFixed(precision)}%`;
};

export const formatSpeedupFactor = (factor: number): string => {
  if (factor === undefined || factor === null || isNaN(factor)) return '1.0×';
  return `${factor.toFixed(1)}×`;
};
