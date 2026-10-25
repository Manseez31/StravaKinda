export type Sport = 'running' | 'walking' | 'cycling' | 'hiking';
export type Visibility = 'private' | 'followers' | 'public';
export type TrackPoint = { latitude: number; longitude: number; timestamp: number; accuracy: number; altitude: number | null; altitudeAccuracy: number | null; segment: number };
export type Workout = { id: string; title: string; description: string; sport: Sport; visibility: Visibility; startedAt: number; endedAt: number | null; state: 'recording' | 'paused' | 'finished'; activeMs: number; resumedAt: number | null; segment: number; points: TrackPoint[]; rejected: number; ownerId?: string; syncedAt?: number };
export type Preferences = { units: 'km' | 'mi'; theme: 'dark' | 'light'; weeklyGoalKm: number; defaultVisibility: Visibility; autoPause: boolean };
