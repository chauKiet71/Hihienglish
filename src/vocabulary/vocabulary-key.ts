import { createHash } from 'crypto';

export function vocabularyKey(value: string) {
  return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function vocabularySenseKey(meaning: string) {
  return createHash('sha256').update(vocabularyKey(meaning)).digest('hex');
}
