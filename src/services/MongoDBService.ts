import { DBService } from './DBService';
import connectDB from '@/lib/db/mongodb';
import Keyword from '@/models/Keyword';

export class MongoDBService implements DBService {
  async getAllKeywords(): Promise<string[]> {
    await connectDB();
    const keywords = await Keyword.find({}, { keyword: 1 }).lean();
    return keywords.map(k => k.keyword);
  }

  async addKeyword(keyword: string): Promise<void> {
    await connectDB();
    await Keyword.create({ keyword: keyword.trim() });
  }

  async deleteKeyword(id: string): Promise<void> {
    await connectDB();
    const result = await Keyword.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Keyword not found');
    }
  }

  async getKeywordsForDisplay(): Promise<Array<{ id: string; keyword: string }>> {
    await connectDB();
    const keywords = await Keyword.find({}).sort({ createdAt: -1 });
    return keywords.map(k => ({
      id: (k as any)._id.toString(),
      keyword: k.keyword,
    }));
  }

  async evaluateText(text: string): Promise<boolean> {
    const keywords = await this.getAllKeywords();
    const normalizedText = text.toLowerCase();
    return keywords.some(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    );
  }
}
