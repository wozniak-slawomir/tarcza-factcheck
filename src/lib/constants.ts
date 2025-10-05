/**
 * Próg podobieństwa do flagowania tekstów jako potencjalnie problematyczne.
 * Wartość od 0 do 1, gdzie 1 oznacza identyczne teksty.
 */
export const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.5');

/**
 * Próg podobieństwa dla wykrywania dokładnych duplikatów.
 * Wartość od 0 do 1, gdzie 1 oznacza identyczne teksty.
 */
export const EXACT_DUPLICATE_THRESHOLD = parseFloat(process.env.EXACT_DUPLICATE_THRESHOLD || '0.9999');

/**
 * Rozmiar embeddingu OpenAI (text-embedding-3-small)
 */
export const OPENAI_EMBEDDING_SIZE = parseInt(process.env.OPENAI_EMBEDDING_SIZE || '1536');

/**
 * Model OpenAI do embeddings
 */
export const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

/**
 * Model OpenAI do chat completions
 */
export const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
