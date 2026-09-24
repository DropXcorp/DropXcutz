import type { Request, Response } from "express";
import { bookingForCustomer, cancelBookingForCustomer } from "../services/booking-automation.service";
import { salonForPublic } from "./public-booking.controller";

const tokenOf = (request: Request) =>
  request.header("x-booking-token") ?? (typeof request.query.token === "string" ? request.query.token : undefined);

export async function viewPublicBooking(request: Request, response: Response) {
  const salon = await salonForPublic(response);
  const { appointment, view } = await bookingForCustomer(String(request.params.id), tokenOf(request));
  if (appointment.salonId !== salon.id) return void response.status(404).json({ error: "Booking not found." });
  response.setHeader("Cache-Control", "no-store");
  response.json({ data: view });
}

export async function cancelPublicBooking(request: Request, response: Response) {
  const salon = await salonForPublic(response);
  const { appointment } = await bookingForCustomer(String(request.params.id), tokenOf(request));
  if (appointment.salonId !== salon.id) return void response.status(404).json({ error: "Booking not found." });
  response.json({ data: await cancelBookingForCustomer(String(request.params.id), tokenOf(request)) });
}
