import React, { useMemo, useRef, useState } from 'react';
import {
  ETAPAS_METADATA,
  ESTADOS_METADATA,
  obtenerResponsableActual,
  type Catalogos,
  type EvaluacionPar,
  type Proyecto
} from '../types';
import type { VistaApp } from '../components/Sidebar';
import { BadgeEstado, BadgeEtapa, BadgeEvento } from '../components/ui/Badge';
import { proyectosService } from '../services/proyectos';
import {
  PlusCircle,
  Users,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  UserPlus,
  UserMinus,
  Clock,
  PauseCircle,
  PlayCircle,
  Send,
  History,
  ArrowRight,
  FolderOpen,
  ShieldAlert
} from 'lucide-react';

interface Props {
  proyectos: Proyecto[];
  catalogos: Catalogos;
  seleccionado: Proyecto | null;
  setSeleccionado: (p: Proyecto) => void;
  setVistaActual: (v: VistaApp) => void;
  onProyectoActualizado: (p?: Proyecto) => void;
}

function calcularDemoraTexto(fechaStr?: string | null): { fechaCorta: string; diasTexto: string } {
  if (!fechaStr) {
    return { fechaCorta: 'Sin fecha', diasTexto: 'Reciente' };
  }
  const fechaCorta = fechaStr.slice(0, 10);
  const partes = fechaCorta.split('-').map(Number);
  if (partes.length !== 3 || partes.some(isNaN)) {
    return { fechaCorta, diasTexto: 'Registrado' };
  }
  const fechaMov = new Date(partes[0], partes[1] - 1, partes[2]);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diffMs = hoy.getTime() - fechaMov.getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (dias <= 0) return { fechaCorta, diasTexto: 'Movimiento hoy' };
  if (dias === 1) return { fechaCorta, diasTexto: 'Hace 1 día' };
  return { fechaCorta, diasTexto: `Hace ${dias} días` };
}

function obtenerEtapaSiguienteLabel(etapaActual: Proyecto['etapa_actual']): string {
  switch (etapaActual) {
    case 'idea':
      return 'Anteproyecto (Pasa a Revisión Líder)';
    case 'anteproyecto':
      return 'Proyecto Formal (Pasa a Revisión Líder)';
    case 'proyecto':
      return 'Desarrollo del Proyecto (Inicia Ejecución)';
    case 'desarrollo':
      return 'Informe Final (Aprobado Nivel Facultad)';
    default:
      return 'Informe Final (Aprobado Nivel Facultad)';
  }
}

interface TarjetaParProps {
  indice: number;
  evaluacion: EvaluacionPar;
  proyectoId: number;
  fechaDefault: string;
  onActualizado: (p?: Proyecto) => void;
  setMensajeExito: (msg: string) => void;
  setErrorMsg: (msg: string) => void;
}

