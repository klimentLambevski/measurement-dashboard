import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Мониторинг на животна средина",
  description: "Контролна табла за IoT мерни станици",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mk">
      <body>{children}</body>
    </html>
  );
}
