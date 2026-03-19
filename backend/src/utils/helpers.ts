import { v4 as uuidv4 } from 'uuid';

export function generateCode(prefix: string): string {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${random}`;
}

export function getPaginationParams(query: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20')));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}
