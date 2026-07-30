export type AppointmentStatus =
  | "Booked"
  | "Confirmed"
  | "Checked In"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "No Show";

export type PaymentStatus = "Paid" | "Pending";

export interface AppointmentService {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  membership?: string;
}

export interface Employee {
  id: string;
  name: string;
  designation?: string;
}