const TarjetaEvaluacionPar: React.FC<TarjetaParProps> = ({
  indice,
  evaluacion,
  proyectoId,
  fechaDefault,
  onActualizado,
  setMensajeExito,
  setErrorMsg
}) => {
  const [fechaConcepto, setFechaConcepto] = useState(
    evaluacion.fecha_concepto || fechaDefault
  );
  const [observacionesPar, setObservacionesPar] = useState(
    evaluacion.concepto_observaciones || ''
  );
  const [guardandoPar, setGuardandoPar] = useState(false);

  const emitirDictamenPar = async (veredicto: 'aprobado' | 'con_correcciones') => {
    setErrorMsg('');
    setMensajeExito('');
    if (veredicto === 'con_correcciones' && !observacionesPar.trim()) {
      setErrorMsg(
        `Por favor escriba las observaciones de corrección emitidas por ${evaluacion.par_nombre}.`
      );
      return;
    }
    setGuardandoPar(true);
    const res = await proyectosService.registrarConceptoPar(proyectoId, {
      evaluacion_id: evaluacion.id,
      par_usuario_id: evaluacion.par_usuario_id,
      veredicto,
      fecha_concepto: fechaConcepto,
      fecha_evento: fechaConcepto,
      concepto_observaciones:
        observacionesPar.trim() ||
        (veredicto === 'aprobado'
          ? 'El par evaluador emite concepto favorable sin correcciones.'
          : 'El par evaluador solicita correcciones de forma y fondo.')
    });
    setGuardandoPar(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setMensajeExito(
        veredicto === 'con_correcciones'
          ? `Concepto CON CORRECCIONES de ${evaluacion.par_nombre} registrado. El proyecto fue devuelto automáticamente a los investigadores.`
          : `Concepto APROBADO de ${evaluacion.par_nombre} registrado en la bitácora.`
      );
      onActualizado(res.data);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderLeft:
          evaluacion.veredicto === 'aprobado'
            ? '4px solid #10B981'
            : evaluacion.veredicto === 'con_correcciones'
            ? '4px solid #C8102E'
            : '4px solid #C59B27',
        borderRadius: '8px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#8A6A10'
            }}
          >
            Par Evaluador {indice} · Ronda {evaluacion.ronda}
          </span>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1F2937' }}>
            {evaluacion.par_nombre}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>
            Asignado el: <strong>{evaluacion.fecha_asignacion}</strong>
          </div>
        </div>

        <span
          style={{
            padding: '4px 9px',
            borderRadius: '999px',
            fontSize: '10.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            backgroundColor:
              evaluacion.veredicto === 'aprobado'
                ? '#D1FAE5'
                : evaluacion.veredicto === 'con_correcciones'
                ? '#FEE2E2'
                : '#FEF3C7',
            color:
              evaluacion.veredicto === 'aprobado'
                ? '#065F46'
                : evaluacion.veredicto === 'con_correcciones'
                ? '#9E0B22'
                : '#92400E',
            border:
              evaluacion.veredicto === 'aprobado'
                ? '1px solid #10B981'
                : evaluacion.veredicto === 'con_correcciones'
                ? '1px solid #C8102E'
                : '1px solid #F59E0B'
          }}
        >
          {evaluacion.veredicto.replace('_', ' ')}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '155px 1fr', gap: '10px' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '4px'
            }}
          >
            Fecha del Concepto:
          </label>
          <input
            type="date"
            value={fechaConcepto}
            onChange={(e) => setFechaConcepto(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '7px 8px',
              fontSize: '12px'
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '4px'
            }}
          >
            Observaciones / Soporte de Correo del Par {indice}:
          </label>
          <input
            type="text"
            value={observacionesPar}
            onChange={(e) => setObservacionesPar(e.target.value)}
            placeholder="Concepto enviado por correo institucional..."
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '7px 10px',
              fontSize: '12px'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={guardandoPar}
          onClick={() => emitirDictamenPar('aprobado')}
          style={{
            flex: 1,
            backgroundColor: '#059669',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <CheckCircle2 size={14} /> Concepto Aprobado (Par {indice})
        </button>

        <button
          type="button"
          disabled={guardandoPar}
          onClick={() => emitirDictamenPar('con_correcciones')}
          className="ub-btn-primary"
          style={{
            flex: 1,
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <XCircle size={14} /> Devolver con Correcciones
        </button>
      </div>
    </div>
  );
};

interface ExpedienteDetalleProps {
  proyecto: Proyecto;
  catalogos: Catalogos;
  onProyectoActualizado: (p?: Proyecto) => void;
}

const ExpedienteMaestroDetalle: React.FC<ExpedienteDetalleProps> = ({
  proyecto,
  catalogos,
  onProyectoActualizado
}) => {
  const hoyISO = new Date().toISOString().slice(0, 10);

  
  
  const [fechaMovimiento, setFechaMovimiento] = useState(hoyISO);
  const [observacionMovimiento, setObservacionMovimiento] = useState('');
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  
  const paresCatalogo = catalogos.pares.length >= 2 ? catalogos.pares : [
    { id: 5, nombre: 'Dr. Carlos Mendoza (Par 1)', email: 'par1@udeb.edu.co', rol: 'par_evaluador' as const, programa: 'Externo' },
    { id: 6, nombre: 'Dra. Laura Gómez (Par 2)', email: 'par2@udeb.edu.co', rol: 'par_evaluador' as const, programa: 'Externo' }
  ];
  const [par1Id, setPar1Id] = useState<number>(paresCatalogo[0]?.id ?? 5);
  const [par2Id, setPar2Id] = useState<number>(paresCatalogo[1]?.id ?? 6);
  const [mostrarReasignarPares, setMostrarReasignarPares] = useState(false);

  
  const [estadoRetornoStandby, setEstadoRetornoStandby] = useState<string>(
    proyecto.fecha_asignacion_pares ? 'en_evaluacion_pares' : 'en_revision_comite'
  );

  
  const [editTitulo, setEditTitulo] = useState(proyecto.titulo);
  const [editResumen, setEditResumen] = useState(proyecto.resumen || '');
  const [editLineaId, setEditLineaId] = useState<number>(proyecto.linea_id);
  const [editSublineaId, setEditSublineaId] = useState<number>(proyecto.sublinea_id);

  
  const [docenteVincularId, setDocenteVincularId] = useState<number>(
    catalogos.docentes.find((d) => d.id !== proyecto.investigador_principal_id)?.id ?? 3
  );
  const [rolVincular, setRolVincular] = useState<'coinvestigador' | 'codirector'>('coinvestigador');
  const [fechaCambioEquipo, setFechaCambioEquipo] = useState(hoyISO);
  const [obsCambioEquipo, setObsCambioEquipo] = useState('');
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);

  const sublineasDeLinea = useMemo(() => {
    const filtradas = catalogos.sublineas.filter((s) => Number(s.linea_id) === Number(editLineaId));
    return filtradas.length > 0 ? filtradas : catalogos.sublineas;
  }, [catalogos.sublineas, editLineaId]);

  
  const maxRondaPares = useMemo(() => {
    if (proyecto.evaluaciones_pares.length === 0) return 0;
    return Math.max(...proyecto.evaluaciones_pares.map((e) => e.ronda));
  }, [proyecto.evaluaciones_pares]);

  const evaluacionesRondaActual = useMemo(() => {
    return proyecto.evaluaciones_pares.filter((e) => e.ronda === maxRondaPares);
  }, [proyecto.evaluaciones_pares, maxRondaPares]);

  const infoResponsable = obtenerResponsableActual(proyecto.estado_actual);
  const etapaSiguienteTexto = obtenerEtapaSiguienteLabel(proyecto.etapa_actual);

  const ejecutarTransicion = async (
    accion: string,
    extraPayload: Record<string, unknown> = {},
    exitoTexto?: string
  ) => {
    setErrorMsg('');
    setMensajeExito('');
    if (accion === 'devolucion_lider' && !observacionMovimiento.trim()) {
      setErrorMsg('Debe registrar la observación de reunión o correo para devolver el proyecto.');
      return;
    }
    if (accion === 'novedad_cipade' && !observacionMovimiento.trim()) {
      setErrorMsg('Debe describir el motivo de la Novedad de CIPADE reportada.');
      return;
    }

    setProcesandoAccion(true);
    const res = await proyectosService.transicion(proyecto.id, {
      accion,
      fecha_evento: fechaMovimiento,
      fecha_movimiento: fechaMovimiento,
      observaciones: observacionMovimiento.trim(),
      ...extraPayload
    });
    setProcesandoAccion(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setObservacionMovimiento('');
      setMostrarReasignarPares(false);
      setMensajeExito(exitoTexto || res.message || 'Estado actualizado en la bitácora de trazabilidad.');
      onProyectoActualizado(res.data);
    }
  };

  const handleSubsanarProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMensajeExito('');
    if (!observacionMovimiento.trim()) {
      setErrorMsg(
        'Por favor registre el resumen de las correcciones enviadas por correo institucional.'
      );
      return;
    }

    setProcesandoAccion(true);
    const eraNovedadCipade = proyecto.estado_actual === 'novedad_cipade';
    const res = await proyectosService.subsanar(proyecto.id, {
      actor_id: proyecto.investigador_principal_id,
      titulo: editTitulo.trim(),
      resumen: editResumen.trim(),
      linea_id: editLineaId,
      sublinea_id: editSublineaId,
      fecha_evento: fechaMovimiento,
      observaciones: observacionMovimiento.trim()
    });
    setProcesandoAccion(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setObservacionMovimiento('');
      setMensajeExito(
        eraNovedadCipade
          ? 'Novedad CIPADE subsanada. El proyecto regresó directamente a En Desarrollo (sin pasar por Comité).'
          : 'Subsanación registrada con éxito. El proyecto regresó a En Revisión Líder.'
      );
      onProyectoActualizado(res.data);
    }
  };

  const handleVincularDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMensajeExito('');
    setGuardandoEquipo(true);
    const res = await proyectosService.transicion(proyecto.id, {
      accion: 'cambio_equipo',
      actor_id: proyecto.investigador_principal_id,
      nuevo_usuario_id: docenteVincularId,
      rol_equipo: rolVincular,
      fecha_cambio: fechaCambioEquipo,
      fecha_evento: fechaCambioEquipo,
      observaciones:
        obsCambioEquipo.trim() ||
        'Solicitud enviada por correo institucional para vinculación al equipo docente.'
    });
    setGuardandoEquipo(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setObsCambioEquipo('');
      setMensajeExito('Co-investigador vinculado y registrado en la bitácora de trazabilidad.');
      onProyectoActualizado(res.data);
    }
  };

  const handleRetirarDocente = async (usuarioId: number, nombreDocente: string) => {
    setErrorMsg('');
    setMensajeExito('');
    setGuardandoEquipo(true);
    const res = await proyectosService.transicion(proyecto.id, {
      accion: 'cambio_equipo',
      actor_id: proyecto.investigador_principal_id,
      retirar_usuario_id: usuarioId,
      fecha_cambio: fechaCambioEquipo,
      fecha_evento: fechaCambioEquipo,
      observaciones:
        obsCambioEquipo.trim() ||
        `Retiro de ${nombreDocente} formalizado mediante correo institucional.`
    });
    setGuardandoEquipo(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setObsCambioEquipo('');
      setMensajeExito(`Retiro de ${nombreDocente} registrado en la bitácora de trazabilidad.`);
      onProyectoActualizado(res.data);
    }
  };

  return (
    <section
      style={{
        marginTop: '22px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        borderTop: '4px solid #C8102E',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
        padding: '22px 24px'
      }}
    >
      {/* Cabecera del Expediente Abierto */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
          paddingBottom: '16px',
          borderBottom: '1px solid #E5E7EB',
          marginBottom: '20px'
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '6px'
            }}
          >
            <span
              style={{
                backgroundColor: '#C8102E',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '11px',
                padding: '3px 9px',
                borderRadius: '5px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              Expediente #{proyecto.id}
            </span>
            <BadgeEtapa etapa={proyecto.etapa_actual} />
            <BadgeEstado estado={proyecto.estado_actual} />
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
              <RefreshCw size={12} color="#C59B27" /> Rondas de revisión: {proyecto.rondas_revision}
            </span>
          </div>

          <h2 style={{ fontSize: '19px', margin: '4px 0 6px 0', color: '#1F2937', lineHeight: 1.3 }}>
            {proyecto.titulo}
          </h2>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '12.5px',
              color: '#4B5563'
            }}
          >
            <span>
              <strong style={{ color: '#1F2937' }}>Investigador Principal:</strong>{' '}
              {proyecto.investigador_principal}
            </span>
            <span>
              <strong style={{ color: '#1F2937' }}>Línea:</strong> {proyecto.linea_investigacion} (
              {proyecto.sublinea})
            </span>
            <span>
              <strong style={{ color: '#1F2937' }}>Fecha Radicación:</strong>{' '}
              {proyecto.fecha_radicacion}
            </span>
          </div>
        </div>

        {/* Tarjeta de Responsable Actual */}
        <div
          style={{
            backgroundColor: infoResponsable.bg,
            border: `1px solid ${infoResponsable.border}`,
            borderRadius: '8px',
            padding: '10px 14px',
            minWidth: '240px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: infoResponsable.text,
              letterSpacing: '0.04em'
            }}
          >
            Responsable Actual del Movimiento
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: infoResponsable.text, marginTop: '2px' }}>
            {infoResponsable.responsable}
          </div>
          <div style={{ fontSize: '11.5px', color: '#374151', marginTop: '2px' }}>
            {infoResponsable.accionRequerida}
          </div>
        </div>
      </div>

      {/* Alertas de operación */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #C8102E',
            color: '#9E0B22',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '12.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={16} color="#C8102E" />
          {errorMsg}
        </div>
      )}

      {mensajeExito && (
        <div
          style={{
            backgroundColor: '#D1FAE5',
            border: '1px solid #10B981',
            color: '#065F46',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '12.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} color="#059669" />
          {mensajeExito}
        </div>
      )}

      {/* VISTA MAESTRO-DETALLE EN 2 COLUMNAS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* =======================================================================
            COLUMNA IZQUIERDA: CONTROL DE ESTADOS, PARES, SUBSANACIÓN Y EQUIPO
           ======================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Panel Contextual de Control de Estados */}
          <div
            style={{
              backgroundColor: '#F9FAFB',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              padding: '18px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '15px', color: '#1F2937' }}>
                1. Control de Estado y Dictámenes ({ETAPAS_METADATA[proyecto.etapa_actual].label})
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#C8102E',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}
              >
                Acciones habilitadas según estado
              </span>
            </div>

            {/* Selector común de Fecha del Movimiento y Observaciones (excepto cuando es formulario propio de subsanación) */}
            {proyecto.estado_actual !== 'en_revision_investigadores' &&
              proyecto.estado_actual !== 'novedad_cipade' && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '12px' }}>
                    <div>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#1F2937',
                          marginBottom: '4px'
                        }}
                      >
                        <Calendar size={13} color="#C8102E" /> Fecha del Movimiento:
                      </label>
                      <input
                        type="date"
                        value={fechaMovimiento}
                        onChange={(e) => setFechaMovimiento(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#FFFFFF',
                          color: '#1F2937',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '12.5px',
                          fontWeight: 600
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#1F2937',
                          marginBottom: '4px'
                        }}
                      >
                        Observación de Reunión / Correo Institucional:
                      </label>
                      <input
                        type="text"
                        value={observacionMovimiento}
                        onChange={(e) => setObservacionMovimiento(e.target.value)}
                        placeholder="Ej. Avalado en reunión del 3 de noviembre / Se remite acta de comité..."
                        style={{
                          width: '100%',
                          backgroundColor: '#FFFFFF',
                          color: '#1F2937',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '12.5px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

            {/* CASO A: EN REVISIÓN LÍDER */}
            {proyecto.estado_actual === 'en_revision_lider' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    fontSize: '12.5px',
                    color: '#374151',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    padding: '10px 12px',
                    borderRadius: '6px'
                  }}
                >
                  El proyecto en etapa <strong>{ETAPAS_METADATA[proyecto.etapa_actual].label}</strong> se
                  encuentra en manos de la <strong>Líder de Grupo</strong>. Puede otorgar aval para enviarlo al
                  Comité FIAD o devolverlo con observaciones a los investigadores.
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={procesandoAccion}
                    onClick={() =>
                      ejecutarTransicion(
                        'aval_lider',
                        { actor_id: 1 },
                        'Aval de Líder de Grupo registrado. El proyecto pasó a En Revisión Comité.'
                      )
                    }
                    style={{
                      flex: 1,
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px 14px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px'
                    }}
                  >
                    <CheckCircle2 size={16} /> Dar Aval y Enviar a Comité FIAD
                  </button>

                  <button
                    type="button"
                    disabled={procesandoAccion}
                    onClick={() =>
                      ejecutarTransicion(
                        'devolucion_lider',
                        { actor_id: 1 },
                        'Proyecto devuelto con observaciones a los investigadores docentes.'
                      )
                    }
                    className="ub-btn-primary"
                    style={{
                      flex: 1,
                      borderRadius: '8px',
                      padding: '11px 14px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px'
                    }}
                  >
                    <XCircle size={16} /> Devolver con Observaciones
                  </button>
                </div>
              </div>
            )}

            {/* CASO B: EN REVISIÓN COMITÉ (O APROBADO LÍDER) */}
            {(proyecto.estado_actual === 'en_revision_comite' ||
              proyecto.estado_actual === 'aprobado_lider') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Sub-bloque 1: Asignación de Pares */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderLeft: '4px solid #C59B27',
                    borderRadius: '8px',
                    padding: '14px'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
                    Opción A: Asignar Pares Evaluadores (Par 1 y Par 2)
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginBottom: '10px'
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#4B5563',
                          marginBottom: '3px'
                        }}
                      >
                        Par Evaluador 1:
                      </label>
                      <select
                        value={par1Id}
                        onChange={(e) => setPar1Id(Number(e.target.value))}
                        style={{
                          width: '100%',
                          backgroundColor: '#FFFFFF',
                          color: '#1F2937',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          padding: '7px 9px',
                          fontSize: '12px'
                        }}
                      >
                        {paresCatalogo.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#4B5563',
                          marginBottom: '3px'
                        }}
                      >
                        Par Evaluador 2:
                      </label>
                      <select
                        value={par2Id}
                        onChange={(e) => setPar2Id(Number(e.target.value))}
                        style={{
                          width: '100%',
                          backgroundColor: '#FFFFFF',
                          color: '#1F2937',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          padding: '7px 9px',
                          fontSize: '12px'
                        }}
                      >
                        {paresCatalogo.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={procesandoAccion}
                    onClick={() => {
                      const ids = Array.from(new Set([par1Id, par2Id]));
                      void ejecutarTransicion(
                        'asignacion_pares',
                        {
                          actor_id: 4,
                          fecha_asignacion: fechaMovimiento,
                          pares_ids: ids
                        },
                        `Pares evaluadores asignados con fecha ${fechaMovimiento}.`
                      );
                    }}
                    className="ub-btn-primary"
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Asignar Pares Evaluadores con Fecha ({fechaMovimiento})
                  </button>
                </div>

                {/* Sub-bloque 2: Aprobación directa de etapa en Comité o Standby */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderLeft: '4px solid #059669',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>
                      Opción B: Aprobar Etapa Actual en Comité FIAD (Promoción Automática)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#4B5563', marginTop: '2px' }}>
                      Etapa actual: <strong>{ETAPAS_METADATA[proyecto.etapa_actual].label}</strong> → Al
                      aprobar avanza a: <strong style={{ color: '#065F46' }}>{etapaSiguienteTexto}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={procesandoAccion}
                      onClick={() =>
                        ejecutarTransicion(
                          'aprobacion_facultad',
                          { actor_id: 4 },
                          `Comité FIAD aprobó la etapa ${ETAPAS_METADATA[proyecto.etapa_actual].label}. Promovido a: ${etapaSiguienteTexto}.`
                        )
                      }
                      style={{
                        flex: 1.4,
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '9px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={15} /> Aprobar Etapa y Promover
                    </button>

                    <button
                      type="button"
                      disabled={procesandoAccion}
                      onClick={() =>
                        ejecutarTransicion(
                          'en_standby',
                          { actor_id: 4 },
                          'Proyecto puesto en Standby por receso vacacional.'
                        )
                      }
                      style={{
                        flex: 1,
                        backgroundColor: '#FEF9E7',
                        color: '#8A6A10',
                        border: '1px solid #C59B27',
                        borderRadius: '6px',
                        padding: '9px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <PauseCircle size={15} /> Pasar a Standby (Vacaciones)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CASO C: EN EVALUACIÓN DE PARES */}
            {proyecto.estado_actual === 'en_evaluacion_pares' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#9A3412',
                    backgroundColor: '#FFEDD5',
                    border: '1px solid #F59E0B',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    lineHeight: 1.45
                  }}
                >
                  <strong>Regla de Evaluación por Pares:</strong> Registre el concepto individual de cada par con su
                  fecha. Si <strong>al menos un par devuelve con correcciones</strong>, el proyecto pasa de inmediato a{' '}
                  <strong>Devuelto a Investigadores</strong>. Cuando los pares aprueban, el Comité promueve el proyecto
                  a la siguiente etapa.
                </div>

                {/* Tarjetas individuales de Par 1 y Par 2 */}
                {evaluacionesRondaActual.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {evaluacionesRondaActual.map((ev, idx) => (
                      <TarjetaEvaluacionPar
                        key={`${ev.id}-${ev.veredicto}-${ev.fecha_concepto ?? ''}`}
                        indice={idx + 1}
                        evaluacion={ev}
                        proyectoId={proyecto.id}
                        fechaDefault={fechaMovimiento}
                        onActualizado={onProyectoActualizado}
                        setMensajeExito={setMensajeExito}
                        setErrorMsg={setErrorMsg}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#6B7280'
                    }}
                  >
                    No hay pares registrados en esta ronda. Use el botón "Asignar / Reasignar Pares" abajo.
                  </div>
                )}

                {/* Botones de Comité en etapa de Pares: Aprobar y Promover Etapa, Pasar a Standby, o Reasignar Pares */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>
                    Decisión del Comité FIAD / Contingencia Vacacional (Dic - Feb):
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={procesandoAccion}
                      onClick={() =>
                        ejecutarTransicion(
                          'aprobacion_facultad',
                          { actor_id: 4 },
                          `Comité FIAD aprobó la etapa ${ETAPAS_METADATA[proyecto.etapa_actual].label}. Promovido a: ${etapaSiguienteTexto}.`
                        )
                      }
                      style={{
                        flex: 1.4,
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '9px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={15} /> Aprobar en Comité → {etapaSiguienteTexto}
                    </button>

                    <button
                      type="button"
                      disabled={procesandoAccion}
                      onClick={() =>
                        ejecutarTransicion(
                          'en_standby',
                          { actor_id: 4 },
                          'Proceso puesto en Standby por vacaciones de pares evaluadores (diciembre/febrero).'
                        )
                      }
                      style={{
                        flex: 1,
                        backgroundColor: '#FEF9E7',
                        color: '#8A6A10',
                        border: '1px solid #C59B27',
                        borderRadius: '6px',
                        padding: '9px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <PauseCircle size={15} /> Pasar a Standby
                    </button>

                    <button
                      type="button"
                      onClick={() => setMostrarReasignarPares((prev) => !prev)}
                      className="ub-btn-neutral"
                      style={{
                        padding: '9px 12px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {mostrarReasignarPares ? 'Ocultar Reasignación' : 'Reasignar Pares'}
                    </button>
                  </div>

                  {mostrarReasignarPares && (
                    <div
                      style={{
                        marginTop: '6px',
                        paddingTop: '10px',
                        borderTop: '1px solid #E5E7EB',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-end',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#4B5563', marginBottom: '2px' }}>
                          Par 1:
                        </label>
                        <select
                          value={par1Id}
                          onChange={(e) => setPar1Id(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '6px',
                            borderRadius: '5px',
                            border: '1px solid #D1D5DB',
                            fontSize: '12px'
                          }}
                        >
                          {paresCatalogo.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#4B5563', marginBottom: '2px' }}>
                          Par 2:
                        </label>
                        <select
                          value={par2Id}
                          onChange={(e) => setPar2Id(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '6px',
                            borderRadius: '5px',
                            border: '1px solid #D1D5DB',
                            fontSize: '12px'
                          }}
                        >
                          {paresCatalogo.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          ejecutarTransicion(
                            'asignacion_pares',
                            {
                              actor_id: 4,
                              fecha_asignacion: fechaMovimiento,
                              pares_ids: Array.from(new Set([par1Id, par2Id]))
                            },
                            'Nueva ronda de pares evaluadores asignada.'
                          )
                        }
                        className="ub-btn-primary"
                        style={{
                          padding: '7px 12px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Guardar Nuevos Pares
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CASO D: EN STANDBY (VACACIONES DICIEMBRE / FEBRERO) */}
            {proyecto.estado_actual === 'en_standby' && (
              <div
                style={{
                  backgroundColor: '#FEF9E7',
                  border: '1px solid #C59B27',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '12.5px', color: '#8A6A10', lineHeight: 1.45 }}>
                  <strong>Proyecto en Standby (Espera Vacacional):</strong> El proceso se encuentra pausado mientras
                  los pares evaluadores o el comité retornan de receso académico. Seleccione el estado al cual desea
                  reactivar el expediente:
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#8A6A10',
                        marginBottom: '4px'
                      }}
                    >
                      Estado de retorno al reactivar:
                    </label>
                    <select
                      value={estadoRetornoStandby}
                      onChange={(e) => setEstadoRetornoStandby(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                        border: '1px solid #C59B27',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12.5px',
                        fontWeight: 600
                      }}
                    >
                      <option value="en_evaluacion_pares">En Evaluación de Pares</option>
                      <option value="en_revision_comite">En Revisión Comité</option>
                      <option value="en_revision_lider">En Revisión Líder</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={procesandoAccion}
                    onClick={() =>
                      ejecutarTransicion(
                        'reactivar_standby',
                        { actor_id: 4, estado_destino: estadoRetornoStandby },
                        'Proyecto reactivado exitosamente tras periodo de Standby.'
                      )
                    }
                    style={{
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '9px 16px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <PlayCircle size={16} /> Reactivar Proceso desde Standby
                  </button>
                </div>
              </div>
            )}

            {/* CASO E: DEVUELTO A INVESTIGADORES O NOVEDAD CIPADE (FORMULARIO DE EDICIÓN Y SUBSANACIÓN) */}
            {(proyecto.estado_actual === 'en_revision_investigadores' ||
              proyecto.estado_actual === 'novedad_cipade') && (
              <form
                onSubmit={handleSubsanarProyecto}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #FCA5A5',
                  borderLeft: '4px solid #C8102E',
                  borderRadius: '8px',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#9E0B22',
                    lineHeight: 1.45
                  }}
                >
                  {proyecto.estado_actual === 'novedad_cipade' ? (
                    <>
                      <strong>Regla Especial de Novedad CIPADE (Etapa Desarrollo):</strong> Al subsanar las
                      observaciones de CIPADE, el proyecto <strong>regresa directamente a En Desarrollo</strong> sin
                      pasar de nuevo por la Líder de Grupo ni por el Comité FIAD.
                    </>
                  ) : (
                    <>
                      <strong>Subsanación de Investigadores Docentes:</strong> Actualice los datos necesarios y
                      registre la fecha y observación del soporte enviado por correo. Al guardar, el proyecto pasará a{' '}
                      <strong>En Revisión Líder</strong>.
                    </>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#1F2937',
                      marginBottom: '4px'
                    }}
                  >
                    Título del Proyecto Docente (Editable):
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitulo}
                    onChange={(e) => setEditTitulo(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12.5px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#1F2937',
                        marginBottom: '4px'
                      }}
                    >
                      Línea de Investigación:
                    </label>
                    <select
                      value={editLineaId}
                      onChange={(e) => {
                        const nuevaLinea = Number(e.target.value);
                        setEditLineaId(nuevaLinea);
                        const primeraSub = catalogos.sublineas.find(
                          (s) => Number(s.linea_id) === nuevaLinea
                        );
                        if (primeraSub) setEditSublineaId(primeraSub.id);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        padding: '7px 9px',
                        fontSize: '12px'
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
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#1F2937',
                        marginBottom: '4px'
                      }}
                    >
                      Sublínea de Investigación:
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
                        padding: '7px 9px',
                        fontSize: '12px'
                      }}
                    >
                      {sublineasDeLinea.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#1F2937',
                      marginBottom: '4px'
                    }}
                  >
                    Resumen / Alcance Actualizado:
                  </label>
                  <textarea
                    rows={2}
                    value={editResumen}
                    onChange={(e) => setEditResumen(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '165px 1fr', gap: '10px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#C8102E',
                        marginBottom: '4px'
                      }}
                    >
                      Fecha de Subsanación:
                    </label>
                    <input
                      type="date"
                      required
                      value={fechaMovimiento}
                      onChange={(e) => setFechaMovimiento(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        padding: '8px 9px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#C8102E',
                        marginBottom: '4px'
                      }}
                    >
                      Observación / Soporte de Correo de Subsanación:
                    </label>
                    <input
                      type="text"
                      required
                      value={observacionMovimiento}
                      onChange={(e) => setObservacionMovimiento(e.target.value)}
                      placeholder="Ej. El 11 de noviembre se enviaron correcciones por correo institucional..."
                      style={{
                        width: '100%',
                        backgroundColor: '#FFFFFF',
                        color: '#1F2937',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={procesandoAccion}
                  className="ub-btn-primary"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={15} />
                  {procesandoAccion
                    ? 'Registrando subsanación...'
                    : proyecto.estado_actual === 'novedad_cipade'
                    ? 'Guardar Subsanación CIPADE y Retornar Directo a Desarrollo'
                    : 'Guardar Subsanación y Enviar a Revisión de Líder de Grupo'}
                </button>
              </form>
            )}

            {/* CASO F: EN DESARROLLO (NOVEDADES DE CIPADE O CIERRE A INFORME FINAL) */}
            {proyecto.estado_actual === 'en_desarrollo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #10B981',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#065F46',
                    lineHeight: 1.45
                  }}
                >
                  <strong>Proyecto en Etapa de Desarrollo:</strong> Desde aquí puede registrar una{' '}
                  <strong>Novedad de CIPADE</strong> (que devuelve el proyecto directamente a los investigadores sin
                  pasar por el Comité, y al subsanarse regresa directo a Desarrollo) o aprobar el cierre pasando a{' '}
                  <strong>Informe Final</strong>.
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={procesandoAccion}
                    onClick={() =>
                      ejecutarTransicion(
                        'novedad_cipade',
                        { actor_id: 1 },
                        'Novedad de CIPADE registrada. El proyecto pasó directamente a los investigadores docentes.'
                      )
                    }
                    className="ub-btn-primary"
                    style={{
                      flex: 1.2,
                      borderRadius: '8px',
                      padding: '11px 14px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px'
                    }}
                  >
                    <ShieldAlert size={16} /> Registrar Novedad de CIPADE (Directo a Investigadores)
                  </button>

                  <button
                    type="button"
                    disabled={procesandoAccion}
                    onClick={() =>
                      ejecutarTransicion(
                        'aprobacion_facultad',
                        { actor_id: 4 },
                        'Desarrollo finalizado. El proyecto pasó a Informe Final con estado Aprobado Nivel Facultad.'
                      )
                    }
                    style={{
                      flex: 1,
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px 14px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px'
                    }}
                  >
                    <CheckCircle2 size={16} /> Cerrar Desarrollo → Informe Final
                  </button>
                </div>
              </div>
            )}

            {/* CASO G: APROBADO A NIVEL DE FACULTAD / INFORME FINAL */}
            {proyecto.estado_actual === 'aprobado_facultad' && (
              <div
                style={{
                  backgroundColor: '#D1FAE5',
                  border: '1px solid #059669',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ fontSize: '12.5px', color: '#065F46' }}>
                  <strong>Expediente Aprobado a Nivel de Facultad</strong> en etapa{' '}
                  <strong>{ETAPAS_METADATA[proyecto.etapa_actual].label}</strong>.
                </div>

                {proyecto.etapa_actual !== 'informe_final' && (
                  <button
                    type="button"
                    disabled={procesandoAccion}
                    onClick={() =>
                      ejecutarTransicion(
                        'inicio_desarrollo',
                        { actor_id: 4 },
                        'El proyecto pasó a etapa de Desarrollo.'
                      )
                    }
                    style={{
                      backgroundColor: '#047857',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Pasar a Etapa de Desarrollo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Panel de Gestión de Co-investigadores Docentes */}
          <div
            style={{
              backgroundColor: '#F9FAFB',
              padding: '18px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14.5px',
                fontWeight: 700,
                color: '#1F2937',
                marginBottom: '12px'
              }}
            >
              <Users size={17} color="#C8102E" />
              2. Equipo de Investigadores Docentes ({proyecto.equipo.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
              {proyecto.equipo.map((miembro) => (
                <div
                  key={miembro.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    padding: '9px 12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    opacity: miembro.activo ? 1 : 0.72,
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
                          padding: '3px 8px',
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

            {/* Formulario integrado para vincular co-investigador o codirector */}
            <form
              onSubmit={handleVincularDocente}
              style={{
                backgroundColor: '#FFFFFF',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                gap: '9px'
              }}
            >
              <div
                style={{
                  fontSize: '11.5px',
                  color: '#C8102E',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <UserPlus size={13} /> Vincular Co-investigador o Codirector (Con Registro en Bitácora)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr 1fr', gap: '8px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10.5px',
                      color: '#4B5563',
                      marginBottom: '3px',
                      fontWeight: 600
                    }}
                  >
                    Docente:
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
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10.5px',
                      color: '#4B5563',
                      marginBottom: '3px',
                      fontWeight: 600
                    }}
                  >
                    Rol:
                  </label>
                  <select
                    value={rolVincular}
                    onChange={(e) => setRolVincular(e.target.value as 'coinvestigador' | 'codirector')}
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
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10.5px',
                      color: '#4B5563',
                      marginBottom: '3px',
                      fontWeight: 600
                    }}
                  >
                    Fecha del cambio:
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

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={obsCambioEquipo}
                  onChange={(e) => setObsCambioEquipo(e.target.value)}
                  placeholder="Observación / Soporte de correo para el cambio en el equipo..."
                  style={{
                    flex: 1,
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
                  className="ub-btn-secondary"
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {guardandoEquipo ? 'Guardando...' : 'Vincular Docente'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* =======================================================================
            COLUMNA DERECHA: BITÁCORA DE TRAZABILIDAD EN VIVO
           ======================================================================= */}
        <div
          style={{
            backgroundColor: '#F9FAFB',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            maxHeight: '780px',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '1px solid #E5E7EB'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="#C8102E" />
              <h3 style={{ margin: 0, fontSize: '15px', color: '#1F2937' }}>
                Bitácora de Trazabilidad en Vivo
              </h3>
            </div>
            <span
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#374151',
                padding: '3px 9px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              {proyecto.trazabilidad.length} movimientos
            </span>
          </div>

          <div
            style={{
              position: 'relative',
              paddingLeft: '20px',
              borderLeft: '2px solid #D1D5DB',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {proyecto.trazabilidad.map((evento, index) => {
              const esReciente = index === 0;
              return (
                <div
                  key={evento.id}
                  style={{
                    position: 'relative',
                    backgroundColor: '#FFFFFF',
                    padding: '13px 15px',
                    borderRadius: '8px',
                    border: esReciente ? '1px solid #C8102E' : '1px solid #E5E7EB',
                    boxShadow: esReciente
                      ? '0 2px 6px rgba(200, 16, 46, 0.08)'
                      : '0 1px 2px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  {/* Punto en la línea de tiempo */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-27px',
                      top: '16px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: esReciente ? '#C8102E' : '#C59B27',
                      border: '2px solid #FFFFFF'
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <BadgeEvento tipo={evento.tipo_evento} />
                      {esReciente && (
                        <span
                          style={{
                            backgroundColor: '#FEE2E2',
                            color: '#9E0B22',
                            border: '1px solid #FCA5A5',
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}
                        >
                          Último
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        color: '#374151',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        backgroundColor: '#F3F4F6',
                        padding: '2px 7px',
                        borderRadius: '4px'
                      }}
                    >
                      <Clock size={11} color="#C8102E" /> {evento.fecha_evento}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '6px 0 8px 0',
                      fontSize: '12.5px',
                      color: '#1F2937',
                      lineHeight: 1.45
                    }}
                  >
                    {evento.observaciones}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '7px',
                      borderTop: '1px dashed #E5E7EB',
                      fontSize: '11px',
                      color: '#6B7280'
                    }}
                  >
                    <span>
                      Por: <strong style={{ color: '#1F2937' }}>{evento.actor_nombre}</strong> · Etapa:{' '}
                      <strong style={{ color: '#8A6A10', textTransform: 'uppercase' }}>
                        {evento.etapa}
                      </strong>
                    </span>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {evento.estado_anterior ? (
                        <>
                          <span>{ESTADOS_METADATA[evento.estado_anterior]?.label ?? evento.estado_anterior}</span>
                          <ArrowRight size={11} color="#9CA3AF" />
                        </>
                      ) : null}
                      <strong style={{ color: '#1F2937' }}>
                        {ESTADOS_METADATA[evento.estado_nuevo]?.label ?? evento.estado_nuevo}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export const GestionProyectos: React.FC<Props> = ({
  proyectos,
  catalogos,
  seleccionado,
  setSeleccionado,
  setVistaActual,
  onProyectoActualizado
}) => {
  const [filtroEtapa, setFiltroEtapa] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const detalleRef = useRef<HTMLDivElement | null>(null);

  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      const matchEtapa = filtroEtapa === 'todas' || p.etapa_actual === filtroEtapa;
      const matchEstado = filtroEstado === 'todos' || p.estado_actual === filtroEstado;
      return matchEtapa && matchEstado;
    });
  }, [proyectos, filtroEtapa, filtroEstado]);

  const seleccionarYAbrir = (p: Proyecto) => {
    setSeleccionado(p);
    setTimeout(() => {
      detalleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  return (
    <div>
      {/* Encabezado Principal */}
      <header
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1 style={{ fontSize: '23px', margin: '0 0 4px 0', color: '#1F2937' }}>
            Tablero de Control y Trazabilidad de Proyectos Docentes
          </h1>
          <p style={{ color: '#4B5563', fontSize: '13px', margin: 0 }}>
            Seleccione cualquier proyecto de la tabla para abrir su <strong>Expediente Maestro-Detalle</strong>{' '}
            con gestión de estados, evaluación de pares, subsanación y bitácora en vivo.
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
          <PlusCircle size={18} /> Radicar Propuesta Docente
        </button>
      </header>

      {/* Barra de Filtros */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '16px',
          backgroundColor: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              color: '#4B5563',
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: '4px'
            }}
          >
            Filtrar por Etapa:
          </label>
          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value)}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
              padding: '7px 12px',
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
          <label
            style={{
              display: 'block',
              color: '#4B5563',
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: '4px'
            }}
          >
            Filtrar por Estado del Flujo:
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '12.5px'
            }}
          >
            <option value="todos">Todos los Estados</option>
            <option value="en_revision_lider">En Revisión Líder</option>
            <option value="en_revision_investigadores">Devuelto a Investigadores (Con Obs.)</option>
            <option value="en_revision_comite">En Revisión Comité</option>
            <option value="en_evaluacion_pares">En Evaluación de Pares</option>
            <option value="en_standby">En Standby (Vacaciones Dic/Feb)</option>
            <option value="aprobado_facultad">Aprobado Nivel Facultad</option>
            <option value="en_desarrollo">En Desarrollo</option>
            <option value="novedad_cipade">Novedad CIPADE</option>
          </select>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            color: '#4B5563'
          }}
        >
          <div>
            Proyectos listados: <strong style={{ color: '#C8102E' }}>{proyectosFiltrados.length}</strong>
          </div>
          <div>
            Modalidad: <strong style={{ color: '#065F46' }}>Investigación Docente FIAD</strong>
          </div>
        </div>
      </div>

      {/* Tabla Resumen con Columna 'Responsable Actual / Demora' */}
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
              <th style={{ padding: '12px 14px' }}>Responsable Actual / Demora</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Rondas</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Expediente</th>
            </tr>
          </thead>
          <tbody>
            {proyectosFiltrados.map((p) => {
              const isSelected = seleccionado?.id === p.id;
              const coCount = p.equipo.filter((m) => m.rol_equipo !== 'principal' && m.activo).length;
              const resp = obtenerResponsableActual(p.estado_actual);
              const fechaUltMov = p.trazabilidad?.[0]?.fecha_evento ?? p.fecha_radicacion;
              const demora = calcularDemoraTexto(fechaUltMov);

              return (
                <tr
                  key={p.id}
                  onClick={() => seleccionarYAbrir(p)}
                  style={{
                    borderBottom: '1px solid #E5E7EB',
                    backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF',
                    borderLeft: isSelected ? '4px solid #C8102E' : '4px solid transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.12s ease'
                  }}
                >
                  <td style={{ padding: '13px 14px', fontWeight: 800, color: '#C8102E' }}>#{p.id}</td>
                  <td style={{ padding: '13px 14px' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: '#1F2937',
                        marginBottom: '3px',
                        lineHeight: 1.3
                      }}
                    >
                      {p.titulo}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#6B7280' }}>
                      IP: <strong style={{ color: '#374151' }}>{p.investigador_principal}</strong>
                      {coCount > 0 && ` (+${coCount} co-inv.)`} · {p.linea_investigacion}
                    </div>
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <BadgeEtapa etapa={p.etapa_actual} />
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <BadgeEstado estado={p.estado_actual} />
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        backgroundColor: resp.bg,
                        color: resp.text,
                        border: `1px solid ${resp.border}`,
                        padding: '2px 8px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 700,
                        marginBottom: '3px'
                      }}
                    >
                      En manos de: {resp.responsable}
                    </div>
                    <div style={{ fontSize: '11px', color: '#4B5563' }}>
                      Últ. mov: <strong>{demora.fechaCorta}</strong> ({demora.diasTexto})
                    </div>
                  </td>
                  <td style={{ padding: '13px 14px', textAlign: 'center' }}>
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
                  <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        seleccionarYAbrir(p);
                      }}
                      className={isSelected ? 'ub-btn-primary' : 'ub-btn-neutral'}
                      style={{
                        padding: '6px 11px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <FolderOpen size={13} />
                      {isSelected ? 'Expediente Abierto' : 'Abrir Expediente'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {proyectosFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#6B7280' }}>
                  No se encontraron proyectos docentes con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vista Maestro-Detalle Unificada en 2 Columnas */}
      <div ref={detalleRef}>
        {seleccionado && (
          <ExpedienteMaestroDetalle
            key={`${seleccionado.id}-${seleccionado.etapa_actual}-${seleccionado.estado_actual}-${seleccionado.rondas_revision}-${seleccionado.trazabilidad.length}`}
            proyecto={seleccionado}
            catalogos={catalogos}
            onProyectoActualizado={onProyectoActualizado}
          />
        )}
      </div>
    </div>
  );
};
