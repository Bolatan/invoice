import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TenantProvider } from "@/components/providers/TenantProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invoicing App",
  description: "Manage your business finances",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TenantProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </TenantProvider>
      </body>
    </html>
  );
}
