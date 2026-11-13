<?php
namespace App\Repositories;

use App\Models\Proyecto;
use App\Models\Usuario;
use App\Models\LineaInvestigacion;
use App\Models\SublineaInvestigacion;
use App\Models\ProyectoInvestigador;
use App\Models\HistorialTrazabilidad;
use App\Models\EvaluacionPar;
use Illuminate\Database\Capsule\Manager as DB;

class ProyectoRepository {

    private function relacionesProyecto(): array {
        return [
            'linea',
            'sublinea',
            'investigadorPrincipal',
            'equipo.usuario',
            'trazabilidad.actor',
            'evaluacionesPares.par'
        ];
    }

    private function normalizarFechaEvento(?string $fechaInput): string {
        if (!$fechaInput || trim($fechaInput) === '') {
            return date('Y-m-d H:i:s');
        }
        $limpia = str_replace('T', ' ', trim($fechaInput));
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $limpia)) {
            return $limpia . ' ' . date('H:i:s');
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $limpia)) {
            return $limpia . ':00';
        }
        return $limpia;
    }

    public function obtenerCatalogos(): array {
        return [
            'lineas'    => LineaInvestigacion::with('sublineas')->where('activa', 1)->orderBy('id')->get(),
            'sublineas' => SublineaInvestigacion::where('activa', 1)->orderBy('id')->get(),
            'docentes'  => Usuario::whereIn('rol', ['docente', 'lider_grupo'])->orderBy('nombre')->get(),
            'pares'     => Usuario::where('rol', 'par_evaluador')->orderBy('nombre')->get(),
            'usuarios'  => Usuario::orderBy('id')->get()
        ];
    }

    public function obtenerTodos($etapa = null, $estado = null) {
        $query = Proyecto::with($this->relacionesProyecto());

        if ($etapa && $etapa !== 'todas') {
            $query->where('etapa_actual', strtolower($etapa));
        }

        if ($estado && $estado !== 'todos') {
            $query->where('estado_actual', strtolower($estado));
        }

        return $query->orderBy('id', 'desc')->get();
    }

    public function obtenerPorId(int $id) {
        return Proyecto::with($this->relacionesProyecto())->findOrFail($id);
    }

    public function crear(array $datos) {
        return DB::transaction(function () use ($datos) {
            $principalId = (int)($datos['investigador_principal_id'] ?? 2);
            $lineaId = (int)($datos['linea_id'] ?? 1);
            $sublineaId = (int)($datos['sublinea_id'] ?? 1);
            $etapa = $datos['etapa_actual'] ?? 'idea';

            $fechaInput = $datos['fecha_radicacion'] ?? $datos['fecha_evento'] ?? null;
            $fechaRadicacion = $fechaInput ? substr(trim($fechaInput), 0, 10) : date('Y-m-d');
            $fechaEvento = $this->normalizarFechaEvento($datos['fecha_evento'] ?? $fechaRadicacion);

            $proyecto = Proyecto::create([
                'titulo'                    => trim($datos['titulo']),
                'resumen'                   => trim($datos['resumen'] ?? ''),
                'linea_id'                  => $lineaId,
                'sublinea_id'               => $sublineaId,
                'investigador_principal_id' => $principalId,
                'etapa_actual'              => $etapa,
                'estado_actual'             => 'en_revision_lider',
                'rondas_revision'           => 0,
                'fecha_radicacion'          => $fechaRadicacion,
                'fecha_asignacion_pares'    => null
            ]);

            
            ProyectoInvestigador::create([
                'proyecto_id'       => $proyecto->id,
                'usuario_id'        => $principalId,
                'rol_equipo'        => 'principal',
                'activo'            => 1,
                'fecha_vinculacion' => $fechaRadicacion
            ]);

            
            $coinvestigadores = $datos['coinvestigadores_ids'] ?? [];
            if (is_string($coinvestigadores)) {
                $decoded = json_decode($coinvestigadores, true);
                $coinvestigadores = is_array($decoded) ? $decoded : array_filter(explode(',', $coinvestigadores));
            }

            if (is_array($coinvestigadores)) {
                $unicos = array_unique(array_map('intval', $coinvestigadores));
                foreach ($unicos as $coId) {
                    if ($coId > 0 && $coId !== $principalId) {
                        ProyectoInvestigador::create([
                            'proyecto_id'       => $proyecto->id,
                            'usuario_id'        => $coId,
                            'rol_equipo'        => 'coinvestigador',
                            'activo'            => 1,
                            'fecha_vinculacion' => $fechaRadicacion
                        ]);
                    }
                }
            }

            
            HistorialTrazabilidad::create([
                'proyecto_id'     => $proyecto->id,
                'etapa'           => $etapa,
                'estado_anterior' => null,
                'estado_nuevo'    => 'en_revision_lider',
                'actor_id'        => $principalId,
                'tipo_evento'     => 'radicacion_inicial',
                'observaciones'   => trim($datos['observaciones'] ?? 'Radicación inicial de propuesta docente remitida por correo institucional para revisión del Líder de Grupo.'),
                'fecha_evento'    => $fechaEvento
            ]);

            return $this->obtenerPorId($proyecto->id);
        });
    }

    public function transicion(int $id, array $datos) {
        return DB::transaction(function () use ($id, $datos) {
            $proyecto = Proyecto::findOrFail($id);
            $accion = strtolower(trim($datos['accion'] ?? $datos['tipo_evento'] ?? ''));
            $estadoAnterior = $proyecto->estado_actual;
            $observaciones = trim($datos['observaciones'] ?? '');
            $fechaEvento = $this->normalizarFechaEvento($datos['fecha_evento'] ?? $datos['fecha_movimiento'] ?? null);
            $fechaCorta = substr($fechaEvento, 0, 10);

            switch ($accion) {
                case 'devolucion_lider':
                case 'devolver_lider':
                    $actorId = (int)($datos['actor_id'] ?? 1);
                    $tipoEvento = 'devolucion_lider';
                    $proyecto->estado_actual = 'en_revision_investigadores';
                    $proyecto->rondas_revision = (int)$proyecto->rondas_revision + 1;
                    if ($observaciones === '') {
                        $observaciones = 'El Líder de Grupo devuelve el proyecto con observaciones enviadas por correo institucional.';
                    }
                    break;

                case 'aval_lider':
                    $actorId = (int)($datos['actor_id'] ?? 1);
                    $tipoEvento = 'aval_lider';
                    $proyecto->estado_actual = 'en_revision_comite';
                    if ($observaciones === '') {
                        $observaciones = 'El Líder de Grupo otorga aval académico y remite la propuesta al Comité de Investigación FIAD.';
                    }
                    break;

                case 'asignacion_pares':
                case 'asignar_pares':
                    $actorId = (int)($datos['actor_id'] ?? 4);
                    $tipoEvento = 'asignacion_pares';
                    $fechaAsignacion = !empty($datos['fecha_asignacion'])
                        ? substr(trim($datos['fecha_asignacion']), 0, 10)
                        : $fechaCorta;
                    $proyecto->estado_actual = 'en_evaluacion_pares';
                    $proyecto->fecha_asignacion_pares = $fechaAsignacion;
                    $fechaEvento = $this->normalizarFechaEvento($datos['fecha_evento'] ?? $fechaAsignacion);

                    $paresIds = $datos['pares_ids'] ?? [5, 6];
                    if (is_array($paresIds) && count($paresIds) > 0) {
                        $maxRonda = (int)EvaluacionPar::where('proyecto_id', $proyecto->id)->max('ronda');
                        $nuevaRonda = $maxRonda + 1;
                        $etapaEval = in_array($proyecto->etapa_actual, ['idea', 'anteproyecto', 'proyecto'], true)
                            ? $proyecto->etapa_actual
                            : 'proyecto';

                        $nombresPares = [];
                        foreach (array_unique(array_map('intval', $paresIds)) as $parId) {
                            if ($parId <= 0) continue;
                            EvaluacionPar::create([
                                'proyecto_id'            => $proyecto->id,
                                'par_usuario_id'         => $parId,
                                'etapa_evaluada'         => $etapaEval,
                                'ronda'                  => $nuevaRonda,
                                'fecha_asignacion'       => $fechaAsignacion,
                                'fecha_concepto'         => null,
                                'veredicto'              => 'pendiente',
                                'concepto_observaciones' => null
                            ]);
                            $parUser = Usuario::find($parId);
                            if ($parUser) {
                                $nombresPares[] = $parUser->nombre;
                            }
                        }

                        if ($observaciones === '') {
                            $listaNombres = count($nombresPares) > 0 ? implode(', ', $nombresPares) : 'Pares Evaluadores';
                            $observaciones = "El Comité FIAD asignó pares evaluadores ({$listaNombres}) con fecha {$fechaAsignacion} (Ronda {$nuevaRonda}).";
                        }
                    } else {
                        if ($observaciones === '') {
                            $observaciones = "Asignación de pares evaluadores registrada con fecha {$fechaAsignacion}.";
                        }
                    }
                    break;

                case 'aprobacion_facultad':
                case 'aprobar_facultad':
                    $actorId = (int)($datos['actor_id'] ?? 4);
                    $tipoEvento = 'aprobacion_facultad';
                    $etapaPrevia = $proyecto->etapa_actual;

                    if ($etapaPrevia === 'idea') {
                        $proyecto->etapa_actual = 'anteproyecto';
                        $proyecto->estado_actual = 'en_revision_lider';
                        $msgDefault = 'El Comité FIAD aprueba la etapa de Idea. El proyecto avanza a etapa de Anteproyecto y pasa a revisión del Líder de Grupo.';
                    } elseif ($etapaPrevia === 'anteproyecto') {
                        $proyecto->etapa_actual = 'proyecto';
                        $proyecto->estado_actual = 'en_revision_lider';
                        $msgDefault = 'El Comité FIAD aprueba el Anteproyecto. El proyecto avanza a etapa de Proyecto y pasa a revisión del Líder de Grupo.';
                    } elseif ($etapaPrevia === 'proyecto') {
                        $proyecto->etapa_actual = 'desarrollo';
                        $proyecto->estado_actual = 'en_desarrollo';
                        $msgDefault = 'El Comité FIAD aprueba el Proyecto a nivel de Facultad e inicia formalmente la etapa de Desarrollo.';
                    } elseif ($etapaPrevia === 'desarrollo') {
                        $proyecto->etapa_actual = 'informe_final';
                        $proyecto->estado_actual = 'aprobado_facultad';
                        $msgDefault = 'El Comité FIAD aprueba el cierre de la etapa de Desarrollo. El proyecto pasa a Informe Final con estado Aprobado a nivel de Facultad.';
                    } else {
                        $proyecto->estado_actual = 'aprobado_facultad';
                        $msgDefault = 'El Comité de Investigación aprueba formalmente el Informe Final a nivel de Facultad.';
                    }

                    if ($observaciones === '') {
                        $observaciones = $msgDefault;
                    }
                    break;

                case 'en_standby':
                case 'standby':
                    $actorId = (int)($datos['actor_id'] ?? 4);
                    $tipoEvento = 'standby';
                    $proyecto->estado_actual = 'en_standby';
                    if ($observaciones === '') {
                        $observaciones = 'El proceso se coloca en espera (Standby) por periodo vacacional de pares evaluadores (diciembre/febrero).';
                    }
                    break;

                case 'reactivar_standby':
                    $actorId = (int)($datos['actor_id'] ?? 4);
                    $tipoEvento = 'standby';
                    $destinoDefault = $proyecto->fecha_asignacion_pares ? 'en_evaluacion_pares' : 'en_revision_comite';
                    $estadoDestino = !empty($datos['estado_destino']) ? trim($datos['estado_destino']) : $destinoDefault;
                    if (!in_array($estadoDestino, ['en_revision_lider', 'en_revision_comite', 'en_evaluacion_pares', 'en_desarrollo'], true)) {
                        $estadoDestino = $destinoDefault;
                    }
                    $proyecto->estado_actual = $estadoDestino;
                    if ($observaciones === '') {
                        $observaciones = 'Se reactiva el proceso tras finalizar el periodo de espera (Standby).';
                    }
                    break;

                case 'inicio_desarrollo':
                case 'iniciar_desarrollo':
                    $actorId = (int)($datos['actor_id'] ?? 4);
                    $tipoEvento = 'inicio_desarrollo';
                    $proyecto->etapa_actual = 'desarrollo';
                    $proyecto->estado_actual = 'en_desarrollo';
                    if ($observaciones === '') {
                        $observaciones = 'El proyecto inicia formalmente su etapa de Desarrollo según acta de facultad.';
                    }
                    break;

                case 'novedad_cipade':
                    $actorId = (int)($datos['actor_id'] ?? 1);
                    $tipoEvento = 'novedad_cipade';
                    $proyecto->etapa_actual = 'desarrollo';
                    $proyecto->estado_actual = 'novedad_cipade';
                    $proyecto->rondas_revision = (int)$proyecto->rondas_revision + 1;
                    if ($observaciones === '') {
                        $observaciones = 'Se registra Novedad de CIPADE. El proyecto se devuelve directamente a los investigadores docentes sin pasar por el Comité.';
                    }
                    break;

                case 'cambio_equipo':
                    $actorId = (int)($datos['actor_id'] ?? $proyecto->investigador_principal_id);
                    $tipoEvento = 'cambio_equipo';
                    $fechaCambio = !empty($datos['fecha_cambio'])
                        ? substr(trim($datos['fecha_cambio']), 0, 10)
                        : $fechaCorta;
                    $detalleAutomatico = '';

                    if (!empty($datos['nuevo_usuario_id'])) {
                        $nuevoId = (int)$datos['nuevo_usuario_id'];
                        $rolEquipo = in_array($datos['rol_equipo'] ?? '', ['coinvestigador', 'codirector'], true)
                            ? $datos['rol_equipo']
                            : 'coinvestigador';
                        $docente = Usuario::findOrFail($nuevoId);

                        ProyectoInvestigador::updateOrCreate(
                            ['proyecto_id' => $proyecto->id, 'usuario_id' => $nuevoId],
                            [
                                'rol_equipo'        => $rolEquipo,
                                'activo'            => 1,
                                'fecha_vinculacion' => $fechaCambio,
                                'fecha_retiro'      => null
                            ]
                        );
                        $detalleAutomatico = "Se vincula a {$docente->nombre} como {$rolEquipo} a partir del {$fechaCambio}.";
                    }

                    if (!empty($datos['retirar_usuario_id'])) {
                        $retirarId = (int)$datos['retirar_usuario_id'];
                        $docenteRetirado = Usuario::find($retirarId);
                        ProyectoInvestigador::where('proyecto_id', $proyecto->id)
                            ->where('usuario_id', $retirarId)
                            ->update([
                                'activo'       => 0,
                                'fecha_retiro' => $fechaCambio
                            ]);
                        $nombreRetirado = $docenteRetirado ? $docenteRetirado->nombre : "Docente #{$retirarId}";
                        $detalleAutomatico = "Se registra el retiro del co-investigador {$nombreRetirado} con fecha {$fechaCambio}.";
                    }

                    if ($observaciones !== '' && $detalleAutomatico !== '') {
                        $observaciones = $detalleAutomatico . ' Motivo/Soporte: ' . $observaciones;
                    } elseif ($observaciones === '') {
                        $observaciones = $detalleAutomatico ?: 'Actualización en la conformación del equipo de investigadores docentes.';
                    }
                    break;

                default:
                    throw new \InvalidArgumentException("Acción de transición no reconocida: {$accion}");
            }

            $proyecto->save();

            HistorialTrazabilidad::create([
                'proyecto_id'     => $proyecto->id,
                'etapa'           => $proyecto->etapa_actual,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo'    => $proyecto->estado_actual,
                'actor_id'        => $actorId,
                'tipo_evento'     => $tipoEvento,
                'observaciones'   => $observaciones,
                'fecha_evento'    => $fechaEvento
            ]);

            return $this->obtenerPorId($proyecto->id);
        });
    }

    public function registrarConceptoPar(int $id, array $datos) {
        return DB::transaction(function () use ($id, $datos) {
            $proyecto = Proyecto::findOrFail($id);
            $veredicto = strtolower(trim($datos['veredicto'] ?? ''));

            if (!in_array($veredicto, ['aprobado', 'con_correcciones'], true)) {
                throw new \InvalidArgumentException("El veredicto del par debe ser 'aprobado' o 'con_correcciones'.");
            }

            $parUsuarioId = (int)($datos['par_usuario_id'] ?? 5);
            $fechaConcepto = !empty($datos['fecha_concepto'])
                ? substr(trim($datos['fecha_concepto']), 0, 10)
                : (!empty($datos['fecha_evento']) ? substr(trim($datos['fecha_evento']), 0, 10) : date('Y-m-d'));
            $fechaEvento = $this->normalizarFechaEvento($datos['fecha_evento'] ?? $fechaConcepto);
            $observaciones = trim($datos['concepto_observaciones'] ?? $datos['observaciones'] ?? '');

            $evaluacion = null;
            if (!empty($datos['evaluacion_id'])) {
                $evaluacion = EvaluacionPar::where('proyecto_id', $proyecto->id)
                    ->where('id', (int)$datos['evaluacion_id'])
                    ->first();
            }

            if (!$evaluacion) {
                $evaluacion = EvaluacionPar::where('proyecto_id', $proyecto->id)
                    ->where('par_usuario_id', $parUsuarioId)
                    ->orderBy('ronda', 'desc')
                    ->orderBy('id', 'desc')
                    ->first();
            }

            if (!$evaluacion) {
                $maxRonda = (int)EvaluacionPar::where('proyecto_id', $proyecto->id)->max('ronda');
                $etapaEval = in_array($proyecto->etapa_actual, ['idea', 'anteproyecto', 'proyecto'], true)
                    ? $proyecto->etapa_actual
                    : 'proyecto';
                $evaluacion = EvaluacionPar::create([
                    'proyecto_id'            => $proyecto->id,
                    'par_usuario_id'         => $parUsuarioId,
                    'etapa_evaluada'         => $etapaEval,
                    'ronda'                  => $maxRonda > 0 ? $maxRonda : 1,
                    'fecha_asignacion'       => $proyecto->fecha_asignacion_pares ?? $fechaConcepto,
                    'fecha_concepto'         => $fechaConcepto,
                    'veredicto'              => $veredicto,
                    'concepto_observaciones' => $observaciones
                ]);
            } else {
                $parUsuarioId = (int)$evaluacion->par_usuario_id;
                $evaluacion->veredicto = $veredicto;
                $evaluacion->fecha_concepto = $fechaConcepto;
                $evaluacion->concepto_observaciones = $observaciones;
                $evaluacion->save();
            }

            $parUser = Usuario::find($parUsuarioId);
            $parNombre = $parUser ? $parUser->nombre : "Par #{$parUsuarioId}";

            $estadoAnterior = $proyecto->estado_actual;

            
            $hayCorreccionesEnRonda = EvaluacionPar::where('proyecto_id', $proyecto->id)
                ->where('ronda', $evaluacion->ronda)
                ->where('veredicto', 'con_correcciones')
                ->exists();

            if ($veredicto === 'con_correcciones' || $hayCorreccionesEnRonda) {
                if ($proyecto->estado_actual !== 'en_revision_investigadores') {
                    $proyecto->estado_actual = 'en_revision_investigadores';
                    $proyecto->rondas_revision = (int)$proyecto->rondas_revision + 1;
                    $proyecto->save();
                }
                $textoTraza = "Concepto de {$parNombre} (CON CORRECCIONES): " . ($observaciones ?: 'Se solicitan ajustes metodológicos.') . " — Al existir concepto con correcciones, el proyecto se devuelve a los investigadores.";
            } else {
                $textoTraza = "Concepto de {$parNombre} (APROBADO): " . ($observaciones ?: 'Cumple con los criterios de calidad académica.');
            }

            HistorialTrazabilidad::create([
                'proyecto_id'     => $proyecto->id,
                'etapa'           => $proyecto->etapa_actual,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo'    => $proyecto->estado_actual,
                'actor_id'        => $parUsuarioId,
                'tipo_evento'     => 'concepto_par',
                'observaciones'   => $textoTraza,
                'fecha_evento'    => $fechaEvento
            ]);

            return $this->obtenerPorId($proyecto->id);
        });
    }

    public function subsanar(int $id, array $datos) {
        return DB::transaction(function () use ($id, $datos) {
            $proyecto = Proyecto::findOrFail($id);
            $estadoAnterior = $proyecto->estado_actual;
            $fechaEvento = $this->normalizarFechaEvento($datos['fecha_evento'] ?? $datos['fecha_movimiento'] ?? null);

            if (!empty($datos['titulo'])) {
                $proyecto->titulo = trim($datos['titulo']);
            }
            if (array_key_exists('resumen', $datos) && $datos['resumen'] !== null) {
                $proyecto->resumen = trim((string)$datos['resumen']);
            }
            if (!empty($datos['linea_id'])) {
                $proyecto->linea_id = (int)$datos['linea_id'];
            }
            if (!empty($datos['sublinea_id'])) {
                $proyecto->sublinea_id = (int)$datos['sublinea_id'];
            }

            
            if ($estadoAnterior === 'novedad_cipade') {
                $estadoNuevo = 'en_desarrollo';
                $obsDefault = 'Los investigadores subsanaron la Novedad de CIPADE. El proyecto retorna directamente a Desarrollo sin pasar nuevamente por Comité.';
            } else {
                $estadoNuevo = 'en_revision_lider';
                $obsDefault = 'Los investigadores subsanaron las observaciones y remitieron los soportes por correo institucional para revisión del Líder de Grupo.';
            }

            $proyecto->estado_actual = $estadoNuevo;
            $proyecto->save();

            $actorId = (int)($datos['actor_id'] ?? $proyecto->investigador_principal_id);
            $observaciones = trim($datos['observaciones'] ?? '');
            if ($observaciones === '') {
                $observaciones = $obsDefault;
            }

            HistorialTrazabilidad::create([
                'proyecto_id'     => $proyecto->id,
                'etapa'           => $proyecto->etapa_actual,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo'    => $estadoNuevo,
                'actor_id'        => $actorId,
                'tipo_evento'     => 'subsanacion_investigador',
                'observaciones'   => $observaciones,
                'fecha_evento'    => $fechaEvento
            ]);

            return $this->obtenerPorId($proyecto->id);
        });
    }
}
