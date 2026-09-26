"use client";

import { Children, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarCheck,
  CreditCard,
  Gift,
  Package as PackageIcon,
  Plus,
  Receipt,
  Save,
  Scissors,
  Settings,
  Star,
  Tag,
  Trash2,
  TrendingDown,
  Truck,
  UserCircle,
  UserCog,
  Users,
  Wallet,
  AlertCircle,
  Search,
  TrendingUp,
  Clock,
  Sparkles,
  Crown,
  ShoppingCart,
  Pencil,
  X,
  Check,
  Download,
  Printer,
} from "lucide-react";
import {
  useERPStore,
  type SalonSettings,
  type Customer,
  type Service,
  type Invoice,
  type Branch,
  type Expense,
  type AttendanceRecord,
  type Supplier,
  type Package,
  type MembershipPlan,
  type Coupon,
  erpApi,
} from "@/src/lib/erp-store";
import { employeeForm, validationMessage } from "@/src/lib/form-validation";
import { downloadInvoicePdf, printInvoicePdf } from "@/src/lib/invoice-pdf";
import CustomerEditDialog from "./CustomerEditDialog";
import ReportsPanel from "./ReportsPanel";

type Module =
  | "customers"
  | "employees"
  | "services"
  | "inventory"
  | "billing"
  | "payroll"
  | "reports"
  | "loyalty"
  | "notifications"
  | "settings"
  | "profile"
  | "branches"
  | "attendance"
  | "expenses"
  | "suppliers"
  | "packages"
  | "coupons"
  | "reviews"
  | "memberships"
  | "purchase-orders";

const moduleFeature: Partial<Record<Module, string>> = {
  customers: "CUSTOMERS",
  employees: "EMPLOYEES",
  services: "SERVICES",
  inventory: "INVENTORY",
  billing: "INVOICES",
  payroll: "PAYROLL",
  loyalty: "LOYALTY",
  memberships: "LOYALTY",
  branches: "MULTI_BRANCH",
  attendance: "EMPLOYEES",
  suppliers: "INVENTORY",
  "purchase-orders": "INVENTORY",
};

const meta: Record<
  Module,
  { title: string; description: string; icon: typeof Users; badge?: string }
