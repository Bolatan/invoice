import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  organizationId: mongoose.Types.ObjectId;
  date: Date;
  category: string;
  amount: number;
  vendor?: string;
  description?: string;
  customerId?: mongoose.Types.ObjectId; // Optional: link expense to a customer project
  receiptUrl?: string; // For GridFS storage
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    date: { type: Date, default: Date.now },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    vendor: { type: String },
    description: { type: String },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
