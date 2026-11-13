import type { Catalogos, Proyecto } from '../../types';

export const mockCatalogos: Catalogos = {
  lineas: [
    {
      id: 1,
      nombre: 'Ingeniería de Software y Sistemas Inteligentes',
      activa: 1,
      sublineas: [
        { id: 1, linea_id: 1, nombre: 'Arquitecturas Web y Computación en la Nube', activa: 1 },
        { id: 2, linea_id: 1, nombre: 'Inteligencia Artificial y Ciencia de Datos', activa: 1 }
      ]
    },
    {
      id: 2,
      nombre: 'Energías Renovables y Eficiencia Energética',
      activa: 1,
      sublineas: [
        { id: 3, linea_id: 2, nombre: 'Modelado Predictivo en Redes Eléctricas', activa: 1 }
      ]
    },
    {
      id: 3,
      nombre: 'Telecomunicaciones y Redes de Nueva Generación',
      activa: 1,
      sublineas: [
        { id: 4, linea_id: 3, nombre: 'Internet de las Cosas (IoT) y Sistemas Embebidos', activa: 1 }
      ]
    }
  ],
  sublineas: [
    { id: 1, linea_id: 1, nombre: 'Arquitecturas Web y Computación en la Nube', activa: 1 },
    { id: 2, linea_id: 1, nombre: 'Inteligencia Artificial y Ciencia de Datos', activa: 1 },
    { id: 3, linea_id: 2, nombre: 'Modelado Predictivo en Redes Eléctricas', activa: 1 },
    { id: 4, linea_id: 3, nombre: 'Internet de las Cosas (IoT) y Sistemas Embebidos', activa: 1 }
  ],
  docentes: [
    { id: 1, nombre: 'Dra. Paula Cheng', email: 'pcheng@uniboyaca.edu.co', rol: 'lider_grupo', programa: 'Ingeniería de Sistemas' },
    { id: 2, nombre: 'Ing. Francisco Vargas', email: 'fvargas@uniboyaca.edu.co', rol: 'docente', programa: 'Ingeniería de Sistemas' },
    { id: 3, nombre: 'Ing. Martha Celene', email: 'mcelene@uniboyaca.edu.co', rol: 'docente', programa: 'Ingeniería de Sistemas' }
  ],
  pares: [
    { id: 5, nombre: 'Dr. Carlos Mendoza (Par 1)', email: 'cmendoza@uniboyaca.edu.co', rol: 'par_evaluador', programa: 'Ingeniería de Sistemas' },
    { id: 6, nombre: 'Dra. Laura Gómez (Par 2)', email: 'lgomez@uniboyaca.edu.co', rol: 'par_evaluador', programa: 'Ingeniería Electrónica' }
  ],
  usuarios: [
    { id: 1, nombre: 'Dra. Paula Cheng', email: 'pcheng@uniboyaca.edu.co', rol: 'lider_grupo', programa: 'Ingeniería de Sistemas' },
    { id: 2, nombre: 'Ing. Francisco Vargas', email: 'fvargas@uniboyaca.edu.co', rol: 'docente', programa: 'Ingeniería de Sistemas' },
    { id: 3, nombre: 'Ing. Martha Celene', email: 'mcelene@uniboyaca.edu.co', rol: 'docente', programa: 'Ingeniería de Sistemas' },
    { id: 4, nombre: 'Comité de Investigaciones FIAD', email: 'comite.fiad@uniboyaca.edu.co', rol: 'comite', programa: 'Facultad de Ingeniería' },
    { id: 5, nombre: 'Dr. Carlos Mendoza (Par 1)', email: 'cmendoza@uniboyaca.edu.co', rol: 'par_evaluador', programa: 'Ingeniería de Sistemas' },
    { id: 6, nombre: 'Dra. Laura Gómez (Par 2)', email: 'lgomez@uniboyaca.edu.co', rol: 'par_evaluador', programa: 'Ingeniería Electrónica' }
  ]
};

export const mockProyectos: Proyecto[] = [
  {
    id: 1,
    titulo: 'Arquitectura de Microservicios para Trazabilidad Académica',
    resumen: 'Propuesta docente para gestionar proyectos de investigación en la FIAD.',
    linea_id: 1,
    linea_investigacion: 'Ingeniería de Software y Sistemas Inteligentes',
    sublinea_id: 1,
    sublinea: 'Arquitecturas Web y Computación en la Nube',
    investigador_principal_id: 2,
    investigador_principal: 'Ing. Francisco Vargas',
    etapa_actual: 'idea',
    estado_actual: 'en_revision_lider',
    rondas_revision: 2,
    fecha_radicacion: '2026-11-03',
    fecha_asignacion_pares: null,
    documento_actual_url: 'docs/proyecto1_v2.pdf',
    version_documento: 2,
    equipo: [
      { id: 1, usuario_id: 2, nombre: 'Ing. Francisco Vargas', email: 'fvargas@uniboyaca.edu.co', programa: 'Ingeniería de Sistemas', rol_equipo: 'principal', activo: true, fecha_vinculacion: '2026-11-03', fecha_retiro: null },
      { id: 2, usuario_id: 3, nombre: 'Ing. Martha Celene', email: 'mcelene@uniboyaca.edu.co', programa: 'Ingeniería de Sistemas', rol_equipo: 'coinvestigador', activo: true, fecha_vinculacion: '2026-11-03', fecha_retiro: null }
    ],
    trazabilidad: [
      {
        id: 3,
        proyecto_id: 1,
        etapa: 'idea',
        estado_anterior: 'en_revision_investigadores',
        estado_nuevo: 'en_revision_lider',
        actor_id: 2,
        actor_nombre: 'Ing. Francisco Vargas',
        actor_rol: 'docente',
        tipo_evento: 'subsanacion_investigador',
        observaciones: 'Se cargó nueva versión v2 con los objetivos ajustados según indicaciones.',
        version_documento: 2,
        archivo_pdf_url: 'docs/proyecto1_v2.pdf',
        fecha_evento: '2026-11-11 10:00:00'
      },
      {
        id: 2,
        proyecto_id: 1,
        etapa: 'idea',
        estado_anterior: 'en_revision_lider',
        estado_nuevo: 'en_revision_investigadores',
        actor_id: 1,
        actor_nombre: 'Dra. Paula Cheng',
        actor_rol: 'lider_grupo',
        tipo_evento: 'devolucion_lider',
        observaciones: 'Se realizó reunión el 06/11 y se envió correo solicitando ajustar los objetivos específicos.',
        version_documento: 1,
        archivo_pdf_url: 'docs/proyecto1_v1.pdf',
        fecha_evento: '2026-11-06 14:15:00'
      },
      {
        id: 1,
        proyecto_id: 1,
        etapa: 'idea',
        estado_anterior: null,
        estado_nuevo: 'en_revision_lider',
        actor_id: 2,
        actor_nombre: 'Ing. Francisco Vargas',
        actor_rol: 'docente',
        tipo_evento: 'radicacion_inicial',
        observaciones: 'Radicación inicial de la idea en formato institucional.',
        version_documento: 1,
        archivo_pdf_url: 'docs/proyecto1_v1.pdf',
        fecha_evento: '2026-11-03 09:30:00'
      }
    ],
    evaluaciones_pares: []
  }
];
