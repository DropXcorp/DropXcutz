"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppointmentExport, {
  ExportType,
} from "@/src/components/appointments/AppointmentExport";
import AppointmentHeader from "@/src/components/appointments/AppointmentHeader";
import AppointmentOverview from "@/src/components/appointments/AppointmentOverview";
import AppointmentTable, {
  AppointmentTableItem,
} from "@/src/components/appointments/AppointmentTable";
import AppointmentToolbar from "@/src/components/appointments/AppointmentToolbar";
import AppointmentDrawer, {
  AppointmentFormData,
  ServiceItem,
  EmployeeItem,
} from "@/src/components/appointments/drawer/AppointmentDrawer";
import { useERPStore } from "@/src/lib/erp-store";

const PAGE_SIZE = 20;

const pad = (value: number) => String(value).padStart(2, "0");
const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
const formatTime = (time: string) =>
  new Date(`2000-01-01T${time}`).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const {
    appointments,
    employees,
    customers,
    saveAppointment: persistAppointment,
    addCustomer,
    services: catalogServices,
    refresh,
    hydrated,
  } = useERPStore();
  const [typed, setTyped] = useState<{ value: string; base: string } | null>(null);
  const search = typed && typed.base === urlSearch ? typed.value : urlSearch;
  const [employee, setEmployee] = useState("all");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [date, setDate] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentTableItem | null>(null);

  const setSearch = (value: string) => {
    setTyped({ value, base: urlSearch });
    setPage(1);
  };
  const withPageReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    const today = new Date();
    const todayKey = localDateKey(today);
    const tomorrowKey = localDateKey(addDays(today, 1));
    const weekEndKey = localDateKey(addDays(today, 7));
    const monthKey = todayKey.slice(0, 7);
    return appointments
      .filter((appointment) => {
        const matchesSearch =
          !query ||
          appointment.customer.name.toLowerCase().includes(query) ||
          (appointment.customer.phone ?? "").toLowerCase().includes(query) ||
          appointment.appointment.appointmentNumber.toLowerCase().includes(query);
        const matchesEmployee =
          employee === "all" || appointment.stylist.id === employee;
        const matchesStatus = status === "all" || appointment.status === status;
        const matchesSource =
          source === "all" || appointment.appointment.source === source;
        const day = appointment.schedule.date;
        const matchesDate =
          date === "all" ||
          (date === "today" && day === todayKey) ||
          (date === "tomorrow" && day === tomorrowKey) ||
          (date === "week" && day >= todayKey && day < weekEndKey) ||
          (date === "month" && day.slice(0, 7) === monthKey);
        return (
          matchesSearch &&
          matchesEmployee &&
          matchesStatus &&
          matchesSource &&
          matchesDate
        );
      })
      .sort(
        (a, b) =>
          b.schedule.date.localeCompare(a.schedule.date) ||
          minutesOf(b.schedule.time) - minutesOf(a.schedule.time),
      );
  }, [appointments, date, employee, search, source, status]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAppointments = filteredAppointments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const overview = useMemo(() => {
    const total = Math.max(appointments.length, 1);
    const walkIn = appointments.filter((item) => item.appointment.source === "Walk-in").length;
    const online = appointments.filter((item) => item.appointment.source === "Online").length;
    const billable = appointments.filter(
      (item) => item.status !== "Cancelled" && item.status !== "No Show",
    );
    return {
      totalAppointments: appointments.length,
      totalTrend: "—",
      walkInAppointments: walkIn,
      walkInPercentage: `${Math.round((walkIn / total) * 100)}%`,
      onlineAppointments: online,
      onlinePercentage: `${Math.round((online / total) * 100)}%`,
      averageRevenue: Math.round(
        billable.reduce((sum, item) => sum + item.payment.amount, 0) /
          Math.max(billable.length, 1),
      ),
      revenueTrend: "—",
    };
  }, [appointments]);

  const saveAppointment = async (data: AppointmentFormData) => {
    const services = data.services.map(({ id, name }) => ({ id, name }));
    const duration = data.services.reduce(
      (sum, item) => sum + item.durationMinutes,
      0,
    );
    const chosenStylist = employees.find((item) => item.id === data.stylistId);
    const stylist = chosenStylist
      ? { id: chosenStylist.id, name: chosenStylist.name, designation: chosenStylist.role ?? "" }
      : { id: "unassigned", name: "Unassigned", designation: "" };
    try {
      if (selectedAppointment) {
        await persistAppointment({
          ...selectedAppointment,
          customer: { ...selectedAppointment.customer, name: data.customerName, phone: data.customerPhone },
          services,
          schedule: {
            date: data.date,
            time: formatTime(data.time),
            duration: `${duration} mins`,
          },
          stylist,
          payment: {
            amount: data.totalAmount,
            status: selectedAppointment.payment.status,
          },
        });
      } else {
        const normalizedPhone = data.customerPhone.replace(/\s+/g, "");
        let customer =
          customers.find((item) => item.phone.replace(/\s+/g, "") === normalizedPhone) ??
          customers.find(
            (item) => item.name.toLowerCase() === data.customerName.trim().toLowerCase(),
          );
        if (!customer)
          customer = await addCustomer({
            name: data.customerName.trim(),
            phone: data.customerPhone.trim(),
            membership: "Standard",
          });
        await persistAppointment({
          id: crypto.randomUUID(),
          customer: {
            id: customer.id,
            name: data.customerName.trim(),
            phone: data.customerPhone.trim(),
            membership: customer.membership,
          },
          appointment: { appointmentNumber: "", source: "Walk-in" },
          services,
          stylist,
          schedule: {
            date: data.date,
            time: formatTime(data.time),
            duration: `${duration} mins`,
          },
          payment: { amount: data.totalAmount, status: "Pending" },
          status: "Booked",
        });
      }
    } catch {
      // The store already surfaced the error toast; keep the drawer open so nothing typed is lost.
      return;
    }
    setDrawerOpen(false);
    setSelectedAppointment(null);
  };

  const updateAppointmentStatus = async (
    appointment: AppointmentTableItem,
    nextStatus: AppointmentTableItem["status"],
  ) => {
    if (busyId) return;
    setBusyId(appointment.id);
    try {
      await persistAppointment({ ...appointment, status: nextStatus });
    } catch {
      // Error toast is raised by the store.
    } finally {
      setBusyId(null);
    }
  };

  const handleExport = (type: ExportType) => {
    if (type === "print" || type === "pdf") {
      window.print();
      return;
    }
    const content = [
      "Appointment ID,Customer,Phone,Stylist,Date,Time,Amount,Payment,Status",
      ...filteredAppointments.map((item) =>
        [
          item.appointment.appointmentNumber,
          item.customer.name,
          item.customer.phone ?? "",
          item.stylist.name,
          formatDate(item.schedule.date),
          item.schedule.time,
          item.payment.amount,
          item.payment.status,
          item.status,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `appointments-${localDateKey(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const openCreate = () => {
    setSelectedAppointment(null);
    setDrawerOpen(true);
  };
  const openEdit = (item: AppointmentTableItem) => {
    setSelectedAppointment(item);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <AppointmentHeader
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void refresh().finally(() => setRefreshing(false));
        }}
        onNewAppointment={openCreate}
      />
      <AppointmentOverview data={overview} />
      <AppointmentToolbar
        search={search}
        employee={employee}
        status={status}
        source={source}
        date={date}
        onSearchChange={setSearch}
        onEmployeeChange={withPageReset(setEmployee)}
        onStatusChange={withPageReset(setStatus)}
        onSourceChange={withPageReset(setSource)}
        onDateChange={withPageReset(setDate)}
        onReset={() => {
          setSearch("");
          setEmployee("all");
          setStatus("all");
          setSource("all");
          setDate("all");
          setPage(1);
        }}
        employees={[
          { label: "All Employees", value: "all" },
          { label: "Unassigned", value: "unassigned" },
          ...employees.map((item) => ({ label: item.name, value: item.id })),
        ]}
        statuses={[
          { label: "All Status", value: "all" },
          ...[
            "Booked",
            "Confirmed",
            "Checked In",
            "In Progress",
            "Completed",
            "Cancelled",
            "No Show",
          ].map((value) => ({ label: value, value })),
        ]}
        sources={[
          { label: "All Sources", value: "all" },
          { label: "Walk-in", value: "Walk-in" },
          { label: "Online", value: "Online" },
        ]}
        dates={[
          { label: "All dates", value: "all" },
          { label: "Today", value: "today" },
          { label: "Tomorrow", value: "tomorrow" },
          { label: "This Week", value: "week" },
          { label: "This Month", value: "month" },
        ]}
        exportAction={<AppointmentExport onExport={handleExport} />}
      />
      <AppointmentTable
        appointments={pagedAppointments}
        loading={!hydrated}
        busyId={busyId}
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={filteredAppointments.length}
        onPageChange={setPage}
        onRowClick={openEdit}
        onCreateAppointment={openCreate}
        onAssign={openEdit}
        onCheckIn={(item) => void updateAppointmentStatus(item, "Checked In")}
        onStart={(item) => void updateAppointmentStatus(item, "In Progress")}
        onComplete={(item) => void updateAppointmentStatus(item, "Completed")}
        onNoShow={(item) => void updateAppointmentStatus(item, "No Show")}
        onCancel={(item) => void updateAppointmentStatus(item, "Cancelled")}
      />
      <AppointmentDrawer
        open={drawerOpen}
        mode={selectedAppointment ? "edit" : "create"}
        appointment={selectedAppointment}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedAppointment(null);
        }}
        onSave={saveAppointment}
        availableServices={catalogServices.map((service): ServiceItem => ({
          id: service.id,
          name: service.name,
          price: service.price,
          durationMinutes: service.durationMinutes,
        }))}
        availableCustomers={customers.map((customer) => ({ id: customer.id, name: customer.name, phone: customer.phone }))}
        availableEmployees={employees.map((employee): EmployeeItem => ({
          id: employee.id,
          name: employee.name,
          role: employee.role,
          active: employee.active,
        }))}
      />
    </div>
  );
}

function minutesOf(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)?$/i);
  if (!match) return 0;
  let hour = Number(match[1]);
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + Number(match[2]);
}
