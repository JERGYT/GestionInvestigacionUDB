import React, { useState } from 'react';
import { ROLES_METADATA, type Catalogos, type EtapaProyecto, type Proyecto, type RolUsuario } from '../types';
import { proyectosService } from '../services/proyectos';
import { BadgeEstado, BadgeEtapa } from '../components/ui/Badge';
import {
  CheckCircle2,
  RotateCcw,
  Users,
  AlertOctagon,
  Award,
  PlayCircle,
  Calendar,
  MailCheck,
  RefreshCw
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
  const fechaHoy = new Date().toISOString().slice(0, 10);

  // Estados para Líder de Grupo
  const [decisionLider, setDecisionLider] = useState<'aval_lider' | 'devolucion_lider'>('aval_lider');
  const [fechaMovimientoLider, setFechaMovimientoLider] = useState(fechaHoy);
  const [obsLider, setObsLider] = useState('');

  // Estados para Comité FIAD
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
  const [fechaMovimientoComite, setFechaMovimientoComite] = useState(fechaHoy);
  const [nuevaEtapaFacultad, setNuevaEtapaFacultad] = useState<EtapaProyecto>(proyecto.etapa_actual);
  const [obsComite, setObsComite] = useState('');

  // Estados para Par Evaluador
  const parPendienteDefault =
    proyecto.evaluaciones_pares.find((ev) => ev.veredicto === 'pendiente')?.par_usuario_id ??
    catalogos.pares[0]?.id ??
    5;
  const [parActivoId, setParActivoId] = useState<number>(parPendienteDefault);
  const [veredictoPar, setVeredictoPar] = useState<'aprobado' | 'con_correcciones'>('con_correcciones');
  const [fechaConceptoPar, setFechaConceptoPar] = useState(fechaHoy);
  const [obsPar, setObsPar] = useState('');

  // Estados para Docente Investigador (Subsanación por correo / reunión)
  const [editTitulo, setEditTitulo] = useState(proyecto.titulo);
  const [editResumen, setEditResumen] = useState(proyecto.resumen);
  const [editLineaId, setEditLineaId] = useState(proyecto.linea_id);
  const [editSublineaId, setEditSublineaId] = useState(proyecto.sublinea_id);
  const [fechaSubsanacion, setFechaSubsanacion] = useState(fechaHoy);
  const [obsSubsanacion, setObsSubsanacion] = useState('');

  const [procesando, setProcesando] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(
    null
  );

  const toggleParAsignado = (id: number) => {
    setParesSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 1. Ejecutar acción de Líder de Grupo
  const handleAccionLider = async () => {
    if (!obsLider.trim()) {
      setMensajeFeedback({
        tipo: 'error',
        texto: 'Por favor ingrese las observaciones / soporte de correo o reunión del Líder de Grupo.'
      });
      return;
    }
    setProcesando(true);
    setMensajeFeedback(null);
    const res = await proyectosService.transicion(proyecto.id, {
      accion: decisionLider,
      actor_id: 1,
      fecha_evento: fechaMovimientoLider,
      observaciones: obsLider.trim()
    });
    setProcesando(false);
    if (res.error) {
      setMensajeFeedback({ tipo: 'error', texto: res.error });
    } else {
      onEvaluado(res.data);
    }
  };

  // 2. Ejecutar acción de Comité FIAD o Novedad CIPADE
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
      fecha_asignacion: fechaMovimientoComite,
      fecha_evento: fechaMovimientoComite,
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

  // 3. Ejecutar concepto individual de Par Evaluador
  const handleConceptoPar = async () => {
    if (!obsPar.trim()) {
      setMensajeFeedback({
        tipo: 'error',
        texto: 'Ingrese las observaciones o concepto técnico enviado por el Par Evaluador.'
      });
      return;
    }
    setProcesando(true);
    setMensajeFeedback(null);
    const res = await proyectosService.registrarConceptoPar(proyecto.id, {
      par_usuario_id: parActivoId,
      veredicto: veredictoPar,
      fecha_concepto: fechaConceptoPar,
      fecha_evento: fechaConceptoPar,
      concepto_observaciones: obsPar.trim()
    });
    setProcesando(false);
    if (res.error) {
      setMensajeFeedback({ tipo: 'error', texto: res.error });
    } else {
      onEvaluado(res.data);
    }
  };

  // 4. Ejecutar Subsanación del Docente Investigador
  const handleSubsanarDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitulo.trim()) {
      setMensajeFeedback({ tipo: 'error', texto: 'El título del proyecto no puede estar vacío.' });
      return;
    }
    setProcesando(true);
    setMensajeFeedback(null);

    const res = await proyectosService.subsanar(proyecto.id, {
      actor_id: proyecto.investigador_principal_id,
      titulo: editTitulo.trim(),
      resumen: editResumen.trim(),
      linea_id: editLineaId,
      sublinea_id: editSublineaId,
      fecha_evento: fechaSubsanacion,
      observaciones:
        obsSubsanacion.trim() ||
        'Se atendieron las observaciones y se enviaron los ajustes correspondientes por correo institucional.'
    });

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
          backgroundColor: '#FFFFFF',
          padding: '24px 28px',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          borderTop: '4px solid #C8102E',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#C8102E', fontWeight: 700, textTransform: 'uppercase' }}>
              Gestión de Flujo de Estados e Historial · Expediente Docente #{proyecto.id}
            </span>
            <h2 style={{ fontSize: '20px', margin: '6px 0 8px 0', color: '#1F2937' }}>{proyecto.titulo}</h2>
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
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RefreshCw size={12} color="#C59B27" /> Rondas de revisión acumuladas: {proyecto.rondas_revision}
              </span>
            </div>
          </div>

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
            ← Volver al Listado
          </button>
        </div>

        {/* Selector rápido de Rol en esta vista para facilitar la demostración en vivo */}
        <div
          style={{
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600, marginRight: '6px' }}>
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
                  backgroundColor: activo ? '#C8102E' : '#F3F4F6',
                  color: activo ? '#FFFFFF' : '#1F2937',
                  border: activo ? '1px solid #C8102E' : '1px solid #D1D5DB',
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
            backgroundColor: mensajeFeedback.tipo === 'error' ? '#FEE2E2' : '#D1FAE5',
            border: `1px solid ${mensajeFeedback.tipo === 'error' ? '#C8102E' : '#10B981'}`,
            color: mensajeFeedback.tipo === 'error' ? '#9E0B22' : '#065F46',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {mensajeFeedback.texto}
        </div>
      )}

      {/* PANEL 1: LÍDER DE GRUPO */}
      {rolActual === 'lider_grupo' && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '28px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            borderLeft: '4px solid #10B981',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#065F46' }}>
            Revisión de Líder de Grupo ({ROLES_METADATA.lider_grupo.actorNombre})
          </h3>
          <p style={{ color: '#4B5563', fontSize: '13px', margin: '0 0 20px 0' }}>
            El Líder de Grupo registra la fecha del movimiento y las observaciones enviadas por correo institucional o acordadas en reunión: devuelve con observaciones a los investigadores o da aval para pasar al Comité FIAD.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => setDecisionLider('aval_lider')}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: decisionLider === 'aval_lider' ? '2px solid #059669' : '1px solid #D1D5DB',
                backgroundColor: decisionLider === 'aval_lider' ? '#ECFDF5' : '#F9FAFB',
                color: decisionLider === 'aval_lider' ? '#065F46' : '#1F2937',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} color="#059669" /> Dar Aval y Pasar al Comité FIAD
            </button>

            <button
              type="button"
              onClick={() => setDecisionLider('devolucion_lider')}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: decisionLider === 'devolucion_lider' ? '2px solid #C8102E' : '1px solid #D1D5DB',
                backgroundColor: decisionLider === 'devolucion_lider' ? '#FEF2F2' : '#F9FAFB',
                color: decisionLider === 'devolucion_lider' ? '#9E0B22' : '#1F2937',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw size={18} color="#C8102E" /> Devolver con Observaciones a Investigadores
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
              <Calendar size={14} color="#C8102E" /> Fecha del Movimiento (Ej: 3 de noviembre, 11 de noviembre) *
            </label>
            <input
              type="date"
              value={fechaMovimientoLider}
              onChange={(e) => setFechaMovimientoLider(e.target.value)}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1F2937',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '9px 12px',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
              Observaciones / Soporte de Correo Institucional o Reunión *
            </label>
            <textarea
              rows={4}
              value={obsLider}
              onChange={(e) => setObsLider(e.target.value)}
              placeholder="Ej: Se realizó reunión el 06/11 y se envió correo institucional solicitando ajustar los objetivos específicos..."
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '12px',
                color: '#1F2937',
                fontSize: '13px'
              }}
            />
          </div>

          <button
            type="button"
            disabled={procesando}
            onClick={handleAccionLider}
            className="ub-btn-primary"
            style={{
              width: '100%',
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
            backgroundColor: '#FFFFFF',
            padding: '28px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            borderLeft: '4px solid #C59B27',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#8A6A10' }}>
            Gestión del Comité de Investigación FIAD y Novedades CIPADE
          </h3>
          <p style={{ color: '#4B5563', fontSize: '13px', margin: '0 0 20px 0' }}>
            Seleccione la acción institucional a registrar en el historial: asignación de pares con fecha, aprobación a nivel de facultad, inicio de desarrollo o Novedad de CIPADE.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setAccionComite('asignacion_pares')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: accionComite === 'asignacion_pares' ? '2px solid #C59B27' : '1px solid #D1D5DB',
                backgroundColor: accionComite === 'asignacion_pares' ? '#FEF9E7' : '#F9FAFB',
                color: accionComite === 'asignacion_pares' ? '#8A6A10' : '#1F2937',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Users size={18} color="#C59B27" /> 1. Asignar Pares Evaluadores con Fecha
            </button>

            <button
              type="button"
              onClick={() => setAccionComite('aprobacion_facultad')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: accionComite === 'aprobacion_facultad' ? '2px solid #059669' : '1px solid #D1D5DB',
                backgroundColor: accionComite === 'aprobacion_facultad' ? '#ECFDF5' : '#F9FAFB',
                color: accionComite === 'aprobacion_facultad' ? '#065F46' : '#1F2937',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Award size={18} color="#059669" /> 2. Aprobar a Nivel de Facultad
            </button>

            <button
              type="button"
              onClick={() => setAccionComite('inicio_desarrollo')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: accionComite === 'inicio_desarrollo' ? '2px solid #0D9488' : '1px solid #D1D5DB',
                backgroundColor: accionComite === 'inicio_desarrollo' ? '#F0FDFA' : '#F9FAFB',
                color: accionComite === 'inicio_desarrollo' ? '#115E59' : '#1F2937',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <PlayCircle size={18} color="#0D9488" /> 3. Iniciar Desarrollo del Proyecto
            </button>

            <button
              type="button"
              onClick={() => setAccionComite('novedad_cipade')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: accionComite === 'novedad_cipade' ? '2px solid #C8102E' : '1px solid #D1D5DB',
                backgroundColor: accionComite === 'novedad_cipade' ? '#FEF2F2' : '#F9FAFB',
                color: accionComite === 'novedad_cipade' ? '#9E0B22' : '#1F2937',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertOctagon size={18} color="#C8102E" /> 4. Crear Novedad de CIPADE (Directo a Docentes)
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
              <Calendar size={14} color="#C59B27" /> Fecha del Movimiento / Fecha de Asignación *
            </label>
            <input
              type="date"
              value={fechaMovimientoComite}
              onChange={(e) => setFechaMovimientoComite(e.target.value)}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1F2937',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '9px 12px',
                fontSize: '13px'
              }}
            />
          </div>

          {accionComite === 'asignacion_pares' && (
            <div
              style={{
                backgroundColor: '#F9FAFB',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #C59B27',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <strong style={{ fontSize: '13px', color: '#8A6A10' }}>
                Selección de Pares Evaluadores a los que se remite por correo
              </strong>

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
                        backgroundColor: checked ? '#FEF9E7' : '#FFFFFF',
                        border: checked ? '1px solid #C59B27' : '1px solid #D1D5DB',
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
                        <div style={{ fontWeight: 700, color: '#1F2937' }}>{par.nombre}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
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
                backgroundColor: '#ECFDF5',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #6EE7B7',
                marginBottom: '16px'
              }}
            >
              <label style={{ display: 'block', fontSize: '12px', color: '#065F46', marginBottom: '6px', fontWeight: 600 }}>
                Etapa aprobada a nivel de Facultad:
              </label>
              <select
                value={nuevaEtapaFacultad}
                onChange={(e) => setNuevaEtapaFacultad(e.target.value as EtapaProyecto)}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  border: '1px solid #D1D5DB',
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
                backgroundColor: '#FEF2F2',
                border: '1px solid #C8102E',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: '#9E0B22',
                marginBottom: '16px'
              }}
            >
              <strong>Regla de Negocio CIPADE:</strong> Al registrar una Novedad de CIPADE durante el desarrollo del proyecto, el expediente regresa <strong>directamente a los investigadores docentes</strong> para su ajuste, y una vez subsanado retoma su desarrollo <strong>sin tener que pasar de nuevo por el Comité</strong>.
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
              Observaciones / Soporte de Correo, Acta o Reunión *
            </label>
            <textarea
              rows={4}
              value={obsComite}
              onChange={(e) => setObsComite(e.target.value)}
              placeholder={
                accionComite === 'novedad_cipade'
                  ? 'Ej: CIPADE solicita por correo anexar el acta de propiedad intelectual antes del primer desembolso...'
                  : 'Ingrese el detalle del correo enviado, acta de comité o acuerdo de reunión...'
              }
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '12px',
                color: '#1F2937',
                fontSize: '13px'
              }}
            />
          </div>

          <button
            type="button"
            disabled={procesando}
            onClick={handleAccionComite}
            className="ub-btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '13.5px'
            }}
          >
            {procesando ? 'Ejecutando transición...' : 'Registrar Decisión Oficial en Historial de Trazabilidad'}
          </button>
        </div>
      )}

      {/* PANEL 3: PAR EVALUADOR */}
      {rolActual === 'par_evaluador' && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '28px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            borderLeft: '4px solid #F59E0B',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#92400E' }}>
            Dictamen de Par Evaluador
          </h3>
          <p style={{ color: '#4B5563', fontSize: '13px', margin: '0 0 18px 0' }}>
            Regla de evaluación por pares: cada par emite su concepto individual con fecha.{' '}
            <strong style={{ color: '#C8102E' }}>
              Si al menos un par devuelve el proyecto con correcciones, el proyecto se devuelve completo a los investigadores (`en_revision_investigadores`).
            </strong>
          </p>

          {proyecto.evaluaciones_pares.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                Estado Actual de Pares Asignados en este Proyecto:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {proyecto.evaluaciones_pares.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setParActivoId(ev.par_usuario_id)}
                    style={{
                      padding: '12px',
                      backgroundColor: parActivoId === ev.par_usuario_id ? '#FEF9E7' : '#F9FAFB',
                      border:
                        parActivoId === ev.par_usuario_id
                          ? '2px solid #C59B27'
                          : '1px solid #E5E7EB',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#1F2937' }}>{ev.par_nombre}</strong>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 7px',
                          borderRadius: '4px',
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
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                      Ronda {ev.ronda} · Asignado: {ev.fecha_asignacion}
                      {ev.fecha_concepto ? ` · Concepto: ${ev.fecha_concepto}` : ''}
                    </div>
                    {ev.concepto_observaciones && (
                      <div style={{ fontSize: '11.5px', color: '#374151', marginTop: '6px' }}>
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
              <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
                Seleccionar Par Evaluador que emite el concepto *
              </label>
              <select
                value={parActivoId}
                onChange={(e) => setParActivoId(Number(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  border: '1px solid #D1D5DB',
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
              <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
                Fecha del Movimiento / Concepto *
              </label>
              <input
                type="date"
                value={fechaConceptoPar}
                onChange={(e) => setFechaConceptoPar(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  border: '1px solid #D1D5DB',
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
                border: veredictoPar === 'aprobado' ? '2px solid #059669' : '1px solid #D1D5DB',
                backgroundColor: veredictoPar === 'aprobado' ? '#ECFDF5' : '#F9FAFB',
                color: veredictoPar === 'aprobado' ? '#065F46' : '#1F2937',
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
                border: veredictoPar === 'con_correcciones' ? '2px solid #C8102E' : '1px solid #D1D5DB',
                backgroundColor: veredictoPar === 'con_correcciones' ? '#FEF2F2' : '#F9FAFB',
                color: veredictoPar === 'con_correcciones' ? '#9E0B22' : '#1F2937',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Devolver con Correcciones (Devuelve el proyecto)
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
              Concepto Técnico / Observaciones Remitidas por Correo *
            </label>
            <textarea
              rows={4}
              value={obsPar}
              onChange={(e) => setObsPar(e.target.value)}
              placeholder="Detalle las correcciones metodológicas requeridas o las fortalezas del documento evaluado..."
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '12px',
                color: '#1F2937',
                fontSize: '13px'
              }}
            />
          </div>

          <button
            type="button"
            disabled={procesando}
            onClick={handleConceptoPar}
            className="ub-btn-primary"
            style={{
              width: '100%',
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

      {/* PANEL 4: DOCENTE INVESTIGADOR (SUBSANACIÓN CON FECHA Y SOPORTE DE CORREO) */}
      {rolActual === 'docente' && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '28px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            borderLeft: '4px solid #C8102E',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#C8102E' }}>
            Subsanación de Observaciones por Parte de los Investigadores
          </h3>
          <p style={{ color: '#4B5563', fontSize: '13px', margin: '0 0 18px 0' }}>
            Cuando un proyecto está devuelto con observaciones o por novedad de CIPADE, el investigador docente puede actualizar la información del proyecto y registrar la fecha exacta y el soporte de envío por correo institucional.
          </p>

          {ultimoMovimiento && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #C8102E',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '18px',
                fontSize: '12.5px'
              }}
            >
              <div style={{ fontWeight: 700, color: '#9E0B22', marginBottom: '4px' }}>
                Última Observación / Motivo de Devolución ({ultimoMovimiento.fecha_evento} —{' '}
                {ultimoMovimiento.actor_nombre}):
              </div>
              <div style={{ color: '#1F2937' }}>{ultimoMovimiento.observaciones}</div>
            </div>
          )}

          <form onSubmit={handleSubsanarDocente} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
                Título del Proyecto Docente (Editable) *
              </label>
              <input
                type="text"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#1F2937',
                  fontSize: '13.5px'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
                Resumen Ejecutivo Actualizado *
              </label>
              <textarea
                rows={3}
                value={editResumen}
                onChange={(e) => setEditResumen(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#1F2937',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
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
                    backgroundColor: '#FFFFFF',
                    color: '#1F2937',
                    border: '1px solid #D1D5DB',
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
                <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
                  Sublínea de Investigación
                </label>
                <select
                  value={editSublineaId}
                  onChange={(e) => setEditSublineaId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    color: '#1F2937',
                    border: '1px solid #D1D5DB',
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

            <div
              style={{
                backgroundColor: '#FEF9E7',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #C59B27',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8A6A10', fontSize: '13px', fontWeight: 700 }}>
                  <MailCheck size={17} color="#C59B27" /> Fecha del Movimiento y Soporte de Subsanación
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="#8A6A10" />
                  <label style={{ fontSize: '12px', color: '#1F2937', fontWeight: 600 }}>
                    Fecha de subsanación *
                  </label>
                  <input
                    type="date"
                    value={fechaSubsanacion}
                    onChange={(e) => setFechaSubsanacion(e.target.value)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12.5px'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#374151', marginBottom: '6px', fontWeight: 600 }}>
                  Observaciones / Soporte de Correo o Reunión *
                </label>
                <textarea
                  rows={3}
                  value={obsSubsanacion}
                  onChange={(e) => setObsSubsanacion(e.target.value)}
                  placeholder="Ej: El 11 de noviembre se remitió por correo institucional el documento con los objetivos ajustados según reunión..."
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

            <div
              style={{
                backgroundColor: '#F9FAFB',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '12px',
                color: '#374151'
              }}
            >
              Estado resultante tras subsanar:{' '}
              {proyecto.estado_actual === 'novedad_cipade' || proyecto.etapa_actual === 'desarrollo' ? (
                <strong style={{ color: '#065F46' }}>
                  Retorna directo a En Desarrollo (sin pasar de nuevo por el Comité FIAD)
                </strong>
              ) : (
                <strong style={{ color: '#92400E' }}>
                  Pasa a En Revisión Líder para validación de ajustes
                </strong>
              )}
            </div>

            <button
              type="submit"
              disabled={procesando}
              className="ub-btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13.5px'
              }}
            >
              {procesando
                ? 'Guardando subsanación en historial...'
                : 'Registrar Subsanación y Actualizar Estado del Proyecto'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
