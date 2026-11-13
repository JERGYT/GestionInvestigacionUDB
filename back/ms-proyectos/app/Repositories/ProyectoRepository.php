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

    public function asegurarArchivoPdf(string $relativePath, string $titulo, int $version, string $detalle = ''): void {
        $publicDir = dirname(__DIR__, 2) . '/public';
        $fullPath = $publicDir . '/' . ltrim($relativePath, '/');
        $dir = dirname($fullPath);

        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        if (file_exists($fullPath) && filesize($fullPath) > 0) {
            return;
        }

        $safeTitulo = preg_replace('/[^A-Za-z0-9 \-_:.,]/', '', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $titulo) ?: $titulo);
        $safeDetalle = preg_replace('/[^A-Za-z0-9 \-_:.,]/', '', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $detalle) ?: $detalle);
        $fecha = date('Y-m-d H:i:s');

        $lines = [
            "UNIVERSIDAD DE BOYACA - FACULTAD DE INGENIERIA (FIAD)",
            "Sistema de Gestion y Trazabilidad de Proyectos Docentes",
            "--------------------------------------------------------",
            "Proyecto: " . substr($safeTitulo, 0, 75),
            "Version del Documento: v" . $version,
            "Fecha de Generacion: " . $fecha,
            "Detalle: " . substr($safeDetalle, 0, 85),
            "Archivo Oficial: " . $relativePath
        ];

        $streamContent = "BT\n/F1 12 Tf\n50 750 Td\n18 TL\n";
        foreach ($lines as $line) {
            $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);
            $streamContent .= "(" . $escaped . ") Tj T*\n";
        }
        $streamContent .= "ET";
        $len = strlen($streamContent);

        $pdf = "%PDF-1.4\n"
            . "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
            . "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
            . "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
            . "4 0 obj << /Length {$len} >> stream\n{$streamContent}\nendstream endobj\n"
            . "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
            . "xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000229 00000 n \n0000000" . (280 + $len) . " 00000 n \n"
            . "trailer << /Size 6 /Root 1 0 R >>\nstartxref\n" . (350 + $len) . "\n%%EOF";

        file_put_contents($fullPath, $pdf);
    }

    public function crear(array $datos, ?array $archivoSubido = null) {
        return DB::transaction(function () use ($datos, $archivoSubido) {
            $principalId = (int)($datos['investigador_principal_id'] ?? 2);
            $lineaId = (int)($datos['linea_id'] ?? 1);
            $sublineaId = (int)($datos['sublinea_id'] ?? 1);
            $etapa = $datos['etapa_actual'] ?? 'idea';
            $fechaHoy = date('Y-m-d');

            $proyecto = Proyecto::create([
                'titulo'                    => trim($datos['titulo']),
                'resumen'                   => trim($datos['resumen'] ?? ''),
                'linea_id'                  => $lineaId,
                'sublinea_id'               => $sublineaId,
                'investigador_principal_id' => $principalId,
                'etapa_actual'              => $etapa,
                'estado_actual'             => 'en_revision_lider',
                'rondas_revision'           => 0,
                'fecha_radicacion'          => $fechaHoy,
                'fecha_asignacion_pares'    => null,
                'documento_actual_url'      => null,
                'version_documento'         => 1
            ]);

            $docUrl = "docs/proyecto{$proyecto->id}_v1.pdf";
            if ($archivoSubido && isset($archivoSubido['tmp_name']) && is_uploaded_file($archivoSubido['tmp_name'])) {
                $publicDir = dirname(__DIR__, 2) . '/public/docs';
                if (!is_dir($publicDir)) {
                    mkdir($publicDir, 0777, true);
                }
                move_uploaded_file($archivoSubido['tmp_name'], $publicDir . "/proyecto{$proyecto->id}_v1.pdf");
            } else {
                $this->asegurarArchivoPdf($docUrl, $proyecto->titulo, 1, 'Radicacion inicial de proyecto docente');
            }

            $proyecto->documento_actual_url = $docUrl;
            $proyecto->save();

            ProyectoInvestigador::create([
                'proyecto_id'       => $proyecto->id,
                'usuario_id'        => $principalId,
                'rol_equipo'        => 'principal',
                'activo'            => 1,
                'fecha_vinculacion' => $fechaHoy
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
                            'fecha_vinculacion' => $fechaHoy
                        ]);
                    }
                }
            }

            HistorialTrazabilidad::create([
                'proyecto_id'       => $proyecto->id,
                'etapa'             => $etapa,
                'estado_anterior'   => null,
                'estado_nuevo'      => 'en_revision_lider',
                'actor_id'          => $principalId,
                'tipo_evento'       => 'radicacion_inicial',
                'observaciones'     => trim($datos['observaciones'] ?? 'Radicación inicial de propuesta docente en formato institucional para revisión del Líder de Grupo.'),
                'version_documento' => 1,
                'archivo_pdf_url'   => $docUrl,
                'fecha_evento'      => date('Y-m-d H:i:s')
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
            $fechaAhora = date('Y-m-d H:i:s');

            switch ($accion) {
                case 'devolucion_lider':
                case 'devolver_lider':
                    $actorId = (int)($datos['actor_id'] ?? 1);
                    $tipoEvento = 'devolucion_lider';
                    $proyecto->estado_actual = 'en_revision_investigadores';
                    $proyecto->rondas_revision = (int)$proyecto->rondas_revision + 1;
                    if ($observaciones === '') {
                        $observaciones = 'El Líder de Grupo devuelve el proyecto con observaciones para subsanación por parte de los investigadores.';
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
                    $fechaAsignacion = !empty($datos['fecha_asignacion']) ? $datos['fecha_asignacion'] : date('Y-m-d');
                    $proyecto->estado_actual = 'en_evaluacion_pares';
                    $proyecto->fecha_asignacion_pares = $fechaAsignacion;

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
                            $observaciones = "El Comité FIAD asignó pares evaluadores ({$listaNombres}) en fecha {$fechaAsignacion} (Ronda {$nuevaRonda}).";
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
                    $proyecto->estado_actual = 'aprobado_facultad';
                    if (!empty($datos['nueva_etapa']) && in_array($datos['nueva_etapa'], ['idea', 'anteproyecto', 'proyecto', 'desarrollo', 'informe_final'], true)) {
                        $proyecto->etapa_actual = $datos['nueva_etapa'];
                    }
                    if ($observaciones === '') {
                        $observaciones = 'El Comité de Investigación aprueba formalmente el proyecto a nivel de Facultad.';
                    }
                    break;

                case 'inicio_desarrollo':
                case 'iniciar_desarrollo':
                    $actorId = (int)($datos['actor_id'] ?? 4);
                    $tipoEvento = 'inicio_desarrollo';
                    $proyecto->etapa_actual = 'desarrollo';
                    $proyecto->estado_actual = 'en_desarrollo';
                    if ($observaciones === '') {
                        $observaciones = 'El proyecto inicia formalmente su fase de Desarrollo y ejecución presupuestal/académica.';
                    }
                    break;

                case 'novedad_cipade':
                    $actorId = (int)($datos['actor_id'] ?? 1);
                    $tipoEvento = 'novedad_cipade';
                    $proyecto->etapa_actual = 'desarrollo';
                    $proyecto->estado_actual = 'novedad_cipade';
                    $proyecto->rondas_revision = (int)$proyecto->rondas_revision + 1;
                    if ($observaciones === '') {
                        $observaciones = 'Se registra Novedad de CIPADE. El proyecto se devuelve directamente a los investigadores docentes para subsanación sin pasar por el Comité.';
                    }
                    break;

                case 'cambio_equipo':
                    $actorId = (int)($datos['actor_id'] ?? $proyecto->investigador_principal_id);
                    $tipoEvento = 'cambio_equipo';
                    if (!empty($datos['nuevo_usuario_id'])) {
                        $nuevoId = (int)$datos['nuevo_usuario_id'];
                        ProyectoInvestigador::updateOrCreate(
                            ['proyecto_id' => $proyecto->id, 'usuario_id' => $nuevoId],
                            [
                                'rol_equipo'        => $datos['rol_equipo'] ?? 'coinvestigador',
                                'activo'            => 1,
                                'fecha_vinculacion' => date('Y-m-d'),
                                'fecha_retiro'      => null
                            ]
                        );
                    }
                    if (!empty($datos['retirar_usuario_id'])) {
                        ProyectoInvestigador::where('proyecto_id', $proyecto->id)
                            ->where('usuario_id', (int)$datos['retirar_usuario_id'])
                            ->update([
                                'activo'       => 0,
                                'fecha_retiro' => date('Y-m-d')
                            ]);
                    }
                    if ($observaciones === '') {
                        $observaciones = 'Actualización en la conformación del equipo de investigadores docentes.';
                    }
                    break;

                default:
                    throw new \InvalidArgumentException("Acción de transición no reconocida: {$accion}");
            }

            $proyecto->save();

            HistorialTrazabilidad::create([
                'proyecto_id'       => $proyecto->id,
                'etapa'             => $proyecto->etapa_actual,
                'estado_anterior'   => $estadoAnterior,
                'estado_nuevo'      => $proyecto->estado_actual,
                'actor_id'          => $actorId,
                'tipo_evento'       => $tipoEvento,
                'observaciones'     => $observaciones,
                'version_documento' => $proyecto->version_documento,
                'archivo_pdf_url'   => $proyecto->documento_actual_url,
                'fecha_evento'      => $fechaAhora
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
            $fechaConcepto = !empty($datos['fecha_concepto']) ? $datos['fecha_concepto'] : date('Y-m-d');
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
                    'fecha_asignacion'       => $proyecto->fecha_asignacion_pares ?? date('Y-m-d'),
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
                'proyecto_id'       => $proyecto->id,
                'etapa'             => $proyecto->etapa_actual,
                'estado_anterior'   => $estadoAnterior,
                'estado_nuevo'      => $proyecto->estado_actual,
                'actor_id'          => $parUsuarioId,
                'tipo_evento'       => 'concepto_par',
                'observaciones'     => $textoTraza,
                'version_documento' => $proyecto->version_documento,
                'archivo_pdf_url'   => $proyecto->documento_actual_url,
                'fecha_evento'      => date('Y-m-d H:i:s')
            ]);

            return $this->obtenerPorId($proyecto->id);
        });
    }

    public function subsanar(int $id, array $datos, ?array $archivoSubido = null) {
        return DB::transaction(function () use ($id, $datos, $archivoSubido) {
            $proyecto = Proyecto::findOrFail($id);
            $estadoAnterior = $proyecto->estado_actual;
            $versionAnterior = (int)$proyecto->version_documento;
            $urlAnterior = $proyecto->documento_actual_url ?: "docs/proyecto{$proyecto->id}_v{$versionAnterior}.pdf";

            $existeVersionAnterior = HistorialTrazabilidad::where('proyecto_id', $proyecto->id)
                ->where('version_documento', $versionAnterior)
                ->exists();

            if (!$existeVersionAnterior) {
                $this->asegurarArchivoPdf($urlAnterior, $proyecto->titulo, $versionAnterior, 'Version previa archivada');
                HistorialTrazabilidad::create([
                    'proyecto_id'       => $proyecto->id,
                    'etapa'             => $proyecto->etapa_actual,
                    'estado_anterior'   => $estadoAnterior,
                    'estado_nuevo'      => $estadoAnterior,
                    'actor_id'          => (int)$proyecto->investigador_principal_id,
                    'tipo_evento'       => 'radicacion_inicial',
                    'observaciones'     => "Respaldo histórico de versión v{$versionAnterior} previo a subsanación.",
                    'version_documento' => $versionAnterior,
                    'archivo_pdf_url'   => $urlAnterior,
                    'fecha_evento'      => date('Y-m-d H:i:s', time() - 60)
                ]);
            }

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

            $nuevaVersion = $versionAnterior + 1;
            $nuevoPdfUrl = "docs/proyecto{$proyecto->id}_v{$nuevaVersion}.pdf";

            if ($archivoSubido && isset($archivoSubido['tmp_name']) && is_uploaded_file($archivoSubido['tmp_name'])) {
                $publicDir = dirname(__DIR__, 2) . '/public/docs';
                if (!is_dir($publicDir)) {
                    mkdir($publicDir, 0777, true);
                }
                move_uploaded_file($archivoSubido['tmp_name'], $publicDir . "/proyecto{$proyecto->id}_v{$nuevaVersion}.pdf");
            } else {
                $this->asegurarArchivoPdf(
                    $nuevoPdfUrl,
                    $proyecto->titulo,
                    $nuevaVersion,
                    $datos['observaciones'] ?? "Subsanacion version v{$nuevaVersion}"
                );
            }

            $proyecto->version_documento = $nuevaVersion;
            $proyecto->documento_actual_url = $nuevoPdfUrl;

            if ($estadoAnterior === 'novedad_cipade' || $proyecto->etapa_actual === 'desarrollo') {
                $estadoNuevo = 'en_desarrollo';
            } else {
                $estadoNuevo = !empty($datos['estado_nuevo']) ? $datos['estado_nuevo'] : 'en_revision_lider';
            }

            $proyecto->estado_actual = $estadoNuevo;
            $proyecto->save();

            $actorId = (int)($datos['actor_id'] ?? $proyecto->investigador_principal_id);
            $observaciones = trim($datos['observaciones'] ?? '');
            if ($observaciones === '') {
                $observaciones = "Se cargó nueva versión v{$nuevaVersion} con ajustes aplicados (versión previa v{$versionAnterior} conservada en historial: {$urlAnterior}).";
            }

            HistorialTrazabilidad::create([
                'proyecto_id'       => $proyecto->id,
                'etapa'             => $proyecto->etapa_actual,
                'estado_anterior'   => $estadoAnterior,
                'estado_nuevo'      => $estadoNuevo,
                'actor_id'          => $actorId,
                'tipo_evento'       => 'subsanacion_investigador',
                'observaciones'     => $observaciones,
                'version_documento' => $nuevaVersion,
                'archivo_pdf_url'   => $nuevoPdfUrl,
                'fecha_evento'      => date('Y-m-d H:i:s')
            ]);

            return $this->obtenerPorId($proyecto->id);
        });
    }
}
