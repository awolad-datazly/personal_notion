import { notifyStorageUpdate } from "@/lib/storage-bus";

export type SavedStudySession = {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  progressPercent: number;
  timestampsCount: number;
  lastPosition: string;
  notes?: string;
  updatedAt: string;
};

const STORAGE_KEY = "devpulse.study_sessions";

export const DEFAULT_SESSIONS: SavedStudySession[] = [
  {
    id: "study-1",
    videoId: "kYv_8w4-f-M",
    title: "Building High-Throughput Microservices in Go & gRPC",
    channel: "ArjanCodes • 48m",
    progressPercent: 62,
    timestampsCount: 4,
    lastPosition: "28:10",
    notes: "- [12:45] Connection pooling\n- [28:10] Graceful shutdown",
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "study-2",
    videoId: "T_8N_b37Q6M",
    title: "Next.js 16 Server Components & Modern React 19 Patterns",
    channel: "Lee Robinson • 35m",
    progressPercent: 84,
    timestampsCount: 3,
    lastPosition: "18:30",
    notes: "- [05:12] PPR vs dynamic streaming\n- [16:40] Server actions",
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

let _cachedRaw: string | null = null;
let _cachedSessions: SavedStudySession[] = DEFAULT_SESSIONS;

export function getStudySessions(): SavedStudySession[] {
  if (typeof window === "undefined") {
    return DEFAULT_SESSIONS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === _cachedRaw) return _cachedSessions;
    _cachedRaw = raw;
    if (!raw) {
      _cachedSessions = DEFAULT_SESSIONS;
      return DEFAULT_SESSIONS;
    }
    const parsed = JSON.parse(raw) as SavedStudySession[];
    _cachedSessions = parsed.length > 0 ? parsed : DEFAULT_SESSIONS;
    return _cachedSessions;
  } catch {
    return DEFAULT_SESSIONS;
  }
}

export function saveStudySession(session: Partial<SavedStudySession> & { videoId: string }) {
  if (typeof window === "undefined") return;
  try {
    const current = getStudySessions();
    const existingIndex = current.findIndex((s) => s.videoId === session.videoId);

    const now = new Date().toISOString();
    let updated: SavedStudySession[];

    if (existingIndex >= 0) {
      const existing = current[existingIndex];
      const merged: SavedStudySession = {
        ...existing,
        ...session,
        title: session.title || existing.title,
        updatedAt: now,
      };
      updated = [merged, ...current.filter((_, idx) => idx !== existingIndex)];
    } else {
      const newSession: SavedStudySession = {
        id: session.id || `session-${Date.now()}`,
        videoId: session.videoId,
        title: session.title || "YouTube Study Session",
        channel: session.channel || "YouTube",
        progressPercent: session.progressPercent ?? 10,
        timestampsCount: session.timestampsCount ?? 0,
        lastPosition: session.lastPosition ?? "00:00",
        notes: session.notes ?? "",
        updatedAt: now,
      };
      updated = [newSession, ...current];
    }

    const sliced = updated.slice(0, 10);
    const raw = JSON.stringify(sliced);
    _cachedRaw = raw;
    _cachedSessions = sliced;
    localStorage.setItem(STORAGE_KEY, raw);
    notifyStorageUpdate("study");
  } catch {
    // localStorage error handling
  }
}
