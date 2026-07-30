"use client";

import { create } from "zustand";
import type { AppointmentTableItem } from "@/src/components/appointments/AppointmentTable";

export type Customer = { id: string; name: string; phone: string; membership: "Standard" | "Silver" | "Gold"; points: number; totalSpend: number };
export type Employee = { id: string; name: string; role: string; phone: string; baseSalary: number; active: boolean };
export type Service = { id: string; name: string; price: number; durationMinutes: number; stockItemId?: string };
export type InventoryItem = { id: string; name: string; sku: string; stock: number; reorderLevel: number; unitCost: number };
export type Invoice = { id: string; invoiceNumber?: string; customerId: string; appointmentId?: string; amount: number; status: "Paid" | "Pending" | "Partially Paid" | "Refunded"; createdAt: string };
export type PayrollRun = { id: string; employeeId: string; month: string; baseSalary: number; commission: number; status: "Draft" | "Paid" };
export type Notification = { id: string; type: "APPOINTMENT" | "LOW_STOCK" | "PAYMENT" | "SYSTEM"; title: string; message: string; readAt: string | null; createdAt: string };
export type SalonSettings = {
  salonName: string; legalName: string; gstin: string; logoUrl: string;
  phone: string; email: string; website: string; address: string; city: string; state: string; postalCode: string;
  currency: string; locale: string; timezone: string; taxRate: number; invoicePrefix: string;
  openingTime: string; closingTime: string; appointmentSlotMinutes: number; cancellationWindowHours: number; allowOnlineBooking: boolean;
  adminName: string; adminEmail: string; lowStockAlerts: boolean; dailyRevenueDigest: boolean;
};

type Snapshot = {
  customers: Customer[]; employees: Employee[]; services: Service[]; inventory: InventoryItem[];
  appointments: AppointmentTableItem[]; invoices: Invoice[]; payroll: PayrollRun[]; notifications: Notification[]; settings: SalonSettings;
};

