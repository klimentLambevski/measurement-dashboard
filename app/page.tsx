"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Battery, RefreshCw, Thermometer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@supabase/supabase-js";

type LatestMeasurement = {
  station_id: string;
  group_name: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  device_time: string;
  received_at: string;
  noise_dba: number | null;
  pm25_ugm3: number | null;
  pm10_ugm3: number | null;
  temperature_c: number | null;
  battery_v: number | null;
  quality_flag: string;
};

type Measurement = {
  station_id: string;
  device_time: string;
  noise_dba: number | null;
  pm25_ugm3: number | null;
  pm10_ugm3: number | null;
  temperature_c: number | null;
};

type DailySummary = {
  station_id: string;
  day: string;
  avg_noise_dba: number | null;
  avg_pm25_ugm3: number | null;
  avg_pm10_ugm3: number | null;
  sample_count: number;
};

type MetricKey = "noise_dba" | "pm25_ugm3" | "pm10_ugm3" | "temperature_c";

const metrics: Record<
  MetricKey,
  { label: string; unit: string; latestKey: keyof LatestMeasurement; dailyKey?: keyof DailySummary; color: string }
> = {
  noise_dba: {
    label: "Бучава",
    unit: "dBA",
    latestKey: "noise_dba",
    dailyKey: "avg_noise_dba",
    color: "#16745f",
  },
  pm25_ugm3: {
    label: "PM2.5",
    unit: "ug/m3",
    latestKey: "pm25_ugm3",
    dailyKey: "avg_pm25_ugm3",
    color: "#2563eb",
  },
  pm10_ugm3: {
    label: "PM10",
    unit: "ug/m3",
    latestKey: "pm10_ugm3",
    dailyKey: "avg_pm10_ugm3",
    color: "#7c3aed",
  },
  temperature_c: {
    label: "Температура",
    unit: "C",
    latestKey: "temperature_c",
    color: "#b45309",
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const formatNumber = (value: number | null | undefined, digits = 1) =>
  typeof value === "number" ? value.toFixed(digits) : "n/a";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("mk-MK", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("mk-MK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function Home() {
  const [latest, setLatest] = useState<LatestMeasurement[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("noise_dba");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError("Недостасуваат NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setLoading(true);
    setError(null);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const summarySince = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();

    const [latestResult, measurementResult, summaryResult] = await Promise.all([
      supabase
        .from("latest_measurements")
        .select("*")
        .order("station_id", { ascending: true }),
      supabase
        .from("measurements")
        .select("station_id, device_time, noise_dba, pm25_ugm3, pm10_ugm3, temperature_c")
        .gte("device_time", since)
        .order("device_time", { ascending: true })
        .limit(1000),
      supabase
        .from("daily_measurement_summary")
        .select("*")
        .gte("day", summarySince)
        .order("day", { ascending: true })
        .limit(1000),
    ]);

    const firstError = latestResult.error ?? measurementResult.error ?? summaryResult.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setLatest((latestResult.data ?? []) as LatestMeasurement[]);
      setMeasurements((measurementResult.data ?? []) as Measurement[]);
      setSummaries((summaryResult.data ?? []) as DailySummary[]);
      setLastRefresh(new Date());
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
    const timer = window.setInterval(() => void loadData(), 60_000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  const stationOptions = useMemo(
    () => latest.map((station) => station.station_id),
    [latest],
  );

  const filteredMeasurements = useMemo(() => {
    const rows =
      selectedStation === "all"
        ? measurements
        : measurements.filter((row) => row.station_id === selectedStation);

    return rows.map((row) => ({
      ...row,
      label: `${row.station_id} ${formatTime(row.device_time)}`,
      value: row[selectedMetric],
    }));
  }, [measurements, selectedMetric, selectedStation]);

  const comparisonData = useMemo(
    () =>
      latest.map((station) => ({
        station: station.station_id,
        value: station[metrics[selectedMetric].latestKey] as number | null,
      })),
    [latest, selectedMetric],
  );

  const summaryData = useMemo(() => {
    const metric = metrics[selectedMetric];
    if (!metric.dailyKey) return [];

    const rows =
      selectedStation === "all"
        ? summaries
        : summaries.filter((row) => row.station_id === selectedStation);

    return rows.map((row) => ({
      label: `${row.station_id} ${new Intl.DateTimeFormat("mk-MK", {
        month: "short",
        day: "numeric",
      }).format(new Date(row.day))}`,
      value: row[metric.dailyKey as keyof DailySummary] as number | null,
      samples: row.sample_count,
    }));
  }, [selectedMetric, selectedStation, summaries]);

  const activeMetric = metrics[selectedMetric];

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="title-block">
            <h1>Мониторинг на животна средина</h1>
            <p>Моментални вредности, трендови и споредба на IoT мерни станици.</p>
          </div>

          <div className="toolbar">
            <select
              className="select"
              value={selectedStation}
              onChange={(event) => setSelectedStation(event.target.value)}
              aria-label="Избор на станица"
            >
              <option value="all">Сите станици</option>
              {stationOptions.map((stationId) => (
                <option key={stationId} value={stationId}>
                  {stationId}
                </option>
              ))}
            </select>
            <button className="icon-button" onClick={() => void loadData()} title="Освежи">
              <RefreshCw size={18} />
            </button>
            <div className="last-refresh">
              {lastRefresh ? `Освежено: ${formatDateTime(lastRefresh.toISOString())}` : "Нема освежување"}
            </div>
          </div>
        </header>

        {!supabase && (
          <div className="notice">
            Поставете ги Supabase променливите од `.env.example` за да се вчитаат податоци.
          </div>
        )}
        {error && <div className="notice error">Грешка при читање податоци: {error}</div>}
        {loading && <div className="notice">Се вчитуваат најновите мерења...</div>}

        <section className="grid station-grid" aria-label="Моментални вредности">
          {latest.length === 0 && !loading ? (
            <div className="empty">Нема достапни мерења за приказ.</div>
          ) : (
            latest.map((station) => <StationCard key={station.station_id} station={station} />)
          )}
        </section>

        <section className="grid dashboard-grid">
          <div className="stack">
            <div className="panel">
              <div className="panel-head">
                <h2>Тренд во последните 24 часа</h2>
                <MetricTabs value={selectedMetric} onChange={setSelectedMetric} />
              </div>
              {filteredMeasurements.length > 0 ? (
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredMeasurements}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d9e2de" />
                      <XAxis dataKey="label" minTickGap={26} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`${formatNumber(Number(value))} ${activeMetric.unit}`, activeMetric.label]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name={`${activeMetric.label} (${activeMetric.unit})`}
                        stroke={activeMetric.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty">Нема временска серија за избраниот филтер.</div>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Дневен и месечен преглед</h2>
              </div>
              {summaryData.length > 0 ? (
                <div className="chart-box small">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={summaryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d9e2de" />
                      <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "samples"
                            ? [value, "примероци"]
                            : [`${formatNumber(Number(value))} ${activeMetric.unit}`, activeMetric.label]
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name={activeMetric.label}
                        stroke={activeMetric.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty">Дневни суми се достапни за бучава, PM2.5 и PM10.</div>
              )}
            </div>
          </div>

          <aside className="panel">
            <div className="panel-head">
              <h2>Споредба по локација</h2>
            </div>
            {comparisonData.length > 0 ? (
              <div className="chart-box small">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e2de" />
                    <XAxis dataKey="station" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${formatNumber(Number(value))} ${activeMetric.unit}`, activeMetric.label]}
                    />
                    <Bar dataKey="value" name={activeMetric.label} fill={activeMetric.color} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty">Нема податоци за споредба.</div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function MetricTabs({
  value,
  onChange,
}: {
  value: MetricKey;
  onChange: (value: MetricKey) => void;
}) {
  return (
    <div className="metric-tabs" aria-label="Избор на параметар">
      {(Object.keys(metrics) as MetricKey[]).map((key) => (
        <button
          key={key}
          className={`metric-button${value === key ? " active" : ""}`}
          onClick={() => onChange(key)}
        >
          {metrics[key].label}
        </button>
      ))}
    </div>
  );
}

function StationCard({ station }: { station: LatestMeasurement }) {
  return (
    <article className="card">
      <div className="card-head">
        <div>
          <h2 className="station-name">{station.station_id}</h2>
          <p className="station-location">
            {station.group_name ?? "Група"} · {station.location_name ?? "Непозната локација"}
          </p>
        </div>
        <span className="badge">{station.quality_flag}</span>
      </div>

      <div className="reading-grid">
        <Reading label="Бучава" value={`${formatNumber(station.noise_dba)} dBA`} icon={<Activity size={16} />} />
        <Reading label="PM2.5" value={`${formatNumber(station.pm25_ugm3)} ug/m3`} icon={<Activity size={16} />} />
        <Reading label="PM10" value={`${formatNumber(station.pm10_ugm3)} ug/m3`} icon={<Activity size={16} />} />
        <Reading label="Температура" value={`${formatNumber(station.temperature_c)} C`} icon={<Thermometer size={16} />} />
      </div>

      <div className="meta-row">
        <span>Батерија</span>
        <strong>
          <Battery size={14} /> {formatNumber(station.battery_v, 2)} V
        </strong>
      </div>
      <div className="meta-row">
        <span>Мерење</span>
        <strong>{formatDateTime(station.device_time)}</strong>
      </div>
    </article>
  );
}

function Reading({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="reading">
      <span>
        {icon} {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}
