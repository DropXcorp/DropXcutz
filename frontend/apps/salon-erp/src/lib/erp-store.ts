"use client";

import { create } from "zustand";
import type { AppointmentTableItem } from "@/src/components/appointments/AppointmentTable";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  membership: "Standard" | "Silver" | "Gold";
  points: number;
  totalSpend: number;
  notes?: string | null;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string | null;
  baseSalary: number;
  active: boolean;
  isBookable?: boolean;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  isPublic?: boolean;
  stockItemId?: string;
  description?: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  unitCost: number;
};

export type Invoice = {
  id: string;
  invoiceNumber?: string;
  customerId: string;
  appointmentId?: string;
  amount: number;
  status: "Paid" | "Pending" | "Partially Paid" | "Refunded";
  createdAt: string;
};

export type PayrollRun = {
  id: string;
  employeeId: string;
  month: string;
  baseSalary: number;
  commission: number;
  status: "Draft" | "Paid";
};

export type Notification = {
  id: string;
  type: "APPOINTMENT" | "LOW_STOCK" | "PAYMENT" | "SYSTEM";
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  branchId?: string | null;
  notes?: string | null;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  checkIn: string;
  checkOut?: string | null;
  branchId?: string | null;
  totalHours?: number | null;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";
};

export type WebsiteSettings = {
  type: "NONE" | "TEMPLATE" | "CUSTOM";
  title?: string | null;
  description?: string | null;
  customDomain?: string | null;
  theme?: Record<string, unknown> | null;
  updatedAt?: string;
};

export type SalonIntegration = {
  id: string;
  isActive: boolean;
  allowedDomains: string[];
  publicKey: string;
  createdAt: string;
  updatedAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
};

export type Package = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  validityDays: number;
  isActive: boolean;
};

export type MembershipPlan = {
  id: string;
  name: string;
  price: number;
  validityDays: number;
  discountPercentage: number;
  loyaltyMultiplier: number;
};

export type Coupon = {
  id: string;
  code: string;
  description?: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minimumOrder: number;
  isActive: boolean;
  expiryDate?: string | null;
};

export type Review = {
  id: string;
  customerId: string;
  customerName?: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

export type PurchaseOrderItem = {
  inventoryItemId: string;
  quantity: number;
  receivedQuantity?: number;
  unitCost: number;
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  branchId?: string | null;
  totalAmount: number;
  status: "PENDING" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
  expectedDate?: string | null;
  receivedDate?: string | null;
  items: PurchaseOrderItem[];
};

export type SalonSettings = {
  salonName: string;
  legalName: string;
  gstin: string;
  logoUrl: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  currency: string;
  locale: string;
  timezone: string;
  taxRate: number;
  invoicePrefix: string;
  openingTime: string;
  closingTime: string;
  appointmentSlotMinutes: number;
  cancellationWindowHours: number;
  allowOnlineBooking: boolean;
  adminName: string;
  adminEmail: string;
  lowStockAlerts: boolean;
  dailyRevenueDigest: boolean;
};

export type ERPUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
};

export type ERPSalon = {
  id: string;
  code: string;
  name: string;
};

type Snapshot = {
  customers: Customer[];
  employees: Employee[];
  services: Service[];
  inventory: InventoryItem[];
  appointments: AppointmentTableItem[];
  invoices: Invoice[];
  payroll: PayrollRun[];
  notifications: Notification[];
  settings: SalonSettings;
  subscription: {
    plan: string;
    status: string;
    expiresAt: string | null;
  } | null;
  features: string[];
  website: { type: string } | null;
};

