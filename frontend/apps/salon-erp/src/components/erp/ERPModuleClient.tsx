"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  CreditCard,
  Gift,
  Plus,
  Save,
  Scissors,
  Settings,
  ShieldCheck,
  Trash2,
  UserCircle,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useERPStore, type SalonSettings } from "@/src/lib/erp-store";

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
  | "super-admin";
const meta: Record<
  Module,
  { title: string; description: string; icon: typeof Users }
> = {
  customers: {
    title: "Customers",
    description: "Customer profiles, loyalty points and lifetime value.",
    icon: Users,
  },
  employees: {
    title: "Employees",
    description: "Team profiles, roles and salary settings.",
    icon: UserCog,
  },
  services: {
    title: "Services",
    description: "Service catalogue with prices and durations.",
    icon: Scissors,
  },
  inventory: {
    title: "Inventory",
    description: "Stock, purchase cost and reorder alerts.",
    icon: Boxes,
  },
  billing: {
    title: "Billing",
    description: "Invoices and payment collection.",
    icon: CreditCard,
  },
  payroll: {
    title: "Payroll",
    description: "Salary and commission runs.",
    icon: Wallet,
  },
  reports: {
    title: "Reports",
    description: "Live business metrics calculated from ERP data.",
    icon: BarChart3,
  },
  loyalty: {
    title: "Loyalty",
    description: "Customer memberships, points and redeemable value.",
    icon: Gift,
  },
  notifications: {
    title: "Notifications",
    description: "Appointment, payment, inventory and system alerts.",
    icon: Bell,
  },
  settings: {
    title: "Company settings",
    description:
      "Business identity, finance, bookings, admin and notifications.",
    icon: Settings,
  },
  profile: {
    title: "Profile",
    description: "Salon administrator and company contact details.",
    icon: UserCircle,
  },
  "super-admin": {
    title: "Super Admin",
    description: "Live company control center and operational overview.",
    icon: ShieldCheck,
  },
};
const input =
  "w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900";
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function ERPModuleClient({ module }: { module: Module }) {
  const info = meta[module];
  const Icon = info.icon;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-zinc-900 p-3 text-white">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{info.title}</h1>
            <p className="text-sm text-zinc-500">{info.description}</p>
          </div>
        </div>
      </div>
      {module === "customers" && <Customers />}
      {module === "employees" && <Employees />}
      {module === "services" && <Services />}
      {module === "inventory" && <Inventory />}
      {module === "billing" && <Billing />}
      {module === "payroll" && <Payroll />}
      {module === "reports" && <Reports />}
      {module === "loyalty" && <Loyalty />}
      {module === "notifications" && <Notifications />}
      {module === "settings" && <SettingsForm />}
      {module === "profile" && <Profile />}
      {module === "super-admin" && <SuperAdmin />}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-6 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
function Form({
  children,
  onSubmit,
}: {
  children: React.ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-3 p-5 md:grid-cols-4">
      {children}
      <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
        <Plus className="h-4 w-4" />
        Add
      </button>
    </form>
  );
}
function Delete({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
      aria-label="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
function Table({
  heads,
  children,
}: {
  heads: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
          <tr>
            {heads.map((head) => (
              <th key={head} className="px-5 py-3 font-semibold">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">{children}</tbody>
      </table>
    </div>
  );
}

function Customers() {
  const { customers, addCustomer, deleteCustomer } = useERPStore();
  return (
    <>
      <Panel title="Add customer">
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            addCustomer({
              name: String(data.get("name")),
              phone: String(data.get("phone")),
              membership: String(data.get("membership")) as
                | "Standard"
                | "Silver"
                | "Gold",
            });
            event.currentTarget.reset();
          }}
        >
          <input
            required
            name="name"
            placeholder="Customer name"
            className={input}
          />
          <input
            required
            name="phone"
            placeholder="Phone number"
            className={input}
          />
          <select name="membership" className={input}>
            <option>Standard</option>
            <option>Silver</option>
            <option>Gold</option>
          </select>
        </Form>
      </Panel>
      <Panel title="Customer directory">
        <Table
          heads={[
            "Customer",
            "Phone",
            "Membership",
            "Points",
            "Lifetime spend",
            "",
          ]}
        >
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td className="px-5 py-4 font-medium">{customer.name}</td>
              <td className="px-5 py-4">{customer.phone}</td>
              <td className="px-5 py-4">{customer.membership}</td>
              <td className="px-5 py-4">{customer.points}</td>
              <td className="px-5 py-4">{money(customer.totalSpend)}</td>
              <td className="px-5 py-4">
                <Delete onClick={() => deleteCustomer(customer.id)} />
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
function Employees() {
  const { employees, addEmployee, deleteEmployee } = useERPStore();
  return (
    <>
      <Panel title="Add employee">
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            addEmployee({
              name: String(data.get("name")),
              role: String(data.get("role")),
              phone: String(data.get("phone")),
              baseSalary: Number(data.get("salary")),
              active: true,
            });
            event.currentTarget.reset();
          }}
        >
          <input
            required
            name="name"
            placeholder="Employee name"
            className={input}
          />
          <input required name="role" placeholder="Role" className={input} />
          <input required name="phone" placeholder="Phone" className={input} />
          <input
            required
            min="0"
            type="number"
            name="salary"
            placeholder="Monthly salary"
            className={input}
          />
        </Form>
      </Panel>
      <Panel title="Team">
        <Table
          heads={["Employee", "Role", "Phone", "Base salary", "Status", ""]}
        >
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className="px-5 py-4 font-medium">{employee.name}</td>
              <td className="px-5 py-4">{employee.role}</td>
              <td className="px-5 py-4">{employee.phone}</td>
              <td className="px-5 py-4">{money(employee.baseSalary)}</td>
              <td className="px-5 py-4">
                {employee.active ? "Active" : "Inactive"}
              </td>
              <td className="px-5 py-4">
                <Delete onClick={() => deleteEmployee(employee.id)} />
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
function Services() {
  const { services, inventory, addService, deleteService } = useERPStore();
  return (
    <>
      <Panel title="Add service">
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            addService({
              name: String(data.get("name")),
              price: Number(data.get("price")),
              durationMinutes: Number(data.get("duration")),
              stockItemId: String(data.get("stock")) || undefined,
            });
            event.currentTarget.reset();
          }}
        >
          <input
            required
            name="name"
            placeholder="Service name"
            className={input}
          />
          <input
            required
            min="0"
            type="number"
            name="price"
            placeholder="Price"
            className={input}
          />
          <input
            required
            min="5"
            type="number"
            name="duration"
            placeholder="Duration (min)"
            className={input}
          />
          <select name="stock" className={input}>
            <option value="">No stock item</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Form>
      </Panel>
      <Panel title="Service catalogue">
        <Table heads={["Service", "Price", "Duration", "Linked stock", ""]}>
          {services.map((service) => (
            <tr key={service.id}>
              <td className="px-5 py-4 font-medium">{service.name}</td>
              <td className="px-5 py-4">{money(service.price)}</td>
              <td className="px-5 py-4">{service.durationMinutes} min</td>
              <td className="px-5 py-4">
                {inventory.find((item) => item.id === service.stockItemId)
                  ?.name ?? "—"}
              </td>
              <td className="px-5 py-4">
                <Delete onClick={() => deleteService(service.id)} />
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
function Inventory() {
  const { inventory, addInventory, deleteInventory } = useERPStore();
  return (
    <>
      <Panel title="Add stock item">
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            addInventory({
              name: String(data.get("name")),
              sku: String(data.get("sku")),
              stock: Number(data.get("stock")),
              reorderLevel: Number(data.get("reorder")),
              unitCost: Number(data.get("cost")),
            });
            event.currentTarget.reset();
          }}
        >
          <input
            required
            name="name"
            placeholder="Item name"
            className={input}
          />
          <input required name="sku" placeholder="SKU" className={input} />
          <input
            required
            min="0"
            type="number"
            name="stock"
            placeholder="In stock"
            className={input}
          />
          <input
            required
            min="0"
            type="number"
            name="reorder"
            placeholder="Reorder level"
            className={input}
          />
          <input
            required
            min="0"
            type="number"
            name="cost"
            placeholder="Unit cost"
            className={input}
          />
        </Form>
      </Panel>
      <Panel title="Stock levels">
        <Table heads={["Item", "SKU", "Stock", "Reorder at", "Unit cost", ""]}>
          {inventory.map((item) => (
            <tr
              key={item.id}
              className={item.stock <= item.reorderLevel ? "bg-amber-50" : ""}
            >
              <td className="px-5 py-4 font-medium">{item.name}</td>
              <td className="px-5 py-4">{item.sku}</td>
              <td className="px-5 py-4">{item.stock}</td>
              <td className="px-5 py-4">{item.reorderLevel}</td>
              <td className="px-5 py-4">{money(item.unitCost)}</td>
              <td className="px-5 py-4">
                <Delete onClick={() => deleteInventory(item.id)} />
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
function Billing() {
  const { customers, appointments, invoices, addInvoice, deleteInvoice } =
    useERPStore();
  return (
    <>
      <Panel title="Create invoice">
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            addInvoice({
              customerId: String(data.get("customer")),
              appointmentId: String(data.get("appointment")) || undefined,
              amount: Number(data.get("amount")),
              status: String(data.get("status")) as "Paid" | "Pending",
            });
            event.currentTarget.reset();
          }}
        >
          <select required name="customer" className={input}>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <select name="appointment" className={input}>
            <option value="">No appointment</option>
            {appointments.map((appointment) => (
              <option key={appointment.id} value={appointment.id}>
                {appointment.appointment.appointmentNumber}
              </option>
            ))}
          </select>
          <input
            required
            min="0"
            type="number"
            name="amount"
            placeholder="Amount"
            className={input}
          />
          <select name="status" className={input}>
            <option>Paid</option>
            <option>Pending</option>
          </select>
        </Form>
      </Panel>
      <Panel title="Invoices">
        <Table
          heads={["Invoice", "Customer", "Appointment", "Amount", "Status", ""]}
        >
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="px-5 py-4 font-medium">
                {invoice.id.slice(0, 8)}
              </td>
              <td className="px-5 py-4">
                {customers.find((item) => item.id === invoice.customerId)
                  ?.name ?? "Deleted customer"}
              </td>
              <td className="px-5 py-4">
                {appointments.find((item) => item.id === invoice.appointmentId)
                  ?.appointment.appointmentNumber ?? "—"}
              </td>
              <td className="px-5 py-4">{money(invoice.amount)}</td>
              <td className="px-5 py-4">{invoice.status}</td>
              <td className="px-5 py-4">
                <Delete onClick={() => deleteInvoice(invoice.id)} />
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
function Payroll() {
  const { employees, appointments, payroll, addPayroll, deletePayroll } =
    useERPStore();
  return (
    <>
      <Panel title="Create payroll run">
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const employee = employees.find(
              (item) => item.id === String(data.get("employee")),
            );
            if (!employee) return;
            const commission = appointments
              .filter(
                (item) =>
                  item.stylist.id === employee.id &&
                  item.status === "Completed",
              )
              .reduce((sum, item) => sum + item.payment.amount * 0.1, 0);
            addPayroll({
              employeeId: employee.id,
              month: String(data.get("month")),
              baseSalary: employee.baseSalary,
              commission,
              status: "Draft",
            });
            event.currentTarget.reset();
          }}
        >
          <select required name="employee" className={input}>
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          <input required type="month" name="month" className={input} />
        </Form>
      </Panel>
      <Panel title="Payroll runs">
        <Table
          heads={[
            "Employee",
            "Month",
            "Base salary",
            "Commission",
            "Total",
            "Status",
            "",
          ]}
        >
          {payroll.map((run) => (
            <tr key={run.id}>
              <td className="px-5 py-4 font-medium">
                {employees.find((item) => item.id === run.employeeId)?.name ??
                  "Deleted employee"}
              </td>
              <td className="px-5 py-4">{run.month}</td>
              <td className="px-5 py-4">{money(run.baseSalary)}</td>
              <td className="px-5 py-4">{money(run.commission)}</td>
              <td className="px-5 py-4">
                {money(run.baseSalary + run.commission)}
              </td>
              <td className="px-5 py-4">{run.status}</td>
              <td className="px-5 py-4">
                <Delete onClick={() => deletePayroll(run.id)} />
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
function Reports() {
  const { customers, employees, inventory, appointments, invoices, payroll } =
    useERPStore();
  const metrics = useMemo(
    () => [
      { label: "Customers", value: customers.length },
      { label: "Appointments", value: appointments.length },
      {
        label: "Paid revenue",
        value: money(
          invoices
            .filter((item) => item.status === "Paid")
            .reduce((sum, item) => sum + item.amount, 0),
        ),
      },
      {
        label: "Low stock items",
        value: inventory.filter((item) => item.stock <= item.reorderLevel)
          .length,
      },
      {
        label: "Active employees",
        value: employees.filter((item) => item.active).length,
      },
      {
        label: "Payroll liability",
        value: money(
          payroll.reduce(
            (sum, item) => sum + item.baseSalary + item.commission,
            0,
          ),
        ),
      },
    ],
    [
      appointments.length,
      customers.length,
      employees,
      inventory,
      invoices,
      payroll,
    ],
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-zinc-500">{metric.label}</p>
          <p className="mt-2 text-2xl font-bold">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}
function Loyalty() {
  const customers = useERPStore((state) => state.customers);
  return (
    <Panel title="Customer loyalty balances">
      <Table heads={["Customer", "Phone", "Tier", "Points", "Redeem value"]}>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td className="px-5 py-4 font-medium">{customer.name}</td>
            <td className="px-5 py-4">{customer.phone}</td>
            <td className="px-5 py-4">{customer.membership}</td>
            <td className="px-5 py-4">
              {customer.points.toLocaleString("en-IN")}
            </td>
            <td className="px-5 py-4">{money(customer.points / 2)}</td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
function Notifications() {
  const { notifications, markNotificationRead } = useERPStore();
  return (
    <Panel title="Latest alerts">
      <div className="divide-y divide-zinc-100">
        {notifications.length === 0 && (
          <p className="p-8 text-center text-sm text-zinc-500">
            No notifications yet.
          </p>
        )}
        {notifications.map((item) => (
          <button
            type="button"
            onClick={() => void markNotificationRead(item.id)}
            key={item.id}
            className={`block w-full p-5 text-left hover:bg-zinc-50 ${item.readAt ? "opacity-60" : "bg-blue-50/40"}`}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold">{item.title}</p>
              <span className="text-xs text-zinc-500">
                {new Date(item.createdAt).toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">{item.message}</p>
          </button>
        ))}
      </div>
    </Panel>
  );
}
function Profile() {
  const settings = useERPStore((state) => state.settings);
  return (
    <Panel title="Administrator profile">
      <div className="grid gap-6 p-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-zinc-500">Administrator</p>
          <p className="mt-1 text-lg font-semibold">{settings.adminName}</p>
          <p className="text-sm text-zinc-600">{settings.adminEmail}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">Salon contact</p>
          <p className="mt-1 text-lg font-semibold">{settings.salonName}</p>
          <p className="text-sm text-zinc-600">
            {settings.phone} · {settings.email}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">Location</p>
          <p className="mt-1 text-sm">
            {[
              settings.address,
              settings.city,
              settings.state,
              settings.postalCode,
            ]
              .filter(Boolean)
              .join(", ") || "Not configured"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">Business hours</p>
          <p className="mt-1 text-sm">
            {settings.openingTime}–{settings.closingTime} · {settings.timezone}
          </p>
        </div>
      </div>
    </Panel>
  );
}
function SettingsForm() {
  const settings = useERPStore((state) => state.settings);
  return <SettingsEditor key={JSON.stringify(settings)} initial={settings} />;
}
function SettingsEditor({ initial }: { initial: SalonSettings }) {
  const updateSettings = useERPStore((state) => state.updateSettings);
  const [form, setForm] = useState(initial);
  const text = (key: keyof SalonSettings, label: string, type = "text") => (
    <label className="text-sm font-medium text-zinc-700">
      {label}
      <input
        type={type}
        value={String(form[key])}
        onChange={(event) =>
          setForm({
            ...form,
            [key]:
              type === "number"
                ? Number(event.target.value)
                : event.target.value,
          })
        }
        className={`${input} mt-1`}
      />
    </label>
  );
  const toggle = (
    key: "allowOnlineBooking" | "lowStockAlerts" | "dailyRevenueDigest",
    label: string,
  ) => (
    <label className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 text-sm font-medium">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={form[key]}
        onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
      />
    </label>
  );
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        updateSettings(form);
      }}
      className="space-y-6"
    >
      <Panel title="Company identity">
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {text("salonName", "Display name")}
          {text("legalName", "Legal company name")}
          {text("gstin", "GSTIN")}
          {text("logoUrl", "Logo URL")}
        </div>
      </Panel>
      <Panel title="Contact and address">
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {text("phone", "Phone")}
          {text("email", "Email", "email")}
          {text("website", "Website")}
          {text("address", "Street address")}
          {text("city", "City")}
          {text("state", "State")}
          {text("postalCode", "Postal code")}
        </div>
      </Panel>
      <Panel title="Finance and localization">
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {text("currency", "Currency")}
          {text("locale", "Locale")}
          {text("timezone", "Timezone")}
          {text("taxRate", "Tax rate (%)", "number")}
          {text("invoicePrefix", "Invoice prefix")}
        </div>
      </Panel>
      <Panel title="Bookings and notifications">
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {text("openingTime", "Opening time", "time")}
          {text("closingTime", "Closing time", "time")}
          {text(
            "appointmentSlotMinutes",
            "Appointment slot (minutes)",
            "number",
          )}
          {text(
            "cancellationWindowHours",
            "Cancellation window (hours)",
            "number",
          )}
          {toggle("allowOnlineBooking", "Enable online bookings")}
          {toggle("lowStockAlerts", "Low-stock alerts")}
          {toggle("dailyRevenueDigest", "Daily revenue digest")}
        </div>
      </Panel>
      <Panel title="Super admin contact">
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {text("adminName", "Admin name")}
          {text("adminEmail", "Admin email", "email")}
        </div>
      </Panel>
      <button className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white">
        <Save className="h-4 w-4" />
        Save all company settings
      </button>
    </form>
  );
}
function SuperAdmin() {
  const { settings, customers, employees, appointments, invoices, inventory } =
    useERPStore();
  const paidRevenue = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const lowStock = inventory.filter((item) => item.stock <= item.reorderLevel);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          ["Customers", customers.length],
          ["Employees", employees.filter((item) => item.active).length],
          ["Appointments", appointments.length],
          ["Paid revenue", money(paidRevenue)],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <Panel title="Live company profile">
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-zinc-500">Company</p>
            <p className="mt-1 text-lg font-semibold">{settings.salonName}</p>
            <p className="text-sm text-zinc-600">{settings.legalName}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Super admin</p>
            <p className="mt-1 text-lg font-semibold">{settings.adminName}</p>
            <p className="text-sm text-zinc-600">{settings.adminEmail}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Business settings</p>
            <p className="mt-1 text-sm">
              {settings.currency} · {settings.timezone} · {settings.taxRate}%
              tax
            </p>
            <p className="text-sm text-zinc-600">
              {settings.openingTime}–{settings.closingTime} ·{" "}
              {settings.appointmentSlotMinutes}-minute slots
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Alerts</p>
            <p className="mt-1 text-sm">
              {lowStock.length} low-stock item{lowStock.length === 1 ? "" : "s"}
            </p>
            <p className="text-sm text-zinc-600">
              Online booking:{" "}
              {settings.allowOnlineBooking ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
      </Panel>
    </>
  );
}
