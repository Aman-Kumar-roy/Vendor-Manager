import mongoose, { Schema, Document } from 'mongoose';

export interface ISeller extends Document {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SellerSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true },
    phone: { type: String, default: null, trim: true },
    address: { type: String, default: null, trim: true },
    gstNumber: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

// Performance & Search Indexes
SellerSchema.index({ createdAt: -1 });
SellerSchema.index({ name: 1 });
SellerSchema.index({ phone: 1 });
SellerSchema.index({ email: 1 });
SellerSchema.index({ gstNumber: 1 });

export const SellerModel = mongoose.model<ISeller>('Seller', SellerSchema);
