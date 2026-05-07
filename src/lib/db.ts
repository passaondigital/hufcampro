import { openDB, type DBSchema } from 'idb';
import type {
  SolarMeasurementInput,
  SolarMeasurements,
  ReferenceScale,
  MmMeasurements,
} from '@/components/hufcam/types';

export interface SessionCollage {
  hoofId: string;
  collageUrl: string;
}

export interface SessionSolarPhoto {
  hoofId: string;
  dataUrl: string;
  measurementPoints?: SolarMeasurementInput;
  pixelMeasurements?: SolarMeasurements;
  referenceScale?: ReferenceScale;
  mmMeasurements?: MmMeasurements;
}

export interface HufSession {
  id?: number;
  horseName: string;
  date: string;
  timestamp: number;
  collages: SessionCollage[];
  watermark: string;
  solarPhotos?: SessionSolarPhoto[];
}

interface HufCamDB extends DBSchema {
  sessions: {
    key: number;
    value: HufSession;
    indexes: { 'by-timestamp': number };
  };
}

async function getDB() {
  return openDB<HufCamDB>('hufcampro', 1, {
    upgrade(db) {
      const store = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
      store.createIndex('by-timestamp', 'timestamp');
    },
  });
}

export async function saveSession(session: Omit<HufSession, 'id'>): Promise<number> {
  const db = await getDB();
  return db.add('sessions', session);
}

export async function getSessions(): Promise<HufSession[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sessions', 'by-timestamp');
  return all.reverse().slice(0, 10);
}

export async function deleteSession(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

export async function updateSession(session: HufSession): Promise<void> {
  if (session.id === undefined) throw new Error('updateSession requires session.id');
  const db = await getDB();
  await db.put('sessions', session);
}
