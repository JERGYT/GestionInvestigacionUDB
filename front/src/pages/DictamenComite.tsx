import React, { useState } from 'react';
import { ROLES_METADATA, type Catalogos, type EtapaProyecto, type Proyecto, type RolUsuario } from '../types';
import { proyectosService, obtenerUrlPdf } from '../services/proyectos';
import { BadgeEstado, BadgeEtapa } from '../components/ui/Badge';
import {
  CheckCircle2,
  RotateCcw,
  Users,
  FileUp,
  AlertOctagon,
  Award,
  PlayCircle,
  FileText,
  Calendar
} from 'lucide-react';

interface Props {
  proyecto: Proyecto;
  catalogos: Catalogos;
  rolActual: RolUsuario;
  setRolActual: (rol: RolUsuario) => void;
  onEvaluado: (proyectoActualizado?: Proyecto) => void;
  onVolver: () => void;
}

export const DictamenComite: React.FC<Props> = ({
  proyecto,
  catalogos,
  rolActual,
  setRolActual,
  onEvaluado,
  onVolver
}) => {
  
  const [decisionLider, setDecisionLider] = useState<'aval_lider' | 'devolucion_lider'>('aval_lider');
  const [obsLider, setObsLider] = useState('');

  

  const [accionComite, setAccionComite] = useState<
    'asignacion_pares' | 'aprobacion_facultad' | 'inicio_desarrollo' | 'novedad_cipade'
  >(
    proyecto.estado_actual === 'en_revision_comite'
      ? 'asignacion_pares'
      : proyecto.estado_actual === 'aprobado_facultad'
      ? 'inicio_desarrollo'
      : proyecto.estado_actual === 'en_desarrollo'
      ? 'novedad_cipade'
      : 'aprobacion_facultad'
  );
  const [paresSeleccionados, setParesSeleccionados] = useState<number[]>(
    catalogos.pares.map((p) => p.id)
  );
  const [fechaAsignacionPares, setFechaAsignacionPares] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [nuevaEtapaFacultad, setNuevaEtapaFacultad] = useState<EtapaProyecto>(proyecto.etapa_actual);
  const [obsComite, setObsComite] = useState('');




  const parPendienteDefault =
    proyecto.evaluaciones_pares.find((ev) => ev.veredicto === 'pendiente')?.par_usuario_id ??
    catalogos.pares[0]?.id ??
    5;
  const [parActivoId, setParActivoId] = useState<number>(parPendienteDefault);
  const [veredictoPar, setVeredictoPar] = useState<'aprobado' | 'con_correcciones'>('con_correcciones');
  const [fechaConceptoPar, setFechaConceptoPar] = useState(new Date().toISOString().slice(0, 10));
  const [obsPar, setObsPar] = useState('');

  const [editTitulo, setEditTitulo] = useState(proyecto.titulo);
  const [editResumen, setEditResumen] = useState(proyecto.resumen);
  const [editLineaId, setEditLineaId] = useState(proyecto.linea_id);
  const [editSublineaId, setEditSublineaId] = useState(proyecto.sublinea_id);
  const [obsSubsanacion, setObsSubsanacion] = useState('');
  const [nuevoArchivoPdf, setNuevoArchivoPdf] = useState<File | null>(null);

  const [procesando, setProcesando] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(
    null
  );

  const toggleParAsignado = (id: number) => {
    setParesSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  

  const handleAccionLider = async () => {
    if (!obsLider.trim()) {
      setMensajeFeedback({
        tipo: 'error',
        texto: 'Por favor ingrese las observaciones de revisión del Líder de Grupo (ej. fecha de reunión o correo).'
      });
      return;
    }
    setProcesando(true);
    setMensajeFeedback(null);
    const res = await proyectosService.transicion(proyecto.id, {
      accion: decisionLider,
      actor_id: 1,
      observaciones: obsLider.trim()
    });
    setProcesando(false);
    if (res.error) {
      setMensajeFeedback({ tipo: 'error', texto: res.error });
    } else {
      onEvaluado(res.data);
    }
  };

  


  const handleAccionComite = async () => {
    if (accionComite === 'asignacion_pares' && paresSeleccionados.length === 0) {
      setMensajeFeedback({
        tipo: 'error',
        texto: 'Debe seleccionar al menos un Par Evaluador para asignar.'
      });
      return;
    }
    setProcesando(true);
    setMensajeFeedback(null);
    const res = await proyectosService.transicion(proyecto.id, {
      accion: accionComite,
      actor_id: accionComite === 'novedad_cipade' ? 1 : 4,
      pares_ids: paresSeleccionados,
      fecha_asignacion: fechaAsignacionPares,
      nueva_etapa: nuevaEtapaFacultad,
      observaciones: obsComite.trim()
    });
    setProcesando(false);
    if (res.error) {
      setMensajeFeedback({ tipo: 'error', texto: res.error });
    } else {
      onEvaluado(res.data);
    }
  };

  



  const handleConceptoPar = async () => {
    if (!obsPar.trim()) {
      setMensajeFeedback({
        tipo: 'error',
        texto: 'Ingrese las observaciones o concepto técnico del Par Evaluador.'
      });
      return;
    }
    setProcesando(true);
    setMensajeFeedback(null);
    const res = await proyectosService.registrarConceptoPar(proyecto.id, {
      par_usuario_id: parActivoId,
      veredicto: veredictoPar,
      fecha_concepto: fechaConceptoPar,
      concepto_observaciones: obsPar.trim()
    });
    setProcesando(false);
    if (res.error) {
      setMensajeFeedback({ tipo: 'error', texto: res.error });
    } else {
      onEvaluado(res.data);
    }
  };




  const handleSubsanarDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitulo.trim()) {
      setMensajeFeedback({ tipo: 'error', texto: 'El título del proyecto no puede estar vacío.' });
      return;
    }
    setProcesando(true);
    setMensajeFeedback(null);

    let res;
    if (nuevoArchivoPdf) {
      const formData = new FormData();
      formData.append('actor_id', String(proyecto.investigador_principal_id));
      formData.append('titulo', editTitulo.trim());
      formData.append('resumen', editResumen.trim());
      formData.append('linea_id', String(editLineaId));
      formData.append('sublinea_id', String(editSublineaId));
      formData.append(
        'observaciones',
        obsSubsanacion.trim() ||
          `Se actualiza documento a versión v${proyecto.version_documento + 1} atendiendo las observaciones.`
      );
      formData.append('archivo_pdf', nuevoArchivoPdf);
      res = await proyectosService.subsanar(proyecto.id, formData);
    } else {
      res = await proyectosService.subsanar(proyecto.id, {
        actor_id: proyecto.investigador_principal_id,
        titulo: editTitulo.trim(),
        resumen: editResumen.trim(),
        linea_id: editLineaId,
        sublinea_id: editSublineaId,
        observaciones:
          obsSubsanacion.trim() ||
          `Se actualiza documento a versión v${proyecto.version_documento + 1} atendiendo las observaciones.`
      });
    }

    setProcesando(false);
    if (res.error) {
      setMensajeFeedback({ tipo: 'error', texto: res.error });
    } else {
      onEvaluado(res.data);
    }
  };

  const ultimoMovimiento = proyecto.trazabilidad[0];

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Encabezado del Proyecto en Evaluación / Subsanación */}
      <div
        style={{
          backgroundColor: '#1e293b',
          padding: '24px 28px',
          borderRadius: '10px',
          border: '1px solid #334155'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
              Gestión de Flujo de Estados · Expediente Docente #{proyecto.id}
            </span>
            <h2 style={{ fontSize: '20px', margin: '6px 0 8px 0' }}>{proyecto.titulo}</h2>
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
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                Rondas de revisión acumuladas: {proyecto.rondas_revision}
              </span>
              {proyecto.documento_actual_url && (
                <a
                  href={obtenerUrlPdf(proyecto.documento_actual_url)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                >
                  <FileText size={14} /> Ver PDF vigente (v{proyecto.version_documento})
                </a>
              )}
            </div>
          </div>

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
            ← Volver al Listado
          </button>
        </div>

        {/* Selector rápido de Rol en esta vista para facilitar la demostración en vivo */}
        <div
          style={{
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid #334155',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '6px' }}>
            Actuar como rol:
          </span>
          {(['lider_grupo', 'comite', 'par_evaluador', 'docente'] as RolUsuario[]).map((r) => {
            const activo = rolActual === r;
            const meta = ROLES_METADATA[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRolActual(r)}
                style={{
                  backgroundColor: activo ? meta.color : '#0f172a',
                  color: activo ? '#0f172a' : '#cbd5e1',
                  border: `1px solid ${meta.color}`,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {mensajeFeedback && (
        <div
          style={{
            backgroundColor: mensajeFeedback.tipo === 'error' ? '#450a0a' : '#064e3b',
            border: `1px solid ${mensajeFeedback.tipo === 'error' ? '#dc2626' : '#10b981'}`,
            color: '#f8fafc',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px'
          }}
        >
          {mensajeFeedback.texto}
        </div>
      )}

      {/* PANEL 1: LÍDER DE GRUPO */}
      {rolActual === 'lider_grupo' && (
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '28px',
            borderRadius: '10px',
            border: '1px solid #34d39955'
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#34d399' }}>
            Revisión de Líder de Grupo ({ROLES_METADATA.lider_grupo.actorNombre})
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0' }}>
            El Líder de Grupo revisa la propuesta radicada o subsanada por los docentes. Puede devolverla con observaciones (incrementando las rondas de revisión) o darle aval para enviarla al Comité de Investigación FIAD.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => setDecisionLider('aval_lider')}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: decisionLider === 'aval_lider' ? '2px solid #34d399' : '1px solid #334155',
                backgroundColor: decisionLider === 'aval_lider' ? '#064e3b' : '#0f172a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} color="#34d399" /> Dar Aval y Pasar al Comité FIAD
            </button>

            <button
              type="button"
              onClick={() => setDecisionLider('devolucion_lider')}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: decisionLider === 'devolucion_lider' ? '2px solid #f87171' : '1px solid #334155',
                backgroundColor: decisionLider === 'devolucion_lider' ? '#450a0a' : '#0f172a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw size={18} color="#f87171" /> Devolver con Observaciones a Investigadores
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
              Observaciones de la Revisión (Reunión realizada, correo enviado, ajustes o aval) *
            </label>
            <textarea
              rows={4}
              value={obsLider}
              onChange={(e) => setObsLider(e.target.value)}
              placeholder="Ej: Se realizó reunión con los investigadores el día de hoy y se verificó la pertinencia metodológica..."
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '12px',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          <button
            type="button"
            disabled={procesando}
            onClick={handleAccionLider}
            style={{
              width: '100%',
              backgroundColor: decisionLider === 'aval_lider' ? '#059669' : '#dc2626',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '13.5px'
            }}
          >
            {procesando
              ? 'Registrando decisión...'
              : decisionLider === 'aval_lider'
              ? 'Confirmar Aval y Enviar a En Revisión Comité'
              : 'Devolver Proyecto a Investigadores con Observaciones'}
          </button>
        </div>
      )}

      {/* PANEL 2: COMITÉ DE INVESTIGACIÓN FIAD & NOVEDADES CIPADE */}
      {rolActual === 'comite' && (
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '28px',
            borderRadius: '10px',
            border: '1px solid #fbbf2455'
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#fbbf24' }}>
            Gestión del Comité de Investigación FIAD y Novedades CIPADE
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0' }}>
            Seleccione la acción institucional a aplicar sobre el proyecto docente: asignación de pares con fecha, aprobación a nivel de facultad, paso a desarrollo o reporte de Novedad CIPADE.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setAccionComite('asignacion_pares')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: accionComite === 'asignacion_pares' ? '2px solid #c084fc' : '1px solid #334155',
                backgroundColor: accionComite === 'asignacion_pares' ? '#3b0764' : '#0f172a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Users size={18} color="#c084fc" /> 1. Asignar Pares Evaluadores con Fecha
            </button>

            <button
              type="button"
              onClick={() => setAccionComite('aprobacion_facultad')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: accionComite === 'aprobacion_facultad' ? '2px solid #4ade80' : '1px solid #334155',
                backgroundColor: accionComite === 'aprobacion_facultad' ? '#14532d' : '#0f172a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Award size={18} color="#4ade80" /> 2. Aprobar a Nivel de Facultad
            </button>

            <button
              type="button"
              onClick={() => setAccionComite('inicio_desarrollo')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: accionComite === 'inicio_desarrollo' ? '2px solid #2dd4bf' : '1px solid #334155',
                backgroundColor: accionComite === 'inicio_desarrollo' ? '#134e4a' : '#0f172a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <PlayCircle size={18} color="#2dd4bf" /> 3. Iniciar Desarrollo del Proyecto
            </button>

            <button
              type="button"
              onClick={() => setAccionComite('novedad_cipade')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: accionComite === 'novedad_cipade' ? '2px solid #fb7185' : '1px solid #334155',
                backgroundColor: accionComite === 'novedad_cipade' ? '#4c0519' : '#0f172a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertOctagon size={18} color="#fb7185" /> 4. Crear Novedad de CIPADE (Directo a Docentes)
            </button>
          </div>

          {accionComite === 'asignacion_pares' && (
            <div
              style={{
                backgroundColor: '#0f172a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #4c1d95',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <strong style={{ fontSize: '13px', color: '#c084fc' }}>
                  Selección de Pares Evaluadores y Fecha de Asignación
                </strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color="#c084fc" />
                  <label style={{ fontSize: '12px', color: '#cbd5e1' }}>Fecha asignación:</label>
                  <input
                    type="date"
                    value={fechaAsignacionPares}
                    onChange={(e) => setFechaAsignacionPares(e.target.value)}
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12.5px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {catalogos.pares.map((par) => {
                  const checked = paresSeleccionados.includes(par.id);
                  return (
                    <label
                      key={par.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        backgroundColor: checked ? '#2e1065' : '#1e293b',
                        border: checked ? '1px solid #a855f7' : '1px solid #334155',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12.5px'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleParAsignado(par.id)}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{par.nombre}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {par.programa} · {par.email}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {accionComite === 'aprobacion_facultad' && (
            <div
              style={{
                backgroundColor: '#0f172a',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #14532d',
                marginBottom: '16px'
              }}
            >
              <label style={{ display: 'block', fontSize: '12px', color: '#86efac', marginBottom: '6px', fontWeight: 600 }}>
                Etapa aprobada a nivel de Facultad:
              </label>
              <select
                value={nuevaEtapaFacultad}
                onChange={(e) => setNuevaEtapaFacultad(e.target.value as EtapaProyecto)}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  fontSize: '13px'
                }}
              >
                <option value="idea">Idea</option>
                <option value="anteproyecto">Anteproyecto</option>
                <option value="proyecto">Proyecto Formal</option>
                <option value="desarrollo">Desarrollo</option>
              </select>
            </div>
          )}

          {accionComite === 'novedad_cipade' && (
            <div
              style={{
                backgroundColor: '#4c0519',
                border: '1px solid #f43f5e',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: '#ffe4e6',
                marginBottom: '16px'
              }}
            >
              <strong>Regla de Negocio CIPADE:</strong> Al registrar una Novedad de CIPADE durante el desarrollo del proyecto, el expediente regresa <strong>directamente a los investigadores docentes</strong> para que editen y suban la nueva versión del PDF, y una vez subsanado retoma su desarrollo <strong>sin tener que pasar de nuevo por el Comité</strong>.
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
              Acta / Observaciones para el Historial de Trazabilidad *
            </label>
            <textarea
              rows={4}
              value={obsComite}
              onChange={(e) => setObsComite(e.target.value)}
              placeholder={
                accionComite === 'novedad_cipade'
                  ? 'Ej: CIPADE solicita anexar el acta de propiedad intelectual o ajuste de rubros antes del desembolso...'
                  : 'Ingrese el detalle del acta o resolución del Comité de Investigación FIAD...'
              }
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '12px',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          <button
            type="button"
            disabled={procesando}
            onClick={handleAccionComite}
            style={{
              width: '100%',
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '13.5px'
            }}
          >
            {procesando ? 'Ejecutando transición...' : 'Registrar Decisión Oficial en Trazabilidad'}
          </button>
        </div>
      )}

      {/* PANEL 3: PAR EVALUADOR */}
      {rolActual === 'par_evaluador' && (
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '28px',
            borderRadius: '10px',
            border: '1px solid #c084fc55'
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#c084fc' }}>
            Dictamen de Par Evaluador
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 18px 0' }}>
            Regla de evaluación por pares: cada par emite su concepto individual con fecha.{' '}
            <strong style={{ color: '#f87171' }}>
              Si al menos un par devuelve el proyecto con correcciones, el proyecto se devuelve completo a los investigadores (`en_revision_investigadores`).
            </strong>
          </p>

          {proyecto.evaluaciones_pares.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                Estado Actual de Pares Asignados en este Proyecto:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {proyecto.evaluaciones_pares.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setParActivoId(ev.par_usuario_id)}
                    style={{
                      padding: '12px',
                      backgroundColor: parActivoId === ev.par_usuario_id ? '#2e1065' : '#0f172a',
                      border:
                        parActivoId === ev.par_usuario_id
                          ? '2px solid #c084fc'
                          : '1px solid #334155',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>{ev.par_nombre}</strong>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor:
                            ev.veredicto === 'aprobado'
                              ? '#14532d'
                              : ev.veredicto === 'con_correcciones'
                              ? '#7f1d1d'
                              : '#475569'
                        }}
                      >
                        {ev.veredicto.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Ronda {ev.ronda} · Asignado: {ev.fecha_asignacion}
                      {ev.fecha_concepto ? ` · Concepto: ${ev.fecha_concepto}` : ''}
                    </div>
                    {ev.concepto_observaciones && (
                      <div style={{ fontSize: '11.5px', color: '#e2e8f0', marginTop: '6px' }}>
                        "{ev.concepto_observaciones}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                Seleccionar Par Evaluador que emite el concepto *
              </label>
              <select
                value={parActivoId}
                onChange={(e) => setParActivoId(Number(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '13px'
                }}
              >
                {catalogos.pares.map((par) => (
                  <option key={par.id} value={par.id}>
                    {par.nombre} ({par.programa})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                Fecha del Concepto *
              </label>
              <input
                type="date"
                value={fechaConceptoPar}
                onChange={(e) => setFechaConceptoPar(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setVeredictoPar('aprobado')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: veredictoPar === 'aprobado' ? '2px solid #4ade80' : '1px solid #334155',
                backgroundColor: veredictoPar === 'aprobado' ? '#14532d' : '#0f172a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✓ Concepto Favorable (Aprobado)
            </button>

            <button
              type="button"
              onClick={() => setVeredictoPar('con_correcciones')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: veredictoPar === 'con_correcciones' ? '2px solid #f87171' : '1px solid #334155',
                backgroundColor: veredictoPar === 'con_correcciones' ? '#7f1d1d' : '#0f172a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Devolver con Correcciones (Devuelve el proyecto)
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
              Concepto Técnico y Observaciones del Par Evaluador *
            </label>
            <textarea
              rows={4}
              value={obsPar}
              onChange={(e) => setObsPar(e.target.value)}
              placeholder="Detalle las correcciones metodológicas requeridas o las fortalezas del documento evaluado..."
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '12px',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          <button
            type="button"
            disabled={procesando}
            onClick={handleConceptoPar}
            style={{
              width: '100%',
              backgroundColor: veredictoPar === 'con_correcciones' ? '#dc2626' : '#7c3aed',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '13.5px'
            }}
          >
            {procesando
              ? 'Registrando concepto del par...'
              : veredictoPar === 'con_correcciones'
              ? 'Emitir Concepto con Correcciones y Devolver a Investigadores'
              : 'Emitir Concepto Favorable (Aprobado)'}
          </button>
        </div>
      )}

      {/* PANEL 4: DOCENTE INVESTIGADOR (SUBSANACIÓN Y NUEVA VERSIÓN DE PDF) */}
      {rolActual === 'docente' && (
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '28px',
            borderRadius: '10px',
            border: '1px solid #38bdf855'
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#38bdf8' }}>
            Subsanación de Observaciones y Carga de Nueva Versión PDF
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 18px 0' }}>
            Como investigador docente puede editar los campos del proyecto y cargar la versión{' '}
            <strong style={{ color: '#38bdf8' }}>v{proyecto.version_documento + 1}</strong> del archivo PDF. La versión anterior{' '}
            <strong style={{ color: '#fbbf24' }}>
              (v{proyecto.version_documento}: {proyecto.documento_actual_url})
            </strong>{' '}
            quedará almacenada permanentemente en el historial de trazabilidad.
          </p>

          {ultimoMovimiento && (
            <div
              style={{
                backgroundColor: '#450a0a',
                border: '1px solid #dc2626',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '18px',
                fontSize: '12.5px'
              }}
            >
              <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: '4px' }}>
                Última Observación / Motivo de Devolución ({ultimoMovimiento.fecha_evento} —{' '}
                {ultimoMovimiento.actor_nombre}):
              </div>
              <div style={{ color: '#fef2f2' }}>{ultimoMovimiento.observaciones}</div>
            </div>
          )}

          <form onSubmit={handleSubsanarDocente} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                Título del Proyecto Docente (Editable) *
              </label>
              <input
                type="text"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '13.5px'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                Resumen Ejecutivo Actualizado *
              </label>
              <textarea
                rows={3}
                value={editResumen}
                onChange={(e) => setEditResumen(e.target.value)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                  Línea de Investigación
                </label>
                <select
                  value={editLineaId}
                  onChange={(e) => {
                    const nuevaLinea = Number(e.target.value);
                    setEditLineaId(nuevaLinea);
                    const sub = catalogos.sublineas.find((s) => Number(s.linea_id) === nuevaLinea);
                    if (sub) setEditSublineaId(sub.id);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '9px 12px',
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
                  Sublínea de Investigación
                </label>
                <select
                  value={editSublineaId}
                  onChange={(e) => setEditSublineaId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '9px 12px',
                    fontSize: '13px'
                  }}
                >
                  {catalogos.sublineas
                    .filter((s) => Number(s.linea_id) === Number(editLineaId))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                Nueva Versión del Documento PDF (Se guardará como v{proyecto.version_documento + 1}) *
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
                  border: '1px dashed #38bdf8'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileUp size={20} color="#38bdf8" />
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setNuevoArchivoPdf(e.target.files?.[0] ?? null)}
                    style={{ color: '#cbd5e1', fontSize: '12.5px' }}
                  />
                </div>
                <span style={{ fontSize: '11.5px', color: '#fbbf24', fontWeight: 700 }}>
                  v{proyecto.version_documento} → v{proyecto.version_documento + 1}
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                Detalle de Ajustes Realizados en esta Subsanación *
              </label>
              <textarea
                rows={3}
                value={obsSubsanacion}
                onChange={(e) => setObsSubsanacion(e.target.value)}
                placeholder={`Ej: Se carga versión v${
                  proyecto.version_documento + 1
                } con los objetivos específicos ajustados y anexos requeridos...`}
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

            <div
              style={{
                backgroundColor: '#0f172a',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #334155',
                fontSize: '12px',
                color: '#cbd5e1'
              }}
            >
              Destino tras subsanar:{' '}
              {proyecto.estado_actual === 'novedad_cipade' || proyecto.etapa_actual === 'desarrollo' ? (
                <strong style={{ color: '#34d399' }}>
                  Retorna directo a En Desarrollo (sin pasar de nuevo por el Comité FIAD)
                </strong>
              ) : (
                <strong style={{ color: '#38bdf8' }}>
                  Pasa a En Revisión Líder para validación de ajustes
                </strong>
              )}
            </div>

            <button
              type="submit"
              disabled={procesando}
              style={{
                width: '100%',
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13.5px'
              }}
            >
              {procesando
                ? 'Guardando cambios y nueva versión PDF...'
                : `Guardar Subsanación y Publicar Documento v${proyecto.version_documento + 1}`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
