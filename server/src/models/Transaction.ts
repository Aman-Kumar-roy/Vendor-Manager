import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  sellerId: Types.ObjectId;
  parentId?: Types.ObjectId;
  type: 'DELIVERY' | 'PAYMENT';
  amount: number;
  date: Date;
  note?: string;
  tank500: number;
  tank1000: number;
  tank2000: number;
  paymentMode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Transaction', default: null, index: true },
    type: { type: String, enum: ['DELIVERY', 'PAYMENT'], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: null },
    tank500: { type: Number, default: 0 },
    tank1000: { type: Number, default: 0 },
    tank2000: { type: Number, default: 0 },
    paymentMode: { type: String, default: null },
  },
  { timestamps: true }
);

export const TransactionModel = mongoose.model<ITransaction>('Transaction', TransactionSchema);
