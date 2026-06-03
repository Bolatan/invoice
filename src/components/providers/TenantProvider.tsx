"use client";

import React, { createContext, useContext } from 'react';
import { useParams } from 'next/navigation';

const TenantContext = createContext<{ tenant: string } | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tenant = (params?.tenant as string) || 'default';

  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
