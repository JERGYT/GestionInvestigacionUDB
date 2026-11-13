export type RolUsuario = 'docente' | 'lider_grupo' | 'comite' | 'par_evaluador';

export type EtapaProyecto = 'idea' | 'anteproyecto' | 'proyecto' | 'desarrollo' | 'informe_final';

export type EstadoProyecto =
  | 'en_revision_lider'
  | 'en_revision_investigadores'
  | 'aprobado_lider'
  | 'en_revision_comite'
  | 'en_evaluacion_pares'
  | 'aprobado_facultad'
  | 'en_desarrollo'
  | 'novedad_cipade'
  | 'archivado';

export type TipoEventoTrazabilidad =
  | 'radicacion_inicial'
  | 'devolucion_lider'
  | 'aval_lider'
  | 'asignacion_pares'
  | 'concepto_par'
  | 'aprobacion_facultad'
  | 'inicio_desarrollo'
  | 'novedad_cipade'
  | 'subsanacion_investigador'
  | 'cambio_equipo';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  programa: string;
}

export interface SublineaInvestigacion {
  id: number;
  linea_id: number;
  nombre: string;
  activa: number;
}

export interface LineaInvestigacion {
  id: number;
  nombre: string;
  activa: number;
  sublineas?: SublineaInvestigacion[];
}

export interface Catalogos {
  lineas: LineaInvestigacion[];
  sublineas: SublineaInvestigacion[];
  docentes: Usuario[];
  pares: Usuario[];
  usuarios: Usuario[];
}

export interface MiembroEquipo {
  id: number;
  usuario_id: number;
  nombre: string;
  email: string;
  programa: string;
  rol_equipo: 'principal' | 'coinvestigador' | 'codirector';
  activo: boolean;
  fecha_vinculacion: string;
  fecha_retiro: string | null;
}

export interface EventoTrazabilidad {
  id: number;
  proyecto_id: number;
  etapa: EtapaProyecto;
  estado_anterior: EstadoProyecto | null;
  estado_nuevo: EstadoProyecto;
  actor_id: number;
  actor_nombre: string;
  actor_rol: RolUsuario;
  tipo_evento: TipoEventoTrazabilidad;
  observaciones: string;
  version_documento: number | null;
  archivo_pdf_url: string | null;
  fecha_evento: string;
}

export interface EvaluacionPar {
  id: number;
  proyecto_id: number;
  par_usuario_id: number;
  par_nombre: string;
  par_email: string;
  par_programa: string;
  etapa_evaluada: EtapaProyecto;
  ronda: number;
  fecha_asignacion: string;
  fecha_concepto: string | null;
  veredicto: 'pendiente' | 'aprobado' | 'con_correcciones';
  concepto_observaciones: string | null;
}

export interface Proyecto {
  id: number;
  titulo: string;
  resumen: string;
  linea_id: number;
  linea_investigacion: string;
  sublinea_id: number;
  sublinea: string;
  investigador_principal_id: number;
  investigador_principal: string;
  etapa_actual: EtapaProyecto;
  estado_actual: EstadoProyecto;
  rondas_revision: number;
  fecha_radicacion: string;
  fecha_asignacion_pares: string | null;
  documento_actual_url: string | null;
  version_documento: number;
  equipo: MiembroEquipo[];
  trazabilidad: EventoTrazabilidad[];
  evaluaciones_pares: EvaluacionPar[];
}

export const ESTADOS_METADATA: Record<
  EstadoProyecto,
  { label: string; bg: string; text: string; border: string }