type ERPState = Snapshot & {
  branches: Branch[];
  expenses: Expense[];
  attendance: AttendanceRecord[];
  suppliers: Supplier[];
  packages: Package[];
  membershipPlans: MembershipPlan[];
  coupons: Coupon[];
  reviews: Review[];
  purchaseOrders: PurchaseOrder[];
  websiteSettings: WebsiteSettings | null;
  integration: SalonIntegration | null;
  currentUser: ERPUser | null;
  currentSalon: ERPSalon | null;
  subscription: Snapshot["subscription"];
  features: string[];
  website: Snapshot["website"];
  loading: boolean;
  hydrated: boolean;
  error: string | null;
  successMessage: string | null;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
  resetSession: () => void;
  setIdentity: (user: ERPUser, salon: ERPSalon | null) => void;

  // Customers
  addCustomer: (
    item: Omit<Customer, "id" | "points" | "totalSpend"> & { id?: string },
  ) => Promise<Customer>;
  updateCustomer: (id: string, item: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  adjustLoyalty: (
    customerId: string,
    points: number,
    reason: string,
  ) => Promise<void>;

  // Employees
  addEmployee: (item: Omit<Employee, "id">) => Promise<void>;
  updateEmployee: (id: string, item: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  // Services
  addService: (item: Omit<Service, "id">) => Promise<void>;
  updateService: (id: string, item: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // Inventory
  addInventory: (item: Omit<InventoryItem, "id">) => Promise<void>;
  updateInventory: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteInventory: (id: string) => Promise<void>;

  // Appointments
  saveAppointment: (item: AppointmentTableItem) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  // Invoices & Billing
  addInvoice: (
    item: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">,
  ) => Promise<void>;
  updateInvoice: (id: string, item: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Payroll
  addPayroll: (item: Omit<PayrollRun, "id">) => Promise<void>;
  updatePayroll: (id: string, item: Partial<PayrollRun>) => Promise<void>;
  deletePayroll: (id: string) => Promise<void>;

  // Settings & Notifications
  updateSettings: (settings: SalonSettings) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;

  // Extended Modules
  fetchBranches: () => Promise<void>;
  addBranch: (item: Omit<Branch, "id">) => Promise<void>;
  updateBranch: (id: string, item: Partial<Branch>) => Promise<void>;
  toggleBranchStatus: (id: string, active: boolean) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;

  fetchExpenses: () => Promise<void>;
  addExpense: (item: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (id: string, item: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  fetchAttendance: (filters?: { month?: string; date?: string }) => Promise<void>;
  recordAttendance: (input: {
    employeeId: string;
    status: AttendanceRecord["status"];
    branchId?: string | null;
    checkIn?: string;
  }) => Promise<void>;
  checkOutAttendance: (
    attendanceId: string,
    checkOut?: string,
  ) => Promise<void>;
  updateAttendance: (
    id: string,
    input: Partial<
      Pick<AttendanceRecord, "checkIn" | "checkOut" | "branchId" | "status">
    >,
  ) => Promise<void>;

  fetchWebsiteSettings: () => Promise<void>;
  saveWebsiteSettings: (input: WebsiteSettings) => Promise<void>;
  fetchIntegration: () => Promise<void>;
  createIntegration: (allowedDomains: string[]) => Promise<void>;
  updateIntegration: (
    id: string,
    input: Pick<SalonIntegration, "allowedDomains" | "isActive">,
  ) => Promise<void>;
  rotateIntegrationKey: (id: string) => Promise<void>;

  fetchSuppliers: () => Promise<void>;
  addSupplier: (item: Omit<Supplier, "id">) => Promise<void>;
  updateSupplier: (id: string, item: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  fetchPackages: () => Promise<void>;
  addPackage: (item: Omit<Package, "id">) => Promise<void>;
  updatePackage: (id: string, item: Partial<Package>) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;

  fetchMemberships: () => Promise<void>;
  addMembershipPlan: (item: Omit<MembershipPlan, "id">) => Promise<void>;
  updateMembershipPlan: (
    id: string,
    item: Partial<MembershipPlan>,
  ) => Promise<void>;
  deleteMembershipPlan: (id: string) => Promise<void>;
  assignMembership: (customerId: string, planId: string) => Promise<void>;

  fetchCoupons: () => Promise<void>;
  addCoupon: (item: Omit<Coupon, "id">) => Promise<void>;
  updateCoupon: (id: string, item: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;

  fetchReviews: () => Promise<void>;
  addReview: (item: Omit<Review, "id" | "createdAt">) => Promise<void>;

  fetchPurchaseOrders: () => Promise<void>;
  addPurchaseOrder: (input: {
    supplierId: string;
    branchId?: string | null;
    expectedDate?: string | null;
    items: { inventoryItemId: string; quantity: number; unitCost: number }[];
  }) => Promise<void>;
  receivePurchaseOrder: (
    id: string,
    items: { inventoryItemId: string; quantity: number }[],
  ) => Promise<void>;
};

const emptySettings: SalonSettings = {
  salonName: "DropX Studio",
  legalName: "",
  gstin: "",
  logoUrl: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  currency: "INR",
  locale: "en-IN",
  timezone: "Asia/Kolkata",
  taxRate: 18,
  invoicePrefix: "INV",
  openingTime: "09:00",
  closingTime: "20:00",
  appointmentSlotMinutes: 30,
  cancellationWindowHours: 4,
  allowOnlineBooking: true,
  adminName: "",
  adminEmail: "",
  lowStockAlerts: true,
  dailyRevenueDigest: true,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export async function erpApi<T>(path: string, init?: RequestInit): Promise<T> {
  const requestId = Math.random().toString(36).slice(2);
  window.dispatchEvent(new CustomEvent("dropxcutz:request-start", {
    detail: { requestId, button: document.activeElement instanceof HTMLButtonElement ? document.activeElement : null },
  }));
  try {
  const response = await fetch(`${API_URL}/erp${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      details?: Array<{ field?: string; message?: string }>;
    } | null;
    const details = payload?.details
      ?.map(
        (item) =>
          `${item.field || "request"}: ${item.message || "invalid value"}`,
      )
      .join("; ");
    throw new Error(
      details
        ? `${payload?.error ?? "Request failed."} ${details}`
        : (payload?.error ?? `Request failed (${response.status}).`),
    );
  }
  if (response.status === 204) return undefined as T;
  const json = await response.json();
  return (json.data ?? json) as T;
  } finally {
    window.dispatchEvent(new CustomEvent("dropxcutz:request-end", { detail: { requestId } }));
  }
}

const api = erpApi;

const replace = <T extends { id: string }>(items: T[], item: T) =>
  items.map((current) => (current.id === item.id ? item : current));
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "The request could not be completed.";
const toList = <T>(res: unknown): T[] => {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== "object") return [];
  const data = (res as { data?: unknown }).data;
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { data?: unknown }).data)
  )
    return (data as { data: T[] }).data;
  return [];
};

export const useERPStore = create<ERPState>((set, get) => ({
  customers: [],
  employees: [],
  services: [],
  inventory: [],
  appointments: [],
  invoices: [],
  payroll: [],
  notifications: [],
  settings: emptySettings,
  branches: [],
  expenses: [],
  attendance: [],
  suppliers: [],
  packages: [],
  membershipPlans: [],
  coupons: [],
  reviews: [],
  purchaseOrders: [],
  websiteSettings: null,
  integration: null,
  currentUser: null,
  currentSalon: null,
  subscription: null,
  features: [],
  website: null,
  loading: true,
  hydrated: false,
  error: null,
  successMessage: null,

  clearError: () => set({ error: null }),
  clearSuccess: () => set({ successMessage: null }),
  resetSession: () =>
    set({
      customers: [],
      employees: [],
      services: [],
      inventory: [],
      appointments: [],
      invoices: [],
      payroll: [],
      notifications: [],
      branches: [],
      expenses: [],
      attendance: [],
      suppliers: [],
      packages: [],
      membershipPlans: [],
      coupons: [],
      reviews: [],
      purchaseOrders: [],
      websiteSettings: null,
      integration: null,
      currentUser: null,
      currentSalon: null,
      subscription: null,
      features: [],
      website: null,
      settings: emptySettings,
      loading: false,
      hydrated: false,
      error: null,
      successMessage: null,
    }),
  setIdentity: (user, salon) => set({ currentUser: user, currentSalon: salon }),

  hydrate: async () => {
    if (get().hydrated) return;
    set({ loading: true, error: null });
    try {
      const snapshot = await api<Snapshot>("/bootstrap");
      set({
        ...snapshot,
        loading: false,
        hydrated: true,
      });
      // Background load auxiliary modules
      void get().fetchBranches();
      void get().fetchExpenses();
      void get().fetchAttendance();
      void get().fetchSuppliers();
      void get().fetchPackages();
      void get().fetchMemberships();
      void get().fetchCoupons();
      void get().fetchReviews();
      void get().fetchPurchaseOrders();
      if (snapshot.features.includes("WEBSITE_MANAGEMENT"))
        void get().fetchWebsiteSettings();
      if (snapshot.features.includes("API_INTEGRATIONS"))
        void get().fetchIntegration();
    } catch (error) {
      set({ loading: false, error: message(error) });
    }
  },

  refresh: async () => {
    try {
      const snapshot = await api<Snapshot>("/bootstrap");
      set({ ...snapshot, error: null });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addCustomer: async (input) => {
    try {
      const item = await api<Customer>("/customers", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        customers: [item, ...state.customers],
        error: null,
        successMessage: "Customer created successfully.",
      }));
      return item;
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  },

  updateCustomer: async (id, input) => {
    try {
      const item = await api<Customer>(`/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        customers: replace(state.customers, item),
        error: null,
        successMessage: "Customer updated.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deleteCustomer: async (id) => {
    try {
      await api(`/customers/${id}`, { method: "DELETE" });
      set((state) => ({
        customers: state.customers.filter((item) => item.id !== id),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  adjustLoyalty: async (customerId, points, reason) => {
    try {
      const updated = await api<Customer>(`/loyalty/${customerId}/adjust`, {
        method: "POST",
        body: JSON.stringify({ points, reason }),
      });
      set((state) => ({
        customers: replace(state.customers, updated),
        successMessage: `Adjusted ${points > 0 ? "+" : ""}${points} loyalty points.`,
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addEmployee: async (input) => {
    try {
      const item = await api<Employee>("/employees", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        employees: [...state.employees, item],
        error: null,
        successMessage: "Staff member added.",
      }));
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  },

  updateEmployee: async (id, input) => {
    try {
      const item = await api<Employee>(`/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        employees: replace(state.employees, item),
        error: null,
        successMessage: "Staff updated.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deleteEmployee: async (id) => {
    try {
      await api(`/employees/${id}`, { method: "DELETE" });
      set((state) => ({
        employees: state.employees.filter((item) => item.id !== id),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addService: async (input) => {
    try {
      const item = await api<Service>("/services", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        services: [...state.services, item],
        error: null,
        successMessage: "Service created.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  updateService: async (id, input) => {
    try {
      const item = await api<Service>(`/services/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        services: replace(state.services, item),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deleteService: async (id) => {
    try {
      await api(`/services/${id}`, { method: "DELETE" });
      set((state) => ({
        services: state.services.filter((item) => item.id !== id),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addInventory: async (input) => {
    try {
      const item = await api<InventoryItem>("/inventory", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        inventory: [...state.inventory, item],
        error: null,
        successMessage: "Inventory item added.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  updateInventory: async (id, input) => {
    try {
      const item = await api<InventoryItem>(`/inventory/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        inventory: replace(state.inventory, item),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deleteInventory: async (id) => {
    try {
      await api(`/inventory/${id}`, { method: "DELETE" });
      set((state) => ({
        inventory: state.inventory.filter((item) => item.id !== id),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  saveAppointment: async (input) => {
    const exists = get().appointments.some((item) => item.id === input.id);
    try {
      const item = await api<AppointmentTableItem>(
        exists ? `/appointments/${input.id}` : "/appointments",
        {
          method: exists ? "PUT" : "POST",
          body: JSON.stringify(input),
        },
      );
      set((state) => ({
        appointments: exists
          ? replace(state.appointments, item)
          : [item, ...state.appointments],
        error: null,
        successMessage: "Appointment saved successfully.",
      }));
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  },

  deleteAppointment: async (id) => {
    try {
      await api(`/appointments/${id}`, { method: "DELETE" });
      set((state) => ({
        appointments: state.appointments.filter((item) => item.id !== id),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addInvoice: async (input) => {
    try {
      const item = await api<Invoice>("/invoices", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        invoices: [item, ...state.invoices],
        appointments: input.appointmentId
          ? state.appointments.map((appointment) =>
              appointment.id === input.appointmentId
                ? {
                    ...appointment,
                    payment: {
                      ...appointment.payment,
                      status: item.status === "Paid" ? "Paid" : "Pending",
                    },
                  }
                : appointment,
            )
          : state.appointments,
        error: null,
        successMessage: "Invoice generated successfully.",
      }));
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  },

  updateInvoice: async (id, input) => {
    try {
      const item = await api<Invoice>(`/invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        invoices: replace(state.invoices, item),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deleteInvoice: async (id) => {
    try {
      await api(`/invoices/${id}`, { method: "DELETE" });
      set((state) => ({
        invoices: state.invoices.filter((item) => item.id !== id),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addPayroll: async (input) => {
    try {
      const item = await api<PayrollRun>("/payroll", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        payroll: [item, ...state.payroll],
        error: null,
        successMessage: "Payroll record created.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  updatePayroll: async (id, input) => {
    try {
      const item = await api<PayrollRun>(`/payroll/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        payroll: replace(state.payroll, item),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deletePayroll: async (id) => {
    try {
      await api(`/payroll/${id}`, { method: "DELETE" });
      set((state) => ({
        payroll: state.payroll.filter((item) => item.id !== id),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  updateSettings: async (settings) => {
    try {
      const item = await api<SalonSettings>("/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      set({
        settings: item,
        error: null,
        successMessage: "Settings updated successfully.",
      });
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  },

  markNotificationRead: async (id) => {
    try {
      const item = await api<Notification>(`/notifications/${id}/read`, {
        method: "PATCH",
      });
      set((state) => ({
        notifications: replace(state.notifications, item),
        error: null,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  // Extended Modules Actions
  fetchBranches: async () => {
    try {
      const data = await api<unknown>("/branches");
      set({ branches: toList<Branch>(data) });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addBranch: async (input) => {
    try {
      const item = await api<Branch>(`/branches`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        branches: [...state.branches, item],
        successMessage: "Branch added.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  updateBranch: async (id, input) => {
    try {
      const item = await api<Branch>(`/branches/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        branches: replace(state.branches, item),
        successMessage: "Branch updated.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  toggleBranchStatus: async (id, active) => {
    try {
      const item = await api<Branch>(
        `/branches/${id}/${active ? "activate" : "deactivate"}`,
        {
          method: "PATCH",
        },
      );
      set((state) => ({
        branches: replace(state.branches, item),
        successMessage: `Branch ${active ? "activated" : "deactivated"}.`,
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deleteBranch: async (id) => {
    try {
      await api(`/branches/${id}`, { method: "DELETE" });
      set((state) => ({
        branches: state.branches.filter((b) => b.id !== id),
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  fetchExpenses: async () => {
    try {
      const res = await api<unknown>("/expenses");
      set({ expenses: toList<Expense>(res) });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addExpense: async (input) => {
    try {
      const item = await api<Expense>("/expenses", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        expenses: [item, ...state.expenses],
        successMessage: "Expense logged.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  updateExpense: async (id, input) => {
    try {
      const item = await api<Expense>(`/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        expenses: replace(state.expenses, item),
        successMessage: "Expense updated.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deleteExpense: async (id) => {
    try {
      await api(`/expenses/${id}`, { method: "DELETE" });
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  fetchAttendance: async (filters) => {
    try {
      const params = new URLSearchParams({ limit: "100", ...(filters?.month ? { month: filters.month } : {}), ...(filters?.date ? { date: filters.date } : {}) });
      const res = await api<unknown>(`/attendance?${params}`);
      set({ attendance: toList<AttendanceRecord>(res) });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  recordAttendance: async (input) => {
    try {
      await api("/attendance/check-in", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await get().fetchAttendance();
      set({ successMessage: "Attendance recorded." });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  checkOutAttendance: async (attendanceId, checkOut) => {
    try {
      await api("/attendance/check-out", {
        method: "POST",
        body: JSON.stringify({
          attendanceId,
          ...(checkOut ? { checkOut } : {}),
        }),
      });
      await get().fetchAttendance();
      set({ successMessage: "Employee checked out." });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  updateAttendance: async (id, input) => {
    try {
      await api<AttendanceRecord>(`/attendance/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      await get().fetchAttendance();
      set({ successMessage: "Attendance record updated." });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  fetchWebsiteSettings: async () => {
    try {
      const item = await api<WebsiteSettings | null>("/website-settings");
      set({ websiteSettings: item });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  saveWebsiteSettings: async (input) => {
    try {
      const item = await api<WebsiteSettings>("/website-settings", {
        method: "PUT",
        body: JSON.stringify(input),
      });
      set({ websiteSettings: item, successMessage: "Website settings saved." });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  fetchIntegration: async () => {
    try {
      const item = await api<SalonIntegration | null>("/integrations");
      set({ integration: item });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  createIntegration: async (allowedDomains) => {
    try {
      const item = await api<SalonIntegration>("/integrations", {
        method: "POST",
        body: JSON.stringify({ allowedDomains }),
      });
      set({
        integration: item,
        successMessage:
          "Integration key created. Save it now; it will be masked after refresh.",
      });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  updateIntegration: async (id, input) => {
    try {
      const item = await api<SalonIntegration>(`/integrations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set({ integration: item, successMessage: "Integration updated." });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  rotateIntegrationKey: async (id) => {
    try {
      const item = await api<SalonIntegration>(
        `/integrations/${id}/rotate-key`,
        {
          method: "POST",
        },
      );
      set({
        integration: item,
        successMessage:
          "Integration key rotated. Update your external website now.",
      });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  fetchSuppliers: async () => {
    try {
      const res = await api<unknown>("/suppliers");
      set({ suppliers: toList<Supplier>(res) });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addSupplier: async (input) => {
    try {
      const item = await api<Supplier>("/suppliers", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        suppliers: [...state.suppliers, item],
        successMessage: "Supplier added.",
      }));
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  },

  updateSupplier: async (id, input) => {
    try {
      const item = await api<Supplier>(`/suppliers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        suppliers: replace(state.suppliers, item),
        successMessage: "Supplier updated.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deleteSupplier: async (id) => {
    try {
      await api(`/suppliers/${id}`, { method: "DELETE" });
      set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id),
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  fetchPackages: async () => {
    try {
      const data = await api<unknown>("/packages");
      set({ packages: toList<Package>(data) });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addPackage: async (input) => {
    try {
      const item = await api<Package>("/packages", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        packages: [...state.packages, item],
        successMessage: "Package created.",
      }));
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  },

  updatePackage: async (id, input) => {
    try {
      const item = await api<Package>(`/packages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        packages: replace(state.packages, item),
        successMessage: "Package updated.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deletePackage: async (id) => {
    try {
      await api(`/packages/${id}`, { method: "DELETE" });
      set((state) => ({
        packages: state.packages.filter((p) => p.id !== id),
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  fetchMemberships: async () => {
    try {
      const data = await api<unknown>("/memberships/plans");
      set({ membershipPlans: toList<MembershipPlan>(data) });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addMembershipPlan: async (input) => {
    try {
      const item = await api<MembershipPlan>("/memberships/plans", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        membershipPlans: [...state.membershipPlans, item],
        successMessage: "Membership tier added.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  updateMembershipPlan: async (id, input) => {
    try {
      const item = await api<MembershipPlan>(`/memberships/plans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        membershipPlans: replace(state.membershipPlans, item),
        successMessage: "Membership tier updated.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deleteMembershipPlan: async (id) => {
    try {
      await api(`/memberships/plans/${id}`, { method: "DELETE" });
      set((state) => ({
        membershipPlans: state.membershipPlans.filter((p) => p.id !== id),
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  assignMembership: async (customerId, planId) => {
    try {
      await api("/memberships/assign", {
        method: "POST",
        body: JSON.stringify({ customerId, membershipPlanId: planId }),
      });
      set({ successMessage: "Membership assigned to customer." });
      await get().refresh();
    } catch (error) {
      set({ error: message(error) });
    }
  },

  fetchCoupons: async () => {
    try {
      const data = await api<unknown>("/coupons");
      set({ coupons: toList<Coupon>(data) });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addCoupon: async (input) => {
    try {
      const item = await api<Coupon>("/coupons", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        coupons: [...state.coupons, item],
        successMessage: "Coupon created.",
      }));
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  },

  updateCoupon: async (id, input) => {
    try {
      const item = await api<Coupon>(`/coupons/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      set((state) => ({
        coupons: replace(state.coupons, item),
        successMessage: "Coupon updated.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  deleteCoupon: async (id) => {
    try {
      await api(`/coupons/${id}`, { method: "DELETE" });
      set((state) => ({
        coupons: state.coupons.filter((c) => c.id !== id),
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  fetchReviews: async () => {
    try {
      const data = await api<unknown>("/reviews");
      set({ reviews: toList<Review>(data) });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addReview: async (input) => {
    try {
      const item = await api<Review>("/reviews", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        reviews: [item, ...state.reviews],
        successMessage: "Review recorded.",
      }));
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  },

  fetchPurchaseOrders: async () => {
    try {
      const data = await api<unknown>("/purchase-orders");
      set({ purchaseOrders: toList<PurchaseOrder>(data) });
    } catch (error) {
      set({ error: message(error) });
    }
  },

  addPurchaseOrder: async (input) => {
    try {
      const item = await api<PurchaseOrder>("/purchase-orders", {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        purchaseOrders: [item, ...state.purchaseOrders],
        successMessage: "Purchase order created.",
      }));
    } catch (error) {
      set({ error: message(error) });
    }
  },

  receivePurchaseOrder: async (id, items) => {
    try {
      const item = await api<PurchaseOrder>(`/purchase-orders/${id}/receive`, {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      set((state) => ({
        purchaseOrders: replace(state.purchaseOrders, item),
        successMessage: "Items received into inventory.",
      }));
      // refresh inventory items
      await get().refresh();
    } catch (error) {
      set({ error: message(error) });
    }
  },
}));
