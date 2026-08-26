import { Body, Equator, GeoVector, Horizon, MakeTime, Observer, SiderealTime, type AstroTime } from 'astronomy-engine';
import { zodiacFromLongitude, type Zodiac } from '@/services/zodiac';

export type BirthData = { date: Date; latitude: number; longitude: number };
export type AstroSnapshot = { julianDate: number; sunLongitude: number; altitude: number; azimuth: number };
export type BirthChart = AstroSnapshot & {
  sunSign: Zodiac;
  moonSign: Zodiac;
  risingSign: Zodiac;
  moonLongitude: number;
  risingLongitude: number;
};

const normalize = (degrees: number) => (degrees + 360) % 360;

const vectorLongitude = (body: Body, time: AstroTime) => {
  const vector = GeoVector(body, time, true);
  return normalize(Math.atan2(vector.y, vector.x) * 180 / Math.PI);
};

export function calculateAstroSnapshot(data: BirthData): AstroSnapshot {
  const time: AstroTime = MakeTime(data.date);
  const observer = new Observer(data.latitude, data.longitude, 0);
  const equator = Equator(Body.Sun, time, observer, true, true);
  const horizon = Horizon(time, observer, equator.ra, equator.dec, 'normal');
  return {
    julianDate: time.ut,
    sunLongitude: vectorLongitude(Body.Sun, time),
    altitude: horizon.altitude,
    azimuth: horizon.azimuth,
  };
}

export function calculateBirthChart(data: BirthData): BirthChart {
  const snapshot = calculateAstroSnapshot(data);
  const time = MakeTime(data.date);
  const moonLongitude = vectorLongitude(Body.Moon, time);
  const siderealDegrees = normalize(SiderealTime(time) * 15 + data.longitude);
  const latitudeRadians = data.latitude * Math.PI / 180;
  const obliquityRadians = 23.439 * Math.PI / 180;
  const risingLongitude = normalize(Math.atan2(
    -Math.cos(siderealDegrees * Math.PI / 180),
    Math.sin(siderealDegrees * Math.PI / 180) * Math.cos(obliquityRadians) + Math.tan(latitudeRadians) * Math.sin(obliquityRadians),
  ) * 180 / Math.PI + 180);
  return {
    ...snapshot,
    sunSign: zodiacFromLongitude(snapshot.sunLongitude),
    moonSign: zodiacFromLongitude(moonLongitude),
    risingSign: zodiacFromLongitude(risingLongitude),
    moonLongitude,
    risingLongitude,
  };
}