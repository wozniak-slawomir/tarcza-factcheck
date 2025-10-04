export interface OpenAIServiceInterface {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  prompt(prompt: string): Promise<string>;
}