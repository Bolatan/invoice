import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  organizationId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  date: Date;
  dueDate: Date;
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  isRecurring: boolean;
  recurringInterval?: 'monthly' | 'weekly' | 'yearly';
  nextOccurrence?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    date: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        rate: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    notes: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ['weekly', 'monthly', 'yearly'] },
    nextOccurrence: { type: Date },
  },
  { timestamps: true }
);

InvoiceSchema.index({ invoiceNumber: 1, organizationId: 1 }, { unique: true });

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
