"use client";

import { useMemo, useState } from "react";
import {
  CreditCard,
  IndianRupee,
  Percent,
  Receipt,
} from "lucide-react";

export default function PaymentSection() {
  const subtotal = 1550;

  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [advance, setAdvance] = useState(500);

  const payable = useMemo(() => {
    return Math.max(subtotal - discount, 0);
  }, [subtotal, discount]);

  const balance = useMemo(() => {
    return Math.max(payable - advance, 0);
  }, [payable, advance]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">

      {/* Header */}

      <div className="border-b border-zinc-200 px-5 py-4">

        <h3 className="text-lg font-semibold text-zinc-900">
          Payment Details
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Configure payment information for this appointment.
        </p>

      </div>

      <div className="grid gap-5 p-5 md:grid-cols-2">

        {/* Payment Status */}

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Payment Status
          </label>

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 outline-none focus:border-black"
          >
            <option>Pending</option>
            <option>Partial</option>
            <option>Paid</option>
          </select>

        </div>

        {/* Payment Method */}

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Payment Method
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4">

            <CreditCard className="h-5 w-5 text-zinc-500" />

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-12 w-full bg-transparent outline-none"
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Wallet</option>
              <option>Bank Transfer</option>
            </select>

          </div>

        </div>

        {/* Discount */}

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Discount
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4">

            <Percent className="h-5 w-5 text-zinc-500" />

            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="h-12 w-full bg-transparent outline-none"
              placeholder="0"
            />

          </div>

        </div>

        {/* Advance */}

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Advance Paid
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4">

            <IndianRupee className="h-5 w-5 text-zinc-500" />

            <input
              type="number"
              value={advance}
              onChange={(e) => setAdvance(Number(e.target.value))}
              className="h-12 w-full bg-transparent outline-none"
            />

          </div>

        </div>

      </div>

      {/* Summary */}

      <div className="border-t border-zinc-200 bg-zinc-50 p-5">

        <div className="space-y-3">

          <SummaryRow
            label="Subtotal"
            value={`₹${subtotal}`}
          />

          <SummaryRow
            label="Discount"
            value={`₹${discount}`}
          />

          <SummaryRow
            label="Payable"
            value={`₹${payable}`}
            bold
          />

          <SummaryRow
            label="Advance Paid"
            value={`₹${advance}`}
          />

          <SummaryRow
            label="Remaining Balance"
            value={`₹${balance}`}
            highlight
          />

        </div>

      </div>

      {/* Coupon */}

      <div className="border-t border-zinc-200 p-5">

        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">

          <Receipt className="h-4 w-4" />

          Coupon Code

        </label>

        <div className="flex gap-3">

          <input
            placeholder="Enter coupon"
            className="h-12 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 outline-none focus:border-black"
          />

          <button className="rounded-xl bg-black px-5 text-sm font-medium text-white hover:bg-zinc-800">
            Apply
          </button>

        </div>

      </div>

    </section>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}

function SummaryRow({
  label,
  value,
  bold,
  highlight,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between">

      <span className="text-sm text-zinc-600">
        {label}
      </span>

      <span
        className={`${
          highlight
            ? "text-lg font-bold text-green-600"
            : bold
            ? "font-semibold text-zinc-900"
            : "font-medium text-zinc-800"
        }`}
      >
        {value}
      </span>

    </div>
  );
}
