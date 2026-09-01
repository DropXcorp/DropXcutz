import { notFound } from "next/navigation";

export default function WebsiteIntegrationPage() {
  // API-key management belongs to the platform administrator, not salon staff.
  notFound();
}
