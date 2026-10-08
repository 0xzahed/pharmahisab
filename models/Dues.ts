import mongoose, { Schema } from "mongoose";

const DueCustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const DueCustomer =
  mongoose.models.DueCustomer ?? mongoose.model("DueCustomer", DueCustomerSchema);

const DueTxnSchema = new Schema(
  {
    customerId: { type: String, required: true, index: true },
    kind: { type: String, enum: ["due", "payment"], required: true },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const DueTxn = mongoose.models.DueTxn ?? mongoose.model("DueTxn", DueTxnSchema);
