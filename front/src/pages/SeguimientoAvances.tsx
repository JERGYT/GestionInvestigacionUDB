import React, { useMemo, useState } from 'react';
import { ESTADOS_METADATA, type Proyecto } from '../types';
import { obtenerUrlPdf, proyectosService } from '../services/proyectos';
import {
  BadgeEstado,
  BadgeEtapa,
  BadgeEvento
} from '../components/ui/Badge';
import {
  FileText,
  Download,
  Clock,
  AlertOctagon,
  ArrowRight,
  RefreshCw,
  CheckSquare,
  Table as TableIcon
} from 'lucide-react';

interface Props {
  proyecto: Proyecto;
  onActualizado: (proyectoActualizado?: Proyecto) => void;
  onIrASubsanar: () => void;
  onVolver: () => void;
}

export const SeguimientoAvances: React.FC<Props> = ({
  proyecto,
  onActualizado,
  onIrASubsanar,
  onVolver
}) => {
  const [obsCipade, setObsCipade] = useState('');
  const [registrandoCipade, setRegistrandoCipade] = useState(false);

  const versionesPdf = useMemo(() => {
    const mapa = new Map<
      number,
      { version: number; url: string; fecha: string; actor: string; nota: string }
    >();



    const trazaOrdenada = [...proyecto.trazabilidad].reverse();
    for (const item of trazaOrdenada) {
      if (item.version_documento && item.archivo_pdf_url) {
        if (!mapa.has(item.version_documento)) {
          mapa.set(item.version_documento, {
            version: item.version_documento,
            url: item.archivo_pdf_url,
            fecha: item.fecha_evento,
            actor: item.actor_nombre,
            nota: item.observaciones
          });
        }
      }
    }

    if (proyecto.version_documento && proyecto.documento_actual_url) {
      if (!mapa.has(proyecto.version_documento)) {
        mapa.set(proyecto.version_documento, {
          version: proyecto.version_documento,
          url: proyecto.documento_actual_url,
          fecha: proyecto.fecha_radicacion,
          actor: proyecto.investigador_principal,
          nota: 'Versión vigente del proyecto'
        });
      }
    }

    return Array.from(mapa.values()).sort((a, b) => b.version - a.version);
  }, [proyecto]);

  const handleCrearNovedadCipade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsCipade.trim()) return;
    setRegistrandoCipade(true);
    const res = await proyectosService.transicion(proyecto.id, {
      accion: 'novedad_cipade',
      actor_id: 1,
      observaciones: obsCipade.trim()
    });
    setRegistrandoCipade(false);
    if (!res.error) {
      setObsCipade('');
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
          backgroundColor: '#1e293b',
          padding: '24px 28px',
          borderRadius: '10px',
          border: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
            Auditoría e Historial de Trazabilidad · Proyecto Docente #{proyecto.id}
          </span>
          <h2 style={{ fontSize: '21px', margin: '6px 0 10px 0' }}>{proyecto.titulo}</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <BadgeEstado estado={proyecto.estado_actual} />
            <BadgeEtapa etapa={proyecto.etapa_actual} />
            <span
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #475569',
                color: '#fbbf24',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RefreshCw size={12} /> Rondas de revisión: {proyecto.rondas_revision}
            </span>
            <span
              style={{
                backgroundColor: '#0c4a6e',
                color: '#38bdf8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700
              }}
            >
              Versión vigente: v{proyecto.version_documento}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onIrASubsanar}
            style={{
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
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
            <CheckSquare size={15} /> Gestionar Estado / Subsanar
          </button>
          <button
            type="button"
            onClick={onVolver}
            style={{
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: 'none',
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

      {/* Bloque 1: Repositorio de Versiones de PDF + Creación rápida de Novedad de CIPADE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '22px',
            borderRadius: '10px',
            border: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FileText size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '16px' }}>
              Historial de Versiones del Documento PDF ({versionesPdf.length})
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0' }}>
            Cada subsanación conserva las versiones anteriores del archivo PDF para trazabilidad completa.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {versionesPdf.map((v) => {
              const esVigente = v.version === proyecto.version_documento;
              return (
                <div
                  key={v.version}
                  style={{
                    backgroundColor: '#0f172a',
                    border: esVigente ? '1px solid #0284c7' : '1px solid #334155',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#f8fafc', fontSize: '13px' }}>
                        Versión v{v.version}
                      </strong>
                      {esVigente && (
                        <span
                          style={{
                            backgroundColor: '#0284c7',
                            color: '#fff',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700
                          }}
                        >
                          VIGENTE
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{v.fecha}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '3px' }}>
                      Archivo: <code>{v.url}</code> · Por: {v.actor}
                    </div>
                  </div>

                  <a
                    href={obtenerUrlPdf(v.url)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    style={{
                      backgroundColor: esVigente ? '#0284c7' : '#334155',
                      color: '#fff',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Download size={14} /> Descargar v{v.version}
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloque Creación de Novedad CIPADE */}
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '22px',
            borderRadius: '10px',
            border: '1px solid #f43f5e55'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#fb7185' }}>
            <AlertOctagon size={18} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Registrar Novedad de CIPADE</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '0 0 12px 0', lineHeight: 1.45 }}>
            Cuando un proyecto está en desarrollo, una <strong>Novedad de CIPADE</strong> devuelve el proyecto{' '}
            <strong style={{ color: '#fb7185' }}>directamente a los investigadores docentes</strong> sin pasar de nuevo por el Comité de Investigación.
          </p>

          <form onSubmit={handleCrearNovedadCipade} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              rows={3}
              value={obsCipade}
              onChange={(e) => setObsCipade(e.target.value)}
              placeholder="Ej: CIPADE solicita anexar el acta de propiedad intelectual o ajuste de cronograma para desembolso..."
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '10px',
                color: '#fff',
                fontSize: '12.5px'
              }}
              required
            />
            <button
              type="submit"
              disabled={registrandoCipade}
              style={{
                backgroundColor: '#e11d48',
                color: '#fff',
                border: 'none',
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
          backgroundColor: '#1e293b',
          padding: '24px 28px',
          borderRadius: '10px',
          border: '1px solid #334155'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Clock size={19} color="#38bdf8" />
          <h3 style={{ margin: 0, fontSize: '17px' }}>
            Línea de Tiempo de Trazabilidad ({proyecto.trazabilidad.length} movimientos)
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {proyecto.trazabilidad.map((item, idx) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#0f172a',
                padding: '16px 18px',
                borderRadius: '8px',
                borderLeft: idx === 0 ? '4px solid #38bdf8' : '4px solid #475569',
                borderTop: '1px solid #334155',
                borderRight: '1px solid #334155',
                borderBottom: '1px solid #334155'
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
                      color: '#cbd5e1',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#1e293b',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    <span>{formatearNombreEstado(item.estado_anterior)}</span>
                    <ArrowRight size={12} color="#38bdf8" />
                    <strong style={{ color: '#38bdf8' }}>
                      {formatearNombreEstado(item.estado_nuevo)}
                    </strong>
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
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
                    color: '#38bdf8',
                    fontWeight: 700,
                    fontFamily: 'monospace'
                  }}
                >
                  {item.fecha_evento}
                </span>
              </div>

              <p style={{ margin: '6px 0 10px 0', fontSize: '13.5px', color: '#f8fafc', lineHeight: 1.5 }}>
                {item.observaciones}
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  fontSize: '12px',
                  color: '#94a3b8'
                }}
              >
                <div>
                  Registrado por: <strong style={{ color: '#e2e8f0' }}>{item.actor_nombre}</strong>{' '}
                  <span style={{ fontSize: '11px' }}>({item.actor_rol})</span>
                </div>

                {item.archivo_pdf_url && (
                  <a
                    href={obtenerUrlPdf(item.archivo_pdf_url)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    style={{
                      color: '#38bdf8',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: '#0c4a6e',
                      padding: '4px 10px',
                      borderRadius: '5px',
                      fontSize: '11.5px'
                    }}
                  >
                    <Download size={13} /> Descargar PDF v{item.version_documento ?? 1} (
                    {item.archivo_pdf_url})
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloque 3: Tabla de Auditoría de Trazabilidad */}
      <div
        style={{
          backgroundColor: '#1e293b',
          padding: '24px 28px',
          borderRadius: '10px',
          border: '1px solid #334155'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <TableIcon size={18} color="#34d399" />
          <h3 style={{ margin: 0, fontSize: '16px' }}>
            Tabla Oficial de Trazabilidad (Fechas Exactas y Observaciones)
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
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
                <th style={{ padding: '10px 12px' }}>Fecha y Hora Exacta</th>
                <th style={{ padding: '10px 12px' }}>Etapa</th>
                <th style={{ padding: '10px 12px' }}>Evento</th>
                <th style={{ padding: '10px 12px' }}>Estado Anterior → Nuevo</th>
                <th style={{ padding: '10px 12px' }}>Actor</th>
                <th style={{ padding: '10px 12px' }}>Observaciones</th>
                <th style={{ padding: '10px 12px' }}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {proyecto.trazabilidad.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', whiteSpace: 'nowrap', color: '#38bdf8' }}>
                    {t.fecha_evento}
                  </td>
                  <td style={{ padding: '12px', textTransform: 'uppercase', fontWeight: 600 }}>
                    {t.etapa}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <BadgeEvento tipo={t.tipo_evento} />
                  </td>
                  <td style={{ padding: '12px', color: '#cbd5e1' }}>
                    {formatearNombreEstado(t.estado_anterior)} →{' '}
                    <strong style={{ color: '#fff' }}>{formatearNombreEstado(t.estado_nuevo)}</strong>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{t.actor_nombre}</td>
                  <td style={{ padding: '12px', color: '#e2e8f0', maxWidth: '300px' }}>
                    {t.observaciones}
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    {t.archivo_pdf_url ? (
                      <a
                        href={obtenerUrlPdf(t.archivo_pdf_url)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}
                      >
                        v{t.version_documento ?? 1}
                      </a>
                    ) : (
                      '—'
                    )}
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