type ERPState = Snapshot & {
  loading: boolean; hydrated: boolean; error: string | null;
  hydrate: () => Promise<void>; clearError: () => void;
  addCustomer: (item: Omit<Customer, "id" | "points" | "totalSpend"> & { id?: string }) => Promise<Customer>;
  updateCustomer: (id: string, item: Partial<Customer>) => Promise<void>; deleteCustomer: (id: string) => Promise<void>;
  addEmployee: (item: Omit<Employee, "id">) => Promise<void>; updateEmployee: (id: string, item: Partial<Employee>) => Promise<void>; deleteEmployee: (id: string) => Promise<void>;
  addService: (item: Omit<Service, "id">) => Promise<void>; updateService: (id: string, item: Partial<Service>) => Promise<void>; deleteService: (id: string) => Promise<void>;
  addInventory: (item: Omit<InventoryItem, "id">) => Promise<void>; updateInventory: (id: string, item: Partial<InventoryItem>) => Promise<void>; deleteInventory: (id: string) => Promise<void>;
  saveAppointment: (item: AppointmentTableItem) => Promise<void>; deleteAppointment: (id: string) => Promise<void>;
  addInvoice: (item: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">) => Promise<void>; updateInvoice: (id: string, item: Partial<Invoice>) => Promise<void>; deleteInvoice: (id: string) => Promise<void>;
  addPayroll: (item: Omit<PayrollRun, "id">) => Promise<void>; updatePayroll: (id: string, item: Partial<PayrollRun>) => Promise<void>; deletePayroll: (id: string) => Promise<void>;
  updateSettings: (settings: SalonSettings) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
};

const emptySettings: SalonSettings = {
  salonName: "DropX Studio", legalName: "", gstin: "", logoUrl: "", phone: "", email: "", website: "", address: "", city: "", state: "", postalCode: "",
  currency: "INR", locale: "en-IN", timezone: "Asia/Kolkata", taxRate: 18, invoicePrefix: "INV", openingTime: "09:00", closingTime: "20:00",
  appointmentSlotMinutes: 30, cancellationWindowHours: 4, allowOnlineBooking: true, adminName: "", adminEmail: "", lowStockAlerts: true, dailyRevenueDigest: true,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/erp${path}`, {
    ...init,
    credentials: "include", headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json() as { data: T }).data;
}

const replace = <T extends { id: string }>(items: T[], item: T) => items.map((current) => current.id === item.id ? item : current);
const message = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";

export const useERPStore = create<ERPState>((set, get) => ({
  customers: [], employees: [], services: [], inventory: [], appointments: [], invoices: [], payroll: [], notifications: [], settings: emptySettings,
  loading: true, hydrated: false, error: null,
  clearError: () => set({ error: null }),
  hydrate: async () => {
    if (get().hydrated) return;
    set({ loading: true, error: null });
    try { set({ ...(await api<Snapshot>("/bootstrap")), loading: false, hydrated: true }); }
    catch (error) { set({ loading: false, error: message(error) }); }
  },
  addCustomer: async (input) => {
    try {
      const item = await api<Customer>("/customers", { method: "POST", body: JSON.stringify(input) });
      set((state) => ({ customers: [item, ...state.customers], error: null })); return item;
    } catch (error) { set({ error: message(error) }); throw error; }
  },
  updateCustomer: async (id, input) => { try { const item = await api<Customer>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(input) }); set((state) => ({ customers: replace(state.customers, item), error: null })); } catch (error) { set({ error: message(error) }); } },
  deleteCustomer: async (id) => { try { await api(`/customers/${id}`, { method: "DELETE" }); set((state) => ({ customers: state.customers.filter((item) => item.id !== id), error: null })); } catch (error) { set({ error: message(error) }); } },
  addEmployee: async (input) => { try { const item = await api<Employee>("/employees", { method: "POST", body: JSON.stringify(input) }); set((state) => ({ employees: [...state.employees, item], error: null })); } catch (error) { set({ error: message(error) }); } },
  updateEmployee: async (id, input) => { try { const item = await api<Employee>(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(input) }); set((state) => ({ employees: replace(state.employees, item), error: null })); } catch (error) { set({ error: message(error) }); } },
  deleteEmployee: async (id) => { try { await api(`/employees/${id}`, { method: "DELETE" }); set((state) => ({ employees: state.employees.filter((item) => item.id !== id), error: null })); } catch (error) { set({ error: message(error) }); } },
  addService: async (input) => { try { const item = await api<Service>("/services", { method: "POST", body: JSON.stringify(input) }); set((state) => ({ services: [...state.services, item], error: null })); } catch (error) { set({ error: message(error) }); } },
  updateService: async (id, input) => { try { const item = await api<Service>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(input) }); set((state) => ({ services: replace(state.services, item), error: null })); } catch (error) { set({ error: message(error) }); } },
  deleteService: async (id) => { try { await api(`/services/${id}`, { method: "DELETE" }); set((state) => ({ services: state.services.filter((item) => item.id !== id), error: null })); } catch (error) { set({ error: message(error) }); } },
  addInventory: async (input) => { try { const item = await api<InventoryItem>("/inventory", { method: "POST", body: JSON.stringify(input) }); set((state) => ({ inventory: [...state.inventory, item], error: null })); } catch (error) { set({ error: message(error) }); } },
  updateInventory: async (id, input) => { try { const item = await api<InventoryItem>(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(input) }); set((state) => ({ inventory: replace(state.inventory, item), error: null })); } catch (error) { set({ error: message(error) }); } },
  deleteInventory: async (id) => { try { await api(`/inventory/${id}`, { method: "DELETE" }); set((state) => ({ inventory: state.inventory.filter((item) => item.id !== id), error: null })); } catch (error) { set({ error: message(error) }); } },
  saveAppointment: async (input) => {
    const exists = get().appointments.some((item) => item.id === input.id);
    try { const item = await api<AppointmentTableItem>(exists ? `/appointments/${input.id}` : "/appointments", { method: exists ? "PUT" : "POST", body: JSON.stringify(input) }); set((state) => ({ appointments: exists ? replace(state.appointments, item) : [item, ...state.appointments], error: null })); }
    catch (error) { set({ error: message(error) }); throw error; }
  },
  deleteAppointment: async (id) => { try { await api(`/appointments/${id}`, { method: "DELETE" }); set((state) => ({ appointments: state.appointments.filter((item) => item.id !== id), error: null })); } catch (error) { set({ error: message(error) }); } },
  addInvoice: async (input) => { try { const item = await api<Invoice>("/invoices", { method: "POST", body: JSON.stringify(input) }); set((state) => ({ invoices: [item, ...state.invoices], error: null })); } catch (error) { set({ error: message(error) }); } },
  updateInvoice: async (id, input) => { try { const item = await api<Invoice>(`/invoices/${id}`, { method: "PATCH", body: JSON.stringify(input) }); set((state) => ({ invoices: replace(state.invoices, item), error: null })); } catch (error) { set({ error: message(error) }); } },
  deleteInvoice: async (id) => { try { await api(`/invoices/${id}`, { method: "DELETE" }); set((state) => ({ invoices: state.invoices.filter((item) => item.id !== id), error: null })); } catch (error) { set({ error: message(error) }); } },
  addPayroll: async (input) => { try { const item = await api<PayrollRun>("/payroll", { method: "POST", body: JSON.stringify(input) }); set((state) => ({ payroll: [item, ...state.payroll], error: null })); } catch (error) { set({ error: message(error) }); } },
  updatePayroll: async (id, input) => { try { const item = await api<PayrollRun>(`/payroll/${id}`, { method: "PATCH", body: JSON.stringify(input) }); set((state) => ({ payroll: replace(state.payroll, item), error: null })); } catch (error) { set({ error: message(error) }); } },
  deletePayroll: async (id) => { try { await api(`/payroll/${id}`, { method: "DELETE" }); set((state) => ({ payroll: state.payroll.filter((item) => item.id !== id), error: null })); } catch (error) { set({ error: message(error) }); } },
  updateSettings: async (settings) => { try { const item = await api<SalonSettings>("/settings", { method: "PUT", body: JSON.stringify(settings) }); set({ settings: item, error: null }); } catch (error) { set({ error: message(error) }); } },
  markNotificationRead: async (id) => { try { const item = await api<Notification>(`/notifications/${id}/read`, { method: "PATCH" }); set((state) => ({ notifications: replace(state.notifications, item), error: null })); } catch (error) { set({ error: message(error) }); } },
}));
