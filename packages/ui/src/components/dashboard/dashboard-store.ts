"use client";
import { create } from 'zustand'

interface DashboardState {
  isOpen: boolean
  activeDashboardIndex: number
  toggleDashboard: () => void
  setDashboardOpen: (open: boolean, index?: number) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  isOpen: false,
  activeDashboardIndex: 0,
  toggleDashboard: () => set((state) => ({ isOpen: !state.isOpen })),
  setDashboardOpen: (open, index) => set((state) => ({ 
    isOpen: open, 
    activeDashboardIndex: index ?? state.activeDashboardIndex 
  })),
}))
