import React from 'react';
import { FolderGit2, PlusCircle, CheckSquare, History, UserCheck } from 'lucide-react';
import type { RolUsuario } from '../types';
import { ROLES_METADATA } from '../types';

export type VistaApp = 'gestion' | 'radicar' | 'evaluacion' | 'seguimiento';

export interface SidebarProps {
  vistaActual: VistaApp;
  setVistaActual: (vista: VistaApp) => void;
  rolActual: RolUsuario;
  setRolActual: (rol: RolUsuario) => void;
}

interface MenuItem {
  id: VistaApp;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  vistaActual,
  setVistaActual,
  rolActual,
  setRolActual
}) => {
  const menu: MenuItem[] = [
    { id: 'gestion', label: 'Proyectos Docentes', icon: FolderGit2 },
    { id: 'radicar', label: 'Radicar Proyecto', icon: PlusCircle },
    { id: 'evaluacion', label: 'Flujo, Pares y Subsanación', icon: CheckSquare },
    { id: 'seguimiento', label: 'Historial de Trazabilidad', icon: History },
  ];

  const roles: RolUsuario[] = ['docente', 'lider_grupo', 'comite', 'par_evaluador'];
  const metaRol = ROLES_METADATA[rolActual];

  return (
    <aside
      style={{
        width: '285px',
        backgroundColor: '#1C1C1E',
        color: '#D1D5DB',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        borderRight: '1px solid #2E2E32',
        flexShrink: 0
      }}
    >
      {/* Encabezado Institucional SiiUB */}
      <div
        style={{
          padding: '20px 18px',
          borderBottom: '1px solid #2E2E32',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            backgroundColor: '#C8102E',
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: '15px',
            letterSpacing: '0.04em',
            padding: '8px 10px',
            borderRadius: '6px',
            borderBottom: '3px solid #C59B27',
            lineHeight: 1,
            flexShrink: 0
          }}
        >
          UB
        </div>
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              fontSize: '13px',
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.3,
              color: '#FFFFFF'
            }}
          >
            UB | Universidad de Boyacá
          </h2>
          <small style={{ color: '#C59B27', fontSize: '11px', fontWeight: 600, display: 'block', marginTop: '2px' }}>
            Gestión Investigativa FIAD
          </small>
        </div>
      </div>

      <nav
        style={{
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          flex: 1
        }}
      >
        <div
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: '#9CA3AF',
            fontWeight: 700,
            padding: '0 8px 6px 8px'
          }}
        >
          Módulos del Sistema
        </div>
        {menu.map((item) => {
          const Icon = item.icon;
          const activo = vistaActual === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setVistaActual(item.id)}
              className={activo ? 'ub-nav-item-active' : 'ub-nav-item'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: activo ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Icon size={18} color={activo ? '#FFFFFF' : '#D1D5DB'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Selector de Rol Simulado en vivo */}
      <div
        style={{
          padding: '16px',
          margin: '12px',
          backgroundColor: '#27272A',
          borderRadius: '10px',
          border: '1px solid #3F3F46',
          borderTop: `3px solid ${metaRol.accent}`
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#C59B27'
          }}
        >
          <UserCheck size={15} color="#C59B27" />
          Selector de Rol (Simulación)
        </div>

        <select
          aria-label="Selector de rol simulado"
          value={rolActual}
          onChange={(e) => setRolActual(e.target.value as RolUsuario)}
          style={{
            width: '100%',
            backgroundColor: '#1C1C1E',
            color: '#FFFFFF',
            border: '1px solid #3F3F46',
            borderRadius: '6px',
            padding: '9px 10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLES_METADATA[r].label}
            </option>
          ))}
        </select>

        <div style={{ fontSize: '11.5px', color: '#D1D5DB', marginBottom: '4px' }}>
          Actor activo: <strong style={{ color: '#FFFFFF' }}>{metaRol.actorNombre}</strong>
        </div>
        <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.4 }}>
          {metaRol.descripcion}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
