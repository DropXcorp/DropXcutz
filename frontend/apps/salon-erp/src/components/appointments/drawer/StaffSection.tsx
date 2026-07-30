"use client";

import { useState } from "react";
import {
  UserRound,
  CheckCircle2,
  Clock3,
  Users,
} from "lucide-react";

interface Staff {
  id: string;
  name: string;
  role: string;
  status: "Available" | "Busy";
}

const stylists: Staff[] = [
  {
    id: "1",
    name: "John Mathew",
    role: "Senior Stylist",
    status: "Available",
  },
  {
    id: "2",
    name: "Priya Sharma",
    role: "Hair Specialist",
    status: "Busy",
  },
  {
    id: "3",
    name: "Rahul Kumar",
    role: "Beard Specialist",
    status: "Available",
  },
];

export default function StaffSection() {
  const [primaryStylist, setPrimaryStylist] = useState("1");
  const [assistant, setAssistant] = useState("");

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">

      {/* Header */}

      <div className="border-b border-zinc-200 px-5 py-4">

        <h3 className="text-lg font-semibold text-zinc-900">
          Staff Assignment
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Assign the stylist responsible for this appointment.
        </p>

      </div>

      <div className="space-y-6 p-5">

        {/* Primary Stylist */}

        <div>

          <label className="mb-3 block text-sm font-medium text-zinc-700">
            Primary Stylist
          </label>

          <div className="space-y-3">

            {stylists.map((staff) => (

              <button
                key={staff.id}
                type="button"
                onClick={() => setPrimaryStylist(staff.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 transition ${
                  primaryStylist === staff.id
                    ? "border-black bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">

                    <UserRound className="h-6 w-6 text-zinc-700" />

                  </div>

                  <div className="text-left">

                    <h4 className="font-semibold text-zinc-900">
                      {staff.name}
                    </h4>

                    <p className="text-sm text-zinc-500">
                      {staff.role}
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-4">

                  {staff.status === "Available" ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Available
                    </span>
                  ) : (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                      Busy
                    </span>
                  )}

                  {primaryStylist === staff.id && (
                    <CheckCircle2 className="h-6 w-6 text-black" />
                  )}

                </div>

              </button>

            ))}

          </div>

        </div>

        {/* Assistant */}

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Assistant (Optional)
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">

            <Users className="h-5 w-5 text-zinc-500" />

            <select
              value={assistant}
              onChange={(e) => setAssistant(e.target.value)}
              className="w-full bg-transparent outline-none"
            >

              <option value="">No Assistant</option>

              {stylists.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}

            </select>

          </div>

        </div>

        {/* Availability Note */}

        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">

          <Clock3 className="mt-0.5 h-5 w-5 text-blue-600" />

          <div>

            <h4 className="font-medium text-blue-900">
              Staff Availability
            </h4>

            <p className="mt-1 text-sm text-blue-700">
              Green indicates the stylist is available during the selected appointment time.
              Busy stylists may have overlapping appointments.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}