import React, { useMemo, useState } from 'react';
import { ROLES_METADATA, type Catalogos, type Proyecto, type RolUsuario } from '../types';
import type { VistaApp } from '../components/Sidebar';
import { BadgeEstado, BadgeEtapa, BadgeEvento } from '../components/ui/Badge';
import { proyectosService } from '../services/proyectos';
import {
  PlusCircle,
  Users,
  RefreshCw,
  CheckSquare,
  History,
  AlertTriangle,
  Calendar,
  UserPlus,
  UserMinus
} from 'lucide-react';

interface Props {
  proyectos: Proyecto[];
  catalogos: Catalogos;
  seleccionado: Proyecto | null;
  setSeleccionado: (p: Proyecto) => void;
  setVistaActual: (v: VistaApp) => void;
  rolActual: RolUsuario;
  onProyectoActualizado: (p?: Proyecto) => void;
}

export const GestionProyectos: React.FC<Props> = ({
  proyectos,
  catalogos,
  seleccionado,
  setSeleccionado,
  setVistaActual,
  rolActual,
  onProyectoActualizado
}) => {
  const [filtroEtapa, setFiltroEtapa] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Estados para gestión de cambios en el equipo de co-investigadores
  const [mostrarGestionEquipo, setMostrarGestionEquipo] = useState(false);
  const [docenteVincularId, setDocenteVincularId] = useState<number>(3);
  const [rolVincular, setRolVincular] = useState<'coinvestigador' | 'codirector'>('coinvestigador');
  const [fechaCambioEquipo, setFechaCambioEquipo] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [obsCambioEquipo, setObsCambioEquipo] = useState('');
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);

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

  const rolMeta = ROLES_METADATA[rolActual];

  const handleVincularDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionado) return;
    setGuardandoEquipo(true);
    const res = await proyectosService.transicion(seleccionado.id, {
      accion: 'cambio_equipo',
      actor_id: ROLES_METADATA[rolActual].actorDefaultId,
      nuevo_usuario_id: docenteVincularId,
      rol_equipo: rolVincular,
      fecha_cambio: fechaCambioEquipo,
      fecha_evento: fechaCambioEquipo,
      observaciones:
        obsCambioEquipo.trim() ||
        'Solicitud enviada por correo institucional para vinculación al equipo docente.'
    });
    setGuardandoEquipo(false);
    if (!res.error) {
      setObsCambioEquipo('');
      onProyectoActualizado(res.data);
    }
  };

  const handleRetirarDocente = async (usuarioId: number, nombreDocente: string) => {
    if (!seleccionado) return;
    setGuardandoEquipo(true);
    const res = await proyectosService.transicion(seleccionado.id, {
      accion: 'cambio_equipo',
      actor_id: ROLES_METADATA[rolActual].actorDefaultId,
      retirar_usuario_id: usuarioId,
      fecha_cambio: fechaCambioEquipo,
      fecha_evento: fechaCambioEquipo,
      observaciones:
        obsCambioEquipo.trim() ||
        `Retiro de ${nombreDocente} formalizado mediante correo institucional.`
    });
    setGuardandoEquipo(false);
    if (!res.error) {
      setObsCambioEquipo('');
      onProyectoActualizado(res.data);
    }
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '23px', margin: 0, color: '#1F2937' }}>
              Trazabilidad y Estados de Proyectos Docentes
            </h1>
            <span
              style={{
                backgroundColor: rolMeta.badgeBg,
                border: `1px solid ${rolMeta.badgeBorder}`,
                color: rolMeta.badgeText,
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              Vista activa: {rolMeta.label}
            </span>
          </div>
          <p style={{ color: '#4B5563', fontSize: '13px', margin: 0 }}>
            Flujo de control histórico: Revisión Líder → Revisión Comité y Evaluación por Pares → Aprobación Facultad → Desarrollo y Novedades CIPADE
          </p>
        </div>

        <button
          onClick={() => setVistaActual('radicar')}
          className="ub-btn-primary"
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 700,
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

      {/* Barra de filtros */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '20px',
          backgroundColor: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div>
          <label style={{ display: 'block', color: '#4B5563', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
            Filtrar por Etapa:
          </label>
          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value)}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
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
          <label style={{ display: 'block', color: '#4B5563', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
            Filtrar por Estado del Flujo:
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
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

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', fontSize: '12px', color: '#4B5563' }}>
          <div>
            Total proyectos: <strong style={{ color: '#C8102E' }}>{proyectosFiltrados.length}</strong>
          </div>
          <div>
            Modalidad única: <strong style={{ color: '#065F46' }}>Investigación Docente</strong>
          </div>
        </div>
      </div>

      {/* Grilla Principal: Tabla + Expediente Detallado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1.25fr', gap: '22px', alignItems: 'start' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead
              style={{
                backgroundColor: '#F9FAFB',
                color: '#4B5563',
                textTransform: 'uppercase',
                fontSize: '11px',
                borderBottom: '1px solid #E5E7EB'
              }}
            >
              <tr>
                <th style={{ padding: '12px 14px' }}>ID</th>
                <th style={{ padding: '12px 14px' }}>Proyecto Docente / Investigador Principal</th>
                <th style={{ padding: '12px 14px' }}>Etapa</th>
                <th style={{ padding: '12px 14px' }}>Estado Actual</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Rondas</th>
                <th style={{ padding: '12px 14px' }}>Radicado</th>
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
                      borderBottom: '1px solid #E5E7EB',
                      backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF',
                      borderLeft: isSelected ? '4px solid #C8102E' : '4px solid transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease'
                    }}
                  >
                    <td style={{ padding: '14px', fontWeight: 700, color: '#C8102E' }}>#{p.id}</td>
                    <td style={{ padding: '14px' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#1F2937',
                          marginBottom: '4px',
                          lineHeight: 1.3
                        }}
                      >
                        {p.titulo}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#6B7280' }}>
                        IP: <strong style={{ color: '#374151' }}>{p.investigador_principal}</strong>
                        {coCount > 0 && ` (+${coCount} co-inv. activos)`}
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
                          backgroundColor: p.rondas_revision > 0 ? '#FEF9E7' : '#F3F4F6',
                          color: p.rondas_revision > 0 ? '#8A6A10' : '#4B5563',
                          border: p.rondas_revision > 0 ? '1px solid #C59B27' : '1px solid #D1D5DB',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '11.5px',
                          fontWeight: 700
                        }}
                      >
                        {p.rondas_revision}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontSize: '12px', color: '#4B5563', whiteSpace: 'nowrap' }}>
                      {p.fecha_radicacion}
                    </td>
                  </tr>
                );
              })}
              {proyectosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: '#6B7280' }}>
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
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              borderTop: '4px solid #C8102E',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  color: '#C8102E',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Expediente Docente #{seleccionado.id} · Fecha Radicación: {seleccionado.fecha_radicacion}
              </span>
              <h2 style={{ fontSize: '18px', margin: '4px 0 0 0', lineHeight: 1.3, color: '#1F2937' }}>
                {seleccionado.titulo}
              </h2>
            </div>

            {/* Indicadores clave de estado, etapa y rondas */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <BadgeEstado estado={seleccionado.estado_actual} />
              <BadgeEtapa etapa={seleccionado.etapa_actual} />
              <span
                style={{
                  backgroundColor: '#FEF9E7',
                  border: '1px solid #C59B27',
                  color: '#8A6A10',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RefreshCw size={12} color="#C59B27" /> Rondas de revisión: {seleccionado.rondas_revision}
              </span>
            </div>

            {seleccionado.resumen && (
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#374151',
                  backgroundColor: '#F9FAFB',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  borderLeft: '3px solid #C59B27',
                  lineHeight: 1.5
                }}
              >
                {seleccionado.resumen}
              </p>
            )}

            <div style={{ fontSize: '12.5px', lineHeight: 1.6, color: '#374151' }}>
              <div>
                <strong style={{ color: '#1F2937' }}>Línea de Investigación:</strong>{' '}
                {seleccionado.linea_investigacion}
              </div>
              <div>
                <strong style={{ color: '#1F2937' }}>Sublínea:</strong> {seleccionado.sublinea}
              </div>
              {seleccionado.fecha_asignacion_pares && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Calendar size={13} color="#C59B27" />
                  <strong style={{ color: '#8A6A10' }}>Fecha Asignación Pares:</strong>{' '}
                  {seleccionado.fecha_asignacion_pares}
                </div>
              )}
            </div>

            {/* Equipo de Investigadores Docentes + Gestión de Cambios en el Equipo */}
            <div
              style={{
                backgroundColor: '#F9FAFB',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#1F2937'
                  }}
                >
                  <Users size={15} color="#C8102E" /> Equipo de Investigadores Docentes ({seleccionado.equipo.length})
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarGestionEquipo((prev) => !prev)}
                  className={mostrarGestionEquipo ? 'ub-btn-secondary' : 'ub-btn-neutral'}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <UserPlus size={13} />
                  {mostrarGestionEquipo ? 'Cerrar Gestión de Equipo' : 'Vincular / Retirar Co-investigador'}
                </button>
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
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      opacity: miembro.activo ? 1 : 0.7,
                      borderLeft: miembro.activo ? '3px solid #10B981' : '3px solid #9CA3AF'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#1F2937' }}>{miembro.nombre}</strong>
                      <span style={{ color: '#6B7280', marginLeft: '6px', fontSize: '11px' }}>
                        ({miembro.email})
                      </span>
                      <div style={{ fontSize: '10.5px', color: '#6B7280', marginTop: '2px' }}>
                        Vinculado: {miembro.fecha_vinculacion}
                        {!miembro.activo && miembro.fecha_retiro
                          ? ` · Retirado el: ${miembro.fecha_retiro}`
                          : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          backgroundColor: !miembro.activo
                            ? '#F3F4F6'
                            : miembro.rol_equipo === 'principal'
                            ? '#27272A'
                            : '#ECFDF5',
                          color: !miembro.activo
                            ? '#4B5563'
                            : miembro.rol_equipo === 'principal'
                            ? '#FFFFFF'
                            : '#065F46',
                          border: !miembro.activo
                            ? '1px solid #D1D5DB'
                            : miembro.rol_equipo === 'principal'
                            ? '1px solid #27272A'
                            : '1px solid #6EE7B7',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      >
                        {!miembro.activo
                          ? 'Retirado'
                          : miembro.rol_equipo === 'principal'
                          ? 'Principal'
                          : miembro.rol_equipo}
                      </span>

                      {miembro.activo && miembro.rol_equipo !== 'principal' && (
                        <button
                          type="button"
                          disabled={guardandoEquipo}
                          onClick={() => handleRetirarDocente(miembro.usuario_id, miembro.nombre)}
                          title="Retirar co-investigador dejando registro en trazabilidad"
                          style={{
                            backgroundColor: '#FEE2E2',
                            color: '#9E0B22',
                            border: '1px solid #C8102E',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <UserMinus size={11} /> Retirar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulario desplegable para vincular/retirar un co-investigador con fecha y trazabilidad */}
              {mostrarGestionEquipo && (
                <form
                  onSubmit={handleVincularDocente}
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ fontSize: '11.5px', color: '#C8102E', fontWeight: 700 }}>
                    Registrar Vinculación de Co-investigador / Codirector en Trazabilidad
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#4B5563', marginBottom: '3px', fontWeight: 600 }}>
                        Docente a vincular:
                      </label>
                      <select
                        value={docenteVincularId}
                        onChange={(e) => setDocenteVincularId(Number(e.target.value))}
                        style={{
                          width: '100%',
                          backgroundColor: '#FFFFFF',
                          color: '#1F2937',
                          border: '1px solid #D1D5DB',
                          borderRadius: '5px',
                          padding: '6px 8px',
                          fontSize: '12px'
                        }}
                      >
                        {catalogos.docentes.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#4B5563', marginBottom: '3px', fontWeight: 600 }}>
                        Rol en equipo:
                      </label>
                      <select
                        value={rolVincular}
                        onChange={(e) =>
                          setRolVincular(e.target.value as 'coinvestigador' | 'codirector')
                        }
                        style={{
                          width: '100%',
                          backgroundColor: '#FFFFFF',
                          color: '#1F2937',
                          border: '1px solid #D1D5DB',
                          borderRadius: '5px',
                          padding: '6px 8px',
                          fontSize: '12px'
                        }}
                      >
                        <option value="coinvestigador">Co-investigador</option>
                        <option value="codirector">Codirector</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#4B5563', marginBottom: '3px', fontWeight: 600 }}>
                        Fecha del movimiento:
                      </label>
                      <input
                        type="date"
                        value={fechaCambioEquipo}
                        onChange={(e) => setFechaCambioEquipo(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#FFFFFF',
                          color: '#1F2937',
                          border: '1px solid #D1D5DB',
                          borderRadius: '5px',
                          padding: '5px 8px',
                          fontSize: '12px'
                        }}
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={obsCambioEquipo}
                    onChange={(e) => setObsCambioEquipo(e.target.value)}
                    placeholder="Observación / Soporte de correo o acta para el cambio de integrante..."
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      border: '1px solid #D1D5DB',
                      borderRadius: '5px',
                      padding: '7px 10px',
                      fontSize: '12px'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={guardandoEquipo}
                    className="ub-btn-primary"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {guardandoEquipo
                      ? 'Registrando cambio...'
                      : 'Vincular Docente y Guardar en Historial de Trazabilidad'}
                  </button>
                </form>
              )}
            </div>

            {/* Resumen de Evaluación por Pares si aplica */}
            {seleccionado.evaluaciones_pares.length > 0 && (
              <div
                style={{
                  backgroundColor: '#FEF9E7',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #C59B27'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#8A6A10', marginBottom: '8px' }}>
                  Pares Evaluadores Asignados
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {seleccionado.evaluaciones_pares.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        fontSize: '12px',
                        padding: '8px 10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#1F2937' }}>{ev.par_nombre} (Ronda {ev.ronda})</strong>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor:
                              ev.veredicto === 'aprobado'
                                ? '#D1FAE5'
                                : ev.veredicto === 'con_correcciones'
                                ? '#FEE2E2'
                                : '#FEF3C7',
                            color:
                              ev.veredicto === 'aprobado'
                                ? '#065F46'
                                : ev.veredicto === 'con_correcciones'
                                ? '#9E0B22'
                                : '#92400E',
                            border:
                              ev.veredicto === 'aprobado'
                                ? '1px solid #10B981'
                                : ev.veredicto === 'con_correcciones'
                                ? '1px solid #C8102E'
                                : '1px solid #F59E0B'
                          }}
                        >
                          {ev.veredicto.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        Asignado: {ev.fecha_asignacion}
                        {ev.fecha_concepto ? ` · Concepto: ${ev.fecha_concepto}` : ' · Pendiente de dictamen'}
                      </div>
                      {ev.concepto_observaciones && (
                        <div style={{ fontSize: '11.5px', color: '#374151', fontStyle: 'italic' }}>
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
                  backgroundColor: requiereSubsanacion ? '#FEF2F2' : '#F9FAFB',
                  border: `1px solid ${requiereSubsanacion ? '#C8102E' : '#E5E7EB'}`,
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
                    {requiereSubsanacion && <AlertTriangle size={15} color="#C8102E" />}
                    <BadgeEvento tipo={ultimoEvento.tipo_evento} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#4B5563', fontFamily: 'monospace', fontWeight: 600 }}>
                    {ultimoEvento.fecha_evento}
                  </span>
                </div>
                <div style={{ color: '#1F2937', marginBottom: '4px', lineHeight: 1.4 }}>
                  {ultimoEvento.observaciones}
                </div>
                <div style={{ fontSize: '11px', color: '#4B5563' }}>
                  Registrado por: <strong style={{ color: '#1F2937' }}>{ultimoEvento.actor_nombre}</strong>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setVistaActual('evaluacion')}
                className="ub-btn-primary"
                style={{
                  flex: 1,
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
                  ? 'Subsanar Observaciones y Cambiar Estado'
                  : 'Gestionar Estado / Evaluar'}
              </button>

              <button
                onClick={() => setVistaActual('seguimiento')}
                className="ub-btn-secondary"
                style={{
                  flex: 1,
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
                Ver Historial ({seleccionado.trazabilidad.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
