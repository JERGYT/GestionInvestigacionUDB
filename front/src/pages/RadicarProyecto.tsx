import React, { useState, useMemo } from 'react';
import type { Catalogos } from '../types';
import { proyectosService } from '../services/proyectos';
import { Users, Calendar, MailCheck } from 'lucide-react';

interface Props {
  catalogos: Catalogos;
  onRadicado: (nuevoId?: number) => void;
  onCancelar: () => void;
}

export const RadicarProyecto: React.FC<Props> = ({ catalogos, onRadicado, onCancelar }) => {
  const [titulo, setTitulo] = useState('');
  const [resumen, setResumen] = useState('');
  const [lineaId, setLineaId] = useState<number>(catalogos.lineas[0]?.id ?? 1);
  const [sublineaId, setSublineaId] = useState<number>(catalogos.sublineas[0]?.id ?? 1);
  const [principalId, setPrincipalId] = useState<number>(2);
  const [coinvestigadoresIds, setCoinvestigadoresIds] = useState<number[]>([3]);
  const [fechaRadicacion, setFechaRadicacion] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [observaciones, setObservaciones] = useState(
    'Radicación inicial de propuesta docente enviada por correo institucional para revisión del Líder de Grupo.'
  );
  const [enviando, setEnviando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const sublineasFiltradas = useMemo(() => {
    const filtradas = catalogos.sublineas.filter((s) => Number(s.linea_id) === Number(lineaId));
    return filtradas.length > 0 ? filtradas : catalogos.sublineas;
  }, [catalogos.sublineas, lineaId]);

  const handleCambioLinea = (nuevoLineaId: number) => {
    setLineaId(nuevoLineaId);
    const primeraSub = catalogos.sublineas.find((s) => Number(s.linea_id) === Number(nuevoLineaId));
    if (primeraSub) {
      setSublineaId(primeraSub.id);
    }
  };

  const toggleCoinvestigador = (docenteId: number) => {
    setCoinvestigadoresIds((prev) =>
      prev.includes(docenteId) ? prev.filter((id) => id !== docenteId) : [...prev, docenteId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);

    if (!titulo.trim()) {
      setMensajeError('El título del proyecto docente es obligatorio.');
      return;
    }

    setEnviando(true);
    try {
      const coIdsLimpiados = coinvestigadoresIds.filter((id) => id !== principalId);
      const respuesta = await proyectosService.radicar({
        titulo: titulo.trim(),
        resumen: resumen.trim(),
        linea_id: lineaId,
        sublinea_id: sublineaId,
        investigador_principal_id: principalId,
        coinvestigadores_ids: coIdsLimpiados,
        fecha_radicacion: fechaRadicacion,
        fecha_evento: fechaRadicacion,
        observaciones: observaciones.trim()
      });

      if (respuesta.error) {
        setMensajeError(respuesta.error);
      } else {
        onRadicado(respuesta.data?.id);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '780px',
        margin: '0 auto',
        backgroundColor: '#FFFFFF',
        padding: '32px',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        borderTop: '4px solid #C8102E',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div style={{ marginBottom: '22px' }}>
        <span
          style={{
            backgroundColor: '#FEF9E7',
            color: '#8A6A10',
            border: '1px solid #C59B27',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        >
          Modalidad Exclusiva: Proyecto Docente
        </span>
        <h2 style={{ fontSize: '22px', margin: '10px 0 6px 0', color: '#1F2937' }}>
          Radicar Nuevo Proyecto de Investigación Docente
        </h2>
        <p style={{ color: '#4B5563', fontSize: '13px', margin: 0 }}>
          El proyecto se radicará en etapa de <strong>Idea</strong> con estado inicial{' '}
          <strong style={{ color: '#92400E' }}>En Revisión Líder</strong>, dejando constancia de la fecha exacta de radicación y del soporte enviado por correo institucional.
        </p>
      </div>

      {mensajeError && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #C8102E',
            color: '#9E0B22',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px'
          }}
        >
          {mensajeError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
            Título del Proyecto Docente *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Plataforma Inteligente para Monitoreo Hidrológico en Boyacá..."
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '11px 12px',
              color: '#1F2937',
              fontSize: '13.5px'
            }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
            Resumen Ejecutivo y Alcance *
          </label>
          <textarea
            rows={3}
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            placeholder="Describa el problema de investigación, metodología propuesta y resultados esperados..."
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '10px 12px',
              color: '#1F2937',
              fontSize: '13px'
            }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
              Línea de Investigación *
            </label>
            <select
              value={lineaId}
              onChange={(e) => handleCambioLinea(Number(e.target.value))}
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#1F2937',
                fontSize: '13px'
              }}
            >
              {catalogos.lineas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
              Sublínea de Investigación *
            </label>
            <select
              value={sublineaId}
              onChange={(e) => setSublineaId(Number(e.target.value))}
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#1F2937',
                fontSize: '13px'
              }}
            >
              {sublineasFiltradas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conformación del Equipo Docente */}
        <div
          style={{
            backgroundColor: '#F9FAFB',
            padding: '18px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1F2937', fontSize: '13px', fontWeight: 700 }}>
            <Users size={17} color="#C8102E" /> Conformación del Equipo de Investigadores Docentes
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#4B5563', fontWeight: 600, marginBottom: '6px' }}>
              Investigador Principal (Docente Responsable) *
            </label>
            <select
              value={principalId}
              onChange={(e) => {
                const nuevoPrincipal = Number(e.target.value);
                setPrincipalId(nuevoPrincipal);
                setCoinvestigadoresIds((prev) => prev.filter((id) => id !== nuevoPrincipal));
              }}
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#1F2937',
                fontSize: '13px'
              }}
            >
              {catalogos.docentes.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.nombre} — {doc.programa} ({doc.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#4B5563', fontWeight: 600, marginBottom: '8px' }}>
              Asociar Co-investigadores Docentes (Opcional):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {catalogos.docentes
                .filter((doc) => doc.id !== principalId)
                .map((doc) => {
                  const seleccionado = coinvestigadoresIds.includes(doc.id);
                  return (
                    <label
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        backgroundColor: seleccionado ? '#FEF2F2' : '#FFFFFF',
                        border: seleccionado ? '1px solid #C8102E' : '1px solid #D1D5DB',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12.5px'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() => toggleCoinvestigador(doc.id)}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#1F2937' }}>{doc.nombre}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>{doc.email}</div>
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Fecha del Movimiento y Soporte de Correo/Reunión */}
        <div
          style={{
            backgroundColor: '#FEF9E7',
            padding: '18px',
            borderRadius: '8px',
            border: '1px solid #C59B27',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8A6A10', fontSize: '13px', fontWeight: 700 }}>
              <MailCheck size={17} color="#C59B27" /> Registro de Fecha y Soporte en Historial de Trazabilidad
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={15} color="#8A6A10" />
              <label style={{ fontSize: '12px', color: '#1F2937', fontWeight: 600 }}>
                Fecha del movimiento (Radicación) *
              </label>
              <input
                type="date"
                value={fechaRadicacion}
                onChange={(e) => setFechaRadicacion(e.target.value)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  fontSize: '12.5px'
                }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
              Observaciones / Soporte de Correo Institucional o Reunión *
            </label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Se recibió propuesta por correo institucional el 3 de noviembre y se asigna a revisión del Líder de Grupo..."
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#1F2937',
                fontSize: '13px'
              }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
          <button
            type="submit"
            disabled={enviando}
            className="ub-btn-primary"
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: enviando ? 'wait' : 'pointer',
              fontSize: '13.5px'
            }}
          >
            {enviando ? 'Radicando Proyecto Docente...' : 'Radicar Proyecto y Registrar en Historial'}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="ub-btn-neutral"
            style={{
              padding: '12px 22px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
