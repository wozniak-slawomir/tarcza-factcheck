import mongoose, { Schema, Document } from 'mongoose';

interface IKeyword extends Document {
  keyword: string;
}

const KeywordSchema = new Schema({
  keyword: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Keyword || mongoose.model<IKeyword>('Keyword', KeywordSchema);
