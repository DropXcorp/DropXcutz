"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Scissors,
  Trash2,
  Clock3,
  IndianRupee,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

const availableServices: Service[] = [];

export default function ServiceSection() {
  const [search, setSearch] = useState("");

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  const filteredServices = availableServices.filter((service) =>
    service.name.toLowerCase().includes(search.toLowerCase())
  );

  const addService = (service: Service) => {
    if (selectedServices.find((s) => s.id === service.id)) return;

    setSelectedServices((prev) => [...prev, service]);
  };

  const removeService = (id: string) => {
    setSelectedServices((prev) =>
      prev.filter((service) => service.id !== id)
    );
  };

  const totalAmount = useMemo(
    () =>
      selectedServices.reduce(
        (total, service) => total + service.price,
        0
      ),
    [selectedServices]
  );

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (total, service) => total + service.duration,
        0
      ),
    [selectedServices]
  );

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">

      {/* Header */}

      <div className="border-b border-border px-5 py-4">

        <h3 className="text-lg font-semibold text-foreground">
          Services
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Add one or more services for this appointment.
        </p>

      </div>

      <div className="space-y-5 p-5">

        {/* Search */}

        <div className="relative">

          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="h-12 w-full rounded-xl border border-border bg-muted/60 pl-12 pr-4 outline-none transition focus:border-black"
          />

        </div>

        {/* Service List */}

        <div className="grid gap-3">

          {filteredServices.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => addService(service)}
              className="flex items-center justify-between rounded-xl border border-border bg-muted/60 p-4 text-left transition hover:border-black hover:bg-card"
            >
              <div className="flex items-center gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
                  <Scissors className="h-5 w-5 text-foreground/80" />
                </div>

                <div>

                  <h4 className="font-semibold text-foreground">
                    {service.name}
                  </h4>

                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">

                    <span className="flex items-center gap-1">
                      <Clock3 className="h-4 w-4" />
                      {service.duration} mins
                    </span>

                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {service.price}
                    </span>

                  </div>

                </div>

              </div>

              <Plus className="h-5 w-5 text-foreground/70" />
            </button>
          ))}

        </div>

        {/* Selected Services */}

        <div className="space-y-3">

          {selectedServices.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div>

                <h4 className="font-semibold text-foreground">
                  {service.name}
                </h4>

                <p className="mt-1 text-sm text-muted-foreground">
                  {service.duration} mins • ₹{service.price}
                </p>

              </div>

              <button
                onClick={() => removeService(service.id)}
                className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}

        </div>

      </div>

      {/* Footer */}

      <div className="border-t border-border bg-muted/60 px-5 py-4">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm text-muted-foreground">
              Total Duration
            </p>

            <h4 className="font-semibold text-foreground">
              {totalDuration} mins
            </h4>

          </div>

          <div className="text-right">

            <p className="text-sm text-muted-foreground">
              Subtotal
            </p>

            <h3 className="text-2xl font-bold text-foreground">
              ₹{totalAmount}
            </h3>

          </div>

        </div>

      </div>

    </section>
  );
}
