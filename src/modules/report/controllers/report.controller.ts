import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase"; // ← misma ruta que en report.service.ts
import {
  buildSheets,
  downloadExcel,
  fetchContracts,
  fetchReport,
  fetchStaffOptions,
} from "../services/report.service";
import type { AttendanceReport, ContractOption, StaffOption } from "../types/report.types";

const SEARCH_DELAY_MS = 300;
const REALTIME_DELAY_MS = 500;

const messageOf = (err: unknown) => (err instanceof Error ? err.message : "Ocurrió un error inesperado.");
const isAbort = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

export function useReportController() {
  /* ── selector de personal ── */
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffOption | null>(null);
  const staffCache = useRef(new Map<string, StaffOption[]>());

  /* ── contratos ── */
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractId, setContractId] = useState<number | null>(null);

  /* ── reporte ── */
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const reportRequest = useRef(0);

  /* búsqueda con retraso */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [search]);

  /* lista de personal: solo cuando el menú está abierto, con caché por término */
  useEffect(() => {
    if (!menuOpen) return;
    const cached = staffCache.current.get(debouncedSearch);
    if (cached) {
      setStaffOptions(cached);
      setStaffError(null);
      return;
    }

    const controller = new AbortController();
    setStaffLoading(true);
    setStaffError(null);
    fetchStaffOptions(debouncedSearch, controller.signal)
      .then((items) => {
        staffCache.current.set(debouncedSearch, items);
        setStaffOptions(items);
      })
      .catch((err) => { if (!isAbort(err)) setStaffError(messageOf(err)); })
      .finally(() => { if (!controller.signal.aborted) setStaffLoading(false); });
    return () => controller.abort();
  }, [menuOpen, debouncedSearch]);

  /* contratos del personal seleccionado: por defecto el último */
  useEffect(() => {
    setContracts([]);
    setContractId(null);
    setReport(null);
    setReportError(null);
    if (!staff) return;

    const controller = new AbortController();
    setContractsLoading(true);
    fetchContracts(staff.stff_id, controller.signal)
      .then((items) => {
        setContracts(items);
        setContractId(items.length ? items[items.length - 1].id : null);
      })
      .catch((err) => { if (!isAbort(err)) setReportError(messageOf(err)); })
      .finally(() => { if (!controller.signal.aborted) setContractsLoading(false); });
    return () => controller.abort();
  }, [staff]);

  /* reporte del contrato (silent = recarga por Realtime, sin parpadeo) */
  const loadReport = useCallback(async (stffId: number, id: number, silent: boolean) => {
    const request = ++reportRequest.current;
    if (!silent) setReportLoading(true);
    setReportError(null);
    try {
      const data = await fetchReport(stffId, id);
      if (request === reportRequest.current) setReport(data);
    } catch (err) {
      if (request === reportRequest.current) setReportError(messageOf(err));
    } finally {
      if (request === reportRequest.current) setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!staff || contractId === null) return;
    setReport(null);
    void loadReport(staff.stff_id, contractId, false);
  }, [staff, contractId, loadReport]);

  /* sincronización: cualquier cambio de asistencia, incidencias o adelantos recarga el reporte */
  useEffect(() => {
    if (!staff || contractId === null) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void loadReport(staff.stff_id, contractId, true), REALTIME_DELAY_MS);
    };
    const onTable = (table: string, filter?: string) =>
      ({ event: "*", schema: "public", table, ...(filter ? { filter } : {}) }) as const;

    const channel = supabase
      .channel(`report-${staff.stff_id}-${contractId}`)
      .on("postgres_changes", onTable("attendance", `stff_id=eq.${staff.stff_id}`), refresh)
      .on("postgres_changes", onTable("staff_advancements", `stff_id=eq.${staff.stff_id}`), refresh)
      // staff_discount_incidents no tiene el id del trabajador: se recarga ante cualquier cambio visible por RLS.
      .on("postgres_changes", onTable("staff_discount_incidents"), refresh)
      .subscribe();

    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [staff, contractId, loadReport]);

  /* hojas: misma estructura para la vista previa y el Excel */
  const sheets = useMemo(() => (report ? buildSheets(report) : []), [report]);
  const activeSheet = sheets.find((s) => s.name === sheetName) ?? sheets[sheets.length - 1] ?? null;

  const selectStaff = (option: StaffOption) => {
    setStaff(option);
    setSheetName(null);
    setMenuOpen(false);
    setSearch("");
  };

  const selectContract = (id: number) => {
    setSheetName(null);
    setContractId(id);
  };

  const exportExcel = async () => {
    if (!report) return;
    setExporting(true);
    try {
      await downloadExcel(report);
    } catch (err) {
      setReportError(messageOf(err));
    } finally {
      setExporting(false);
    }
  };

  const selectedContract = contracts.find((c) => c.id === contractId) ?? null;

  return {
    menuOpen, setMenuOpen, search, setSearch, staffOptions, staffLoading, staffError, staff, selectStaff,
    contracts, contractsLoading, contractId, selectContract, selectedContract,
    report, reportLoading, reportError,
    sheets, activeSheet, setSheetName,
    exporting, exportExcel,
  };
}

export type ReportController = ReturnType<typeof useReportController>;