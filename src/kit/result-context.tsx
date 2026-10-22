'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type KitResult = { blockId: string; kind: string; passed: boolean };
export type ReportKitResult = (result: KitResult) => void;

const KitResultContext = createContext<ReportKitResult>(() => {});
const ignoreResult: ReportKitResult = () => {};

export function KitResultProvider({
  children,
  report = ignoreResult,
}: {
  children: ReactNode;
  report?: ReportKitResult;
}) {
  return <KitResultContext.Provider value={report}>{children}</KitResultContext.Provider>;
}

export function useReportResult(): ReportKitResult {
  return useContext(KitResultContext);
}