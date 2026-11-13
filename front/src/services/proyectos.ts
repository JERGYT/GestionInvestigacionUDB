import type { Catalogos, Proyecto } from '../types';
import { mockCatalogos, mockProyectos } from './mocks/db';

const PUBLIC_BASE = 'http://localhost/GestionInvestigacionUDB/back/ms-proyectos/public';
const API_BASE = `${PUBLIC_BASE}/index.php/view`;

export interface RespuestaApi {
  success?: boolean;
  message?: string;
  data?: Proyecto;
  error?: string;
}

export const obtenerUrlPdf = (relativePath?: string | null): string => {
  if (!relativePath) return '#';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  return `${PUBLIC_BASE}/${relativePath.replace(/^\/+/, '')}`;
};

export const proyectosService = {
  async obtenerCatalogos(): Promise<Catalogos> {
    try {
      const res = await fetch(`${API_BASE}/catalogos`);
      if (!res.ok) throw new Error('Error al consultar catálogos');
      return (await res.json()) as Catalogos;
    } catch {
      console.warn('Usando catálogos de respaldo local.');
      return mockCatalogos;
    }
  },

  async obtenerTodos(): Promise<Proyecto[]> {
    try {
      const res = await fetch(`${API_BASE}/proyectos`);
      if (!res.ok) throw new Error('Error al consultar proyectos');
      const data = await res.json();
      return Array.isArray(data) ? (data as Proyecto[]) : mockProyectos;
    } catch {
      console.warn('Backend inalcanzable. Usando datos Mock de contingencia.');
      return mockProyectos;
    }
  },

  async radicar(payload: FormData | Record<string, unknown>): Promise<RespuestaApi> {
    try {
      const isFormData = payload instanceof FormData;
      const res = await fetch(`${API_BASE}/proyectos`, {
        method: 'POST',
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
        body: isFormData ? payload : JSON.stringify(payload)
      });
      return (await res.json()) as RespuestaApi;
    } catch {
      return { success: false, error: 'Fallo de conexión al radicar el proyecto docente.' };
    }
  },

  async transicion(id: number, payload: Record<string, unknown>): Promise<RespuestaApi> {
    try {
      const res = await fetch(`${API_BASE}/proyectos/${id}/transicion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return (await res.json()) as RespuestaApi;
    } catch {
      return { success: false, error: 'Fallo de conexión al ejecutar la transición de estado.' };
    }
  },

  async registrarConceptoPar(id: number, payload: Record<string, unknown>): Promise<RespuestaApi> {
    try {
      const res = await fetch(`${API_BASE}/proyectos/${id}/pares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return (await res.json()) as RespuestaApi;
    } catch {
      return { success: false, error: 'Fallo de conexión al registrar el concepto del par evaluador.' };
    }
  },

  async subsanar(id: number, payload: FormData | Record<string, unknown>): Promise<RespuestaApi> {
    try {
      const isFormData = payload instanceof FormData;
      const res = await fetch(`${API_BASE}/proyectos/${id}/subsanar`, {
        method: 'POST',
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
        body: isFormData ? payload : JSON.stringify(payload)
      });
      return (await res.json()) as RespuestaApi;
    } catch {
      return { success: false, error: 'Fallo de conexión al subsanar el proyecto.' };
    }
  }
};
