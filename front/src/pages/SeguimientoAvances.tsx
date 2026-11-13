import React, { useState } from 'react';
import { ESTADOS_METADATA, type Catalogos, type Proyecto } from '../types';
import { proyectosService } from '../services/proyectos';
import {
  BadgeEstado,
  BadgeEtapa,
  BadgeEvento
} from '../components/ui/Badge';
import {
  Clock,
  AlertOctagon,
  ArrowRight,
  RefreshCw,
  CheckSquare,
  Table as TableIcon,
  Users,
  Calendar
} from 'lucide-react';

interface Props {
  proyecto: Proyecto;
  catalogos: Catalogos;
  onActualizado: (proyectoActualizado?: Proyecto) => void;
  onIrASubsanar: () => void;
  onVolver: () => void;
}

export const SeguimientoAvances: React.FC<Props> = ({
  proyecto,
  catalogos,
  onActualizado,
  onIrASubsanar,
  onVolver
}) => {
  const fechaHoy = new Date().toISOString().slice(0, 10);

  // Estado para Novedad CIPADE
  const [fechaCipade, setFechaCipade] = useState(fechaHoy);
  const [obsCipade, setObsCipade] = useState('');
  const [registrandoCipade, setRegistrandoCipade] = useState(false);

  // Estado para Cambio en el Equipo Docente
  const [tipoCambioEquipo, setTipoCambioEquipo] = useState<'vincular' | 'retirar'>('vincular');
  const [usuarioEquipoId, setUsuarioEquipoId] = useState<number>(
    catalogos.docentes[0]?.id ?? 3
  );
  const [rolEquipoNuevo, setRolEquipoNuevo] = useState<'coinvestigador' | 'codirector'>(
    'coinvestigador'
  );
  const [fechaCambioEquipo, setFechaCambioEquipo] = useState(fechaHoy);
  const [obsCambioEquipo, setObsCambioEquipo] = useState('');
  const [registrandoEquipo, setRegistrandoEquipo] = useState(false);

  const handleCrearNovedadCipade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsCipade.trim()) return;
    setRegistrandoCipade(true);
    const res = await proyectosService.transicion(proyecto.id, {
      accion: 'novedad_cipade',
      actor_id: 1,
      fecha_evento: fechaCipade,
      observaciones: obsCipade.trim()
    });
    setRegistrandoCipade(false);
    if (!res.error) {
      setObsCipade('');
      onActualizado(res.data);
    }
  };

  const handleCambioEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrandoEquipo(true);
    const payload: Record<string, unknown> = {
      accion: 'cambio_equipo',
      actor_id: 1,
      fecha_cambio: fechaCambioEquipo,
      fecha_evento: fechaCambioEquipo,
      observaciones: obsCambioEquipo.trim()
    };

    if (tipoCambioEquipo === 'vincular') {
      payload.nuevo_usuario_id = usuarioEquipoId;
      payload.rol_equipo = rolEquipoNuevo;
    } else {
      payload.retirar_usuario_id = usuarioEquipoId;
    }

    const res = await proyectosService.transicion(proyecto.id, payload);
    setRegistrandoEquipo(false);
    if (!res.error) {
      setObsCambioEquipo('');
      onActualizado(res.data);
    }
  };

  const formatearNombreEstado = (estado: string | null) => {
    if (!estado) return 'Inicio';
    const meta = ESTADOS_METADATA[estado as keyof typeof ESTADOS_METADATA];
    return meta ? meta.label : estado;
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Cabecera de Trazabilidad */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '24px 28px',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          borderTop: '4px solid #C8102E',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: '#C8102E', fontWeight: 700, textTransform: 'uppercase' }}>
            Auditoría de Estados, Fechas e Historial · Proyecto Docente #{proyecto.id}
          </span>
          <h2 style={{ fontSize: '21px', margin: '6px 0 10px 0', color: '#1F2937' }}>{proyecto.titulo}</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <BadgeEstado estado={proyecto.estado_actual} />
            <BadgeEtapa etapa={proyecto.etapa_actual} />
            <span
              style={{
                backgroundColor: '#FEF9E7',
                border: '1px solid #C59B27',
                color: '#8A6A10',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RefreshCw size={12} color="#C59B27" /> Rondas de revisión: {proyecto.rondas_revision}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onIrASubsanar}
            className="ub-btn-primary"
            style={{
              padding: '9px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckSquare size={15} /> Cambiar Estado / Evaluar / Subsanar
          </button>
          <button
            type="button"
            onClick={onVolver}
            className="ub-btn-neutral"
            style={{
              padding: '9px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12.5px'
            }}
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* Bloque 1: Acciones de Trazabilidad Especial (Cambio en Equipo Docente + Novedades de CIPADE) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Panel Cambio de Equipo de Co-investigadores */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '22px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            borderLeft: '4px solid #27272A',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#1F2937' }}>
            <Users size={18} color="#27272A" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1F2937' }}>
              Trazabilidad de Cambios en Equipo de Co-investigadores
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#4B5563', margin: '0 0 12px 0', lineHeight: 1.45 }}>
            Vincule o retire un co-investigador o codirector docente dejando constancia de la fecha exacta y del soporte en el historial.
          </p>

          <form onSubmit={handleCambioEquipo} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setTipoCambioEquipo('vincular')}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: tipoCambioEquipo === 'vincular' ? '2px solid #27272A' : '1px solid #D1D5DB',
                  backgroundColor: tipoCambioEquipo === 'vincular' ? '#27272A' : '#F9FAFB',
                  color: tipoCambioEquipo === 'vincular' ? '#FFFFFF' : '#1F2937',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + Vincular Co-investigador
              </button>
              <button
                type="button"
                onClick={() => setTipoCambioEquipo('retirar')}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: tipoCambioEquipo === 'retirar' ? '2px solid #C8102E' : '1px solid #D1D5DB',
                  backgroundColor: tipoCambioEquipo === 'retirar' ? '#FEE2E2' : '#F9FAFB',
                  color: tipoCambioEquipo === 'retirar' ? '#9E0B22' : '#1F2937',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                − Retirar Integrante
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#4B5563', fontWeight: 600, marginBottom: '3px' }}>
                  Docente:
                </label>
                <select
                  value={usuarioEquipoId}
                  onChange={(e) => setUsuarioEquipoId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    color: '#1F2937',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    padding: '7px 8px',
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
                <label style={{ display: 'block', fontSize: '11px', color: '#4B5563', fontWeight: 600, marginBottom: '3px' }}>
                  Rol:
                </label>
                <select
                  value={rolEquipoNuevo}
                  disabled={tipoCambioEquipo === 'retirar'}
                  onChange={(e) =>
                    setRolEquipoNuevo(e.target.value as 'coinvestigador' | 'codirector')
                  }
                  style={{
                    width: '100%',
                    backgroundColor: tipoCambioEquipo === 'retirar' ? '#F3F4F6' : '#FFFFFF',
                    color: '#1F2937',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    padding: '7px 8px',
                    fontSize: '12px'
                  }}
                >
                  <option value="coinvestigador">Co-investigador</option>
                  <option value="codirector">Codirector</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#4B5563', fontWeight: 600, marginBottom: '3px' }}>
                  Fecha movimiento:
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
                    borderRadius: '6px',
                    padding: '6px 8px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>

            <input
              type="text"
              value={obsCambioEquipo}
              onChange={(e) => setObsCambioEquipo(e.target.value)}
              placeholder="Observaciones / Soporte de correo o acta para el cambio en el equipo..."
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '8px 10px',
                color: '#1F2937',
                fontSize: '12.5px'
              }}
              required
            />

            <button
              type="submit"
              disabled={registrandoEquipo}
              className="ub-btn-secondary"
              style={{
                padding: '9px 14px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '12.5px'
              }}
            >
              {registrandoEquipo
                ? 'Guardando en historial...'
                : 'Registrar Cambio de Equipo en Trazabilidad'}
            </button>
          </form>
        </div>

        {/* Bloque Creación de Novedad CIPADE */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '22px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            borderLeft: '4px solid #C8102E',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#C8102E' }}>
            <AlertOctagon size={18} color="#C8102E" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#C8102E' }}>Registrar Novedad de CIPADE</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#4B5563', margin: '0 0 12px 0', lineHeight: 1.45 }}>
            Cuando un proyecto está en desarrollo, una <strong>Novedad de CIPADE</strong> devuelve el proyecto{' '}
            <strong style={{ color: '#9E0B22' }}>directamente a los investigadores docentes</strong> sin pasar de nuevo por el Comité de Investigación.
          </p>

          <form onSubmit={handleCrearNovedadCipade} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={14} color="#C8102E" />
              <label style={{ fontSize: '11.5px', color: '#374151', fontWeight: 600 }}>
                Fecha de la novedad:
              </label>
              <input
                type="date"
                value={fechaCipade}
                onChange={(e) => setFechaCipade(e.target.value)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px'
                }}
              />
            </div>

            <textarea
              rows={3}
              value={obsCipade}
              onChange={(e) => setObsCipade(e.target.value)}
              placeholder="Ej: CIPADE solicita por correo anexar el acta de propiedad intelectual o ajuste de cronograma para desembolso..."
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '10px',
                color: '#1F2937',
                fontSize: '12.5px'
              }}
              required
            />
            <button
              type="submit"
              disabled={registrandoCipade}
              className="ub-btn-primary"
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '12.5px'
              }}
            >
              {registrandoCipade
                ? 'Registrando Novedad CIPADE...'
                : 'Crear Novedad CIPADE y Devolver Directo a Investigadores'}
            </button>
          </form>
        </div>
      </div>

      {/* Bloque 2: Línea de Tiempo Visual de Trazabilidad */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '24px 28px',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Clock size={19} color="#C8102E" />
          <h3 style={{ margin: 0, fontSize: '17px', color: '#1F2937' }}>
            Línea de Tiempo de Trazabilidad ({proyecto.trazabilidad.length} movimientos registrados)
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {proyecto.trazabilidad.map((item, idx) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#F9FAFB',
                padding: '16px 18px',
                borderRadius: '8px',
                borderLeft: idx === 0 ? '4px solid #C8102E' : '4px solid #C59B27',
                borderTop: '1px solid #E5E7EB',
                borderRight: '1px solid #E5E7EB',
                borderBottom: '1px solid #E5E7EB'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <BadgeEvento tipo={item.tipo_evento} />
                  <span
                    style={{
                      fontSize: '11.5px',
                      color: '#4B5563',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    <span>{formatearNombreEstado(item.estado_anterior)}</span>
                    <ArrowRight size={12} color="#C8102E" />
                    <strong style={{ color: '#1F2937' }}>
                      {formatearNombreEstado(item.estado_nuevo)}
                    </strong>
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}
                  >
                    Etapa: {item.etapa}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '12px',
                    color: '#C8102E',
                    fontWeight: 700,
                    fontFamily: 'monospace'
                  }}
                >
                  {item.fecha_evento}
                </span>
              </div>

              <p style={{ margin: '6px 0 10px 0', fontSize: '13.5px', color: '#1F2937', lineHeight: 1.5 }}>
                {item.observaciones}
              </p>

              <div style={{ fontSize: '12px', color: '#4B5563' }}>
                Registrado por: <strong style={{ color: '#1F2937' }}>{item.actor_nombre}</strong>{' '}
                <span style={{ fontSize: '11px', color: '#6B7280' }}>({item.actor_rol})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloque 3: Tabla de Auditoría de Trazabilidad */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '24px 28px',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <TableIcon size={18} color="#C59B27" />
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1F2937' }}>
            Tabla Oficial de Trazabilidad (Fechas Exactas y Observaciones)
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
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
                <th style={{ padding: '10px 12px' }}>Fecha y Hora Exacta</th>
                <th style={{ padding: '10px 12px' }}>Etapa</th>
                <th style={{ padding: '10px 12px' }}>Evento</th>
                <th style={{ padding: '10px 12px' }}>Estado Anterior → Nuevo</th>
                <th style={{ padding: '10px 12px' }}>Actor</th>
                <th style={{ padding: '10px 12px' }}>Observaciones / Soporte de Correo o Reunión</th>
              </tr>
            </thead>
            <tbody>
              {proyecto.trazabilidad.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', whiteSpace: 'nowrap', color: '#C8102E', fontWeight: 700 }}>
                    {t.fecha_evento}
                  </td>
                  <td style={{ padding: '12px', textTransform: 'uppercase', fontWeight: 600, color: '#1F2937' }}>
                    {t.etapa}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <BadgeEvento tipo={t.tipo_evento} />
                  </td>
                  <td style={{ padding: '12px', color: '#4B5563' }}>
                    {formatearNombreEstado(t.estado_anterior)} →{' '}
                    <strong style={{ color: '#1F2937' }}>{formatearNombreEstado(t.estado_nuevo)}</strong>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap', color: '#1F2937' }}>{t.actor_nombre}</td>
                  <td style={{ padding: '12px', color: '#374151', maxWidth: '380px' }}>
                    {t.observaciones}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SeguimientoAvances;
