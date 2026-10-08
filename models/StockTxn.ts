import mongoose, { Schema } from "mongoose";

const StockTxnSchema = new Schema(
  {
    medicineId: { type: String, required: true, index: true },
    kind: { type: String, enum: ["in", "out"], required: true },
    qty: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const StockTxn = mongoose.models.StockTxn ?? mongoose.model("StockTxn", StockTxnSchema);
