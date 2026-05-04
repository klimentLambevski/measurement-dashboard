create table public.stations (
station_id text primary key,
group_name text not null,
location_name text,
latitude double precision,
longitude double precision,
active boolean not null default true,
created_at timestamptz not null default now()
);

create table public.station_tokens (
station_id text primary key references public.stations(station_id),
token text not null,
active boolean not null default true
);

insert into public.stations
(station_id, group_name, location_name, latitude, longitude)
values
('MO1', 'Group 01', 'Faculty courtyard', 42.004, 21.409);

create table public.measurements (
id bigserial primary key,
station_id text not null references public.stations(station_id),
device_time timestamptz not null,
received_at timestamptz not null default now(),

noise_dba_raw numeric,
noise_dba numeric,
pm25_raw numeric,
pm25_ugm3 numeric,
pm10_raw numeric,
pm10_ugm3 numeric,
temperature_c numeric,
battery_v numeric,

calibration_version text,
quality_flag text not null default 'ok',
payload jsonb not null default '{}'::jsonb,
unique (station_id, device_time)
);

create view public.latest_measurements as
select distinct on (m.station_id)
m.station_id, s.group_name, s.location_name,
s.latitude, s.longitude,
m.device_time, m.received_at,
m.noise_dba, m.pm25_ugm3, m.pm10_ugm3,
m.temperature_c, m.battery_v, m.quality_flag
from public.measurements m
join public.stations s on s.station_id = m.station_id
where s.active = true
order by m.station_id, m.device_time desc;

create view public.daily_measurement_summary as
select station_id,
date_trunc('day', device_time) as day,
avg(noise_dba) as avg_noise_dba,
avg(pm25_ugm3) as avg_pm25_ugm3,
avg(pm10_ugm3) as avg_pm10_ugm3,
count(*) as sample_count
from public.measurements
group by station_id, date_trunc('day', device_time);

FRONTEND ENDPOINTS
/rest/v1/latest_measurements
current station cards

/rest/v1/measurements
time-series charts

/rest/v1/daily_measurement_summary
daily and monthly summaries
