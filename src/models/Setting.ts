import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  organizationName: string;
  email: string;
  address: string;
  phone: string;
  taxId?: string;
  currency: string;
  logoUrl?: string;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    organizationName: { type: String, required: true, default: 'My Organization' },
    email: { type: String, required: true, default: 'admin@example.com' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    taxId: { type: String, default: '' },
    currency: { type: String, required: true, default: 'NGN' },
    logoUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
