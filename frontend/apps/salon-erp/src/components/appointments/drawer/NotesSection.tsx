"use client";

import { useState } from "react";
import {
  ClipboardPen,
  Heart,
  AlertTriangle,
  FileText,
} from "lucide-react";

export default function NotesSection() {
  const [notes, setNotes] = useState("");

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">

      {/* Header */}

      <div className="border-b border-border px-5 py-4">

        <h3 className="text-lg font-semibold text-foreground">
          Notes & Preferences
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Record important information for this appointment.
        </p>

      </div>

      <div className="space-y-5 p-5">

        {/* Allergies */}

        <div>

          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/80">

            <AlertTriangle className="h-4 w-4 text-amber-500" />

            Allergies / Skin Sensitivity

          </label>

          <input
            type="text"
            placeholder="Example: Hair dye allergy, sensitive skin..."
            className="h-12 w-full rounded-xl border border-border bg-muted/60 px-4 outline-none transition focus:border-black focus:bg-card"
          />

        </div>

        {/* Customer Preferences */}

        <div>

          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/80">

            <Heart className="h-4 w-4 text-pink-500" />

            Customer Preferences

          </label>

          <input
            type="text"
            placeholder="Preferred stylist, haircut style, products..."
            className="h-12 w-full rounded-xl border border-border bg-muted/60 px-4 outline-none transition focus:border-black focus:bg-card"
          />

        </div>

        {/* Internal Notes */}

        <div>

          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/80">

            <FileText className="h-4 w-4 text-blue-500" />

            Internal Staff Notes

          </label>

          <textarea
            rows={5}
            value={notes}
            maxLength={500}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add appointment instructions or notes for the salon staff..."
            className="w-full resize-none rounded-xl border border-border bg-muted/60 p-4 outline-none transition focus:border-black focus:bg-card"
          />

          <div className="mt-2 flex justify-between">

            <p className="text-xs text-muted-foreground">
              Visible only to salon staff.
            </p>

            <span className="text-xs text-muted-foreground">
              {notes.length}/500
            </span>

          </div>

        </div>

        {/* Reminder */}

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/60 p-4">

          <ClipboardPen className="mt-0.5 h-5 w-5 text-foreground/80" />

          <div>

            <h4 className="font-medium text-foreground">
              Reminder
            </h4>

            <p className="mt-1 text-sm text-foreground/70">
              These notes will be available to the assigned stylist before the
              appointment begins.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}