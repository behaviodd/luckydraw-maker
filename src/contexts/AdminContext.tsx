'use client';

import { createContext, useContext } from 'react';

const AdminContext = createContext(false);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  return <AdminContext.Provider value={true}>{children}</AdminContext.Provider>;
}

export function useIsAdmin() {
  return useContext(AdminContext);
}
