import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
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
    paymentNumber: { type: String, required: true, unique: true },
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

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
