import { Platform } from 'react-native';

import type { AgentData, PaginatedAgentData } from '@/types/agent-data';

const DEV_API_URL = 'https://devgadbadr.me/actressapi';

const DEFAULT_API_URL =
  Platform.OS === 'web' ? 'http://localhost:3000' : DEV_API_URL;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '').replace(/localhost|127\.0\.0\.1/, 'devgadbadr.me') ??
  DEFAULT_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function fetchAgentData(params: {
  page: number;
  limit: number;
  shuffle: boolean;
}): Promise<PaginatedAgentData> {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    shuffle: String(params.shuffle),
  });

  return request<PaginatedAgentData>(`/agent-data?${search}`);
}

export function toggleFavourite(id: number): Promise<AgentData> {
  return request<AgentData>(`/agent-data/${id}/favourite`, { method: 'PATCH' });
}

export function deleteAgentData(id: number): Promise<void> {
  return request<void>(`/agent-data/${id}`, { method: 'DELETE' });
}
