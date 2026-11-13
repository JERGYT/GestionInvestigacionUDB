import React, { useState, useMemo } from 'react';
import type { Catalogos } from '../types';
import { proyectosService } from '../services/proyectos';
import { Upload, Users, FileCheck2 } from 'lucide-react';

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
  const [observaciones, setObservaciones] = useState(
    'Radicación inicial de propuesta de investigación docente en formato institucional.'
  );
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
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
      let respuesta;

      if (archivoPdf) {
        const formData = new FormData();
        formData.append('titulo', titulo.trim());
        formData.append('resumen', resumen.trim());
        formData.append('linea_id', String(lineaId));
        formData.append('sublinea_id', String(sublineaId));
        formData.append('investigador_principal_id', String(principalId));
        formData.append('coinvestigadores_ids', JSON.stringify(coIdsLimpiados));
        formData.append('observaciones', observaciones.trim());
        formData.append('archivo_pdf', archivoPdf);
        respuesta = await proyectosService.radicar(formData);
      } else {
        respuesta = await proyectosService.radicar({
          titulo: titulo.trim(),
          resumen: resumen.trim(),
          linea_id: lineaId,
          sublinea_id: sublineaId,
          investigador_principal_id: principalId,
          coinvestigadores_ids: coIdsLimpiados,
          observaciones: observaciones.trim()
        });
      }

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
        backgroundColor: '#1e293b',
        padding: '32px',
        borderRadius: '10px',
        border: '1px solid #334155'
      }}
    >
      <div style={{ marginBottom: '22px' }}>
        <span
          style={{
            backgroundColor: '#0c4a6e',
            color: '#38bdf8',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        >
          Modalidad Exclusiva: Proyecto Docente
        </span>
        <h2 style={{ fontSize: '22px', margin: '10px 0 6px 0' }}>
          Radicar Nuevo Proyecto de Investigación Docente
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
          El proyecto se radicará en etapa de <strong>Idea</strong> con estado inicial{' '}
          <strong style={{ color: '#38bdf8' }}>En Revisión Líder</strong> y generará automáticamente el primer registro en el historial de trazabilidad (Documento PDF <strong>v1</strong>).
        </p>
      </div>

      {mensajeError && (
        <div
          style={{
            backgroundColor: '#450a0a',
            border: '1px solid #dc2626',
            color: '#fecaca',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px'
          }}
        >
          {mensajeError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
            Título del Proyecto Docente *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Plataforma Inteligente para Monitoreo Hidrológico en Boyacá..."
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '11px 12px',
              color: '#fff',
              fontSize: '13.5px'
            }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
            Resumen Ejecutivo y Alcance *
          </label>
          <textarea
            rows={3}
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            placeholder="Describa el problema de investigación, metodología propuesta y resultados esperados..."
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '10px 12px',
              color: '#fff',
              fontSize: '13px'
            }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
              Línea de Investigación *
            </label>
            <select
              value={lineaId}
              onChange={(e) => handleCambioLinea(Number(e.target.value))}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#fff',
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
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
              Sublínea de Investigación *
            </label>
            <select
              value={sublineaId}
              onChange={(e) => setSublineaId(Number(e.target.value))}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#fff',
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
            backgroundColor: '#0f172a',
            padding: '18px',
            borderRadius: '8px',
            border: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 700 }}>
            <Users size={17} /> Conformación del Equipo de Investigadores Docentes
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
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
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#fff',
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
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
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
                        backgroundColor: seleccionado ? '#1e3a5f' : '#1e293b',
                        border: seleccionado ? '1px solid #0284c7' : '1px solid #334155',
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
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{doc.nombre}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{doc.email}</div>
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
            Observaciones de Radicación (Registro en Trazabilidad)
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '10px 12px',
              color: '#fff',
              fontSize: '13px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
            Documento Soporte en PDF (Versión Inicial v1) *
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              backgroundColor: '#0f172a',
              padding: '14px',
              borderRadius: '8px',
              border: '1px dashed #0284c7'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Upload size={20} color="#38bdf8" />
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setArchivoPdf(e.target.files?.[0] ?? null)}
                style={{ color: '#cbd5e1', fontSize: '12.5px' }}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileCheck2 size={15} /> Se registrará como v1
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="submit"
            disabled={enviando}
            style={{
              flex: 1,
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: enviando ? 'wait' : 'pointer',
              fontSize: '13.5px'
            }}
          >
            {enviando ? 'Radicando Proyecto Docente...' : 'Radicar Proyecto y Enviar a Revisión Líder'}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            style={{
              backgroundColor: '#334155',
              color: '#cbd5e1',
              border: 'none',
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
