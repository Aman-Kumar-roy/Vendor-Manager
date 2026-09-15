import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITankItem {
  size: 500 | 1000;
  quantity: number;
  layers: number;
  foam?: 'none' | 'single' | 'double';
}

export interface ITransaction extends Document {
  sellerId: Types.ObjectId;
  parentId?: Types.ObjectId;
  type: 'DELIVERY' | 'PAYMENT';
  amount: number;
  date: Date;
  note?: string;
  tankItems?: ITankItem[];
  tank500: number;
  tank1000: number;
  tank500_layers?: number | null;
  tank1000_layers?: number | null;
  tank1000_foam?: 'none' | 'single' | 'double';
  previousDues?: number;
  currentDues?: number;
  paymentMode?: string;
  whatsappStatus?: 'pending' | 'sent' | 'failed' | 'skipped';
  whatsappMessageId?: string;
  whatsappSentAt?: Date;
  whatsappError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TankItemSchema: Schema = new Schema(
  {
    size: { type: Number, enum: [500, 1000], required: true },
    quantity: { type: Number, required: true, min: 1 },
    layers: { type: Number, required: true, min: 3, max: 6 },
    foam: { type: String, enum: ['none', 'single', 'double'], default: 'none' },
  },
  { _id: false }
);

const TransactionSchema: Schema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Transaction', default: null, index: true },
    type: { type: String, enum: ['DELIVERY', 'PAYMENT'], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: null },
    tankItems: { type: [TankItemSchema], default: undefined },
    tank500: { type: Number, default: 0 },
    tank1000: { type: Number, default: 0 },
    tank500_layers: { type: Number, min: 3, max: 6, default: null },
    tank1000_layers: { type: Number, min: 3, max: 6, default: null },
    tank1000_foam: { type: String, enum: ['none', 'single', 'double'], default: 'none' },
    previousDues: { type: Number, default: 0 },
    paymentMode: { type: String, default: null },
    whatsappStatus: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: undefined },
    whatsappMessageId: { type: String, default: null },
    whatsappSentAt: { type: Date, default: null },
    whatsappError: { type: String, default: null },
  },
  { timestamps: true }
);

// Performance & Compound Indexes
TransactionSchema.index({ sellerId: 1, date: -1, createdAt: -1 });
TransactionSchema.index({ type: 1, date: -1, createdAt: -1 });
TransactionSchema.index({ date: -1, createdAt: -1 });
TransactionSchema.index({ parentId: 1, type: 1 });
TransactionSchema.index({ createdAt: -1 });

export const TransactionModel = mongoose.model<ITransaction>('Transaction', TransactionSchema);
