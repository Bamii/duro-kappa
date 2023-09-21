import React, { createContext, useContext, useState } from 'react';
import { UIResponse } from './auth.context';
import { apis } from '@/api';

export type BranchContextType = {
  branches: any[] | null,
  get_branches: () => Promise<UIResponse>,
  create_branch: (id: string) => Promise<UIResponse>
}

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<any[] | null>(null);

  const get_branches = async () => {
    const { message, data } = await apis.get_branches();
    setBranches(data);
    return { message }
  }

  const create_branch = async () => {
    const { message, data } = await apis.get_branches();
    setBranches(data);
    return { message }
  }

  return (
    <BranchContext.Provider value={{ branches, get_branches, create_branch }}>
      {children}
    </BranchContext.Provider>
  )
}

const BranchContext = createContext({} as BranchContextType);

export const useBranchContext = () => useContext(BranchContext);

