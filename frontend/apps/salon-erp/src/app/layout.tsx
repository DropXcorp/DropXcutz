import type { Metadata } from "next";
import "./globals.css";
import RequestFeedback from "@/src/components/layout/RequestFeedback";

export const metadata: Metadata = {
  title: "DropXCut ERP",
  description: "Salon operations, appointments and customer management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><RequestFeedback />{children}</body>
    </html>
  );
}
