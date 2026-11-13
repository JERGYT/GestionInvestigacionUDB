import React from 'react';
import { FolderGit2, PlusCircle, CheckSquare, History, GraduationCap, UserCheck } from 'lucide-react';
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
    { id: 'seguimiento', label: 'Trazabilidad y Versiones', icon: History },
  ];

  const roles: RolUsuario[] = ['docente', 'lider_grupo', 'comite', 'par_evaluador'];
  const metaRol = ROLES_METADATA[rolActual];

  return (
    <aside
      style={{
        width: '285px',
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        borderRight: '1px solid #334155',
        flexShrink: 0
      }}
    >
      <div
        style={{
          padding: '22px 20px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <GraduationCap size={32} color="#38bdf8" />
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, lineHeight: 1.2 }}>
            Investigación UDB
          </h2>
          <small style={{ color: '#94a3b8', fontSize: '11px' }}>
            Proyectos Docentes · FIAD
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
            letterSpacing: '0.06em',
            color: '#64748b',
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activo ? '#0284c7' : 'transparent',
                color: activo ? '#ffffff' : '#94a3b8',
                fontSize: '13.5px',
                fontWeight: activo ? '600' : '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} />
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
          backgroundColor: '#0f172a',
          borderRadius: '10px',
          border: `1px solid ${metaRol.color}55`
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
            color: metaRol.color
          }}
        >
          <UserCheck size={15} color={metaRol.color} />
          Selector de Rol (Simulación)
        </div>

        <select
          aria-label="Selector de rol simulado"
          value={rolActual}
          onChange={(e) => setRolActual(e.target.value as RolUsuario)}
          style={{
            width: '100%',
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
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

        <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginBottom: '4px' }}>
          Actor activo: <strong style={{ color: '#fff' }}>{metaRol.actorNombre}</strong>
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
          {metaRol.descripcion}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
