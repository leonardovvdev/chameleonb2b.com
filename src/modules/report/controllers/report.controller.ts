import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import {
  buildSheets,
  downloadExcel,
  fetchContracts,
  fetchReport,
  fetchReportRow,
  fetchStaffOptions,
  pickRandomStaff,
} from "../services/report.service";
import type { AttendanceReport, ContractOption, StaffOption } from "../types/report.types";

// en el import de ../services/report.service agrega: fetchReportRow,

const SEARCH_DELAY_MS = 300;
const EVENT_DELAY_MS = 150; // agrupa ráfagas de eventos
const RESYNC_AFTER_HIDDEN_MS = 30_000;
type Change = RealtimePostgresChangesPayload<Record<string, unknown>>;

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
  const [initialLoading, setInitialLoading] = useState(true); // buscando el trabajador inicial

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
  const reportRef = useRef<AttendanceReport | null>(null);
const reportCache = useRef(new Map<string, AttendanceReport>());
const fullInFlight = useRef(false);
const pendingFull = useRef(false);

useEffect(() => {
  reportRef.current = report;
  if (report) reportCache.current.set(`${report.staff.id}:${report.contract.id}`, report);
}, [report]);

  /* búsqueda con retraso */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [search]);

    /* al entrar: un trabajador al azar (con contratos) para no mostrar la pantalla vacía */
  useEffect(() => {
    const controller = new AbortController();
    pickRandomStaff(controller.signal)
      .then((option) => {
        // si el usuario ya eligió a alguien mientras tanto, se respeta su elección
        if (option && !controller.signal.aborted) setStaff((actual) => actual ?? option);
      })
      .catch((err) => { if (!isAbort(err)) setStaffError(messageOf(err)); })
      .finally(() => { if (!controller.signal.aborted) setInitialLoading(false); });
    return () => controller.abort();
  }, []);

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
const loadReport = useCallback(async (stffId: number, id: number, silent: boolean): Promise<void> => {
  const request = ++reportRequest.current;
  fullInFlight.current = true;
  if (!silent) setReportLoading(true);
  setReportError(null);
  try {
    const data = await fetchReport(stffId, id);
    if (request === reportRequest.current) setReport(data);
  } catch (err) {
    if (request === reportRequest.current) setReportError(messageOf(err));
  } finally {
    if (request === reportRequest.current) {
      fullInFlight.current = false;
      setReportLoading(false);
      if (pendingFull.current) {
        pendingFull.current = false;
        void loadReport(stffId, id, true); // llegó un cambio mientras cargaba: se repite en silencio
      }
    }
  }
}, []);

/* al elegir contrato: lo guardado se ve al instante y se revalida en silencio */
useEffect(() => {
  if (!staff || contractId === null) return;
  const cached = reportCache.current.get(`${staff.stff_id}:${contractId}`);
  setReport(cached ?? null);
  void loadReport(staff.stff_id, contractId, cached !== undefined);
}, [staff, contractId, loadReport]);

/* Realtime: cada evento actualiza SOLO la fila (fecha) afectada */
useEffect(() => {
  if (!staff || contractId === null) return;
  const stffId = staff.stff_id;
  const dirty = new Set<string>();
  let full = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let wasSubscribed = false;
  let hiddenAt = 0;

  const reloadAll = () => {
    if (fullInFlight.current) { pendingFull.current = true; return; }
    void loadReport(stffId, contractId, true);
  };

  const patchDay = async (date: string) => {
    try {
      const row = await fetchReportRow(stffId, contractId, date);
      if (disposed) return;
      if (!row) return reloadAll();
      setReport((prev) => {
        if (!prev) return prev;
        const i = prev.rows.findIndex((r) => r.date === date);
        if (i < 0) return prev;
        const rows = prev.rows.slice();
        rows[i] = row;
        return { ...prev, rows };
      });
    } catch {
      if (!disposed) reloadAll();
    }
  };

  const flush = () => {
    const dates = [...dirty];
    dirty.clear();
    const needFull = full;
    full = false;
    const known = reportRef.current;
    if (needFull || !known || fullInFlight.current || dates.some((d) => !known.rows.some((r) => r.date === d))) {
      return reloadAll();
    }
    dates.forEach((d) => void patchDay(d));
  };

  const queue = (date: string | null) => {
    if (date) dirty.add(date.slice(0, 10));
    else full = true;
    clearTimeout(timer);
    timer = setTimeout(flush, EVENT_DELAY_MS);
  };

  const dateOfAtt = (attId: unknown) =>
    typeof attId === "number" ? (reportRef.current?.rows.find((r) => r.att_id === attId)?.date ?? null) : null;

  const onAttendance = (p: Change) => {
    const n = p.new as Record<string, unknown>;
    const o = p.old as Record<string, unknown>;
    if (p.eventType === "DELETE") {
      const d = dateOfAtt(o.att_id); // los DELETE no se pueden filtrar: solo cuenta si es de este reporte
      if (d) queue(d);
      return;
    }
    queue(typeof n.att_date === "string" ? n.att_date : null);
  };

  // adelantos e incidencias: solo importan si su att_id pertenece a este reporte
  const onChild = (p: Change) => {
    const n = p.new as Record<string, unknown>;
    const o = p.old as Record<string, unknown>;
    const d = dateOfAtt(n.att_id ?? o.att_id);
    if (d) queue(d);
  };

  const channel = supabase
    .channel(`report-${stffId}-${contractId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "attendance", filter: `stff_id=eq.${stffId}` }, onAttendance)
    .on("postgres_changes", { event: "*", schema: "public", table: "staff_advancements" }, onChild)
    .on("postgres_changes", { event: "*", schema: "public", table: "staff_discount_incidents" }, onChild)
    .subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        if (wasSubscribed) reloadAll(); // se reconectó: pudo perder eventos
        wasSubscribed = true;
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("[report] Realtime:", status, err);
      }
    });

  const onVisibility = () => {
    if (document.visibilityState === "hidden") { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > RESYNC_AFTER_HIDDEN_MS) reloadAll();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("online", reloadAll);

  return () => {
    disposed = true;
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", reloadAll);
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
    initialLoading,
    contracts, contractsLoading, contractId, selectContract, selectedContract,
    report, reportLoading, reportError,
    sheets, activeSheet, setSheetName,
    exporting, exportExcel,
  };
}

export type ReportController = ReturnType<typeof useReportController>;