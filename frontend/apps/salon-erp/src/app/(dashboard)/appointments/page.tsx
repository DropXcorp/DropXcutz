"use client";

import { useMemo, useState } from "react";
import AppointmentExport, { ExportType } from "@/src/components/appointments/AppointmentExport";
import AppointmentHeader from "@/src/components/appointments/AppointmentHeader";
import AppointmentOverview from "@/src/components/appointments/AppointmentOverview";
import AppointmentTable, { AppointmentTableItem } from "@/src/components/appointments/AppointmentTable";
import AppointmentToolbar from "@/src/components/appointments/AppointmentToolbar";
import AppointmentDrawer, { AppointmentFormData } from "@/src/components/appointments/drawer/AppointmentDrawer";
import { useERPStore } from "@/src/lib/erp-store";

const formatDate = (date: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
const formatTime = (time: string) => new Date(`2000-01-01T${time}`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

export default function AppointmentsPage() {
  const { appointments, employees, customers, saveAppointment: persistAppointment, addCustomer } = useERPStore();
  const [search, setSearch] = useState("");
  const [employee, setEmployee] = useState("all");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [date, setDate] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentTableItem | null>(null);

  const filteredAppointments = useMemo(() => appointments.filter((appointment) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || appointment.customer.name.toLowerCase().includes(query) || appointment.appointment.appointmentNumber.toLowerCase().includes(query);
    const matchesEmployee = employee === "all" || appointment.stylist.id === employee;
    const matchesStatus = status === "all" || appointment.status === status;
    const matchesSource = source === "all" || appointment.appointment.source === source;
    const day = new Date(appointment.schedule.date).getTime();
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const matchesDate = date === "all" || (date === "today" && day === now.getTime()) || (date === "tomorrow" && day === now.getTime() + 86400000) || (date === "week" && day >= now.getTime() && day < now.getTime() + 7 * 86400000) || (date === "month" && new Date(appointment.schedule.date).getMonth() === now.getMonth());
    return matchesSearch && matchesEmployee && matchesStatus && matchesSource && matchesDate;
  }), [appointments, date, employee, search, source, status]);

  const overview = useMemo(() => ({
    totalAppointments: appointments.length, totalTrend: "+12%",
    walkInAppointments: appointments.filter((item) => item.appointment.source === "Walk-in").length, walkInPercentage: `${Math.round((appointments.filter((item) => item.appointment.source === "Walk-in").length / Math.max(appointments.length, 1)) * 100)}%`,
    onlineAppointments: appointments.filter((item) => item.appointment.source === "Online").length, onlinePercentage: `${Math.round((appointments.filter((item) => item.appointment.source === "Online").length / Math.max(appointments.length, 1)) * 100)}%`,
    averageRevenue: Math.round(appointments.reduce((sum, item) => sum + item.payment.amount, 0) / Math.max(appointments.length, 1)), revenueTrend: "+8%",
  }), [appointments]);

  const saveAppointment = async (data: AppointmentFormData) => {
    const services = data.services.map(({ id, name }) => ({ id, name }));
    const duration = data.services.reduce((sum, item) => sum + item.durationMinutes, 0);
    if (selectedAppointment) {
      await persistAppointment({ ...selectedAppointment, customer: { ...selectedAppointment.customer, name: data.customerName }, services, schedule: { date: data.date, time: formatTime(data.time), duration: `${duration} mins` }, payment: { amount: data.totalAmount, status: selectedAppointment.payment.status } });
    } else {
      let customer = customers.find((item) => item.phone === data.customerPhone) ?? customers.find((item) => item.name.toLowerCase() === data.customerName.toLowerCase());
      if (!customer) customer = await addCustomer({ name: data.customerName, phone: data.customerPhone, membership: "Standard" });
      const stylist = employees.find((item) => item.active) ?? { id: "unassigned", name: "Unassigned", role: "" };
      await persistAppointment({ id: crypto.randomUUID(), customer: { id: customer.id, name: data.customerName, membership: customer.membership }, appointment: { appointmentNumber: "", source: "Walk-in" }, services, stylist: { id: stylist.id, name: stylist.name, designation: stylist.role }, schedule: { date: data.date, time: formatTime(data.time), duration: `${duration} mins` }, payment: { amount: data.totalAmount, status: "Pending" }, status: "Booked" });
    }
    setDrawerOpen(false); setSelectedAppointment(null);
  };

  const handleExport = (type: ExportType) => {
    if (type === "print") { window.print(); return; }
    const content = ["Appointment ID,Customer,Stylist,Date,Time,Amount,Status", ...filteredAppointments.map((item) => [item.appointment.appointmentNumber, item.customer.name, item.stylist.name, formatDate(item.schedule.date), item.schedule.time, item.payment.amount, item.status].map((value) => `\"${String(value).replaceAll('"', '""')}\"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    link.download = `appointments-${new Date().toISOString().slice(0, 10)}.${type === "excel" ? "csv" : type}`;
    link.click(); URL.revokeObjectURL(link.href);
  };

  return <div className="space-y-6"><AppointmentHeader refreshing={refreshing} onRefresh={() => { setRefreshing(true); window.setTimeout(() => setRefreshing(false), 500); }} onNewAppointment={() => { setSelectedAppointment(null); setDrawerOpen(true); }} /><AppointmentOverview data={overview} /><AppointmentToolbar search={search} employee={employee} status={status} source={source} date={date} onSearchChange={setSearch} onEmployeeChange={setEmployee} onStatusChange={setStatus} onSourceChange={setSource} onDateChange={setDate} onReset={() => { setSearch(""); setEmployee("all"); setStatus("all"); setSource("all"); setDate("all"); }} employees={[{ label: "All Employees", value: "all" }, ...employees.map((item) => ({ label: item.name, value: item.id }))]} statuses={[{ label: "All Status", value: "all" }, ...["Booked", "Confirmed", "Checked In", "In Progress", "Completed", "Cancelled"].map((value) => ({ label: value, value }))]} sources={[{ label: "All Sources", value: "all" }, { label: "Walk-in", value: "Walk-in" }, { label: "Online", value: "Online" }]} dates={[{ label: "All dates", value: "all" }, { label: "Today", value: "today" }, { label: "Tomorrow", value: "tomorrow" }, { label: "This Week", value: "week" }, { label: "This Month", value: "month" }]} exportAction={<AppointmentExport onExport={handleExport} />} /><AppointmentTable appointments={filteredAppointments} onRowClick={(item) => { setSelectedAppointment(item); setDrawerOpen(true); }} onCreateAppointment={() => { setSelectedAppointment(null); setDrawerOpen(true); }} /><AppointmentDrawer open={drawerOpen} mode={selectedAppointment ? "edit" : "create"} appointment={selectedAppointment} onClose={() => { setDrawerOpen(false); setSelectedAppointment(null); }} onSave={saveAppointment} /></div>;
}
