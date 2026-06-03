import mongoose, { Schema, Document } from 'mongoose';

export interface IProposal extends Document {
  proposalNumber: string;
  organizationId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  title: string;
  date: Date;
  expiryDate?: Date;
  content: string;
  items: {
    description: string;
    amount: number;
  }[];
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema<IProposal>(
  {
    proposalNumber: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    title: { type: String, required: true },
    date: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    content: { type: String },
    items: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'declined'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

ProposalSchema.index({ proposalNumber: 1, organizationId: 1 }, { unique: true });

export default mongoose.models.Proposal || mongoose.model<IProposal>('Proposal', ProposalSchema);
