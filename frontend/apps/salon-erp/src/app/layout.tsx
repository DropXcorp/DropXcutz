import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import RequestFeedback from "@/src/components/layout/RequestFeedback";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

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
    <html lang="en" className={`h-full antialiased ${geist.variable}`}>
      <body className="min-h-full flex flex-col font-sans"><RequestFeedback />{children}</body>
    </html>
  );
}
