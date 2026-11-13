export type RolUsuario = 'docente' | 'lider_grupo' | 'comite' | 'par_evaluador';

export type EtapaProyecto = 'idea' | 'anteproyecto' | 'proyecto' | 'desarrollo' | 'informe_final';

export type EstadoProyecto =
  | 'en_revision_lider'
  | 'en_revision_investigadores'
  | 'aprobado_lider'
  | 'en_revision_comite'
  | 'en_evaluacion_pares'
  | 'en_standby'
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
  | 'cambio_equipo'
  | 'standby';

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
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#F59E0B'
  },
  en_revision_investigadores: {
    label: 'Devuelto a Investigadores (Con Obs.)',
    bg: '#FEE2E2',
    text: '#9E0B22',
    border: '#C8102E'
  },
  aprobado_lider: {
    label: 'Avalado por Líder',
    bg: '#D1FAE5',
    text: '#065F46',
    border: '#10B981'
  },
  en_revision_comite: {
    label: 'En Revisión Comité',
    bg: '#FEF9E7',
    text: '#8A6A10',
    border: '#C59B27'
  },
  en_evaluacion_pares: {
    label: 'En Evaluación de Pares',
    bg: '#FFEDD5',
    text: '#9A3412',
    border: '#F59E0B'
  },
  en_standby: {
    label: 'En Standby (Espera Vacaciones)',
    bg: '#FEF9E7',
    text: '#8A6A10',
    border: '#C59B27'
  },
  aprobado_facultad: {
    label: 'Aprobado Nivel Facultad',
    bg: '#D1FAE5',
    text: '#065F46',
    border: '#059669'
  },
  en_desarrollo: {
    label: 'En Desarrollo',
    bg: '#ECFDF5',
    text: '#047857',
    border: '#10B981'
  },
  novedad_cipade: {
    label: 'Novedad CIPADE (En Subsanación)',
    bg: '#FFF1F2',
    text: '#9E0B22',
    border: '#C8102E'
  },
  archivado: {
    label: 'Archivado',
    bg: '#F3F4F6',
    text: '#374151',
    border: '#D1D5DB'
  }
};

export const ETAPAS_METADATA: Record<
  EtapaProyecto,
  { label: string; bg: string; text: string; border: string }
> = {
  idea: {
    label: 'Idea',
    bg: '#F3F4F6',
    text: '#1F2937',
    border: '#D1D5DB'
  },
  anteproyecto: {
    label: 'Anteproyecto',
    bg: '#FEF9E7',
    text: '#8A6A10',
    border: '#C59B27'
  },
  proyecto: {
    label: 'Proyecto Formal',
    bg: '#ECFDF5',
    text: '#065F46',
    border: '#6EE7B7'
  },
  desarrollo: {
    label: 'Desarrollo del Proyecto',
    bg: '#D1FAE5',
    text: '#047857',
    border: '#10B981'
  },
  informe_final: {
    label: 'Informe Final',
    bg: '#E5E7EB',
    text: '#1F2937',
    border: '#9CA3AF'
  }
};

export const EVENTOS_METADATA: Record<
  TipoEventoTrazabilidad,
  { label: string; color: string; bg: string; border: string }
> = {
  radicacion_inicial: {
    label: 'Radicación Inicial',
    color: '#1F2937',
    bg: '#F3F4F6',
    border: '#D1D5DB'
  },
  devolucion_lider: {
    label: 'Devolución Líder (Con Observaciones)',
    color: '#9E0B22',
    bg: '#FEE2E2',
    border: '#FCA5A5'
  },
  aval_lider: {
    label: 'Aval Líder de Grupo → Comité',
    color: '#065F46',
    bg: '#D1FAE5',
    border: '#6EE7B7'
  },
  asignacion_pares: {
    label: 'Asignación de Pares Evaluadores',
    color: '#8A6A10',
    bg: '#FEF9E7',
    border: '#C59B27'
  },
  concepto_par: {
    label: 'Concepto de Par Evaluador',
    color: '#92400E',
    bg: '#FEF3C7',
    border: '#F59E0B'
  },
  aprobacion_facultad: {
    label: 'Aprobación Comité / Promoción de Etapa',
    color: '#065F46',
    bg: '#D1FAE5',
    border: '#10B981'
  },
  inicio_desarrollo: {
    label: 'Inicio de Desarrollo del Proyecto',
    color: '#047857',
    bg: '#ECFDF5',
    border: '#34D399'
  },
  novedad_cipade: {
    label: 'Novedad de CIPADE (Directo a Investigadores)',
    color: '#9E0B22',
    bg: '#FFF1F2',
    border: '#C8102E'
  },
  subsanacion_investigador: {
    label: 'Subsanación por Correo / Reunión',
    color: '#92400E',
    bg: '#FFFBEB',
    border: '#F59E0B'
  },
  cambio_equipo: {
    label: 'Cambio en Equipo de Co-investigadores',
    color: '#1F2937',
    bg: '#E5E7EB',
    border: '#9CA3AF'
  },
  standby: {
    label: 'Pausa / Reactivación Standby (Vacaciones)',
    color: '#8A6A10',
    bg: '#FEF9E7',
    border: '#C59B27'
  }
};

export function obtenerResponsableActual(estado: EstadoProyecto): {
  responsable: string;
  accionRequerida: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (estado) {
    case 'en_revision_lider':
      return {
        responsable: 'Líder de Grupo',
        accionRequerida: 'Dar aval o devolver con observaciones',
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#F59E0B'
      };
    case 'en_revision_investigadores':
      return {
        responsable: 'Investigadores Docentes',
        accionRequerida: 'Subsanar observaciones y reenviar a Líder',
        bg: '#FEE2E2',
        text: '#9E0B22',
        border: '#C8102E'
      };
    case 'aprobado_lider':
    case 'en_revision_comite':
      return {
        responsable: 'Comité FIAD',
        accionRequerida: 'Asignar pares evaluadores o aprobar etapa',
        bg: '#FEF9E7',
        text: '#8A6A10',
        border: '#C59B27'
      };
    case 'en_evaluacion_pares':
      return {
        responsable: 'Pares Evaluadores / Comité',
        accionRequerida: 'Registrar concepto de Par 1 y Par 2',
        bg: '#FFEDD5',
        text: '#9A3412',
        border: '#F59E0B'
      };
    case 'en_standby':
      return {
        responsable: 'En Standby (Pares / Comité)',
        accionRequerida: 'En espera por receso vacacional (Dic/Feb)',
        bg: '#FEF9E7',
        text: '#8A6A10',
        border: '#C59B27'
      };
    case 'en_desarrollo':
      return {
        responsable: 'Investigadores / CIPADE',
        accionRequerida: 'Ejecución, novedad CIPADE o cierre',
        bg: '#ECFDF5',
        text: '#047857',
        border: '#10B981'
      };
    case 'novedad_cipade':
      return {
        responsable: 'CIPADE / Investigadores',
        accionRequerida: 'Subsanar novedad CIPADE (retorno directo)',
        bg: '#FFF1F2',
        text: '#9E0B22',
        border: '#C8102E'
      };
    case 'aprobado_facultad':
      return {
        responsable: 'Facultad FIAD (Cerrado)',
        accionRequerida: 'Aprobado a nivel de Facultad',
        bg: '#D1FAE5',
        text: '#065F46',
        border: '#059669'
      };
    default:
      return {
        responsable: 'Archivo Institucional',
        accionRequerida: 'Sin acciones pendientes',
        bg: '#F3F4F6',
        text: '#374151',
        border: '#D1D5DB'
      };
  }
}
