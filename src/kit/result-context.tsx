import { createContext, useContext, type ReactNode } from 'react';

export type KitResult = { blockId: string; kind: string; passed: boolean };
export type ReportKitResult = (result: KitResult) => void;

const KitResultContext = createContext<ReportKitResult>(() => {});

export function KitResultProvider({
  children,
  report,
}: {
  children: ReactNode;
  report: ReportKitResult;
}) {
  return <KitResultContext.Provider value={report}>{children}</KitResultContext.Provider>;
}

export function useReportResult(): ReportKitResult {
  return useContext(KitResultContext);
}