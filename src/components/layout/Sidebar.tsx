"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  TrendingDown,
  BarChart3,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Proposals", href: "/proposals", icon: FileText },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Payments Received", href: "/payments", icon: CreditCard },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { tenant } = useParams<{ tenant: string }>();

  const tenantNavigation = navigation.map(item => ({
    ...item,
    href: `/${tenant}${item.href === '/' ? '' : item.href}`
  }));

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-400">Invoicing App</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {tenantNavigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== `/${tenant}` && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <Link
          href="/settings"
          className="flex items-center px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </Link>
      </div>
    </div>
  );
}
