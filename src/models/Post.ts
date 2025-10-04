import mongoose, { Schema, Document } from 'mongoose';

interface IPost extends Document {
  text: string;
}

const PostSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
