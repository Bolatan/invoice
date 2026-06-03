import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  company?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    company: { type: String },
  },
  { timestamps: true }
);

CustomerSchema.index({ organizationId: 1, email: 1 }, { unique: true });

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
