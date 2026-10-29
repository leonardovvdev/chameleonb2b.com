import { useEffect, useMemo, useState } from "react";
import style from "./seccion_1.module.css";

interface Holiday {
  date: string; // "2026-07-28"
  localName: string; // nombre en español
  name: string; // nombre en inglés
}

const COUNTRY = "PE";
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const Seccion_1 = () => {
  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string>(todayKey);
  const [cache, setCache] = useState<Record<number, Record<string, Holiday>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga los feriados del año visible (solo si no están en caché)
  useEffect(() => {
    if (cache[year]) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${COUNTRY}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los feriados");
        return res.json() as Promise<Holiday[]>;
      })
      .then((data) => {
        const map: Record<string, Holiday> = {};
        data.forEach((h) => (map[h.date] = h));
        setCache((prev) => ({ ...prev, [year]: map }));
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [year, cache]);

  const holidays = cache[year] ?? {};

  const monthName = new Date(year, month, 1).toLocaleDateString("es-PE", {
    month: "long",
  });

  // Celdas del mes (la semana empieza en lunes)
  const cells = useMemo(() => {
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(d);
    return list;
  }, [year, month]);

  const monthHolidays = Object.values(holidays)
    .filter((h) => h.date.startsWith(`${year}-${pad(month + 1)}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  const selectedHoliday = holidays[selected];

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelected(todayKey);
  };

  const formatLong = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className={style.seccion}>
      <div className={style.calendar}>
        <header className={style.header}>
          <div>
            <h2 className={style.month}>{monthName}</h2>
            <span className={style.year}>{year}</span>
          </div>

          <div className={style.controls}>
            <button className={style.todayBtn} onClick={goToday}>
              Hoy
            </button>
            <button className={style.navBtn} onClick={goPrev} aria-label="Mes anterior">
              ‹
            </button>
            <button className={style.navBtn} onClick={goNext} aria-label="Mes siguiente">
              ›
            </button>
          </div>
        </header>

        <div className={style.weekdays}>
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className={`${style.grid} ${loading ? style.loading : ""}`}>
          {cells.map((day, i) => {
            if (day === null) return <span key={`empty-${i}`} />;

            const key = toKey(year, month, day);
            const holiday = holidays[key];
            const isWeekend = i % 7 >= 5;

            const classes = [
              style.day,
              key === todayKey ? style.today : "",
              key === selected ? style.selected : "",
              holiday ? style.holiday : "",
              isWeekend ? style.weekend : "",
            ].join(" ");

            return (
              <button
                key={key}
                className={classes}
                onClick={() => setSelected(key)}
                title={holiday?.localName}
              >
                <span>{day}</span>
                {holiday && <i className={style.dot} />}
              </button>
            );
          })}
        </div>

        {error && <p className={style.error}>{error}</p>}
      </div>

      <aside className={style.panel}>
        <p className={style.panelDate}>{formatLong(selected)}</p>

        {selectedHoliday ? (
          <div className={style.holidayCard}>
            <strong>{selectedHoliday.localName}</strong>
            <span>{selectedHoliday.name}</span>
          </div>
        ) : (
          <p className={style.muted}>Día sin feriado</p>
        )}

        <h3 className={style.panelTitle}>Feriados de {monthName}</h3>

        {monthHolidays.length === 0 ? (
          <p className={style.muted}>{loading ? "Cargando..." : "No hay feriados este mes"}</p>
        ) : (
          <ul className={style.list}>
            {monthHolidays.map((h) => (
              <li key={h.date}>
                <button onClick={() => setSelected(h.date)}>
                  <b>{Number(h.date.slice(8))}</b>
                  <span>{h.localName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
};

export default Seccion_1;