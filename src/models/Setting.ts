import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  organizationId: mongoose.Types.ObjectId;
  organizationName: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  currency: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
    organizationName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    taxId: { type: String },
    currency: { type: String, default: 'NGN' },
    logoUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
