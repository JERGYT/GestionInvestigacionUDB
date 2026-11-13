import React from 'react';
import { Sidebar, type VistaApp } from './Sidebar';
import type { RolUsuario } from '../types';

interface AdminShellProps {
  vistaActual: VistaApp;
  setVistaActual: (vista: VistaApp) => void;
  rolActual: RolUsuario;
  setRolActual: (rol: RolUsuario) => void;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  vistaActual,
  setVistaActual,
  rolActual,
  setRolActual,
  children
}) => {
  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#F4F5F7',
        color: '#1F2937'
      }}
    >
      <Sidebar
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        rolActual={rolActual}
        setRolActual={setRolActual}
      />
      <main
        style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          padding: '28px 36px',
          boxSizing: 'border-box',
          backgroundColor: '#F4F5F7',
          color: '#1F2937'
        }}
      >
        {children}
      </main>
    </div>
  );
};
