curl -L -X POST 'https://jbmqhalknhatgpedkoij.supabase.co/functions/v1/smart-processor' \
-H 'X-Station-Token: test_m_01' \
-H 'Content-Type: application/json' \
--data '{
    "station_id": "M01",
    "device_time": "2026-05-03T12:36:00+02:00",
    "noise_dba_raw": 62.1,
    "pm25_raw": 150,
    "pm10_raw": 301,
    "temperature_c": 24.1,
    "battery_v": 3.91,
    "calibration_version": "G03-v1"
}'