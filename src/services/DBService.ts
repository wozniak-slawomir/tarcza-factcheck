import { MongoDBService } from './MongoDBService';

export interface DBService {
  getAllKeywords(): Promise<string[]>;
  addKeyword(keyword: string): Promise<void>;
  deleteKeyword(id: string): Promise<void>;
  getKeywordsForDisplay(): Promise<Array<{ id: string; keyword: string }>>;
  evaluateText(text: string): Promise<boolean>;
}

let dbServiceInstance: DBService | null = null;

export function getDBService(): DBService {
  if (!dbServiceInstance) {
    dbServiceInstance = new MongoDBService();
  }
  return dbServiceInstance;
}
