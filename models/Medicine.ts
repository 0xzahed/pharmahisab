import mongoose, { Schema } from "mongoose";

const MedicineSchema = new Schema(
  {
    name: { type: String, required: true },
    company: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 10 },
    expiryDate: { type: String, default: "" }, // YYYY-MM-DD
    buyPrice: { type: Number, default: 0 },
    sellPrice: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export const Medicine = mongoose.models.Medicine ?? mongoose.model("Medicine", MedicineSchema);