> = {
  customers: {
    title: "Customers & CRM",
    description: "Manage client directory, tiers, loyalty points and purchase history.",
    icon: Users,
    badge: "CRM",
  },
  employees: {
    title: "Staff & Stylists",
    description: "Employee directory, role assignments, status and base compensation.",
    icon: UserCog,
    badge: "Team",
  },
  services: {
    title: "Service Catalog",
    description: "Configured salon treatments, timing, prices and stock linkages.",
    icon: Scissors,
    badge: "Menu",
  },
  inventory: {
    title: "Inventory & Stock",
    description: "Product inventory, SKU tracker, cost per unit and reorder triggers.",
    icon: Boxes,
    badge: "Stock",
  },
  billing: {
    title: "Billing & Invoices",
    description: "Counter sales invoices, payment collection status and revenue records.",
    icon: CreditCard,
    badge: "POS",
  },
  payroll: {
    title: "Payroll & Commission",
    description: "Monthly salary disbursements, performance commissions and pay logs.",
    icon: Wallet,
    badge: "Finance",
  },
  reports: {
    title: "Analytics & Reports",
    description: "Financial performance, revenue channels, ticket size and business health.",
    icon: BarChart3,
    badge: "Live Data",
  },
  loyalty: {
    title: "Loyalty & Rewards",
    description: "Customer tiers, points balance adjustment and reward multipliers.",
    icon: Gift,
    badge: "Growth",
  },
  notifications: {
    title: "Notifications & Alerts",
    description: "System announcements, low-stock warnings and appointment updates.",
    icon: Bell,
    badge: "Inbox",
  },
  settings: {
    title: "Salon Configuration",
    description: "Business identity, tax setup, GSTIN, opening hours and booking rules.",
    icon: Settings,
    badge: "Setup",
  },
  profile: {
    title: "Salon Profile",
    description: "Administrator identity and salon contact details.",
    icon: UserCircle,
    badge: "Admin",
  },
  branches: {
    title: "Branch Management",
    description: "Multi-location salon outlets, local addresses and operational status.",
    icon: Building2,
    badge: "Locations",
  },
  attendance: {
    title: "Staff Attendance",
    description: "Daily punch-in / punch-out logs, shift tracking and leave records.",
    icon: CalendarCheck,
    badge: "HR",
  },
  expenses: {
    title: "Operating Expenses",
    description: "Rent, utilities, maintenance, consumables and misc operating costs.",
    icon: TrendingDown,
    badge: "Outflow",
  },
  suppliers: {
    title: "Suppliers & Vendors",
    description: "Product distributors, contact persons and vendor directory.",
    icon: Truck,
    badge: "Supply",
  },
  packages: {
    title: "Combo Packages",
    description: "Bundled multi-service promotional packages with custom validity.",
    icon: PackageIcon,
    badge: "Offers",
  },
  coupons: {
    title: "Discount Coupons",
    description: "Promotional voucher codes, percentage/fixed discounts and limits.",
    icon: Tag,
    badge: "Vouchers",
  },
  reviews: {
    title: "Client Feedback & Reviews",
    description: "Customer satisfaction ratings, comments and service testimonials.",
    icon: Star,
    badge: "Ratings",
  },
  memberships: {
    title: "Membership Tiers & Plans",
    description: "Configured membership plans, discounts, loyalty multipliers and client assignments.",
    icon: Crown,
    badge: "VIP Club",
  },
  "purchase-orders": {
    title: "Purchase Orders & Stock Inflow",
    description: "Procurement orders from distributors, item receipts and inventory restock.",
    icon: ShoppingCart,
    badge: "Procurement",
  },
};

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";
const formatInvoiceDate = (value: string) => {
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

async function submitAndReset(
  form: HTMLFormElement,
  submit: () => Promise<unknown>,
) {
  const store = useERPStore.getState();
  store.clearError();
  try {
    await submit();
  } catch {
    // Store actions already provide the user-facing error notification.
  }
  if (!useERPStore.getState().error) form.reset();
}

export default function ERPModuleClient({ module }: { module: Module }) {
  const info = meta[module];
  const Icon = info.icon;
  const { features, hydrated } = useERPStore();
  const requiredFeature = moduleFeature[module];

  if (hydrated && requiredFeature && !features.includes(requiredFeature)) {
    return (
      <section className="mx-auto grid min-h-[50vh] max-w-lg place-items-center px-4 text-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <AlertCircle className="mx-auto h-9 w-9 text-amber-500" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Module not included in your plan</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Ask your platform administrator to enable {requiredFeature.replace(/_/g, " ")} for this salon.</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Return to dashboard</Link>
        </div>
      </section>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-7xl space-y-6 pb-12"
    >
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Icon className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{info.title}</h1>
              {info.badge && (
                <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{info.badge}</span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>
      </div>

      {/* Module Views */}
      {module === "customers" && <CustomersView />}
      {module === "employees" && <EmployeesView />}
      {module === "services" && <ServicesView />}
      {module === "inventory" && <InventoryView />}
      {module === "billing" && <BillingView />}
      {module === "payroll" && <PayrollView />}
      {module === "reports" && <ReportsView />}
      {module === "loyalty" && <LoyaltyView />}
      {module === "notifications" && <NotificationsView />}
      {module === "settings" && <SettingsView />}
      {module === "profile" && <ProfileView />}
      {module === "branches" && <BranchesView />}
      {module === "attendance" && <AttendanceView />}
      {module === "expenses" && <ExpensesView />}
      {module === "suppliers" && <SuppliersView />}
      {module === "packages" && <PackagesView />}
      {module === "coupons" && <CouponsView />}
      {module === "reviews" && <ReviewsView />}
      {module === "memberships" && <MembershipsView />}
      {module === "purchase-orders" && <PurchaseOrdersView />}
    </motion.div>
  );
}

// -------------------------------------------------------------
// Shared Layout Helpers
// -------------------------------------------------------------

function SectionPanel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/5 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function DataTable({
  heads,
  children,
  loading,
}: {
  heads: string[];
  children: React.ReactNode;
  loading?: boolean;
}) {
  const isEmpty = Children.toArray(children).length === 0;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            {heads.map((head, idx) => (
              <th key={idx} className="whitespace-nowrap px-6 py-3">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-foreground/80 [&>tr]:transition-colors [&>tr:hover]:bg-muted/40">{children}</tbody>
      </table>
      {isEmpty && (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          {loading ? "Loading…" : "Nothing here yet."}
        </p>
      )}
    </div>
  );
}

function DeleteButton({ onClick }: { onClick: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onClick();
      setOpen(false);
    } catch {
      // The store surfaces the failure as a toast; keep the dialog usable.
    } finally {
      setDeleting(false);
    }
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={deleting}
        aria-busy={deleting}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-wait disabled:opacity-50"
        title="Delete record"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <AlertDialog open={open} onOpenChange={(next) => !deleting && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void remove()}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="Edit record"
    >
      <Pencil className="h-4 w-4" />
    </button>
  );
}

// -------------------------------------------------------------
// 1. CUSTOMERS VIEW
// -------------------------------------------------------------
function CustomersView() {
  const { customers, addCustomer, deleteCustomer } = useERPStore();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [tier, setTier] = useState("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return customers.filter(
      (c) =>
        (tier === "all" || c.membership === tier) &&
        (!q || c.name.toLowerCase().includes(q) || c.phone.replace(/\s+/g, "").includes(q.replace(/\s+/g, "")) || (c.email ?? "").toLowerCase().includes(q)),
    );
  }, [customers, query, tier]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Customers"
          value={String(customers.length)}
          subtitle="Registered clients"
          icon={Users}
        />
        <StatCard
          title="Gold Tier"
          value={String(customers.filter((c) => c.membership === "Gold").length)}
          subtitle="Top VIP clients"
          icon={Sparkles}
        />
        <StatCard
          title="Avg Lifetime Spend"
          value={money(
            customers.length
              ? Math.round(
                  customers.reduce((s, c) => s + (c.totalSpend || 0), 0) /
                    customers.length
                )
              : 0
          )}
          subtitle="Per customer"
          icon={TrendingUp}
        />
      </div>

      <SectionPanel title="Quick Register Customer" subtitle="Add new client profile directly to CRM">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const digits = String(form.get("phone")).replace(/\s+/g, "");
            const existing = customers.find((c) => c.phone.replace(/\s+/g, "") === digits);
            if (existing) {
              useERPStore.setState({ error: `${existing.name} is already registered with this phone number.` });
              return;
            }
            await submitAndReset(e.currentTarget, () => addCustomer({
              name: String(form.get("name")).trim(),
              phone: String(form.get("phone")).trim(),
              email: String(form.get("email") || ""),
              membership: form.get("membership") as Customer["membership"],
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-4"
        >
          <input required name="name" placeholder="Full Name" className={inputClass} />
          <input required name="phone" type="tel" minLength={5} placeholder="Phone Number" className={inputClass} />
          <input name="email" type="email" placeholder="Email (Optional)" className={inputClass} />
          <div className="flex gap-2">
            <select name="membership" defaultValue="Standard" className={inputClass}>
              <option value="Standard">Standard</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
            </select>
            <button className={`${primaryButtonClass} shrink-0`}>
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </form>
      </SectionPanel>

      <SectionPanel
        title="Customer Directory"
        subtitle={`${filtered.length} client records`}
        action={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, phone or email…"
                aria-label="Search customers"
                className={`${inputClass} pl-9`}
              />
            </div>
            <select value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Filter by tier" className={`${inputClass} w-32`}>
              <option value="all">All tiers</option>
              <option value="Standard">Standard</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
            </select>
          </div>
        }
      >
        <DataTable heads={["Name", "Phone", "Tier", "Points", "Lifetime Spend", "Actions"]}>
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-muted/60">
              <td className="px-6 py-3.5">
                <p className="font-medium text-foreground">{c.name}</p>
                {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
              </td>
              <td className="px-6 py-3.5 text-foreground/70">{c.phone}</td>
              <td className="px-6 py-3.5">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    c.membership === "Gold"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : c.membership === "Silver"
                      ? "bg-muted/60 text-foreground/80 border border-border"
                      : "bg-muted/60 text-foreground/70"
                  }`}
                >
                  {c.membership}
                </span>
              </td>
              <td className="px-6 py-3.5 font-semibold text-foreground">{c.points || 0} pts</td>
              <td className="px-6 py-3.5 font-medium text-foreground">{money(c.totalSpend || 0)}</td>
              <td className="px-6 py-3.5 text-right">
                <EditButton onClick={() => setEditing(c)} />
                <DeleteButton onClick={() => deleteCustomer(c.id)} />
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                No customers found.
              </td>
            </tr>
          )}
        </DataTable>
      </SectionPanel>
      <CustomerEditDialog customer={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

// -------------------------------------------------------------
// 2. EMPLOYEES / STAFF VIEW
// -------------------------------------------------------------
function EmployeesView() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useERPStore();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Stylists"
          value={String(employees.filter((e) => e.active).length)}
          subtitle="On duty roster"
          icon={UserCog}
        />
        <StatCard
          title="Total Staff"
          value={String(employees.length)}
          subtitle="Registered team"
          icon={Users}
        />
        <StatCard
          title="Monthly Payroll Base"
          value={money(employees.reduce((s, e) => s + (e.baseSalary || 0), 0))}
          subtitle="Fixed commitment"
          icon={Wallet}
        />
      </div>

      <SectionPanel title="Add Staff Member" subtitle="Create employee profile and role assignment">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const form = new FormData(e.currentTarget);
            try {
              const values = employeeForm.parse({
                name: form.get("name"),
                role: form.get("role"),
                phone: form.get("phone"),
                email: form.get("email"),
                baseSalary: form.get("baseSalary"),
              });
              await addEmployee({ ...values, active: true });
              formEl.reset();
            } catch (error) {
              useERPStore.setState({ error: validationMessage(error) });
            }
          }}
          className="grid gap-3 p-5 sm:grid-cols-5"
        >
          <input required name="name" placeholder="Staff Name" className={inputClass} />
          <input required name="role" placeholder="Role (e.g. Senior Stylist)" className={inputClass} />
          <input
            required
            name="phone"
            type="tel"
            inputMode="tel"
            pattern="\d{10}"
            title="Enter a valid 10-digit phone number."
            placeholder="Phone Number"
            className={inputClass}
          />
          <input required name="baseSalary" type="number" placeholder="Base Salary (₹)" className={inputClass} />
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Staff Directory" subtitle="Current salon staff and designations">
        <DataTable heads={["Name", "Role", "Contact", "Base Salary", "Status", "Actions"]}>
          {employees.map((e) => (
            <tr key={e.id} className="hover:bg-muted/60">
              <td className="px-6 py-3.5 font-medium text-foreground">{e.name}</td>
              <td className="px-6 py-3.5 text-foreground/70">{e.role}</td>
              <td className="px-6 py-3.5 text-foreground/70">{e.phone}</td>
              <td className="px-6 py-3.5 font-medium text-foreground">{money(e.baseSalary)}</td>
              <td className="px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => updateEmployee(e.id, { active: !e.active })}
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer ${
                    e.active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {e.active ? "Active" : "Inactive"}
                </button>
              </td>
              <td className="px-6 py-3.5 text-right">
                <DeleteButton onClick={() => deleteEmployee(e.id)} />
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                No staff members listed.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 3. SERVICES VIEW
// -------------------------------------------------------------
function ServicesView() {
  const { services, addService, updateService, deleteService } = useERPStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; price: number; durationMinutes: number; isPublic: boolean }>({
    name: "",
    price: 0,
    durationMinutes: 0,
    isPublic: true,
  });

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditForm({ name: s.name, price: s.price, durationMinutes: s.durationMinutes, isPublic: s.isPublic ?? true });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    await updateService(id, editForm);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <SectionPanel title="New Service" subtitle="Add salon treatment / package to service catalog">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await submitAndReset(e.currentTarget, () => addService({
              name: String(form.get("name")),
              price: Number(form.get("price")),
              durationMinutes: Number(form.get("durationMinutes")),
              isPublic: form.get("isPublic") === "on",
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-5"
        >
          <input required name="name" placeholder="Service Name (e.g. Hair Spa)" className={inputClass} />
          <input required name="price" type="number" placeholder="Price (₹)" className={inputClass} />
          <input required name="durationMinutes" type="number" placeholder="Duration (Minutes)" className={inputClass} />
          <label className="flex items-center gap-2 px-2 text-sm font-medium text-foreground/80"><input name="isPublic" type="checkbox" defaultChecked /> Show on website</label>
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Service Catalog" subtitle={`${services.length} active salon services`}>
        <DataTable heads={["Service Name", "Price", "Duration", "Website", "Actions"]}>
          {services.map((s) => {
            const isEditing = editingId === s.id;
            return (
              <tr key={s.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-medium text-foreground">
                  {isEditing ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={`${inputClass} py-1 text-xs`}
                    />
                  ) : (
                    s.name
                  )}
                </td>
                <td className="px-6 py-3.5 font-semibold text-foreground">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                      className={`${inputClass} py-1 text-xs w-28`}
                    />
                  ) : (
                    money(s.price)
                  )}
                </td>
                <td className="px-6 py-3.5 text-foreground/70">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.durationMinutes}
                      onChange={(e) => setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })}
                      className={`${inputClass} py-1 text-xs w-24`}
                    />
                  ) : (
                    `${s.durationMinutes} mins`
                  )}
                </td>
                <td className="px-6 py-3.5 text-sm">
                  {isEditing ? <label className="flex items-center gap-2 text-foreground/80"><input type="checkbox" checked={editForm.isPublic} onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })} /> Visible</label> : <span className={s.isPublic ?? true ? "text-emerald-700" : "text-muted-foreground"}>{s.isPublic ?? true ? "Visible" : "Hidden"}</span>}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(s.id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Save Changes"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <EditButton onClick={() => startEdit(s)} />
                        <DeleteButton onClick={() => deleteService(s.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {services.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                No services added.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 4. INVENTORY VIEW
// -------------------------------------------------------------
function InventoryView() {
  const { inventory, addInventory, deleteInventory } = useERPStore();

  const lowStock = inventory.filter((i) => i.stock <= i.reorderLevel);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total SKUs"
          value={String(inventory.length)}
          subtitle="Tracked items"
          icon={Boxes}
        />
        <StatCard
          title="Low Stock Alerts"
          value={String(lowStock.length)}
          subtitle="At or below reorder level"
          icon={AlertCircle}
        />
        <StatCard
          title="Inventory Valuation"
          value={money(
            inventory.reduce((sum, item) => sum + item.stock * item.unitCost, 0)
          )}
          subtitle="Current asset value"
          icon={TrendingUp}
        />
      </div>

      <SectionPanel title="Add Stock Item" subtitle="Create new product SKU with unit costs">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await submitAndReset(e.currentTarget, () => addInventory({
              name: String(form.get("name")),
              sku: String(form.get("sku")),
              stock: Number(form.get("stock")),
              reorderLevel: Number(form.get("reorderLevel")),
              unitCost: Number(form.get("unitCost")),
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-6"
        >
          <input required name="name" placeholder="Item Name" className={inputClass} />
          <input required name="sku" placeholder="SKU Code" className={inputClass} />
          <input required name="stock" type="number" placeholder="Initial Qty" className={inputClass} />
          <input required name="reorderLevel" type="number" placeholder="Reorder Alert Qty" className={inputClass} />
          <input required name="unitCost" type="number" placeholder="Unit Cost (₹)" className={inputClass} />
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Stock Inventory" subtitle="Live on-shelf quantities and reorder thresholds">
        <DataTable heads={["Product / Item", "SKU", "In Stock", "Reorder Level", "Unit Cost", "Total Value", "Actions"]}>
          {inventory.map((item) => {
            const isLow = item.stock <= item.reorderLevel;
            return (
              <tr key={item.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-medium text-foreground">{item.name}</td>
                <td className="px-6 py-3.5 text-xs font-mono text-muted-foreground">{item.sku}</td>
                <td className="px-6 py-3.5 font-semibold text-foreground">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                      isLow ? "bg-red-100 text-red-700" : "bg-muted/60 text-foreground/80"
                    }`}
                  >
                    {item.stock} units
                  </span>
                </td>
                <td className="px-6 py-3.5 text-muted-foreground">{item.reorderLevel} units</td>
                <td className="px-6 py-3.5 text-foreground/70">{money(item.unitCost)}</td>
                <td className="px-6 py-3.5 font-medium text-foreground">{money(item.stock * item.unitCost)}</td>
                <td className="px-6 py-3.5 text-right">
                  <DeleteButton onClick={() => deleteInventory(item.id)} />
                </td>
              </tr>
            );
          })}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 5. BILLING & INVOICES VIEW
// -------------------------------------------------------------
function BillingView() {
  const { invoices, customers, appointments, addInvoice, deleteInvoice, settings, services: catalogServices } = useERPStore();
  const [invoiceAppointmentId, setInvoiceAppointmentId] = useState("");
  const [invoiceCustomerId, setInvoiceCustomerId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [newInvoiceStatus, setNewInvoiceStatus] = useState<Invoice["status"]>("Paid");
  const [amountReceived, setAmountReceived] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState<{ discount: number; finalAmount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  async function checkCoupon() {
    setCouponError(null);
    setCouponPreview(null);
    const code = couponCode.trim();
    const orderAmount = Number(invoiceAmount);
    if (!code || !orderAmount) {
      setCouponError("Enter an amount and a coupon code first.");
      return;
    }
    setCouponChecking(true);
    try {
      const result = await erpApi<{ discount: number; finalAmount: number }>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, orderAmount }),
      });
      setCouponPreview(result);
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : "Coupon is invalid or expired.");
    } finally {
      setCouponChecking(false);
    }
  }

  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("all");

  const invoiceContext = (invoice: Invoice) => ({
    invoice,
    customer: customers.find((item) => item.id === invoice.customerId),
    appointment: appointments.find((item) => item.id === invoice.appointmentId),
    settings,
    catalog: catalogServices,
  });
  const runPdf = async (invoice: Invoice, action: (context: ReturnType<typeof invoiceContext>) => Promise<void>) => {
    if (pdfBusyId) return;
    setPdfBusyId(invoice.id);
    try {
      await action(invoiceContext(invoice));
    } catch {
      useERPStore.setState({ error: "Could not generate the invoice PDF. Please try again." });
    } finally {
      setPdfBusyId(null);
    }
  };
  const downloadInvoice = (invoice: Invoice) => runPdf(invoice, downloadInvoicePdf);
  const printInvoice = (invoice: Invoice) => runPdf(invoice, printInvoicePdf);

  const visibleInvoices = useMemo(() => {
    const query = invoiceQuery.trim().toLowerCase();
    return [...invoices]
      .filter((invoice) => {
        const customerName = customers.find((item) => item.id === invoice.customerId)?.name ?? "walk-in guest";
        return (
          (invoiceStatus === "all" || invoice.status === invoiceStatus) &&
          (!query || (invoice.invoiceNumber ?? "").toLowerCase().includes(query) || customerName.toLowerCase().includes(query))
        );
      })
      .sort((x, y) => y.createdAt.localeCompare(x.createdAt) || (y.invoiceNumber ?? "").localeCompare(x.invoiceNumber ?? ""));
  }, [customers, invoiceQuery, invoiceStatus, invoices]);

  const exportInvoicesCsv = () => {
    const rows = [
      "Invoice,Customer,Phone,Amount,Status,Date",
      ...visibleInvoices.map((invoice) => {
        const customer = customers.find((item) => item.id === invoice.customerId);
        return [invoice.invoiceNumber ?? "", customer?.name ?? "Walk-in Guest", customer?.phone ?? "", invoice.amount, invoice.status, invoice.createdAt]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",");
      }),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + rows], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const activeInvoices = invoices.filter((i) => i.status !== "Refunded");
  const collected = activeInvoices.reduce((s, i) => s + i.amountPaid, 0);
  const pending = activeInvoices.reduce((s, i) => s + (i.amount - i.amountPaid), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Invoiced"
          value={money(activeInvoices.reduce((s, i) => s + i.amount, 0))}
          subtitle={`${invoices.length} invoices generated`}
          icon={Receipt}
        />
        <StatCard
          title="Collected Revenue"
          value={money(collected)}
          subtitle="Cleared payments"
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Receivables"
          value={money(pending)}
          subtitle="Awaiting settlement"
          icon={CreditCard}
        />
      </div>

      <SectionPanel title="Quick Counter Invoice" subtitle="Generate walk-in or appointment invoice">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const form = new FormData(e.currentTarget);
            await submitAndReset(formEl, () => addInvoice({
              customerId: invoiceCustomerId || String(form.get("customerId")),
              appointmentId: invoiceAppointmentId || undefined,
              amount: invoiceAppointmentId ? Number(invoiceAmount) : Number(form.get("amount")),
              couponCode: couponCode.trim() || undefined,
              status: newInvoiceStatus,
              ...(newInvoiceStatus === "Partially Paid" && { amountReceived: Number(amountReceived) || 0 }),
            }));
            setInvoiceAppointmentId("");
            setInvoiceCustomerId("");
            setInvoiceAmount("");
            setAmountReceived("");
            setNewInvoiceStatus("Paid");
            setCouponCode("");
            setCouponPreview(null);
            setCouponError(null);
          }}
          className="grid gap-3 p-5 sm:grid-cols-4"
        >
          <select required name="customerId" value={invoiceCustomerId} onChange={(event) => setInvoiceCustomerId(event.target.value)} className={inputClass}>
            <option value="">Select Customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
            {invoiceCustomerId && !customers.some((c) => c.id === invoiceCustomerId) && invoiceAppointmentId && (() => {
              const linked = appointments.find((item) => item.id === invoiceAppointmentId);
              return linked ? <option value={invoiceCustomerId}>{linked.customer.name} (linked appointment)</option> : null;
            })()}
          </select>
          <select name="appointmentId" className={inputClass} value={invoiceAppointmentId} onChange={(event) => {
            const id = event.target.value;
            setInvoiceAppointmentId(id);
            const appointment = appointments.find((item) => item.id === id);
            setInvoiceCustomerId(appointment?.customer.id ?? "");
            const amount = appointment ? String(appointment.payment.amount) : "";
            setInvoiceAmount(amount);
            const amountInput = event.currentTarget.form?.elements.namedItem("amount") as HTMLInputElement | null;
            if (amountInput) amountInput.value = amount;
          }}>
            <option value="">Link appointment (optional)...</option>
            {appointments.filter((appointment) => appointment.status !== "Cancelled" && appointment.status !== "No Show").map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.appointment.appointmentNumber} — {appointment.customer.name}</option>)}
          </select>
          <input
            required
            name="amount"
            type="number"
            min="1"
            step="0.01"
            placeholder="Total Amount (₹)"
            className={inputClass}
            onChange={(event) => {
              setInvoiceAmount(event.target.value);
              setCouponPreview(null);
              setCouponError(null);
            }}
          />
          <div className="flex gap-2 sm:col-span-2">
            <input
              name="couponCode"
              placeholder="Discount Code (optional)"
              value={couponCode}
              onChange={(event) => {
                setCouponCode(event.target.value);
                setCouponPreview(null);
                setCouponError(null);
              }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={checkCoupon}
              disabled={couponChecking || !couponCode.trim()}
              className="shrink-0 rounded-lg border border-border px-3 text-sm font-medium text-foreground/80 transition hover:bg-muted disabled:opacity-50"
            >
              {couponChecking ? "Checking..." : "Apply"}
            </button>
          </div>
          <select
            name="status"
            value={newInvoiceStatus}
            onChange={(event) => setNewInvoiceStatus(event.target.value as Invoice["status"])}
            className={inputClass}
          >
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
          {newInvoiceStatus === "Partially Paid" && (
            <input
              name="amountReceived"
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount Received Now (₹)"
              value={amountReceived}
              onChange={(event) => setAmountReceived(event.target.value)}
              className={inputClass}
            />
          )}
          {couponPreview && (
            <p className="text-sm text-emerald-600 sm:col-span-4">
              Coupon applied: -{money(couponPreview.discount)} → new total {money(couponPreview.finalAmount)}
            </p>
          )}
          {couponError && (
            <p className="text-sm text-red-600 sm:col-span-4">{couponError}</p>
          )}
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Issue Invoice
          </button>
        </form>
      </SectionPanel>

      <SectionPanel
        title="Invoices Record"
        subtitle="Chronological salon billing receipts"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={invoiceQuery}
              onChange={(event) => setInvoiceQuery(event.target.value)}
              placeholder="Search invoice or customer"
              aria-label="Search invoices"
              className={`${inputClass} h-9 w-52`}
            />
            <select value={invoiceStatus} onChange={(event) => setInvoiceStatus(event.target.value)} aria-label="Filter by status" className={`${inputClass} h-9 w-36`}>
              <option value="all">All status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Refunded">Refunded</option>
            </select>
            <button type="button" onClick={exportInvoicesCsv} disabled={visibleInvoices.length === 0} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground/80 transition hover:bg-muted disabled:opacity-50">
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
        }
      >
        <DataTable heads={["Invoice #", "Customer", "Amount", "Issued Date", "Status", "Actions"]}>
          {visibleInvoices.map((inv) => {
            const cust = customers.find((c) => c.id === inv.customerId);
            return (
              <tr key={inv.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-mono text-xs font-semibold text-foreground">
                  {inv.invoiceNumber ?? "INV-DRAFT"}
                </td>
                <td className="px-6 py-3.5 font-medium text-foreground">
                  {cust?.name ?? "Walk-in Guest"}
                </td>
                <td className="px-6 py-3.5 font-semibold text-foreground">{money(inv.amount)}</td>
                <td className="px-6 py-3.5 text-muted-foreground">{formatInvoiceDate(inv.createdAt)}</td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      inv.status === "Paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : inv.status === "Pending" || inv.status === "Partially Paid"
                        ? "bg-amber-100 text-amber-800"
                        : inv.status === "Refunded"
                        ? "bg-violet-100 text-violet-800"
                        : "bg-muted/60 text-foreground/80"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button type="button" title="Download PDF" aria-label="Download invoice PDF" disabled={pdfBusyId === inv.id} onClick={() => void downloadInvoice(inv)} className="inline-flex rounded-lg p-2 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground disabled:opacity-50">
                    {pdfBusyId === inv.id ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <Download className="h-4 w-4" />}
                  </button>
                  <button type="button" title="Print invoice" aria-label="Print invoice" disabled={pdfBusyId === inv.id} onClick={() => void printInvoice(inv)} className="mr-2 inline-flex rounded-lg p-2 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground disabled:opacity-50">
                    <Printer className="h-4 w-4" />
                  </button>
                  <DeleteButton onClick={() => deleteInvoice(inv.id)} />
                </td>
              </tr>
            );
          })}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 6. PAYROLL VIEW
// -------------------------------------------------------------
function PayrollView() {
  const { payroll, employees, addPayroll, updatePayroll, deletePayroll } = useERPStore();

  return (
    <div className="space-y-6">
      <SectionPanel title="Run Monthly Payroll" subtitle="Calculate base salary and commission disbursements">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const empId = String(form.get("employeeId"));
            const emp = employees.find((x) => x.id === empId);
            await submitAndReset(e.currentTarget, () => addPayroll({
              employeeId: empId,
              month: String(form.get("month")),
              baseSalary: Number(form.get("baseSalary") || emp?.baseSalary || 0),
              commission: Number(form.get("commission") || 0),
              status: "Draft",
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-5"
        >
          <select required name="employeeId" className={inputClass}>
            <option value="">Select Employee...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.role})
              </option>
            ))}
          </select>
          <input required name="month" type="month" defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`} className={inputClass} />
          <input name="baseSalary" type="number" placeholder="Base Salary (₹)" className={inputClass} />
          <input name="commission" type="number" placeholder="Commission (₹)" className={inputClass} />
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Create Payroll
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Payroll History" subtitle="Disbursed and scheduled staff compensation">
        <DataTable heads={["Employee", "Month", "Base Salary", "Commission", "Total Payout", "Status", "Actions"]}>
          {payroll.map((p) => {
            const emp = employees.find((e) => e.id === p.employeeId);
            const isPaid = p.status === "Paid";
            return (
              <tr key={p.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-medium text-foreground">{emp?.name ?? "Employee"}</td>
                <td className="px-6 py-3.5 text-foreground/70">{p.month}</td>
                <td className="px-6 py-3.5 text-foreground/70">{money(p.baseSalary)}</td>
                <td className="px-6 py-3.5 text-emerald-600 font-medium">{money(p.commission)}</td>
                <td className="px-6 py-3.5 font-bold text-foreground">{money(p.baseSalary + p.commission)}</td>
                <td className="px-6 py-3.5">
                  <button
                    type="button"
                    onClick={() => updatePayroll(p.id, { status: isPaid ? "Draft" : "Paid" })}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition ${
                      isPaid
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
                    }`}
                    title="Click to toggle status"
                  >
                    {isPaid ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {p.status}
                  </button>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <DeleteButton onClick={() => deletePayroll(p.id)} />
                </td>
              </tr>
            );
          })}
          {payroll.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                No payroll records found.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 7. BRANCHES VIEW
// -------------------------------------------------------------
function BranchesView() {
  const { branches, addBranch, updateBranch, toggleBranchStatus, deleteBranch, moduleLoading } = useERPStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; code: string; city: string; phone: string }>({
    name: "",
    code: "",
    city: "",
    phone: "",
  });

  const startEdit = (b: Branch) => {
    setEditingId(b.id);
    setEditForm({
      name: b.name,
      code: b.code,
      city: b.city || "",
      phone: b.phone || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    await updateBranch(id, editForm);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <SectionPanel title="Add Branch Outlet" subtitle="Configure additional salon physical locations">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await submitAndReset(e.currentTarget, () => addBranch({
              name: String(form.get("name")),
              code: String(form.get("code")),
              city: String(form.get("city")),
              phone: String(form.get("phone")),
              status: "ACTIVE",
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-5"
        >
          <input required name="name" placeholder="Branch Name (e.g. Indiranagar)" className={inputClass} />
          <input required name="code" placeholder="Branch Code (e.g. BLR-01)" className={inputClass} />
          <input required name="city" placeholder="City" className={inputClass} />
          <input required name="phone" placeholder="Contact Phone" className={inputClass} />
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Add Branch
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Salon Outlets" subtitle={`${branches.length} configured locations`}>
        <DataTable heads={["Branch Name", "Code", "City", "Phone", "Status", "Actions"]} loading={moduleLoading.branches}>
          {branches.map((b) => {
            const isEditing = editingId === b.id;
            const isActive = b.status === "ACTIVE";
            return (
              <tr key={b.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-medium text-foreground">
                  {isEditing ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={`${inputClass} py-1 text-xs`}
                    />
                  ) : (
                    b.name
                  )}
                </td>
                <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">
                  {isEditing ? (
                    <input
                      value={editForm.code}
                      onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                      className={`${inputClass} py-1 text-xs w-24`}
                    />
                  ) : (
                    b.code
                  )}
                </td>
                <td className="px-6 py-3.5 text-foreground/70">
                  {isEditing ? (
                    <input
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className={`${inputClass} py-1 text-xs w-28`}
                    />
                  ) : (
                    b.city || "—"
                  )}
                </td>
                <td className="px-6 py-3.5 text-foreground/70">
                  {isEditing ? (
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className={`${inputClass} py-1 text-xs w-32`}
                    />
                  ) : (
                    b.phone || "—"
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <button
                    type="button"
                    onClick={() => toggleBranchStatus(b.id, !isActive)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                        : "bg-muted/60 text-foreground/70 border border-border hover:bg-muted"
                    }`}
                    title="Click to toggle status"
                  >
                    {isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {b.status}
                  </button>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(b.id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Save Changes"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <EditButton onClick={() => startEdit(b)} />
                        <DeleteButton onClick={() => deleteBranch(b.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {branches.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                No branches added yet. Primary location active.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 8. ATTENDANCE VIEW
// -------------------------------------------------------------
function AttendanceView() {
  const { attendance, employees, branches, fetchAttendance, recordAttendance, checkOutAttendance, updateAttendance, moduleLoading } = useERPStore();
  const today = new Date().toLocaleDateString("en-CA");
  const [selectedDate, setSelectedDate] = useState(today);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [recording, setRecording] = useState(false);
  const month = selectedDate.slice(0, 7);
  useEffect(() => { void fetchAttendance({ month }); }, [fetchAttendance, month]);

  const dayRecords = attendance.filter((record) =>
    new Date(record.checkIn).toLocaleDateString("en-CA") === selectedDate &&
    (!employeeFilter || record.employeeId === employeeFilter),
  );
  const attendanceDays = new Set(
    attendance
      .filter((record) => !employeeFilter || record.employeeId === employeeFilter)
      .map((record) => new Date(record.checkIn).toLocaleDateString("en-CA")),
  );
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const firstWeekday = new Date(`${month}-01T00:00:00`).getDay();
  const todayRecorded = new Set(
    attendance.filter((record) => new Date(record.checkIn).toLocaleDateString("en-CA") === today).map((record) => record.employeeId),
  );

  return (
    <div className="space-y-6">
      <SectionPanel title="Punch Attendance" subtitle="Record daily check-in and attendance status">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setRecording(true);
            try {
              await submitAndReset(e.currentTarget, () => recordAttendance({
                employeeId: String(form.get("employeeId")),
                status: form.get("status") as AttendanceRecord["status"],
                branchId: String(form.get("branchId") || "") || null,
              }));
            } finally { setRecording(false); }
          }}
          className="grid gap-3 p-5 sm:grid-cols-4"
        >
          <select required name="employeeId" className={inputClass}>
            <option value="">Select Employee...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}{todayRecorded.has(e.id) ? " — already recorded today" : ""}
              </option>
            ))}
          </select>
          <select name="status" defaultValue="PRESENT" className={inputClass}>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
          <select name="branchId" className={inputClass}>
            <option value="">Primary salon location</option>
            {branches.filter((branch) => branch.status === "ACTIVE").map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
          <button disabled={recording} className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> {recording ? "Recording…" : "Record Check-In"}
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Attendance history" subtitle="Choose a day to see who attended. Green dates have attendance records.">
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium text-foreground/80">Month<input type="month" value={month} onChange={(event) => setSelectedDate(`${event.target.value}-01`)} className={`${inputClass} mt-1 w-full`} /></label>
            <label className="text-sm font-medium text-foreground/80">Date<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className={`${inputClass} mt-1 w-full`} /></label>
            <label className="text-sm font-medium text-foreground/80">Employee<select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} className={`${inputClass} mt-1 w-full`}><option value="">All employees</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
          </div>
          <button type="button" onClick={() => setSelectedDate(today)} className="self-end rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted/60">Today</button>
        </div>
        <div className="grid grid-cols-7 gap-1 border-t p-5 text-center text-xs">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <span key={day} className="pb-1 font-semibold text-muted-foreground">{day}</span>)}
          {Array.from({ length: firstWeekday }).map((_, index) => <span key={`empty-${index}`} />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const date = `${month}-${String(index + 1).padStart(2, "0")}`;
            const attended = attendanceDays.has(date);
            return <button type="button" key={date} onClick={() => setSelectedDate(date)} title={attended ? "Attendance recorded" : "No attendance recorded"} className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full font-semibold ${date === selectedDate ? "bg-primary text-white" : attended ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "text-muted-foreground hover:bg-muted/60"}`}>{index + 1}</button>;
          })}
        </div>
      </SectionPanel>

      <SectionPanel title="Attendance Logs" subtitle={`Attendance for ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`}>
        <DataTable heads={["Staff Name", "Check in", "Check out", "Hours", "Status", "Actions"]} loading={moduleLoading.attendance}>
          {dayRecords.map((a) => {
            const emp = employees.find((e) => e.id === a.employeeId);
            return (
              <tr key={a.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-medium text-foreground">{emp?.name ?? a.employeeName ?? "Staff"}</td>
                <td className="px-6 py-3.5 text-muted-foreground">{new Date(a.checkIn).toLocaleString("en-IN")}</td>
                <td className="px-6 py-3.5 text-muted-foreground">{a.checkOut ? new Date(a.checkOut).toLocaleString("en-IN") : "Still on shift"}</td>
                <td className="px-6 py-3.5 text-foreground/80">{a.totalHours == null ? "—" : `${a.totalHours.toFixed(2)} h`}</td>
                <td className="px-6 py-3.5">
                  <select value={a.status} onChange={(event) => void updateAttendance(a.id, { status: event.target.value as AttendanceRecord["status"] })} className={`${inputClass} min-w-28 py-1 text-xs`}>
                    <option value="PRESENT">Present</option><option value="LATE">Late</option><option value="HALF_DAY">Half Day</option><option value="ABSENT">Absent</option><option value="ON_LEAVE">On Leave</option>
                  </select>
                </td>
                <td className="px-6 py-3.5 text-right">
                  {!a.checkOut && <button type="button" onClick={() => void checkOutAttendance(a.id)} className={`${primaryButtonClass} h-8 px-3 text-xs`}>Check out now</button>}
                </td>
              </tr>
            );
          })}
          {dayRecords.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                No attendance recorded for this date.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 9. EXPENSES VIEW
// -------------------------------------------------------------
function ExpensesView() {
  const { expenses, addExpense, updateExpense, deleteExpense, moduleLoading } = useERPStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; category: string; amount: number }>({
    title: "",
    category: "MISCELLANEOUS",
    amount: 0,
  });

  const startEdit = (e: Expense) => {
    setEditingId(e.id);
    setEditForm({ title: e.title, category: e.category, amount: e.amount });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    await updateExpense(id, editForm);
    setEditingId(null);
  };

  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Total Expenses"
          value={money(totalExpense)}
          subtitle="Operating outflow"
          icon={TrendingDown}
        />
        <StatCard
          title="Expense Entries"
          value={String(expenses.length)}
          subtitle="Logged transactions"
          icon={Receipt}
        />
      </div>

      <SectionPanel title="Log New Expense" subtitle="Record utility bills, rent, supplies and maintenance">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await submitAndReset(e.currentTarget, () => addExpense({
              title: String(form.get("title")),
              category: String(form.get("category")),
              amount: Number(form.get("amount")),
              date: new Date().toISOString(),
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-4"
        >
          <input required name="title" placeholder="Description / Purpose" className={inputClass} />
          <select name="category" defaultValue="MISCELLANEOUS" className={inputClass}>
            <option value="RENT">Rent</option>
            <option value="ELECTRICITY">Electricity</option>
            <option value="SALARY">Salary</option>
            <option value="MARKETING">Marketing</option>
            <option value="CLEANING">Cleaning & Laundry</option>
            <option value="MISCELLANEOUS">Miscellaneous</option>
          </select>
          <input required name="amount" type="number" placeholder="Amount (₹)" className={inputClass} />
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Save Expense
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Expense Ledger" subtitle="Detailed spending log">
        <DataTable heads={["Expense Title", "Category", "Amount", "Actions"]} loading={moduleLoading.expenses}>
          {expenses.map((e) => {
            const isEditing = editingId === e.id;
            return (
              <tr key={e.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-medium text-foreground">
                  {isEditing ? (
                    <input
                      value={editForm.title}
                      onChange={(ev) => setEditForm({ ...editForm, title: ev.target.value })}
                      className={`${inputClass} py-1 text-xs`}
                    />
                  ) : (
                    e.title
                  )}
                </td>
                <td className="px-6 py-3.5 text-xs text-muted-foreground font-semibold">
                  {isEditing ? (
                    <select
                      value={editForm.category}
                      onChange={(ev) => setEditForm({ ...editForm, category: ev.target.value })}
                      className={`${inputClass} py-1 text-xs`}
                    >
                      <option value="RENT">Rent</option>
                      <option value="ELECTRICITY">Electricity</option>
                      <option value="SALARY">Salary</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="CLEANING">Cleaning & Laundry</option>
                      <option value="MISCELLANEOUS">Miscellaneous</option>
                    </select>
                  ) : (
                    e.category
                  )}
                </td>
                <td className="px-6 py-3.5 font-semibold text-red-600">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={(ev) => setEditForm({ ...editForm, amount: Number(ev.target.value) })}
                      className={`${inputClass} py-1 text-xs w-28`}
                    />
                  ) : (
                    money(e.amount)
                  )}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(e.id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Save Changes"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <EditButton onClick={() => startEdit(e)} />
                        <DeleteButton onClick={() => deleteExpense(e.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {expenses.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                No expenses logged yet.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 10. SUPPLIERS VIEW
// -------------------------------------------------------------
function SuppliersView() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, moduleLoading } = useERPStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
  }>({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
  });

  const startEdit = (s: Supplier) => {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      contactPerson: s.contactPerson || "",
      phone: s.phone || "",
      email: s.email || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    await updateSupplier(id, editForm);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <SectionPanel title="Add Supplier" subtitle="Register product distributor and contact info">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const form = new FormData(e.currentTarget);
            await submitAndReset(formEl, () => addSupplier({
              name: String(form.get("name")),
              contactPerson: String(form.get("contactPerson")),
              phone: String(form.get("phone")),
              email: String(form.get("email")),
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-5"
        >
          <input required name="name" placeholder="Company Name" className={inputClass} />
          <input name="contactPerson" placeholder="Representative Name" className={inputClass} />
          <input required name="phone" placeholder="Phone" className={inputClass} />
          <input name="email" type="email" placeholder="Email" className={inputClass} />
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Add Vendor
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Vendor Directory" subtitle={`${suppliers.length} active suppliers`}>
        <DataTable heads={["Supplier", "Representative", "Phone", "Email", "Actions"]} loading={moduleLoading.suppliers}>
          {suppliers.map((s) => {
            const isEditing = editingId === s.id;
            return (
              <tr key={s.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-medium text-foreground">
                  {isEditing ? (
                    <input
                      value={editForm.name}
                      onChange={(ev) => setEditForm({ ...editForm, name: ev.target.value })}
                      className={`${inputClass} py-1 text-xs`}
                    />
                  ) : (
                    s.name
                  )}
                </td>
                <td className="px-6 py-3.5 text-foreground/70">
                  {isEditing ? (
                    <input
                      value={editForm.contactPerson}
                      onChange={(ev) => setEditForm({ ...editForm, contactPerson: ev.target.value })}
                      className={`${inputClass} py-1 text-xs`}
                    />
                  ) : (
                    s.contactPerson || "—"
                  )}
                </td>
                <td className="px-6 py-3.5 text-foreground/70">
                  {isEditing ? (
                    <input
                      value={editForm.phone}
                      onChange={(ev) => setEditForm({ ...editForm, phone: ev.target.value })}
                      className={`${inputClass} py-1 text-xs w-32`}
                    />
                  ) : (
                    s.phone
                  )}
                </td>
                <td className="px-6 py-3.5 text-muted-foreground">
                  {isEditing ? (
                    <input
                      value={editForm.email}
                      onChange={(ev) => setEditForm({ ...editForm, email: ev.target.value })}
                      className={`${inputClass} py-1 text-xs`}
                    />
                  ) : (
                    s.email || "—"
                  )}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(s.id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Save Changes"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <EditButton onClick={() => startEdit(s)} />
                        <DeleteButton onClick={() => deleteSupplier(s.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {suppliers.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                No suppliers registered.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 11. PACKAGES VIEW
// -------------------------------------------------------------
function PackagesView() {
  const { packages, addPackage, updatePackage, deletePackage, moduleLoading } = useERPStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    price: number;
    validityDays: number;
  }>({
    name: "",
    description: "",
    price: 0,
    validityDays: 30,
  });

  const startEdit = (p: Package) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      validityDays: p.validityDays,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    await updatePackage(id, editForm);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <SectionPanel title="Create Combo Package" subtitle="Package multiple treatments together with special pricing">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const form = new FormData(e.currentTarget);
            await submitAndReset(formEl, () => addPackage({
              name: String(form.get("name")),
              description: String(form.get("description")),
              price: Number(form.get("price")),
              validityDays: Number(form.get("validityDays") || 30),
              isActive: true,
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-5"
        >
          <input required name="name" placeholder="Package Name (e.g. Bridal Glow)" className={inputClass} />
          <input name="description" placeholder="Description" className={inputClass} />
          <input required name="price" type="number" placeholder="Package Price (₹)" className={inputClass} />
          <input required name="validityDays" type="number" placeholder="Validity (Days)" defaultValue={30} className={inputClass} />
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Create Package
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Available Packages" subtitle="Promotional bundles">
        <DataTable heads={["Package Name", "Description", "Price", "Validity", "Status", "Actions"]} loading={moduleLoading.packages}>
          {packages.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <tr key={p.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-medium text-foreground">
                  {isEditing ? (
                    <input
                      value={editForm.name}
                      onChange={(ev) => setEditForm({ ...editForm, name: ev.target.value })}
                      className={`${inputClass} py-1 text-xs`}
                    />
                  ) : (
                    p.name
                  )}
                </td>
                <td className="px-6 py-3.5 text-muted-foreground">
                  {isEditing ? (
                    <input
                      value={editForm.description}
                      onChange={(ev) => setEditForm({ ...editForm, description: ev.target.value })}
                      className={`${inputClass} py-1 text-xs`}
                    />
                  ) : (
                    p.description || "—"
                  )}
                </td>
                <td className="px-6 py-3.5 font-semibold text-foreground">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(ev) => setEditForm({ ...editForm, price: Number(ev.target.value) })}
                      className={`${inputClass} py-1 text-xs w-28`}
                    />
                  ) : (
                    money(p.price)
                  )}
                </td>
                <td className="px-6 py-3.5 text-foreground/70">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.validityDays}
                      onChange={(ev) => setEditForm({ ...editForm, validityDays: Number(ev.target.value) })}
                      className={`${inputClass} py-1 text-xs w-20`}
                    />
                  ) : (
                    `${p.validityDays} days`
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <button
                    type="button"
                    onClick={() => updatePackage(p.id, { isActive: !p.isActive })}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition ${
                      p.isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(p.id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Save Changes"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <EditButton onClick={() => startEdit(p)} />
                        <DeleteButton onClick={() => deletePackage(p.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {packages.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                No packages configured.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 12. COUPONS VIEW
// -------------------------------------------------------------
function CouponsView() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon, moduleLoading } = useERPStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minimumOrder: number;
  }>({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    minimumOrder: 0,
  });

  const startEdit = (c: Coupon) => {
    setEditingId(c.id);
    setEditForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minimumOrder: c.minimumOrder || 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    await updateCoupon(id, editForm);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <SectionPanel title="Create Promo Coupon" subtitle="Generate voucher codes for promotional marketing">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const form = new FormData(e.currentTarget);
            await submitAndReset(formEl, () => addCoupon({
              code: String(form.get("code")).toUpperCase().trim(),
              discountType: form.get("discountType") as Coupon["discountType"],
              discountValue: Number(form.get("discountValue")),
              minimumOrder: Number(form.get("minOrderAmount") || 0),
              isActive: true,
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-5"
        >
          <input required name="code" placeholder="Code (e.g. SUMMER20)" className={inputClass} />
          <select name="discountType" defaultValue="PERCENTAGE" className={inputClass}>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Flat Discount (₹)</option>
          </select>
          <input required name="discountValue" type="number" placeholder="Discount Value" className={inputClass} />
          <input name="minOrderAmount" type="number" placeholder="Min Order (₹)" className={inputClass} />
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Add Coupon
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Active Coupons" subtitle="Promotional codes">
        <DataTable heads={["Coupon Code", "Type", "Discount", "Min Spend", "Status", "Actions"]} loading={moduleLoading.coupons}>
          {coupons.map((c) => {
            const isEditing = editingId === c.id;
            return (
              <tr key={c.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-mono font-bold text-foreground">
                  {isEditing ? (
                    <input
                      value={editForm.code}
                      onChange={(ev) => setEditForm({ ...editForm, code: ev.target.value.toUpperCase() })}
                      className={`${inputClass} py-1 text-xs`}
                    />
                  ) : (
                    c.code
                  )}
                </td>
                <td className="px-6 py-3.5 text-xs text-muted-foreground">
                  {isEditing ? (
                    <select
                      value={editForm.discountType}
                      onChange={(ev) => setEditForm({ ...editForm, discountType: ev.target.value as Coupon["discountType"] })}
                      className={`${inputClass} py-1 text-xs`}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Flat Discount (₹)</option>
                    </select>
                  ) : (
                    c.discountType
                  )}
                </td>
                <td className="px-6 py-3.5 font-semibold text-emerald-600">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.discountValue}
                      onChange={(ev) => setEditForm({ ...editForm, discountValue: Number(ev.target.value) })}
                      className={`${inputClass} py-1 text-xs w-24`}
                    />
                  ) : (
                    c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`
                  )}
                </td>
                <td className="px-6 py-3.5 text-foreground/70">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.minimumOrder}
                      onChange={(ev) => setEditForm({ ...editForm, minimumOrder: Number(ev.target.value) })}
                      className={`${inputClass} py-1 text-xs w-28`}
                    />
                  ) : (
                    c.minimumOrder ? money(c.minimumOrder) : "None"
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <button
                    type="button"
                    onClick={() => updateCoupon(c.id, { isActive: !c.isActive })}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition ${
                      c.isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(c.id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Save Changes"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <EditButton onClick={() => startEdit(c)} />
                        <DeleteButton onClick={() => deleteCoupon(c.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {coupons.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                No active coupons created.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 13. REVIEWS VIEW
// -------------------------------------------------------------
function ReviewsView() {
  const { reviews, customers, addReview, moduleLoading } = useERPStore();

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Average Rating"
          value={`${avgRating} / 5.0`}
          subtitle="Customer satisfaction"
          icon={Star}
        />
        <StatCard
          title="Total Feedback"
          value={String(reviews.length)}
          subtitle="Customer reviews logged"
          icon={Users}
        />
      </div>

      <SectionPanel title="Log Customer Feedback" subtitle="Record client review and star rating">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const form = new FormData(e.currentTarget);
            await submitAndReset(formEl, () => addReview({
              customerId: String(form.get("customerId")),
              rating: Number(form.get("rating")),
              comment: String(form.get("comment")),
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-4"
        >
          <select required name="customerId" className={inputClass}>
            <option value="">Select Customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="rating" defaultValue="5" className={inputClass}>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star)</option>
          </select>
          <input required name="comment" placeholder="Feedback comment" className={inputClass} />
          <button className={primaryButtonClass}>
            <Plus className="h-4 w-4" /> Save Review
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Customer Testimonials" subtitle="Feedback history">
        <DataTable heads={["Customer", "Rating", "Comment", "Date"]} loading={moduleLoading.reviews}>
          {reviews.map((r) => {
            const cust = customers.find((c) => c.id === r.customerId);
            return (
              <tr key={r.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-medium text-foreground">{cust?.name ?? r.customerName ?? "Client"}</td>
                <td className="px-6 py-3.5 text-amber-500 font-bold">{"★".repeat(r.rating)}</td>
                <td className="px-6 py-3.5 text-foreground/80 italic">&ldquo;{r.comment || "Great service!"}&rdquo;</td>
                <td className="px-6 py-3.5 text-muted-foreground text-xs">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
                </td>
              </tr>
            );
          })}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                No reviews recorded yet.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 14. LOYALTY & REWARDS VIEW
// -------------------------------------------------------------
function LoyaltyView() {
  const { customers, adjustLoyalty } = useERPStore();
  const [selectedCust, setSelectedCust] = useState("");
  const [points, setPoints] = useState(50);
  const [reason, setReason] = useState("Loyalty Bonus");

  return (
    <div className="space-y-6">
      <SectionPanel title="Manual Loyalty Points Adjustment" subtitle="Credit or debit points for a customer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedCust) return;
            adjustLoyalty(selectedCust, points, reason);
          }}
          className="grid gap-3 p-5 sm:grid-cols-4"
        >
          <select
            required
            value={selectedCust}
            onChange={(e) => setSelectedCust(e.target.value)}
            className={inputClass}
          >
            <option value="">Select Customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.points || 0} pts)
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            placeholder="Points (+/-)"
            className={inputClass}
          />
          <input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className={inputClass}
          />
          <button className={primaryButtonClass}>
            <Gift className="h-4 w-4" /> Apply Points
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Customer Loyalty Standings" subtitle="Points balances and membership tiers">
        <DataTable heads={["Customer", "Phone", "Tier", "Points Balance", "Estimated Value"]}>
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-muted/60">
              <td className="px-6 py-3.5 font-medium text-foreground">{c.name}</td>
              <td className="px-6 py-3.5 text-foreground/70">{c.phone}</td>
              <td className="px-6 py-3.5 font-semibold text-amber-700">{c.membership}</td>
              <td className="px-6 py-3.5 font-bold text-foreground">{c.points || 0} pts</td>
              <td className="px-6 py-3.5 text-muted-foreground">{money((c.points || 0) * 0.5)}</td>
            </tr>
          ))}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 15. REPORTS VIEW
// -------------------------------------------------------------
function ReportsView() {
  return <ReportsPanel />;
}

// -------------------------------------------------------------
// 16. NOTIFICATIONS VIEW
// -------------------------------------------------------------
function NotificationsView() {
  const { notifications, markNotificationRead } = useERPStore();

  return (
    <div className="space-y-6">
      <SectionPanel
        title="Notifications Inbox"
        subtitle={`${notifications.length} alerts received`}
        action={
          notifications.some((n) => !n.readAt) ? (
            <button
              type="button"
              onClick={() => void Promise.all(notifications.filter((n) => !n.readAt).map((n) => markNotificationRead(n.id)))}
              className="h-9 rounded-lg border border-border px-3 text-sm font-medium text-foreground/80 transition hover:bg-muted"
            >
              Mark all read
            </button>
          ) : undefined
        }
      >
        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-center justify-between p-5 transition-colors ${
                !n.readAt ? "bg-amber-50/30" : "bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-muted/60 text-foreground/80">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{n.title}</h4>
                  <p className="text-xs text-foreground/70 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              {!n.readAt && (
                <button
                  type="button"
                  onClick={() => markNotificationRead(n.id)}
                  className="rounded-lg bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted transition"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="p-8 text-center text-muted-foreground text-sm">
              All caught up! No notifications.
            </p>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// 17. SETTINGS VIEW
// -------------------------------------------------------------
function SettingsView() {
  const { settings, updateSettings } = useERPStore();
  const [formState, setFormState] = useState<SalonSettings>(settings);

  return (
    <div className="space-y-6">
      <SectionPanel
        title="Salon & Business Settings"
        subtitle="Configure legal identity, tax setup, store timings, booking rules and alerts"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await updateSettings(formState);
          }}
          className="space-y-8 p-6"
        >
          {/* Section 1: Business Identity */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Business Identity & Branding
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Salon Trade Name
                </label>
                <input
                  required
                  value={formState.salonName || ""}
                  onChange={(e) => setFormState({ ...formState, salonName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Legal Entity Name
                </label>
                <input
                  value={formState.legalName || ""}
                  onChange={(e) => setFormState({ ...formState, legalName: e.target.value })}
                  placeholder="DropX Pvt Ltd"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  GSTIN / Tax ID
                </label>
                <input
                  value={formState.gstin || ""}
                  onChange={(e) => setFormState({ ...formState, gstin: e.target.value })}
                  placeholder="29AAAAA0000A1Z5"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Brand Logo URL
                </label>
                <input
                  value={formState.logoUrl || ""}
                  onChange={(e) => setFormState({ ...formState, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Official Website
                </label>
                <input
                  value={formState.website || ""}
                  onChange={(e) => setFormState({ ...formState, website: e.target.value })}
                  placeholder="https://dropxcutz.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Contact Phone
                </label>
                <input
                  required
                  value={formState.phone || ""}
                  onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Official Email
                </label>
                <input
                  required
                  type="email"
                  value={formState.email || ""}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Physical Address & Localization */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Physical Location & Regional Settings
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Street Address
                </label>
                <input
                  value={formState.address || ""}
                  onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                  placeholder="123 100ft Road, Indiranagar"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  City
                </label>
                <input
                  value={formState.city || ""}
                  onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  State
                </label>
                <input
                  value={formState.state || ""}
                  onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Postal / PIN Code
                </label>
                <input
                  value={formState.postalCode || ""}
                  onChange={(e) => setFormState({ ...formState, postalCode: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Currency Code
                </label>
                <input
                  value={formState.currency || "INR"}
                  onChange={(e) => setFormState({ ...formState, currency: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Locale
                </label>
                <input
                  value={formState.locale || "en-IN"}
                  onChange={(e) => setFormState({ ...formState, locale: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Timezone
                </label>
                <input
                  value={formState.timezone || "Asia/Kolkata"}
                  onChange={(e) => setFormState({ ...formState, timezone: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Billing & Tax */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Billing & Invoicing Defaults
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Applicable GST / Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={formState.taxRate ?? 18}
                  onChange={(e) => setFormState({ ...formState, taxRate: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Invoice Number Prefix
                </label>
                <input
                  value={formState.invoicePrefix || "INV"}
                  onChange={(e) => setFormState({ ...formState, invoicePrefix: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Store Operations & Booking Rules */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Operating Hours & Booking Policies
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={formState.openingTime || "09:00"}
                  onChange={(e) => setFormState({ ...formState, openingTime: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={formState.closingTime || "20:00"}
                  onChange={(e) => setFormState({ ...formState, closingTime: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Appointment Slot (Minutes)
                </label>
                <input
                  type="number"
                  value={formState.appointmentSlotMinutes ?? 30}
                  onChange={(e) => setFormState({ ...formState, appointmentSlotMinutes: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Cancellation Window (Hours)
                </label>
                <input
                  type="number"
                  value={formState.cancellationWindowHours ?? 4}
                  onChange={(e) => setFormState({ ...formState, cancellationWindowHours: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Automation & Alert Toggles */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Automations & Preferences
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-border p-4 cursor-pointer hover:bg-muted/60 transition">
                <input
                  type="checkbox"
                  checked={formState.allowOnlineBooking ?? true}
                  onChange={(e) => setFormState({ ...formState, allowOnlineBooking: e.target.checked })}
                  className="h-4 w-4 rounded text-foreground focus:ring-ring"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">Allow Online Booking</p>
                  <p className="text-xs text-muted-foreground">Enable client self-service scheduling</p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border p-4 cursor-pointer hover:bg-muted/60 transition">
                <input
                  type="checkbox"
                  checked={formState.lowStockAlerts ?? true}
                  onChange={(e) => setFormState({ ...formState, lowStockAlerts: e.target.checked })}
                  className="h-4 w-4 rounded text-foreground focus:ring-ring"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">Low Stock Notifications</p>
                  <p className="text-xs text-muted-foreground">Alert staff when items hit reorder level</p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border p-4 cursor-pointer hover:bg-muted/60 transition">
                <input
                  type="checkbox"
                  checked={formState.dailyRevenueDigest ?? true}
                  onChange={(e) => setFormState({ ...formState, dailyRevenueDigest: e.target.checked })}
                  className="h-4 w-4 rounded text-foreground focus:ring-ring"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">Daily Revenue Digest</p>
                  <p className="text-xs text-muted-foreground">Send end-of-day summary reports</p>
                </div>
              </label>
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary/90 shadow-md transition">
            <Save className="h-4 w-4" /> Save Configuration
          </button>
        </form>
      </SectionPanel>
    </div>
  );
}

// -------------------------------------------------------------
// 18. MEMBERSHIPS VIEW (Phase 2)
// -------------------------------------------------------------
function MembershipsView() {
  const { membershipPlans, customers, addMembershipPlan, updateMembershipPlan, deleteMembershipPlan, assignMembership, moduleLoading } = useERPStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    price: number;
    validityDays: number;
    discountPercentage: number;
    loyaltyMultiplier: number;
  }>({
    name: "",
    price: 0,
    validityDays: 365,
    discountPercentage: 10,
    loyaltyMultiplier: 1.5,
  });

  const [assignCustomer, setAssignCustomer] = useState("");
  const [assignPlan, setAssignPlan] = useState("");

  const startEdit = (p: MembershipPlan) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      price: p.price,
      validityDays: p.validityDays,
      discountPercentage: p.discountPercentage,
      loyaltyMultiplier: p.loyaltyMultiplier,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    await updateMembershipPlan(id, editForm);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Membership Plans"
          value={String(membershipPlans.length)}
          subtitle="Configured loyalty tiers"
          icon={Crown}
        />
        <StatCard
          title="Subscribed VIPs"
          value={String(customers.filter((c) => c.membership !== "Standard").length)}
          subtitle="Silver & Gold tier clients"
          icon={Sparkles}
        />
        <StatCard
          title="Total Clients"
          value={String(customers.length)}
          subtitle="Registered customer base"
          icon={Users}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SectionPanel title="Create Membership Tier" subtitle="Define VIP club benefits and validity">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await submitAndReset(e.currentTarget, () => addMembershipPlan({
                name: String(form.get("name")),
                price: Number(form.get("price")),
                validityDays: Number(form.get("validityDays") || 365),
                discountPercentage: Number(form.get("discountPercentage") || 0),
                loyaltyMultiplier: Number(form.get("loyaltyMultiplier") || 1),
              }));
            }}
            className="grid gap-3 p-5 sm:grid-cols-3"
          >
            <input required name="name" placeholder="Tier Name (e.g. Platinum Club)" className={inputClass} />
            <input required name="price" type="number" placeholder="Plan Price (₹)" className={inputClass} />
            <input required name="validityDays" type="number" placeholder="Validity (Days)" defaultValue={365} className={inputClass} />
            <input required name="discountPercentage" type="number" placeholder="Discount (% on all services)" className={inputClass} />
            <input required name="loyaltyMultiplier" type="number" step="0.1" placeholder="Points Multiplier (e.g. 2.0x)" defaultValue={1.5} className={inputClass} />
            <button className={primaryButtonClass}>
              <Plus className="h-4 w-4" /> Create Tier
            </button>
          </form>
        </SectionPanel>

        <SectionPanel title="Assign Customer Membership" subtitle="Enroll or upgrade client tier">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!assignCustomer || !assignPlan) return;
              assignMembership(assignCustomer, assignPlan);
              setAssignCustomer("");
              setAssignPlan("");
            }}
            className="space-y-3 p-5"
          >
            <select
              required
              value={assignCustomer}
              onChange={(e) => setAssignCustomer(e.target.value)}
              className={inputClass}
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) — {c.membership}
                </option>
              ))}
            </select>
            <select
              required
              value={assignPlan}
              onChange={(e) => setAssignPlan(e.target.value)}
              className={inputClass}
            >
              <option value="">Select Membership Plan...</option>
              {membershipPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {money(p.price)} ({p.discountPercentage}% Off)
                </option>
              ))}
            </select>
            <button className={`${primaryButtonClass} w-full`}>
              <Crown className="h-4 w-4" /> Assign Membership Plan
            </button>
          </form>
        </SectionPanel>
      </div>

      <SectionPanel title="Configured Membership Plans" subtitle="Active loyalty tiers and perks">
        <DataTable heads={["Tier Name", "Price", "Validity", "Discount Perk", "Points Boost", "Actions"]} loading={moduleLoading.memberships}>
          {membershipPlans.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <tr key={p.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-medium text-foreground">
                  {isEditing ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={`${inputClass} py-1 text-xs`}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-3.5 font-semibold text-foreground">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                      className={`${inputClass} py-1 text-xs w-28`}
                    />
                  ) : (
                    money(p.price)
                  )}
                </td>
                <td className="px-6 py-3.5 text-foreground/70">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.validityDays}
                      onChange={(e) => setEditForm({ ...editForm, validityDays: Number(e.target.value) })}
                      className={`${inputClass} py-1 text-xs w-20`}
                    />
                  ) : (
                    `${p.validityDays} days`
                  )}
                </td>
                <td className="px-6 py-3.5 font-semibold text-emerald-600">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.discountPercentage}
                      onChange={(e) => setEditForm({ ...editForm, discountPercentage: Number(e.target.value) })}
                      className={`${inputClass} py-1 text-xs w-20`}
                    />
                  ) : (
                    `${p.discountPercentage}% Off`
                  )}
                </td>
                <td className="px-6 py-3.5 font-medium text-amber-700">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.loyaltyMultiplier}
                      onChange={(e) => setEditForm({ ...editForm, loyaltyMultiplier: Number(e.target.value) })}
                      className={`${inputClass} py-1 text-xs w-20`}
                    />
                  ) : (
                    `${p.loyaltyMultiplier}x points`
                  )}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(p.id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Save Changes"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <EditButton onClick={() => startEdit(p)} />
                        <DeleteButton onClick={() => deleteMembershipPlan(p.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {membershipPlans.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                No membership plans configured. Create one above.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 19. PURCHASE ORDERS VIEW (Phase 3)
// -------------------------------------------------------------
function PurchaseOrdersView() {
  const { purchaseOrders, suppliers, branches, inventory, addPurchaseOrder, receivePurchaseOrder, moduleLoading } = useERPStore();
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(100);

  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);
  const [receiptQuantities, setReceiptQuantities] = useState<Record<string, number>>({});

  const pendingOrders = purchaseOrders.filter((po) => po.status === "PENDING" || po.status === "PARTIALLY_RECEIVED");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Purchase Orders"
          value={String(purchaseOrders.length)}
          subtitle="Distributor restock orders"
          icon={ShoppingCart}
        />
        <StatCard
          title="Pending Inflow"
          value={String(pendingOrders.length)}
          subtitle="Awaiting inventory delivery"
          icon={Clock}
        />
        <StatCard
          title="Procurement Spend"
          value={money(purchaseOrders.reduce((s, po) => s + (po.totalAmount || 0), 0))}
          subtitle="Total distributor order value"
          icon={TrendingDown}
        />
      </div>

      <SectionPanel title="Raise Purchase Order" subtitle="Order restock inventory from suppliers & distributors">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedSupplier || !selectedItem) return;
            await addPurchaseOrder({
              supplierId: selectedSupplier,
              branchId: selectedBranch || null,
              expectedDate: expectedDate || null,
              items: [
                {
                  inventoryItemId: selectedItem,
                  quantity,
                  unitCost,
                },
              ],
            });
            setSelectedSupplier("");
            setSelectedItem("");
            setExpectedDate("");
          }}
          className="grid gap-3 p-5 sm:grid-cols-3"
        >
          <select
            required
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className={inputClass}
          >
            <option value="">Select Supplier / Distributor...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.phone})
              </option>
            ))}
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className={inputClass}
          >
            <option value="">Select Destination Branch (Optional)...</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            placeholder="Expected Delivery Date"
            className={inputClass}
          />

          <select
            required
            value={selectedItem}
            onChange={(e) => {
              setSelectedItem(e.target.value);
              const inv = inventory.find((i) => i.id === e.target.value);
              if (inv) setUnitCost(inv.unitCost);
            }}
            className={inputClass}
          >
            <option value="">Select Inventory SKU to Restock...</option>
            {inventory.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} (Current: {i.stock} in stock)
              </option>
            ))}
          </select>

          <input
            required
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="Order Quantity"
            className={inputClass}
          />

          <div className="flex gap-2">
            <input
              required
              type="number"
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              placeholder="Unit Cost (₹)"
              className={inputClass}
            />
            <button className={`${primaryButtonClass} shrink-0`}>
              <Plus className="h-4 w-4" /> Issue PO
            </button>
          </div>
        </form>
      </SectionPanel>

      <SectionPanel title="Purchase Orders Ledger" subtitle="Procurement tracking and goods receipt">
        <DataTable heads={["PO ID", "Supplier", "Items Ordered", "Total Cost", "Expected Date", "Status", "Actions"]} loading={moduleLoading.purchaseOrders}>
          {purchaseOrders.map((po) => {
            const supp = suppliers.find((s) => s.id === po.supplierId);
            const isReceiving = receivingOrderId === po.id;
            const canReceive = po.status !== "RECEIVED" && po.status !== "CANCELLED";

            return (
              <tr key={po.id} className="hover:bg-muted/60">
                <td className="px-6 py-3.5 font-mono text-xs font-semibold text-foreground">
                  {po.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-6 py-3.5 font-medium text-foreground">
                  {supp?.name ?? "Distributor"}
                </td>
                <td className="px-6 py-3.5 text-foreground/80">
                  {po.items?.map((item, idx) => {
                    const inv = inventory.find((i) => i.id === item.inventoryItemId);
                    return (
                      <span key={idx} className="block text-xs">
                        {inv?.name ?? "Item"} × <b>{item.quantity}</b> ({item.receivedQuantity || 0} received)
                      </span>
                    );
                  })}
                </td>
                <td className="px-6 py-3.5 font-semibold text-foreground">{money(po.totalAmount)}</td>
                <td className="px-6 py-3.5 text-muted-foreground text-xs">
                  {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString("en-IN") : "—"}
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      po.status === "RECEIVED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : po.status === "PARTIALLY_RECEIVED"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {po.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  {canReceive && (
                    <div className="flex items-center justify-end gap-2">
                      {isReceiving ? (
                        <div className="w-72 space-y-2 rounded-xl border border-border bg-muted/60 p-3 text-left">
                          <p className="text-xs font-semibold text-foreground/80">Receive each delivered item</p>
                          {po.items.map((item) => {
                            const remaining = item.quantity - (item.receivedQuantity || 0);
                            const inv = inventory.find((entry) => entry.id === item.inventoryItemId);
                            return <label key={item.inventoryItemId} className="flex items-center justify-between gap-2 text-xs text-foreground/70"><span className="min-w-0 truncate">{inv?.name ?? "Item"} <b>({remaining} left)</b></span><input type="number" min="0" max={remaining} value={receiptQuantities[item.inventoryItemId] ?? 0} onChange={(event) => setReceiptQuantities((current) => ({ ...current, [item.inventoryItemId]: Math.max(0, Math.min(remaining, Number(event.target.value) || 0)) }))} className={`${inputClass} w-16 px-2 py-1 text-xs`} /></label>;
                          })}
                          <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              const items = po.items.map((item) => ({ inventoryItemId: item.inventoryItemId, quantity: receiptQuantities[item.inventoryItemId] ?? 0 })).filter((item) => item.quantity > 0);
                              if (!items.length) return;
                              await receivePurchaseOrder(po.id, items);
                              setReceivingOrderId(null); setReceiptQuantities({});
                            }}
                            className="rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold hover:bg-emerald-700"
                          >
                            Receive selected
                          </button>
                          <button
                            type="button"
                            onClick={() => { setReceivingOrderId(null); setReceiptQuantities({}); }}
                            className="rounded-lg bg-muted/60 text-foreground/70 px-2 py-1 text-xs hover:bg-muted"
                          >
                            Cancel
                          </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReceivingOrderId(po.id);
                            setReceiptQuantities(Object.fromEntries(po.items.map((item) => [item.inventoryItemId, Math.max(0, item.quantity - (item.receivedQuantity || 0))])));
                          }}
                          className={`${primaryButtonClass} h-8 px-3 text-xs`}
                        >
                          <Boxes className="h-3.5 w-3.5" /> Receive Stock
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {purchaseOrders.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                No purchase orders raised yet.
              </td>
            </tr>
          )}
      </DataTable>
    </SectionPanel>
  </div>
  );
}

// -------------------------------------------------------------
// 20. PROFILE VIEW
// -------------------------------------------------------------
function ProfileView() {
  const { currentUser, currentSalon, subscription, features, website } = useERPStore();
  const featureLabels = features.map((code) =>
    code.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
  );

  return (
    <div className="space-y-6">
      <SectionPanel title="Account & Identity" subtitle="Logged in administrator profile">
        <div className="space-y-4 p-6 text-sm text-foreground/80">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-2xl font-bold text-white">
              {currentUser?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{currentUser?.name || "Salon Admin"}</h3>
              <p className="text-muted-foreground">{currentUser?.email || "admin@example.com"}</p>
              <span className="mt-1 inline-block rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-foreground/80">
                {currentUser?.role || "SALON_ADMIN"}
              </span>
            </div>
          </div>
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Salon Name:</span>
              <b className="text-foreground">{currentSalon?.name || "DropX Studio"}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Salon Code:</span>
              <b className="font-mono text-foreground">{currentSalon?.code || "salon"}</b>
            </div>
          </div>
        </div>
      </SectionPanel>
      <SectionPanel title="Plan & access" subtitle="Your current subscription and enabled capabilities">
        <div className="space-y-4 p-6 text-sm text-foreground/80">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
              <p className="mt-1 text-lg font-bold text-foreground">{subscription?.plan || "Not assigned"}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-1 text-lg font-bold text-foreground">{subscription?.status || "Unavailable"}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Website</p>
              <p className="mt-1 text-lg font-bold text-foreground">{website?.type || "Not configured"}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 font-semibold text-foreground">Included features</p>
            {featureLabels.length ? (
              <div className="flex flex-wrap gap-2">
                {featureLabels.map((label) => <span key={label} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{label}</span>)}
              </div>
            ) : <p className="text-muted-foreground">No premium features are enabled. Contact the platform administrator to upgrade your plan.</p>}
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-amber-950">Need more features?</p>
              <p className="mt-1 text-xs text-amber-800">Send an upgrade request to the platform team. Your plan will only change after approval.</p>
            </div>
            <a
              className={`${primaryButtonClass} shrink-0 h-8 px-3 text-xs`}
              href={`mailto:support@dropxcutz.com?subject=${encodeURIComponent(`Upgrade request - ${currentSalon?.name || "Salon"}`)}`}
            >
              Request upgrade
            </a>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
}
