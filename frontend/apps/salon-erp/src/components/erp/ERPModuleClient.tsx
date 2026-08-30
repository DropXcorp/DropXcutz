"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  CheckCircle2,
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
} from "@/src/lib/erp-store";
import { employeeForm, validationMessage } from "@/src/lib/form-validation";

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
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";
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
  const { error, successMessage, clearError, clearSuccess, features, hydrated } = useERPStore();
  const requiredFeature = moduleFeature[module];

  if (hydrated && requiredFeature && !features.includes(requiredFeature)) {
    return (
      <section className="mx-auto grid min-h-[50vh] max-w-lg place-items-center px-4 text-center">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <AlertCircle className="mx-auto h-9 w-9 text-amber-500" />
          <h1 className="mt-4 text-xl font-bold text-zinc-950">Module not included in your plan</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">Ask your platform administrator to enable {requiredFeature.replace(/_/g, " ")} for this salon.</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white">Return to dashboard</Link>
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
      {/* Toast Notification Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-800"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={clearSuccess}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Dismiss
            </button>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-800"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-xs font-semibold text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-zinc-950 text-white shadow-md shadow-zinc-950/10">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                {info.title}
              </h1>
              {info.badge && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 border border-zinc-200">
                  {info.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">{info.description}</p>
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
    <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-6 py-4">
        <div>
          <h2 className="font-semibold text-zinc-950 text-base">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
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
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-zinc-100 text-zinc-800">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </p>
        <p className="text-2xl font-bold tracking-tight text-zinc-950 mt-0.5">
          {value}
        </p>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function DataTable({
  heads,
  children,
}: {
  heads: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50/75 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
          <tr>
            {heads.map((head, idx) => (
              <th key={idx} className="px-6 py-3.5">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-700">{children}</tbody>
      </table>
    </div>
  );
}

function DeleteButton({ onClick }: { onClick: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    if (deleting || !window.confirm("Delete this record? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await onClick();
    } finally {
      setDeleting(false);
    }
  };
  return (
    <button
      type="button"
      onClick={() => void remove()}
      disabled={deleting}
      aria-busy={deleting}
      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-50"
      title={deleting ? "Deleting…" : "Delete record"}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
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

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, query]);

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
            await submitAndReset(e.currentTarget, () => addCustomer({
              name: String(form.get("name")),
              phone: String(form.get("phone")),
              email: String(form.get("email") || ""),
              membership: form.get("membership") as Customer["membership"],
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-4"
        >
          <input required name="name" placeholder="Full Name" className={inputClass} />
          <input required name="phone" placeholder="Phone Number" className={inputClass} />
          <input name="email" type="email" placeholder="Email (Optional)" className={inputClass} />
          <div className="flex gap-2">
            <select name="membership" defaultValue="Standard" className={inputClass}>
              <option value="Standard">Standard</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
            </select>
            <button className="flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 shrink-0">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </form>
      </SectionPanel>

      <SectionPanel
        title="Customer Directory"
        subtitle={`${filtered.length} client records`}
        action={
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name / phone..."
              className={`${inputClass} pl-9 py-1.5 text-xs`}
            />
          </div>
        }
      >
        <DataTable heads={["Name", "Phone", "Tier", "Points", "Lifetime Spend", "Actions"]}>
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-zinc-50/50">
              <td className="px-6 py-3.5 font-medium text-zinc-900">{c.name}</td>
              <td className="px-6 py-3.5 text-zinc-600">{c.phone}</td>
              <td className="px-6 py-3.5">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    c.membership === "Gold"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : c.membership === "Silver"
                      ? "bg-zinc-100 text-zinc-800 border border-zinc-200"
                      : "bg-zinc-50 text-zinc-600"
                  }`}
                >
                  {c.membership}
                </span>
              </td>
              <td className="px-6 py-3.5 font-semibold text-zinc-900">{c.points || 0} pts</td>
              <td className="px-6 py-3.5 font-medium text-zinc-900">{money(c.totalSpend || 0)}</td>
              <td className="px-6 py-3.5 text-right">
                <DeleteButton onClick={() => deleteCustomer(c.id)} />
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                No customers found.
              </td>
            </tr>
          )}
        </DataTable>
      </SectionPanel>
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
              e.currentTarget.reset();
            } catch (error) {
              useERPStore.setState({ error: validationMessage(error) });
            }
          }}
          className="grid gap-3 p-5 sm:grid-cols-5"
        >
          <input required name="name" placeholder="Staff Name" className={inputClass} />
          <input required name="role" placeholder="Role (e.g. Senior Stylist)" className={inputClass} />
          <input required name="phone" placeholder="Phone Number" className={inputClass} />
          <input required name="baseSalary" type="number" placeholder="Base Salary (₹)" className={inputClass} />
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Staff Directory" subtitle="Current salon staff and designations">
        <DataTable heads={["Name", "Role", "Contact", "Base Salary", "Status", "Actions"]}>
          {employees.map((e) => (
            <tr key={e.id} className="hover:bg-zinc-50/50">
              <td className="px-6 py-3.5 font-medium text-zinc-900">{e.name}</td>
              <td className="px-6 py-3.5 text-zinc-600">{e.role}</td>
              <td className="px-6 py-3.5 text-zinc-600">{e.phone}</td>
              <td className="px-6 py-3.5 font-medium text-zinc-900">{money(e.baseSalary)}</td>
              <td className="px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => updateEmployee(e.id, { active: !e.active })}
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer ${
                    e.active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-zinc-100 text-zinc-500"
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
              <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
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
          <label className="flex items-center gap-2 px-2 text-sm font-medium text-zinc-700"><input name="isPublic" type="checkbox" defaultChecked /> Show on website</label>
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Service Catalog" subtitle={`${services.length} active salon services`}>
        <DataTable heads={["Service Name", "Price", "Duration", "Website", "Actions"]}>
          {services.map((s) => {
            const isEditing = editingId === s.id;
            return (
              <tr key={s.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-medium text-zinc-900">
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
                <td className="px-6 py-3.5 font-semibold text-zinc-900">
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
                <td className="px-6 py-3.5 text-zinc-600">
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
                  {isEditing ? <label className="flex items-center gap-2 text-zinc-700"><input type="checkbox" checked={editForm.isPublic} onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })} /> Visible</label> : <span className={s.isPublic ?? true ? "text-emerald-700" : "text-zinc-400"}>{s.isPublic ?? true ? "Visible" : "Hidden"}</span>}
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
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
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
              <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
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
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Stock Inventory" subtitle="Live on-shelf quantities and reorder thresholds">
        <DataTable heads={["Product / Item", "SKU", "In Stock", "Reorder Level", "Unit Cost", "Total Value", "Actions"]}>
          {inventory.map((item) => {
            const isLow = item.stock <= item.reorderLevel;
            return (
              <tr key={item.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-medium text-zinc-900">{item.name}</td>
                <td className="px-6 py-3.5 text-xs font-mono text-zinc-500">{item.sku}</td>
                <td className="px-6 py-3.5 font-semibold text-zinc-900">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                      isLow ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {item.stock} units
                  </span>
                </td>
                <td className="px-6 py-3.5 text-zinc-500">{item.reorderLevel} units</td>
                <td className="px-6 py-3.5 text-zinc-600">{money(item.unitCost)}</td>
                <td className="px-6 py-3.5 font-medium text-zinc-900">{money(item.stock * item.unitCost)}</td>
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
  const { invoices, customers, appointments, addInvoice, deleteInvoice } = useERPStore();
  const [invoiceAppointmentId, setInvoiceAppointmentId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  const downloadInvoice = (invoice: Invoice) => {
    const customer = customers.find((item) => item.id === invoice.customerId);
    const appointment = appointments.find((item) => item.id === invoice.appointmentId);
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${invoice.invoiceNumber ?? "Invoice"}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#18181b}h1{margin-bottom:4px}.muted{color:#71717a}.row{display:flex;justify-content:space-between;border-bottom:1px solid #e4e4e7;padding:12px 0}.total{font-size:22px;font-weight:700}</style></head><body><h1>Salon Invoice</h1><div class="muted">${invoice.invoiceNumber ?? "INV-DRAFT"} · ${invoice.createdAt}</div><hr><p><b>Customer:</b> ${customer?.name ?? "Walk-in Guest"}<br><b>Phone:</b> ${customer?.phone ?? "—"}</p>${appointment ? `<p><b>Appointment:</b> ${appointment.appointment.appointmentNumber}<br><b>Service:</b> ${appointment.services.map((service) => service.name).join(", ")}</p>` : ""}<div class="row"><span>Payment status</span><b>${invoice.status}</b></div><div class="row total"><span>Total</span><span>${money(invoice.amount)}</span></div><p class="muted">Thank you for visiting us.</p></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.invoiceNumber ?? "invoice"}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const collected = invoices
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Invoiced"
          value={money(invoices.reduce((s, i) => s + i.amount, 0))}
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
          value={money(
            invoices
              .filter((i) => i.status === "Pending" || i.status === "Partially Paid")
              .reduce((s, i) => s + i.amount, 0)
          )}
          subtitle="Awaiting settlement"
          icon={CreditCard}
        />
      </div>

      <SectionPanel title="Quick Counter Invoice" subtitle="Generate walk-in or appointment invoice">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await addInvoice({
              customerId: String(form.get("customerId")),
              appointmentId: invoiceAppointmentId || undefined,
              amount: invoiceAppointmentId ? Number(invoiceAmount) : Number(form.get("amount")),
              status: form.get("status") as Invoice["status"],
            });
            e.currentTarget.reset();
            setInvoiceAppointmentId("");
            setInvoiceAmount("");
          }}
          className="grid gap-3 p-5 sm:grid-cols-4"
        >
          <select required name="customerId" className={inputClass}>
            <option value="">Select Customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
          <select name="appointmentId" className={inputClass} value={invoiceAppointmentId} onChange={(event) => {
            const id = event.target.value;
            setInvoiceAppointmentId(id);
            const appointment = appointments.find((item) => item.id === id);
            const amount = appointment ? String(appointment.payment.amount) : "";
            setInvoiceAmount(amount);
            const amountInput = event.currentTarget.form?.elements.namedItem("amount") as HTMLInputElement | null;
            if (amountInput) amountInput.value = amount;
          }}>
            <option value="">Link appointment (optional)...</option>
            {appointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.appointment.appointmentNumber} — {appointment.customer.name}</option>)}
          </select>
          <input required name="amount" type="number" placeholder="Total Amount (₹)" className={inputClass} />
          <select name="status" defaultValue="Paid" className={inputClass}>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Issue Invoice
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Invoices Record" subtitle="Chronological salon billing receipts">
        <DataTable heads={["Invoice #", "Customer", "Amount", "Issued Date", "Status", "Actions"]}>
          {invoices.map((inv) => {
            const cust = customers.find((c) => c.id === inv.customerId);
            return (
              <tr key={inv.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-mono text-xs font-semibold text-zinc-900">
                  {inv.invoiceNumber ?? "INV-DRAFT"}
                </td>
                <td className="px-6 py-3.5 font-medium text-zinc-900">
                  {cust?.name ?? "Walk-in Guest"}
                </td>
                <td className="px-6 py-3.5 font-semibold text-zinc-900">{money(inv.amount)}</td>
                <td className="px-6 py-3.5 text-zinc-500">{inv.createdAt}</td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      inv.status === "Paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : inv.status === "Pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button type="button" title="Download invoice" onClick={() => downloadInvoice(inv)} className="mr-3 inline-flex rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950">
                    <Download className="h-4 w-4" />
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
          <input required name="month" type="month" defaultValue={new Date().toISOString().slice(0, 7)} className={inputClass} />
          <input name="baseSalary" type="number" placeholder="Base Salary (₹)" className={inputClass} />
          <input name="commission" type="number" placeholder="Commission (₹)" className={inputClass} />
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
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
              <tr key={p.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-medium text-zinc-900">{emp?.name ?? "Employee"}</td>
                <td className="px-6 py-3.5 text-zinc-600">{p.month}</td>
                <td className="px-6 py-3.5 text-zinc-600">{money(p.baseSalary)}</td>
                <td className="px-6 py-3.5 text-emerald-600 font-medium">{money(p.commission)}</td>
                <td className="px-6 py-3.5 font-bold text-zinc-900">{money(p.baseSalary + p.commission)}</td>
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
              <td colSpan={7} className="px-6 py-8 text-center text-zinc-400">
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
  const { branches, addBranch, updateBranch, toggleBranchStatus, deleteBranch } = useERPStore();
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
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Add Branch
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Salon Outlets" subtitle={`${branches.length} configured locations`}>
        <DataTable heads={["Branch Name", "Code", "City", "Phone", "Status", "Actions"]}>
          {branches.map((b) => {
            const isEditing = editingId === b.id;
            const isActive = b.status === "ACTIVE";
            return (
              <tr key={b.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-medium text-zinc-900">
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
                <td className="px-6 py-3.5 font-mono text-xs text-zinc-500">
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
                <td className="px-6 py-3.5 text-zinc-600">
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
                <td className="px-6 py-3.5 text-zinc-600">
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
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200"
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
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
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
              <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
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
  const { attendance, employees, recordAttendance } = useERPStore();

  return (
    <div className="space-y-6">
      <SectionPanel title="Punch Attendance" subtitle="Record daily check-in and attendance status">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await submitAndReset(e.currentTarget, () => recordAttendance({
              employeeId: String(form.get("employeeId")),
              status: form.get("status") as AttendanceRecord["status"],
            }));
          }}
          className="grid gap-3 p-5 sm:grid-cols-3"
        >
          <select required name="employeeId" className={inputClass}>
            <option value="">Select Employee...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue="PRESENT" className={inputClass}>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Record Check-In
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Today's Attendance Logs" subtitle="Staff clock-in records">
        <DataTable heads={["Staff Name", "Date / Time", "Status"]}>
          {attendance.map((a) => {
            const emp = employees.find((e) => e.id === a.employeeId);
            return (
              <tr key={a.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-medium text-zinc-900">{emp?.name ?? a.employeeName ?? "Staff"}</td>
                <td className="px-6 py-3.5 text-zinc-500">{new Date(a.date || a.checkIn).toLocaleString("en-IN")}</td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      a.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-800"
                        : a.status === "LATE"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            );
          })}
          {attendance.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-8 text-center text-zinc-400">
                No attendance recorded today.
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
  const { expenses, addExpense, updateExpense, deleteExpense } = useERPStore();
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
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Save Expense
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Expense Ledger" subtitle="Detailed spending log">
        <DataTable heads={["Expense Title", "Category", "Amount", "Actions"]}>
          {expenses.map((e) => {
            const isEditing = editingId === e.id;
            return (
              <tr key={e.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-medium text-zinc-900">
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
                <td className="px-6 py-3.5 text-xs text-zinc-500 font-semibold">
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
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
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
              <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">
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
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useERPStore();
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
            const form = new FormData(e.currentTarget);
            await addSupplier({
              name: String(form.get("name")),
              contactPerson: String(form.get("contactPerson")),
              phone: String(form.get("phone")),
              email: String(form.get("email")),
            });
            e.currentTarget.reset();
          }}
          className="grid gap-3 p-5 sm:grid-cols-5"
        >
          <input required name="name" placeholder="Company Name" className={inputClass} />
          <input name="contactPerson" placeholder="Representative Name" className={inputClass} />
          <input required name="phone" placeholder="Phone" className={inputClass} />
          <input name="email" type="email" placeholder="Email" className={inputClass} />
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Add Vendor
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Vendor Directory" subtitle={`${suppliers.length} active suppliers`}>
        <DataTable heads={["Supplier", "Representative", "Phone", "Email", "Actions"]}>
          {suppliers.map((s) => {
            const isEditing = editingId === s.id;
            return (
              <tr key={s.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-medium text-zinc-900">
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
                <td className="px-6 py-3.5 text-zinc-600">
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
                <td className="px-6 py-3.5 text-zinc-600">
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
                <td className="px-6 py-3.5 text-zinc-500">
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
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
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
              <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
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
  const { packages, addPackage, updatePackage, deletePackage } = useERPStore();
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
            const form = new FormData(e.currentTarget);
            await addPackage({
              name: String(form.get("name")),
              description: String(form.get("description")),
              price: Number(form.get("price")),
              validityDays: Number(form.get("validityDays") || 30),
              isActive: true,
            });
            e.currentTarget.reset();
          }}
          className="grid gap-3 p-5 sm:grid-cols-5"
        >
          <input required name="name" placeholder="Package Name (e.g. Bridal Glow)" className={inputClass} />
          <input name="description" placeholder="Description" className={inputClass} />
          <input required name="price" type="number" placeholder="Package Price (₹)" className={inputClass} />
          <input required name="validityDays" type="number" placeholder="Validity (Days)" defaultValue={30} className={inputClass} />
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Create Package
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Available Packages" subtitle="Promotional bundles">
        <DataTable heads={["Package Name", "Description", "Price", "Validity", "Status", "Actions"]}>
          {packages.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <tr key={p.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-medium text-zinc-900">
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
                <td className="px-6 py-3.5 text-zinc-500">
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
                <td className="px-6 py-3.5 font-semibold text-zinc-900">
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
                <td className="px-6 py-3.5 text-zinc-600">
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
                        : "bg-zinc-100 text-zinc-500"
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
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
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
              <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
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
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useERPStore();
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
            const form = new FormData(e.currentTarget);
            await addCoupon({
              code: String(form.get("code")).toUpperCase().trim(),
              discountType: form.get("discountType") as Coupon["discountType"],
              discountValue: Number(form.get("discountValue")),
              minimumOrder: Number(form.get("minOrderAmount") || 0),
              isActive: true,
            });
            e.currentTarget.reset();
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
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Add Coupon
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Active Coupons" subtitle="Promotional codes">
        <DataTable heads={["Coupon Code", "Type", "Discount", "Min Spend", "Status", "Actions"]}>
          {coupons.map((c) => {
            const isEditing = editingId === c.id;
            return (
              <tr key={c.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-mono font-bold text-zinc-950">
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
                <td className="px-6 py-3.5 text-xs text-zinc-500">
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
                <td className="px-6 py-3.5 text-zinc-600">
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
                        : "bg-zinc-100 text-zinc-500"
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
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
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
              <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
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
  const { reviews, customers, addReview } = useERPStore();

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
            const form = new FormData(e.currentTarget);
            await addReview({
              customerId: String(form.get("customerId")),
              rating: Number(form.get("rating")),
              comment: String(form.get("comment")),
            });
            e.currentTarget.reset();
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
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Plus className="h-4 w-4" /> Save Review
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Customer Testimonials" subtitle="Feedback history">
        <DataTable heads={["Customer", "Rating", "Comment", "Date"]}>
          {reviews.map((r) => {
            const cust = customers.find((c) => c.id === r.customerId);
            return (
              <tr key={r.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-medium text-zinc-900">{cust?.name ?? r.customerName ?? "Client"}</td>
                <td className="px-6 py-3.5 text-amber-500 font-bold">{"★".repeat(r.rating)}</td>
                <td className="px-6 py-3.5 text-zinc-700 italic">&ldquo;{r.comment || "Great service!"}&rdquo;</td>
                <td className="px-6 py-3.5 text-zinc-400 text-xs">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
                </td>
              </tr>
            );
          })}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">
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
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Gift className="h-4 w-4" /> Apply Points
          </button>
        </form>
      </SectionPanel>

      <SectionPanel title="Customer Loyalty Standings" subtitle="Points balances and membership tiers">
        <DataTable heads={["Customer", "Phone", "Tier", "Points Balance", "Estimated Value"]}>
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-zinc-50/50">
              <td className="px-6 py-3.5 font-medium text-zinc-900">{c.name}</td>
              <td className="px-6 py-3.5 text-zinc-600">{c.phone}</td>
              <td className="px-6 py-3.5 font-semibold text-amber-700">{c.membership}</td>
              <td className="px-6 py-3.5 font-bold text-zinc-900">{c.points || 0} pts</td>
              <td className="px-6 py-3.5 text-zinc-500">{money((c.points || 0) * 0.5)}</td>
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
  const { invoices, expenses, payroll, appointments } = useERPStore();

  const totalRevenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalPayroll = payroll
    .filter((p) => p.status === "Paid")
    .reduce((s, p) => s + p.baseSalary + p.commission, 0);

  const netProfit = totalRevenue - totalExpense - totalPayroll;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          title="Gross Revenue"
          value={money(totalRevenue)}
          subtitle="Collected receipts"
          icon={TrendingUp}
        />
        <StatCard
          title="Operating Expenses"
          value={money(totalExpense)}
          subtitle="Supplies, rent & misc"
          icon={TrendingDown}
        />
        <StatCard
          title="Paid Payroll"
          value={money(totalPayroll)}
          subtitle="Staff payouts"
          icon={Wallet}
        />
        <StatCard
          title="Net Profit"
          value={money(netProfit)}
          subtitle={netProfit >= 0 ? "Profitable operations" : "Operating deficit"}
          icon={BarChart3}
        />
      </div>

      <SectionPanel title="Financial Performance Summary" subtitle="Key metrics calculated from live transactions">
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5">
            <h3 className="font-semibold text-zinc-900">Appointments Performance</h3>
            <div className="space-y-2 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Total Bookings:</span>
                <b className="text-zinc-900">{appointments.length}</b>
              </div>
              <div className="flex justify-between">
                <span>Completed Visits:</span>
                <b className="text-zinc-900">
                  {appointments.filter((a) => a.status === "Completed").length}
                </b>
              </div>
              <div className="flex justify-between">
                <span>Walk-in Share:</span>
                <b className="text-zinc-900">
                  {Math.round(
                    (appointments.filter((a) => a.appointment.source === "Walk-in").length /
                      Math.max(appointments.length, 1)) *
                      100
                  )}
                  %
                </b>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5">
            <h3 className="font-semibold text-zinc-900">Average Transaction Size</h3>
            <div className="space-y-2 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Average Invoice Value:</span>
                <b className="text-zinc-900">
                  {money(
                    invoices.length
                      ? Math.round(
                          invoices.reduce((s, i) => s + i.amount, 0) / invoices.length
                        )
                      : 0
                  )}
                </b>
              </div>
              <div className="flex justify-between">
                <span>Paid Rate:</span>
                <b className="text-emerald-700">
                  {Math.round(
                    (invoices.filter((i) => i.status === "Paid").length /
                      Math.max(invoices.length, 1)) *
                      100
                  )}
                  %
                </b>
              </div>
            </div>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
}

// -------------------------------------------------------------
// 16. NOTIFICATIONS VIEW
// -------------------------------------------------------------
function NotificationsView() {
  const { notifications, markNotificationRead } = useERPStore();

  return (
    <div className="space-y-6">
      <SectionPanel title="Notifications Inbox" subtitle={`${notifications.length} alerts received`}>
        <div className="divide-y divide-zinc-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-center justify-between p-5 transition-colors ${
                !n.readAt ? "bg-amber-50/30" : "bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-zinc-100 text-zinc-700">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 text-sm">{n.title}</h4>
                  <p className="text-xs text-zinc-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              {!n.readAt && (
                <button
                  type="button"
                  onClick={() => markNotificationRead(n.id)}
                  className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 transition"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="p-8 text-center text-zinc-400 text-sm">
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
              Business Identity & Branding
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
              Physical Location & Regional Settings
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  City
                </label>
                <input
                  value={formState.city || ""}
                  onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  State
                </label>
                <input
                  value={formState.state || ""}
                  onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Postal / PIN Code
                </label>
                <input
                  value={formState.postalCode || ""}
                  onChange={(e) => setFormState({ ...formState, postalCode: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Currency Code
                </label>
                <input
                  value={formState.currency || "INR"}
                  onChange={(e) => setFormState({ ...formState, currency: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Locale
                </label>
                <input
                  value={formState.locale || "en-IN"}
                  onChange={(e) => setFormState({ ...formState, locale: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
              Billing & Invoicing Defaults
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
              Operating Hours & Booking Policies
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
              Automations & Preferences
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 transition">
                <input
                  type="checkbox"
                  checked={formState.allowOnlineBooking ?? true}
                  onChange={(e) => setFormState({ ...formState, allowOnlineBooking: e.target.checked })}
                  className="h-4 w-4 rounded text-zinc-950 focus:ring-zinc-950"
                />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Allow Online Booking</p>
                  <p className="text-xs text-zinc-500">Enable client self-service scheduling</p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 transition">
                <input
                  type="checkbox"
                  checked={formState.lowStockAlerts ?? true}
                  onChange={(e) => setFormState({ ...formState, lowStockAlerts: e.target.checked })}
                  className="h-4 w-4 rounded text-zinc-950 focus:ring-zinc-950"
                />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Low Stock Notifications</p>
                  <p className="text-xs text-zinc-500">Alert staff when items hit reorder level</p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 transition">
                <input
                  type="checkbox"
                  checked={formState.dailyRevenueDigest ?? true}
                  onChange={(e) => setFormState({ ...formState, dailyRevenueDigest: e.target.checked })}
                  className="h-4 w-4 rounded text-zinc-950 focus:ring-zinc-950"
                />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Daily Revenue Digest</p>
                  <p className="text-xs text-zinc-500">Send end-of-day summary reports</p>
                </div>
              </label>
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-xl bg-zinc-950 px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 shadow-md transition">
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
  const { membershipPlans, customers, addMembershipPlan, updateMembershipPlan, deleteMembershipPlan, assignMembership } = useERPStore();
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
            <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
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
            <button className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
              <Crown className="h-4 w-4" /> Assign Membership Plan
            </button>
          </form>
        </SectionPanel>
      </div>

      <SectionPanel title="Configured Membership Plans" subtitle="Active loyalty tiers and perks">
        <DataTable heads={["Tier Name", "Price", "Validity", "Discount Perk", "Points Boost", "Actions"]}>
          {membershipPlans.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <tr key={p.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-medium text-zinc-900">
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
                <td className="px-6 py-3.5 font-semibold text-zinc-900">
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
                <td className="px-6 py-3.5 text-zinc-600">
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
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
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
              <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
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
  const { purchaseOrders, suppliers, branches, inventory, addPurchaseOrder, receivePurchaseOrder } = useERPStore();
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(100);

  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);
  const [receiveQty, setReceiveQty] = useState(0);

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
            <button className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 shrink-0">
              <Plus className="h-4 w-4" /> Issue PO
            </button>
          </div>
        </form>
      </SectionPanel>

      <SectionPanel title="Purchase Orders Ledger" subtitle="Procurement tracking and goods receipt">
        <DataTable heads={["PO ID", "Supplier", "Items Ordered", "Total Cost", "Expected Date", "Status", "Actions"]}>
          {purchaseOrders.map((po) => {
            const supp = suppliers.find((s) => s.id === po.supplierId);
            const isReceiving = receivingOrderId === po.id;
            const canReceive = po.status !== "RECEIVED" && po.status !== "CANCELLED";

            return (
              <tr key={po.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-3.5 font-mono text-xs font-semibold text-zinc-900">
                  {po.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-6 py-3.5 font-medium text-zinc-900">
                  {supp?.name ?? "Distributor"}
                </td>
                <td className="px-6 py-3.5 text-zinc-700">
                  {po.items?.map((item, idx) => {
                    const inv = inventory.find((i) => i.id === item.inventoryItemId);
                    return (
                      <span key={idx} className="block text-xs">
                        {inv?.name ?? "Item"} × <b>{item.quantity}</b> ({item.receivedQuantity || 0} received)
                      </span>
                    );
                  })}
                </td>
                <td className="px-6 py-3.5 font-semibold text-zinc-900">{money(po.totalAmount)}</td>
                <td className="px-6 py-3.5 text-zinc-500 text-xs">
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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={receiveQty}
                            onChange={(e) => setReceiveQty(Number(e.target.value))}
                            placeholder="Qty"
                            className={`${inputClass} py-1 text-xs w-16`}
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const firstItem = po.items?.[0];
                              if (firstItem && receiveQty > 0) {
                                await receivePurchaseOrder(po.id, [
                                  {
                                    inventoryItemId: firstItem.inventoryItemId,
                                    quantity: receiveQty,
                                  },
                                ]);
                              }
                              setReceivingOrderId(null);
                            }}
                            className="rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold hover:bg-emerald-700"
                          >
                            Receive
                          </button>
                          <button
                            type="button"
                            onClick={() => setReceivingOrderId(null)}
                            className="rounded-lg bg-zinc-100 text-zinc-600 px-2 py-1 text-xs hover:bg-zinc-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReceivingOrderId(po.id);
                            const firstItem = po.items?.[0];
                            const remaining = (firstItem?.quantity || 0) - (firstItem?.receivedQuantity || 0);
                            setReceiveQty(Math.max(1, remaining));
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
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
              <td colSpan={7} className="px-6 py-8 text-center text-zinc-400">
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
  const { currentUser, currentSalon } = useERPStore();

  return (
    <div className="space-y-6">
      <SectionPanel title="Account & Identity" subtitle="Logged in administrator profile">
        <div className="space-y-4 p-6 text-sm text-zinc-700">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-zinc-950 text-2xl font-bold text-white">
              {currentUser?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-950">{currentUser?.name || "Salon Admin"}</h3>
              <p className="text-zinc-500">{currentUser?.email || "admin@example.com"}</p>
              <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                {currentUser?.role || "SALON_ADMIN"}
              </span>
            </div>
          </div>
          <div className="border-t border-zinc-100 pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-500">Salon Name:</span>
              <b className="text-zinc-950">{currentSalon?.name || "DropX Studio"}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Salon Code:</span>
              <b className="font-mono text-zinc-950">{currentSalon?.code || "salon"}</b>
            </div>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
}
