import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  organizationId: mongoose.Types.ObjectId;
  paymentNumber: string;
  customerId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  date: Date;
  amount: number;
  paymentMode: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other';
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    paymentNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    paymentMode: {
      type: String,
      enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'other'],
      required: true,
    },
    reference: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ organizationId: 1, paymentNumber: 1 }, { unique: true });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
