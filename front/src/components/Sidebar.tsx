import React from 'react';
import { FolderGit2, PlusCircle, GitBranch } from 'lucide-react';

export type VistaApp = 'gestion' | 'radicar';

export interface SidebarProps {
  vistaActual: VistaApp;
  setVistaActual: (vista: VistaApp) => void;
}

interface MenuItem {
  id: VistaApp;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ vistaActual, setVistaActual }) => {
  const menu: MenuItem[] = [
    { id: 'gestion', label: 'Tablero y Trazabilidad', icon: FolderGit2 },
    { id: 'radicar', label: 'Radicar Propuesta', icon: PlusCircle }
  ];

  return (
    <aside
      style={{
        width: '280px',
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
          <small
            style={{
              color: '#C59B27',
              fontSize: '11px',
              fontWeight: 600,
              display: 'block',
              marginTop: '2px'
            }}
          >
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
          Vistas Principales
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

      {/* Resumen de Reglas del Flujo FIAD */}
      <div
        style={{
          padding: '15px',
          margin: '12px',
          backgroundColor: '#27272A',
          borderRadius: '10px',
          border: '1px solid #3F3F46',
          borderTop: '3px solid #C59B27'
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
          <GitBranch size={15} color="#C59B27" />
          Ciclo de Etapas FIAD
        </div>
        <div style={{ fontSize: '11.5px', color: '#FFFFFF', fontWeight: 600, marginBottom: '6px', lineHeight: 1.4 }}>
          Idea → Anteproyecto → Proyecto → Desarrollo → Informe Final
        </div>
        <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: 1.45 }}>
          • Al aprobar en Comité se promueve automáticamente a la siguiente etapa.<br />
          • Las Novedades CIPADE retornan directo a Desarrollo tras subsanarse.<br />
          • Incluye estado Standby para recesos de pares (Dic/Feb).
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
