import { useState, useEffect, useCallback } from 'react';
import { AdminShell } from './components/AdminShell';
import type { VistaApp } from './components/Sidebar';
import { GestionProyectos } from './pages/GestionProyectos';
import { RadicarProyecto } from './pages/RadicarProyecto';
import { DictamenComite } from './pages/DictamenComite';
import { SeguimientoAvances } from './pages/SeguimientoAvances';
import { proyectosService } from './services/proyectos';
import { mockCatalogos } from './services/mocks/db';
import type { Catalogos, Proyecto, RolUsuario } from './types';

export function App() {
  const [vistaActual, setVistaActual] = useState<VistaApp>('gestion');
  const [rolActual, setRolActual] = useState<RolUsuario>('lider_grupo');
  const [catalogos, setCatalogos] = useState<Catalogos>(mockCatalogos);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [seleccionado, setSeleccionado] = useState<Proyecto | null>(null);

  const cargarProyectos = useCallback(async (idPreferido?: number) => {
    const data = await proyectosService.obtenerTodos();
    setProyectos(data);
    setSeleccionado((prev) => {
      const targetId = idPreferido ?? prev?.id;
      if (targetId) {
        const encontrado = data.find((item) => item.id === targetId);
        if (encontrado) return encontrado;
      }
      return data.length > 0 ? data[0] : null;
    });
  }, []);

  useEffect(() => {
    let montado = true;
    Promise.all([proyectosService.obtenerCatalogos(), proyectosService.obtenerTodos()]).then(
      ([cats, data]) => {
        if (montado) {
          setCatalogos(cats);
          setProyectos(data);
          setSeleccionado((prev) => prev ?? (data.length > 0 ? data[0] : null));
        }
      }
    );
    return () => {
      montado = false;
    };
  }, []);

  return (
    <AdminShell
      vistaActual={vistaActual}
      setVistaActual={setVistaActual}
      rolActual={rolActual}
      setRolActual={setRolActual}
    >
      {vistaActual === 'gestion' && (
        <GestionProyectos
          proyectos={proyectos}
          seleccionado={seleccionado}
          setSeleccionado={setSeleccionado}
          setVistaActual={setVistaActual}
          rolActual={rolActual}
        />
      )}

      {vistaActual === 'radicar' && (
        <RadicarProyecto
          catalogos={catalogos}
          onRadicado={(nuevoId) => {
            void cargarProyectos(nuevoId);
            setVistaActual('gestion');
          }}
          onCancelar={() => setVistaActual('gestion')}
        />
      )}

      {vistaActual === 'evaluacion' && seleccionado && (
        <DictamenComite
          key={`${seleccionado.id}-${seleccionado.version_documento}-${seleccionado.estado_actual}`}
          proyecto={seleccionado}
          catalogos={catalogos}
          rolActual={rolActual}
          setRolActual={setRolActual}
          onEvaluado={(proyectoActualizado) => {
            if (proyectoActualizado) {
              setSeleccionado(proyectoActualizado);
            }
            void cargarProyectos(proyectoActualizado?.id ?? seleccionado.id);
            setVistaActual('seguimiento');
          }}
          onVolver={() => setVistaActual('gestion')}
        />
      )}

      {vistaActual === 'seguimiento' && seleccionado && (
        <SeguimientoAvances
          proyecto={seleccionado}
          onActualizado={(proyectoActualizado) => {
            if (proyectoActualizado) {
              setSeleccionado(proyectoActualizado);
            }
            void cargarProyectos(proyectoActualizado?.id ?? seleccionado.id);
          }}
          onIrASubsanar={() => setVistaActual('evaluacion')}
          onVolver={() => setVistaActual('gestion')}
        />
      )}
    </AdminShell>
  );
}

export default App;
