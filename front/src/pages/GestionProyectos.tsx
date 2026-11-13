import React, { useMemo, useState } from 'react';
import { ROLES_METADATA, type Proyecto, type RolUsuario } from '../types';
import type { VistaApp } from '../components/Sidebar';
import { BadgeEstado, BadgeEtapa, BadgeEvento } from '../components/ui/Badge';
import { obtenerUrlPdf } from '../services/proyectos';
import {
  PlusCircle,
  Users,
  FileText,
  RefreshCw,
  CheckSquare,
  History,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface Props {
  proyectos: Proyecto[];
  seleccionado: Proyecto | null;
  setSeleccionado: (p: Proyecto) => void;
  setVistaActual: (v: VistaApp) => void;
  rolActual: RolUsuario;
}

export const GestionProyectos: React.FC<Props> = ({
  proyectos,
  seleccionado,
  setSeleccionado,
  setVistaActual,
  rolActual
}) => {
  const [filtroEtapa, setFiltroEtapa] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      const matchEtapa = filtroEtapa === 'todas' || p.etapa_actual === filtroEtapa;
      const matchEstado = filtroEstado === 'todos' || p.estado_actual === filtroEstado;
      return matchEtapa && matchEstado;
    });
  }, [proyectos, filtroEtapa, filtroEstado]);

  const ultimoEvento = seleccionado?.trazabilidad?.[0] ?? null;
  const requiereSubsanacion =
    seleccionado?.estado_actual === 'en_revision_investigadores' ||
    seleccionado?.estado_actual === 'novedad_cipade';

  return (
    <div>
      <header
        style={{
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '23px', margin: 0 }}>
              Gestión de Proyectos de Investigación Docente
            </h1>
            <span
              style={{
                backgroundColor: '#0f172a',
                border: `1px solid ${ROLES_METADATA[rolActual].color}`,
                color: ROLES_METADATA[rolActual].color,
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              Vista activa: {ROLES_METADATA[rolActual].label}
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
            Flujo oficial: Revisión Líder → Revisión Comité y Evaluación por Pares → Aprobación Facultad → Desarrollo y Novedades CIPADE
          </p>
        </div>

        <button
          onClick={() => setVistaActual('radicar')}
          style={{
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}
        >
          <PlusCircle size={18} /> Radicar Proyecto Docente
        </button>
      </header>

      {/* Barra de filtros y resumen rápido */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '20px',
          backgroundColor: '#1e293b',
          padding: '14px 18px',
          borderRadius: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          border: '1px solid #334155'
        }}
      >
        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
            Filtrar por Etapa:
          </label>
          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value)}
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12.5px'
            }}
          >
            <option value="todas">Todas las Etapas</option>
            <option value="idea">Idea</option>
            <option value="anteproyecto">Anteproyecto</option>
            <option value="proyecto">Proyecto Formal</option>
            <option value="desarrollo">Desarrollo</option>
            <option value="informe_final">Informe Final</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
            Filtrar por Estado del Flujo:
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12.5px'
            }}
          >
            <option value="todos">Todos los Estados</option>
            <option value="en_revision_lider">En Revisión Líder</option>
            <option value="en_revision_investigadores">Devuelto a Investigadores (Con Obs.)</option>
            <option value="en_revision_comite">En Revisión Comité</option>
            <option value="en_evaluacion_pares">En Evaluación de Pares</option>
            <option value="aprobado_facultad">Aprobado Nivel Facultad</option>
            <option value="en_desarrollo">En Desarrollo</option>
            <option value="novedad_cipade">Novedad CIPADE</option>
            <option value="archivado">Archivado</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', fontSize: '12px', color: '#cbd5e1' }}>
          <div>
            Total proyectos: <strong style={{ color: '#38bdf8' }}>{proyectosFiltrados.length}</strong>
          </div>
          <div>
            Modalidad única: <strong style={{ color: '#34d399' }}>Investigación Docente</strong>
          </div>
        </div>
      </div>

      {/* Grilla Principal: Tabla + Expediente Detallado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr', gap: '22px', alignItems: 'start' }}>
        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #334155'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead
              style={{
                backgroundColor: '#0f172a',
                color: '#94a3b8',
                textTransform: 'uppercase',
                fontSize: '11px',
                borderBottom: '1px solid #334155'
              }}
            >
              <tr>
                <th style={{ padding: '12px 14px' }}>ID</th>
                <th style={{ padding: '12px 14px' }}>Proyecto Docente / Investigador Principal</th>
                <th style={{ padding: '12px 14px' }}>Etapa</th>
                <th style={{ padding: '12px 14px' }}>Estado Actual</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Rondas</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {proyectosFiltrados.map((p) => {
                const isSelected = seleccionado?.id === p.id;
                const coCount = p.equipo.filter((m) => m.rol_equipo !== 'principal' && m.activo).length;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSeleccionado(p)}
                    style={{
                      borderBottom: '1px solid #334155',
                      backgroundColor: isSelected ? '#1e3a5f' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease'
                    }}
                  >
                    <td style={{ padding: '14px', fontWeight: 'bold', color: '#38bdf8' }}>#{p.id}</td>
                    <td style={{ padding: '14px' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#f8fafc',
                          marginBottom: '4px',
                          lineHeight: 1.3
                        }}
                      >
                        {p.titulo}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        IP: <strong style={{ color: '#cbd5e1' }}>{p.investigador_principal}</strong>
                        {coCount > 0 && ` (+${coCount} co-inv.)`}
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <BadgeEtapa etapa={p.etapa_actual} />
                    </td>
                    <td style={{ padding: '14px' }}>
                      <BadgeEstado estado={p.estado_actual} />
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <span
                        title="Contador de rondas de revisión / devoluciones"
                        style={{
                          backgroundColor: p.rondas_revision > 0 ? '#451a03' : '#0f172a',
                          color: p.rondas_revision > 0 ? '#fbbf24' : '#94a3b8',
                          border: '1px solid #475569',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '11.5px',
                          fontWeight: 700
                        }}
                      >
                        {p.rondas_revision}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: '#0c4a6e',
                          color: '#38bdf8',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        v{p.version_documento}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {proyectosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                    No se encontraron proyectos docentes con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Panel derecho: Expediente del Proyecto Docente */}
        {seleccionado && (
          <div
            style={{
              backgroundColor: '#1e293b',
              padding: '24px',
              borderRadius: '10px',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#38bdf8',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Expediente Docente #{seleccionado.id} · Radicado: {seleccionado.fecha_radicacion}
                </span>
                <h2 style={{ fontSize: '18px', margin: '4px 0 0 0', lineHeight: 1.3 }}>
                  {seleccionado.titulo}
                </h2>
              </div>
              {seleccionado.documento_actual_url && (
                <a
                  href={obtenerUrlPdf(seleccionado.documento_actual_url)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    backgroundColor: '#0c4a6e',
                    color: '#38bdf8',
                    border: '1px solid #0284c7',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <FileText size={15} /> PDF Actual (v{seleccionado.version_documento})
                </a>
              )}
            </div>

            {/* Indicadores clave de estado, etapa y rondas */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <BadgeEstado estado={seleccionado.estado_actual} />
              <BadgeEtapa etapa={seleccionado.etapa_actual} />
              <span
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  color: '#fbbf24',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RefreshCw size={12} /> Rondas de revisión: {seleccionado.rondas_revision}
              </span>
            </div>

            {seleccionado.resumen && (
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#cbd5e1',
                  backgroundColor: '#0f172a',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #38bdf8',
                  lineHeight: 1.5
                }}
              >
                {seleccionado.resumen}
              </p>
            )}

            <div style={{ fontSize: '12.5px', lineHeight: 1.6, color: '#cbd5e1' }}>
              <div>
                <strong style={{ color: '#94a3b8' }}>Línea de Investigación:</strong>{' '}
                {seleccionado.linea_investigacion}
              </div>
              <div>
                <strong style={{ color: '#94a3b8' }}>Sublínea:</strong> {seleccionado.sublinea}
              </div>
              {seleccionado.fecha_asignacion_pares && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Calendar size={13} color="#c084fc" />
                  <strong style={{ color: '#c084fc' }}>Fecha Asignación Pares:</strong>{' '}
                  {seleccionado.fecha_asignacion_pares}
                </div>
              )}
            </div>

            {/* Equipo de Investigadores Docentes */}
            <div
              style={{
                backgroundColor: '#0f172a',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #334155'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  marginBottom: '8px'
                }}
              >
                <Users size={15} /> Equipo de Investigadores Docentes ({seleccionado.equipo.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {seleccionado.equipo.map((miembro) => (
                  <div
                    key={miembro.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      padding: '6px 8px',
                      backgroundColor: '#1e293b',
                      borderRadius: '6px'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#f8fafc' }}>{miembro.nombre}</strong>
                      <span style={{ color: '#94a3b8', marginLeft: '6px', fontSize: '11px' }}>
                        ({miembro.email})
                      </span>
                    </div>
                    <span
                      style={{
                        backgroundColor: miembro.rol_equipo === 'principal' ? '#0284c7' : '#334155',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {miembro.rol_equipo === 'principal' ? 'Investigador Principal' : 'Co-investigador'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de Evaluación por Pares si aplica */}
            {seleccionado.evaluaciones_pares.length > 0 && (
              <div
                style={{
                  backgroundColor: '#0f172a',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #4c1d95'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', marginBottom: '8px' }}>
                  Pares Evaluadores Asignados
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {seleccionado.evaluaciones_pares.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        fontSize: '12px',
                        padding: '8px',
                        backgroundColor: '#1e293b',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{ev.par_nombre} (Ronda {ev.ronda})</strong>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor:
                              ev.veredicto === 'aprobado'
                                ? '#14532d'
                                : ev.veredicto === 'con_correcciones'
                                ? '#7f1d1d'
                                : '#334155',
                            color: '#fff'
                          }}
                        >
                          {ev.veredicto.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Asignado: {ev.fecha_asignacion}
                        {ev.fecha_concepto ? ` · Concepto: ${ev.fecha_concepto}` : ' · Pendiente de dictamen'}
                      </div>
                      {ev.concepto_observaciones && (
                        <div style={{ fontSize: '11.5px', color: '#e2e8f0', fontStyle: 'italic' }}>
                          "{ev.concepto_observaciones}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Último movimiento registrado en Trazabilidad */}
            {ultimoEvento && (
              <div
                style={{
                  backgroundColor: requiereSubsanacion ? '#450a0a' : '#0f172a',
                  border: `1px solid ${requiereSubsanacion ? '#dc2626' : '#334155'}`,
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {requiereSubsanacion && <AlertTriangle size={15} color="#f87171" />}
                    <BadgeEvento tipo={ultimoEvento.tipo_evento} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {ultimoEvento.fecha_evento}
                  </span>
                </div>
                <div style={{ color: '#f8fafc', marginBottom: '4px', lineHeight: 1.4 }}>
                  {ultimoEvento.observaciones}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Por: <strong>{ultimoEvento.actor_nombre}</strong>
                  {ultimoEvento.version_documento && ` · Documento v${ultimoEvento.version_documento}`}
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setVistaActual('evaluacion')}
                style={{
                  flex: 1,
                  backgroundColor: requiereSubsanacion ? '#dc2626' : '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CheckSquare size={16} />
                {requiereSubsanacion
                  ? 'Subsanar y Subir Nueva Versión PDF'
                  : 'Gestionar Estado / Evaluar'}
              </button>

              <button
                onClick={() => setVistaActual('seguimiento')}
                style={{
                  flex: 1,
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <History size={16} />
                Trazabilidad ({seleccionado.trazabilidad.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
