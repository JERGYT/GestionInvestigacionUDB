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
    resumen: 'Propuesta docente para gestionar la trazabilidad histórica y el flujo de estados de proyectos de investigación en la FIAD.',
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
        observaciones: 'Se remitió por correo institucional el documento con los objetivos específicos ajustados según indicaciones de la líder.',
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
        observaciones: 'Se realizó reunión el 06/11 y se envió correo solicitando delimitar los objetivos específicos y el cronograma.',
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
        observaciones: 'Radicación inicial de la idea de investigación docente remitida por correo institucional.',
        fecha_evento: '2026-11-03 09:30:00'
      }
    ],
    evaluaciones_pares: []
  },
  {
    id: 2,
    titulo: 'Optimización Energética mediante Modelos Predictivos',
    resumen: 'Investigación docente enfocada en el análisis predictivo de consumo energético en edificaciones universitarias.',
    linea_id: 2,
    linea_investigacion: 'Energías Renovables y Eficiencia Energética',
    sublinea_id: 3,
    sublinea: 'Modelado Predictivo en Redes Eléctricas',
    investigador_principal_id: 3,
    investigador_principal: 'Ing. Martha Celene',
    etapa_actual: 'anteproyecto',
    estado_actual: 'en_evaluacion_pares',
    rondas_revision: 1,
    fecha_radicacion: '2026-10-15',
    fecha_asignacion_pares: '2026-10-28',
    equipo: [
      { id: 3, usuario_id: 3, nombre: 'Ing. Martha Celene', email: 'mcelene@uniboyaca.edu.co', programa: 'Ingeniería de Sistemas', rol_equipo: 'principal', activo: true, fecha_vinculacion: '2026-10-15', fecha_retiro: null },
      { id: 4, usuario_id: 2, nombre: 'Ing. Francisco Vargas', email: 'fvargas@uniboyaca.edu.co', programa: 'Ingeniería de Sistemas', rol_equipo: 'coinvestigador', activo: true, fecha_vinculacion: '2026-10-15', fecha_retiro: null }
    ],
    trazabilidad: [
      {
        id: 6,
        proyecto_id: 2,
        etapa: 'anteproyecto',
        estado_anterior: 'en_revision_comite',
        estado_nuevo: 'en_evaluacion_pares',
        actor_id: 4,
        actor_nombre: 'Comité de Investigaciones FIAD',
        actor_rol: 'comite',
        tipo_evento: 'asignacion_pares',
        observaciones: 'El Comité FIAD asignó pares evaluadores (Dr. Carlos Mendoza y Dra. Laura Gómez) con fecha 2026-10-28.',
        fecha_evento: '2026-10-28 11:20:00'
      },
      {
        id: 5,
        proyecto_id: 2,
        etapa: 'anteproyecto',
        estado_anterior: 'en_revision_lider',
        estado_nuevo: 'en_revision_comite',
        actor_id: 1,
        actor_nombre: 'Dra. Paula Cheng',
        actor_rol: 'lider_grupo',
        tipo_evento: 'aval_lider',
        observaciones: 'La Líder de Grupo otorga aval al anteproyecto y lo remite al Comité FIAD.',
        fecha_evento: '2026-10-22 16:00:00'
      }
    ],
    evaluaciones_pares: [
      {
        id: 1,
        proyecto_id: 2,
        par_usuario_id: 5,
        par_nombre: 'Dr. Carlos Mendoza (Par 1)',
        par_email: 'cmendoza@uniboyaca.edu.co',
        par_programa: 'Ingeniería de Sistemas',
        etapa_evaluada: 'anteproyecto',
        ronda: 1,
        fecha_asignacion: '2026-10-28',
        fecha_concepto: '2026-11-04',
        veredicto: 'aprobado',
        concepto_observaciones: 'El diseño metodológico y el modelo matemático son sólidos.'
      },
      {
        id: 2,
        proyecto_id: 2,
        par_usuario_id: 6,
        par_nombre: 'Dra. Laura Gómez (Par 2)',
        par_email: 'lgomez@uniboyaca.edu.co',
        par_programa: 'Ingeniería Electrónica',
        etapa_evaluada: 'anteproyecto',
        ronda: 1,
        fecha_asignacion: '2026-10-28',
        fecha_concepto: null,
        veredicto: 'pendiente',
        concepto_observaciones: null
      }
    ]
  },
  {
    id: 3,
    titulo: 'Red de Sensores IoT para Calidad del Aire en Tunja',
    resumen: 'Despliegue y validación de nodos IoT de bajo costo para monitoreo ambiental en el campus universitario.',
    linea_id: 3,
    linea_investigacion: 'Telecomunicaciones y Redes de Nueva Generación',
    sublinea_id: 4,
    sublinea: 'Internet de las Cosas (IoT) y Sistemas Embebidos',
    investigador_principal_id: 1,
    investigador_principal: 'Dra. Paula Cheng',
    etapa_actual: 'desarrollo',
    estado_actual: 'novedad_cipade',
    rondas_revision: 3,
    fecha_radicacion: '2026-08-10',
    fecha_asignacion_pares: '2026-09-01',
    equipo: [
      { id: 5, usuario_id: 1, nombre: 'Dra. Paula Cheng', email: 'pcheng@uniboyaca.edu.co', programa: 'Ingeniería de Sistemas', rol_equipo: 'principal', activo: true, fecha_vinculacion: '2026-08-10', fecha_retiro: null },
      { id: 6, usuario_id: 2, nombre: 'Ing. Francisco Vargas', email: 'fvargas@uniboyaca.edu.co', programa: 'Ingeniería de Sistemas', rol_equipo: 'coinvestigador', activo: true, fecha_vinculacion: '2026-08-10', fecha_retiro: null }
    ],
    trazabilidad: [
      {
        id: 9,
        proyecto_id: 3,
        etapa: 'desarrollo',
        estado_anterior: 'en_desarrollo',
        estado_nuevo: 'novedad_cipade',
        actor_id: 1,
        actor_nombre: 'Dra. Paula Cheng',
        actor_rol: 'lider_grupo',
        tipo_evento: 'novedad_cipade',
        observaciones: 'CIPADE solicita actualización de cronograma de compras y prórroga de 2 meses. Pasa directo a los investigadores.',
        fecha_evento: '2026-11-05 09:15:00'
      },
      {
        id: 8,
        proyecto_id: 3,
        etapa: 'desarrollo',
        estado_anterior: 'aprobado_facultad',
        estado_nuevo: 'en_desarrollo',
        actor_id: 4,
        actor_nombre: 'Comité de Investigaciones FIAD',
        actor_rol: 'comite',
        tipo_evento: 'inicio_desarrollo',
        observaciones: 'Inicia formalmente la ejecución del proyecto docente tras aprobación de facultad.',
        fecha_evento: '2026-09-25 15:00:00'
      }
    ],
    evaluaciones_pares: []
  }
];
