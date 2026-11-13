import React from 'react';
import {
  ESTADOS_METADATA,
  ETAPAS_METADATA,
  EVENTOS_METADATA,
  type EstadoProyecto,
  type EtapaProyecto,
  type TipoEventoTrazabilidad
} from '../../types';

export const BadgeEstado: React.FC<{ estado: EstadoProyecto }> = ({ estado }) => {
  const meta = ESTADOS_METADATA[estado] || ESTADOS_METADATA.en_revision_lider;
  return (
    <span
      style={{
        backgroundColor: meta.bg,
        color: meta.text,
        border: `1px solid ${meta.border}`,
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }}
    >
      {meta.label}
    </span>
  );
};

export const BadgeEtapa: React.FC<{ etapa: EtapaProyecto }> = ({ etapa }) => {
  const meta = ETAPAS_METADATA[etapa] || ETAPAS_METADATA.idea;
  return (
    <span
      style={{
        backgroundColor: meta.bg,
        color: '#f8fafc',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }}
    >
      {meta.label}
    </span>
  );
};

export const BadgeEvento: React.FC<{ tipo: TipoEventoTrazabilidad }> = ({ tipo }) => {
  const meta = EVENTOS_METADATA[tipo] || { label: tipo, color: '#cbd5e1', bg: '#334155' };
  return (
    <span
      style={{
        backgroundColor: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.color}55`,
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 700,
        display: 'inline-block'
      }}
    >
      {meta.label}
    </span>
  );
};