> = {
  en_revision_lider: {
    label: 'En Revisión Líder',
    bg: '#0369a1',
    text: '#e0f2fe',
    border: '#0284c7'
  },
  en_revision_investigadores: {
    label: 'Devuelto a Investigadores (Con Obs.)',
    bg: '#991b1b',
    text: '#fee2e2',
    border: '#dc2626'
  },
  aprobado_lider: {
    label: 'Avalado por Líder',
    bg: '#0d9488',
    text: '#ccfbf1',
    border: '#14b8a6'
  },
  en_revision_comite: {
    label: 'En Revisión Comité',
    bg: '#b45309',
    text: '#fef3c7',
    border: '#f59e0b'
  },
  en_evaluacion_pares: {
    label: 'En Evaluación de Pares',
    bg: '#6d28d9',
    text: '#ede9fe',
    border: '#8b5cf6'
  },
  aprobado_facultad: {
    label: 'Aprobado Nivel Facultad',
    bg: '#15803d',
    text: '#dcfce7',
    border: '#22c55e'
  },
  en_desarrollo: {
    label: 'En Desarrollo',
    bg: '#0f766e',
    text: '#ccfbf1',
    border: '#2dd4bf'
  },
  novedad_cipade: {
    label: 'Novedad CIPADE (En Subsanación)',
    bg: '#be123c',
    text: '#ffe4e6',
    border: '#f43f5e'
  },
  archivado: {
    label: 'Archivado',
    bg: '#334155',
    text: '#cbd5e1',
    border: '#475569'
  }
};

export const ETAPAS_METADATA: Record<EtapaProyecto, { label: string; bg: string }> = {
  idea: { label: 'Idea', bg: '#1e40af' },
  anteproyecto: { label: 'Anteproyecto', bg: '#4338ca' },
  proyecto: { label: 'Proyecto Formal', bg: '#0f766e' },
  desarrollo: { label: 'Desarrollo del Proyecto', bg: '#15803d' },
  informe_final: { label: 'Informe Final', bg: '#334155' }
};

export const EVENTOS_METADATA: Record<
  TipoEventoTrazabilidad,
  { label: string; color: string; bg: string }
> = {
  radicacion_inicial: { label: 'Radicación Inicial', color: '#38bdf8', bg: '#0c4a6e' },
  devolucion_lider: { label: 'Devolución Líder (Con Observaciones)', color: '#f87171', bg: '#450a0a' },
  aval_lider: { label: 'Aval Líder de Grupo → Comité', color: '#34d399', bg: '#064e3b' },
  asignacion_pares: { label: 'Asignación de Pares Evaluadores', color: '#c084fc', bg: '#3b0764' },
  concepto_par: { label: 'Concepto de Par Evaluador', color: '#a78bfa', bg: '#2e1065' },
  aprobacion_facultad: { label: 'Aprobación a Nivel de Facultad', color: '#4ade80', bg: '#14532d' },
  inicio_desarrollo: { label: 'Inicio de Desarrollo del Proyecto', color: '#2dd4bf', bg: '#134e4a' },
  novedad_cipade: { label: 'Novedad de CIPADE (Directo a Investigadores)', color: '#fb7185', bg: '#4c0519' },
  subsanacion_investigador: { label: 'Subsanación y Nueva Versión PDF', color: '#fbbf24', bg: '#451a03' },
  cambio_equipo: { label: 'Actualización Equipo Docente', color: '#94a3b8', bg: '#1e293b' }
};

export const ROLES_METADATA: Record<
  RolUsuario,
  { label: string; actorDefaultId: number; actorNombre: string; descripcion: string; color: string }
> = {
  docente: {
    label: 'Docente Investigador',
    actorDefaultId: 2,
    actorNombre: 'Ing. Francisco Vargas',
    descripcion: 'Radica propuestas docentes, asocia co-investigadores y subsana observaciones subiendo nuevas versiones del PDF.',
    color: '#38bdf8'
  },
  lider_grupo: {
    label: 'Líder de Grupo',
    actorDefaultId: 1,
    actorNombre: 'Dra. Paula Cheng',
    descripcion: 'Revisa propuestas en primera instancia: devuelve con observaciones a investigadores o da aval para pasar al Comité.',
    color: '#34d399'
  },
  comite: {
    label: 'Comité FIAD',
    actorDefaultId: 4,
    actorNombre: 'Comité de Investigaciones FIAD',
    descripcion: 'Asigna pares evaluadores con fecha, aprueba proyectos a nivel de facultad, inicia el desarrollo y registra novedades de CIPADE.',
    color: '#fbbf24'
  },
  par_evaluador: {
    label: 'Par Evaluador',
    actorDefaultId: 6,
    actorNombre: 'Dra. Laura Gómez (Par 2)',
    descripcion: 'Emite concepto individual sobre el proyecto. Si al menos un par devuelve con correcciones, el proyecto regresa a los investigadores.',
    color: '#c084fc'
  }
};
