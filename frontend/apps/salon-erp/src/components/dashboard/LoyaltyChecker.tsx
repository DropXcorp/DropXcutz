"use client";

import { useState } from "react";
import { Gift, Search, Star } from "lucide-react";
import { useERPStore } from "@/src/lib/erp-store";

export default function LoyaltyChecker() {
  const customers = useERPStore((state) => state.customers);
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState("");
  const customer = query
    ? customers.find((item) =>
        item.phone.replace(/\s/g, "").includes(query.replace(/\s/g, "")),
      )
    : undefined;
  return (
    <section className="flex h-[560px] flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-foreground">
            Loyalty Points
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Search customer using phone number
        </p>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(phone.trim());
          }}
          className="flex gap-3"
        >
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="search"
            placeholder="Enter phone number"
            className="min-w-0 flex-1 rounded-xl border border-border px-4 py-3 outline-none transition focus:border-black"
          />
          <button className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-white transition hover:bg-primary/90">
            <Search size={18} />
            Search
          </button>
        </form>
        {query && !customer && (
          <p className="rounded-xl bg-muted/60 p-5 text-sm text-muted-foreground">
            No customer found with that phone number.
          </p>
        )}
        {customer && (
          <div className="rounded-2xl border border-border bg-muted/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {customer.name}
                </h3>
                <p className="text-sm text-muted-foreground">{customer.phone}</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-card p-4">
                <p className="text-sm text-muted-foreground">Available Points</p>
                <h2 className="mt-2 text-3xl font-bold">
                  {customer.points.toLocaleString("en-IN")}
                </h2>
              </div>
              <div className="rounded-xl bg-card p-4">
                <p className="text-sm text-muted-foreground">Redeem Value</p>
                <h2 className="mt-2 text-3xl font-bold text-green-600">
                  ₹{(customer.points / 2).toLocaleString("en-IN")}
                </h2>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
