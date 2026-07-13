export type HealthReading = {
  id?: string | number;
  device_id: string;
  heart_rate: number | null;
  spo2: number | null;
  body_temp: number | null;
  accel_x: number | null;
  accel_y: number | null;
  accel_z: number | null;
  gyro_x: number | null;
  gyro_y: number | null;
  gyro_z: number | null;
  fall_detected: boolean | null;
  gps_locked: boolean | null;
  gps_lat: number | null;
  gps_lon: number | null;
  gps_speed: number | null;
  gps_satellites: number | null;
  buzzer_active: boolean | null;
  created_at: string;
};

export type AlertType = "fall" | "vitals_abnormal" | "geofence" | string;

export type Alert = {
  id: string | number;
  device_id: string;
  alert_type: AlertType;
  message: string | null;
  heart_rate: number | null;
  spo2: number | null;
  body_temp: number | null;
  gps_lat: number | null;
  gps_lon: number | null;
  resolved: boolean;
  created_at: string;
};

export type OutboundMessage = {
  id: string | number;
  device_id: string;
  message: string;
  delivered: boolean;
  created_at: string;
};
