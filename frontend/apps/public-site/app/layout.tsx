import "./globals.css";
export const metadata = { title: "Book your appointment", description: "Online salon appointments powered by DropXcutz." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
