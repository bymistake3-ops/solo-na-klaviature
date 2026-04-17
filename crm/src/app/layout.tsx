import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduCRM — CRM для EdTech",
  description: "Простая CRM для маленькой команды EdTech-стартапа.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
