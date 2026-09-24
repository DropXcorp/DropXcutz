"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useERPStore, type Customer } from "@/src/lib/erp-store";

const field =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30";
const label = "mb-1.5 block text-xs font-semibold text-foreground/80";

export default function CustomerEditDialog({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={customer !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {customer && <EditForm key={customer.id} customer={customer} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { customers, updateCustomer } = useERPStore();
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const phone = String(form.get("phone")).trim();
    const digits = phone.replace(/\s+/g, "");
    if (customers.some((item) => item.id !== customer.id && item.phone.replace(/\s+/g, "") === digits)) {
      setProblem("Another customer already uses this phone number.");
      return;
    }
    setProblem("");
    setSaving(true);
    await updateCustomer(customer.id, {
      name,
      phone,
      email: String(form.get("email") || "").trim() || null,
      membership: form.get("membership") as Customer["membership"],
      notes: String(form.get("notes") || "").trim() || null,
    });
    setSaving(false);
    if (!useERPStore.getState().error) onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit customer</DialogTitle>
        <DialogDescription>Update contact details, membership tier and notes.</DialogDescription>
      </DialogHeader>
      {problem && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {problem}
        </p>
      )}
      <div>
        <label className={label} htmlFor="cust-name">Full name *</label>
        <input id="cust-name" required name="name" defaultValue={customer.name} className={field} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="cust-phone">Phone *</label>
          <input id="cust-phone" required type="tel" minLength={5} name="phone" defaultValue={customer.phone} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="cust-tier">Tier</label>
          <select id="cust-tier" name="membership" defaultValue={customer.membership} className={field}>
            <option value="Standard">Standard</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
          </select>
        </div>
      </div>
      <div>
        <label className={label} htmlFor="cust-email">Email</label>
        <input id="cust-email" type="email" name="email" defaultValue={customer.email ?? ""} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="cust-notes">Notes</label>
        <textarea
          id="cust-notes"
          name="notes"
          defaultValue={customer.notes ?? ""}
          placeholder="Allergies, preferences, anything staff should know"
          className={`${field} h-auto min-h-20 py-2`}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
