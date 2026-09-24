"use client";
/* eslint-disable react-hooks/set-state-in-effect, @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useERPStore, erpApi } from "@/src/lib/erp-store";

export type PhaseTwoModule = "service-setup" | "leave" | "payments" | "marketing" | "time-slots" | "audit-log";
type Item = Record<string, unknown> & { id: string };

const input =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:opacity-50";
const textarea = `${input} h-auto min-h-20 py-2`;
const panel = "rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border";
const primary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50";
const subtle =
  "inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-foreground/80 transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50";
const danger = "text-sm font-medium text-destructive transition hover:underline disabled:opacity-50";

const list = <T,>(value: unknown) => (Array.isArray(value) ? (value as T[]) : ((value as { data?: T[] })?.data ?? []));
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const notify = {
  ok: (message: string) => useERPStore.setState({ successMessage: message, error: null }),
  fail: (cause: unknown) =>
    useERPStore.setState({ error: cause instanceof Error ? cause.message : "Something went wrong. Please try again." }),
};

/** Runs an async action, reporting success/failure as toasts instead of crashing the page. */
function useAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    try {
      await action();
      if (success) notify.ok(success);
      return true;
    } catch (cause) {
      notify.fail(cause);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, run };
}

/** Loads a list; failures become a toast, never an uncaught error. */
function useList(path: string | null) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(Boolean(path));
  const reload = useCallback(async () => {
    if (!path) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(list<Item>(await erpApi(path)));
    } catch (cause) {
      notify.fail(cause);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { items, loading, reload };
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

function Loading() {
  return (
    <div className="space-y-2 py-2" role="status" aria-label="Loading">
      {[1, 2, 3].map((row) => (
        <div key={row} className="h-12 animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const tone: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-muted text-muted-foreground",
    REFUNDED: "bg-violet-100 text-violet-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    PAID: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone[value] ?? "bg-muted text-foreground/70"}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}

function ConfirmAction({
  label,
  title,
  description,
  confirmLabel,
  disabled,
  onConfirm,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  disabled?: boolean;
  onConfirm: () => Promise<unknown> | void;
}) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  return (
    <>
      <button type="button" disabled={disabled} onClick={() => setOpen(true)} className={danger}>
        {label}
      </button>
      <AlertDialog open={open} onOpenChange={(next) => !working && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" disabled={working} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={working}
              onClick={async () => {
                setWorking(true);
                try {
                  await onConfirm();
                } finally {
                  setWorking(false);
                  setOpen(false);
                }
              }}
            >
              {working ? "Working…" : confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const titles: Record<PhaseTwoModule, [string, string]> = {
  "service-setup": ["Service setup", "Organize services and assign staff skills."],
  leave: ["Leave requests", "Apply, approve, reject, or cancel staff leave."],
  payments: ["Payments & refunds", "Record collections and refund completed payments."],
  marketing: ["Offers & gallery", "Manage promotions and website gallery images."],
  "time-slots": ["Time slots", "Create and block online-booking capacity by branch."],
  "audit-log": ["Audit log", "Review salon administration activity."],
};

export default function PhaseTwoConsole({ module }: { module: PhaseTwoModule }) {
  const [title, subtitle] = titles[module];
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className={panel}>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </header>
      {module === "service-setup" && <ServiceSetup />}
      {module === "leave" && <LeaveRequests />}
      {module === "payments" && <Payments />}
      {module === "marketing" && <Marketing />}
      {module === "time-slots" && <TimeSlots />}
      {module === "audit-log" && <AuditLog />}
    </div>
  );
}

function ServiceSetup() {
  const { employees, services } = useERPStore();
  const categories = useList("/service-categories");
  const [employeeId, setEmployeeId] = useState("");
  const skills = useList(employeeId ? `/employee-services/employees/${employeeId}` : null);
  const { busy, run } = useAction();

  const addCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const ok = await run(
      () => erpApi("/service-categories", { method: "POST", body: JSON.stringify({ name: String(form.get("name")).trim(), description: form.get("description") || null }) }),
      "Category added.",
    );
    if (ok) {
      formEl.reset();
      await categories.reload();
    }
  };
  const toggleSkill = async (serviceId: string, assigned: boolean) => {
    const ok = await run(() =>
      erpApi(assigned ? `/employee-services/${employeeId}/${serviceId}` : "/employee-services", {
        method: assigned ? "DELETE" : "POST",
        body: assigned ? undefined : JSON.stringify({ employeeId, serviceId }),
      }),
    );
    if (ok) await skills.reload();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={panel}>
        <h2 className="font-semibold">Service categories</h2>
        <form className="mt-4 grid gap-2" onSubmit={addCategory}>
          <input required name="name" placeholder="Hair, Skin, Spa…" className={input} />
          <input name="description" placeholder="Optional description" className={input} />
          <button disabled={busy} className={primary}>Add category</button>
        </form>
        <div className="mt-4 space-y-2">
          {categories.loading ? (
            <Loading />
          ) : categories.items.length === 0 ? (
            <Empty text="No categories yet." />
          ) : (
            categories.items.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                <span>
                  <b>{String(category.name)}</b>
                  <span className="ml-2 text-muted-foreground">{String(category.serviceCount ?? 0)} services</span>
                </span>
                <ConfirmAction
                  label="Delete"
                  title="Delete this category?"
                  description="Services in this category will no longer be grouped under it."
                  confirmLabel="Delete"
                  onConfirm={async () => {
                    if (await run(() => erpApi(`/service-categories/${category.id}`, { method: "DELETE" }), "Category deleted.")) await categories.reload();
                  }}
                />
              </div>
            ))
          )}
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-semibold">Staff service skills</h2>
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={`mt-4 ${input}`} aria-label="Employee">
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>{employee.name}</option>
          ))}
        </select>
        {employeeId &&
          (skills.loading ? (
            <div className="mt-4"><Loading /></div>
          ) : services.length === 0 ? (
            <Empty text="Add services first from the Services page." />
          ) : (
            <div className="mt-4 space-y-2">
              {services.map((service) => {
                const assigned = skills.items.some((skill) => skill.id === service.id);
                return (
                  <label key={service.id} className="flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm transition hover:bg-muted/40">
                    <span>{service.name}</span>
                    <input type="checkbox" className="size-4 accent-primary" disabled={busy} checked={assigned} onChange={() => void toggleSkill(service.id, assigned)} />
                  </label>
                );
              })}
            </div>
          ))}
      </section>
    </div>
  );
}

function LeaveRequests() {
  const { employees } = useERPStore();
  const leave = useList("/leave-requests?limit=100");
  const { busy, run } = useAction();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const startDate = String(form.get("startDate"));
    const endDate = String(form.get("endDate"));
    if (endDate < startDate) {
      notify.fail(new Error("End date must be on or after the start date."));
      return;
    }
    const ok = await run(
      () => erpApi("/leave-requests", { method: "POST", body: JSON.stringify({ employeeId: form.get("employeeId"), startDate, endDate, reason: form.get("reason") || null }) }),
      "Leave request submitted.",
    );
    if (ok) {
      formEl.reset();
      await leave.reload();
    }
  };
  const changeStatus = async (id: string, status: string) => {
    if (await run(() => erpApi(`/leave-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }), `Leave ${status.toLowerCase()}.`)) await leave.reload();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form className={panel} onSubmit={submit}>
        <h2 className="font-semibold">New leave request</h2>
        <p className="mt-1 text-sm text-muted-foreground">Submit one request per employee and date range.</p>
        <div className="mt-4 space-y-3">
          <select required name="employeeId" className={input} aria-label="Employee">
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">From<input required type="date" name="startDate" defaultValue={today()} className={`mt-1 ${input}`} /></label>
            <label className="text-xs text-muted-foreground">To<input required type="date" name="endDate" defaultValue={today()} className={`mt-1 ${input}`} /></label>
          </div>
          <textarea name="reason" placeholder="Reason (optional)" className={textarea} />
          <button disabled={busy} type="submit" className={`${primary} w-full`}>{busy ? "Saving…" : "Submit leave"}</button>
        </div>
      </form>
      <section className={panel}>
        <h2 className="font-semibold">Requests</h2>
        <div className="mt-4 space-y-3">
          {leave.loading ? (
            <Loading />
          ) : leave.items.length === 0 ? (
            <Empty text="No leave requests yet." />
          ) : (
            leave.items.map((item) => (
              <article key={item.id} className="rounded-xl border p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <b>{String(item.employeeName)}</b>
                  <StatusPill value={String(item.status)} />
                </div>
                <p className="mt-1 text-muted-foreground">{String(item.startDate).slice(0, 10)} to {String(item.endDate).slice(0, 10)}</p>
                <p className="mt-1">{String(item.reason ?? "No reason supplied")}</p>
                {item.status === "PENDING" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["APPROVED", "REJECTED", "CANCELLED"].map((status) => (
                      <button type="button" disabled={busy} key={status} onClick={() => void changeStatus(item.id, status)} className={subtle}>
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Payments() {
  const { invoices, customers } = useERPStore();
  const payments = useList("/payments");
  const { busy, run } = useAction();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const invoiceId = String(form.get("invoiceId") || "");
    const customerId = String(form.get("customerId") || "");
    if (!invoiceId && !customerId) {
      notify.fail(new Error("Choose an invoice or a customer for this payment."));
      return;
    }
    const ok = await run(
      () => erpApi("/payments", { method: "POST", body: JSON.stringify({ invoiceId: invoiceId || null, customerId: customerId || null, amount: Number(form.get("amount")), method: form.get("method"), transactionId: form.get("transactionId") || null }) }),
      "Payment recorded.",
    );
    if (ok) {
      formEl.reset();
      await payments.reload();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form className={panel} onSubmit={submit}>
        <h2 className="font-semibold">Record payment</h2>
        <div className="mt-4 space-y-3">
          <select name="invoiceId" className={input} aria-label="Invoice">
            <option value="">No invoice</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber ?? invoice.id} · ₹{invoice.amount}</option>
            ))}
          </select>
          <select name="customerId" className={input} aria-label="Customer">
            <option value="">No customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
          <input required type="number" min="1" step="0.01" name="amount" placeholder="Amount (₹)" className={input} />
          <select name="method" className={input} aria-label="Method">
            {["CASH", "CARD", "UPI", "WALLET", "ONLINE"].map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
          <input name="transactionId" placeholder="Transaction reference" className={input} />
          <button disabled={busy} className={`${primary} w-full`}>{busy ? "Saving…" : "Record payment"}</button>
        </div>
      </form>
      <section className={panel}>
        <h2 className="font-semibold">Payment ledger</h2>
        <div className="mt-4 space-y-2">
          {payments.loading ? (
            <Loading />
          ) : payments.items.length === 0 ? (
            <Empty text="No payments recorded yet." />
          ) : (
            payments.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                <span className="flex flex-wrap items-center gap-2">
                  <b className="tabular-nums">₹{String(item.amount)}</b>
                  <span className="text-muted-foreground">{String(item.method)}</span>
                  <StatusPill value={String(item.status)} />
                </span>
                {item.status !== "REFUNDED" && (
                  <ConfirmAction
                    label="Refund"
                    title="Refund this payment?"
                    description="The payment will be marked as refunded. This can't be undone."
                    confirmLabel="Refund"
                    onConfirm={async () => {
                      if (await run(() => erpApi(`/payments/${item.id}/refund`, { method: "POST" }), "Payment refunded.")) await payments.reload();
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Marketing() {
  const offers = useList("/offers");
  const gallery = useList("/gallery");
  const { busy, run } = useAction();

  const addOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const startDate = String(form.get("startDate"));
    const endDate = String(form.get("endDate"));
    if (endDate < startDate) {
      notify.fail(new Error("Offer end date must be on or after the start date."));
      return;
    }
    const discountType = String(form.get("discountType"));
    const discount = Number(form.get("discount"));
    if (discountType === "PERCENTAGE" && discount > 100) {
      notify.fail(new Error("A percentage discount can't exceed 100."));
      return;
    }
    const ok = await run(
      () => erpApi("/offers", { method: "POST", body: JSON.stringify({ title: form.get("title"), discount, discountType, startDate, endDate, description: form.get("description") || null, bannerImage: form.get("bannerImage") || null, isActive: true }) }),
      "Offer created.",
    );
    if (ok) {
      formEl.reset();
      await offers.reload();
    }
  };
  const addImage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const ok = await run(() => erpApi("/gallery", { method: "POST", body: JSON.stringify({ imageUrl: form.get("imageUrl"), title: form.get("title") || null }) }), "Image added.");
    if (ok) {
      formEl.reset();
      await gallery.reload();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={panel}>
        <h2 className="font-semibold">Promotional offers</h2>
        <form className="mt-4 grid gap-2" onSubmit={addOffer}>
          <input required name="title" placeholder="Festival special" className={input} />
          <div className="grid grid-cols-2 gap-2">
            <input required type="number" min="1" step="0.01" name="discount" placeholder="Discount" className={input} />
            <select name="discountType" className={input} aria-label="Discount type">
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input required type="date" name="startDate" defaultValue={today()} aria-label="Start date" className={input} />
            <input required type="date" name="endDate" defaultValue={today()} aria-label="End date" className={input} />
          </div>
          <input name="bannerImage" type="url" placeholder="Banner image URL (optional)" className={input} />
          <textarea name="description" placeholder="Offer details" className={textarea} />
          <button disabled={busy} className={primary}>Create offer</button>
        </form>
        <div className="mt-4 space-y-2">
          {offers.loading ? (
            <Loading />
          ) : offers.items.length === 0 ? (
            <Empty text="No offers yet." />
          ) : (
            offers.items.map((offer) => (
              <div key={offer.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                <span>
                  <b>{String(offer.title)}</b>
                  <span className="ml-2 text-muted-foreground">
                    {String(offer.discount)}{offer.discountType === "PERCENTAGE" ? "%" : " off"}
                  </span>
                </span>
                <ConfirmAction
                  label="Delete"
                  title="Delete this offer?"
                  description="Customers will no longer see this promotion."
                  confirmLabel="Delete"
                  onConfirm={async () => {
                    if (await run(() => erpApi(`/offers/${offer.id}`, { method: "DELETE" }), "Offer deleted.")) await offers.reload();
                  }}
                />
              </div>
            ))
          )}
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-semibold">Website gallery</h2>
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={addImage}>
          <input required type="url" name="imageUrl" placeholder="Image URL" className={input} />
          <input name="title" placeholder="Caption" className={input} />
          <button disabled={busy} className={primary}>Add</button>
        </form>
        {gallery.loading ? (
          <div className="mt-4"><Loading /></div>
        ) : gallery.items.length === 0 ? (
          <Empty text="No gallery images yet." />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {gallery.items.map((image) => (
              <figure key={image.id} className="overflow-hidden rounded-xl border">
                <img src={String(image.imageUrl)} alt={String(image.title ?? "Salon gallery")} className="h-28 w-full bg-muted object-cover" />
                <figcaption className="flex items-center justify-between gap-2 p-2 text-xs">
                  <span className="truncate">{String(image.title ?? "Untitled")}</span>
                  <ConfirmAction
                    label="Delete"
                    title="Remove this image?"
                    description="It will disappear from your website gallery."
                    confirmLabel="Remove"
                    onConfirm={async () => {
                      if (await run(() => erpApi(`/gallery/${image.id}`, { method: "DELETE" }), "Image removed.")) await gallery.reload();
                    }}
                  />
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TimeSlots() {
  const { branches } = useERPStore();
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState("");
  const slots = useList(branchId ? `/time-slots?branchId=${encodeURIComponent(branchId)}${date ? `&date=${date}` : ""}` : null);
  const { busy, run } = useAction();

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startTime = String(form.get("startTime"));
    const endTime = String(form.get("endTime"));
    if (endTime <= startTime) {
      notify.fail(new Error("The slot must end after it starts."));
      return;
    }
    const ok = await run(
      () => erpApi("/time-slots", { method: "POST", body: JSON.stringify({ branchId, startTime, endTime, capacity: Number(form.get("capacity")) }) }),
      "Time slot created.",
    );
    if (ok) await slots.reload();
  };
  const toggle = async (slot: Item) => {
    if (await run(() => erpApi(`/time-slots/${slot.id}/${slot.isAvailable ? "block" : "release"}`, { method: "PATCH" }), slot.isAvailable ? "Slot blocked." : "Slot released.")) await slots.reload();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form className={panel} onSubmit={create}>
        <h2 className="font-semibold">Create time slot</h2>
        <div className="mt-4 space-y-3">
          <select required value={branchId} onChange={(e) => setBranchId(e.target.value)} className={input} aria-label="Branch">
            <option value="">Select branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <label className="block text-xs text-muted-foreground">Starts<input required type="datetime-local" name="startTime" className={`mt-1 ${input}`} /></label>
          <label className="block text-xs text-muted-foreground">Ends<input required type="datetime-local" name="endTime" className={`mt-1 ${input}`} /></label>
          <label className="block text-xs text-muted-foreground">Capacity<input required type="number" min="1" name="capacity" defaultValue="1" className={`mt-1 ${input}`} /></label>
          <button disabled={busy || !branchId} className={`${primary} w-full`}>Create slot</button>
        </div>
      </form>
      <section className={panel}>
        <div className="flex flex-wrap items-center gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} max-w-48`} aria-label="Filter by date" />
          {date && <button type="button" onClick={() => setDate("")} className={subtle}>Clear</button>}
        </div>
        <div className="mt-4 space-y-2">
          {!branchId ? (
            <Empty text="Select a branch to see its time slots." />
          ) : slots.loading ? (
            <Loading />
          ) : slots.items.length === 0 ? (
            <Empty text="No time slots for this selection." />
          ) : (
            slots.items.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                <span>
                  {new Date(String(slot.startTime)).toLocaleString("en-IN")} → {new Date(String(slot.endTime)).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  <span className="ml-2 text-muted-foreground">capacity {String(slot.capacity)}</span>
                </span>
                <button type="button" disabled={busy} onClick={() => void toggle(slot)} className={subtle}>
                  {slot.isAvailable ? "Block" : "Release"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function AuditLog() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const logs = useList(`/salon-audit-logs?limit=100${applied ? `&search=${encodeURIComponent(applied)}` : ""}`);
  return (
    <section className={panel}>
      <form
        className="flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (search.trim() === applied) void logs.reload();
          else setApplied(search.trim());
        }}
      >
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entity or action" className={`${input} max-w-sm`} aria-label="Search audit log" />
        <button className={primary}>Search</button>
      </form>
      <div className="mt-5 divide-y">
        {logs.loading ? (
          <Loading />
        ) : logs.items.length === 0 ? (
          <Empty text="No audit entries found." />
        ) : (
          logs.items.map((item) => (
            <div key={item.id} className="py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <b>{String(item.action)} · {String(item.entity)}</b>
                <span className="text-muted-foreground">{new Date(String(item.createdAt)).toLocaleString("en-IN")}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {String((item.user as { name?: string } | null)?.name ?? "System")} · {String(item.entityId ?? "")}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
