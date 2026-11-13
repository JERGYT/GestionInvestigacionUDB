<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Repositories\ProyectoRepository;

class ProyectoController {
    private ProyectoRepository $repository;

    public function __construct() {
        $this->repository = new ProyectoRepository();
    }

    private function formatearProyecto($p): array {
        if ($p->documento_actual_url) {
            $this->repository->asegurarArchivoPdf(
                $p->documento_actual_url,
                $p->titulo,
                (int)$p->version_documento,
                'Documento vigente del proyecto'
            );
        }

        return [
            'id'                        => (int)$p->id,
            'titulo'                    => $p->titulo,
            'resumen'                   => $p->resumen ?? '',
            'linea_id'                  => (int)$p->linea_id,
            'linea_investigacion'       => $p->linea ? $p->linea->nombre : 'Sin línea',
            'sublinea_id'               => (int)$p->sublinea_id,
            'sublinea'                  => $p->sublinea ? $p->sublinea->nombre : 'Sin sublínea',
            'investigador_principal_id' => (int)$p->investigador_principal_id,
            'investigador_principal'    => $p->investigadorPrincipal ? $p->investigadorPrincipal->nombre : 'Sin asignar',
            'etapa_actual'              => $p->etapa_actual,
            'estado_actual'             => $p->estado_actual,
            'rondas_revision'           => (int)$p->rondas_revision,
            'fecha_radicacion'          => $p->fecha_radicacion,
            'fecha_asignacion_pares'    => $p->fecha_asignacion_pares,
            'documento_actual_url'      => $p->documento_actual_url,
            'version_documento'         => (int)$p->version_documento,
            'equipo'                    => $p->equipo->map(function ($m) {
                return [
                    'id'                => (int)$m->id,
                    'usuario_id'        => (int)$m->usuario_id,
                    'nombre'            => $m->usuario ? $m->usuario->nombre : 'Docente',
                    'email'             => $m->usuario ? $m->usuario->email : '',
                    'programa'          => $m->usuario ? $m->usuario->programa : '',
                    'rol_equipo'        => $m->rol_equipo,
                    'activo'            => (bool)$m->activo,
                    'fecha_vinculacion' => $m->fecha_vinculacion,
                    'fecha_retiro'      => $m->fecha_retiro
                ];
            })->values()->all(),
            'trazabilidad'              => $p->trazabilidad->map(function ($t) use ($p) {
                if ($t->archivo_pdf_url) {
                    $this->repository->asegurarArchivoPdf(
                        $t->archivo_pdf_url,
                        $p->titulo,
                        (int)($t->version_documento ?: 1),
                        $t->observaciones
                    );
                }
                return [
                    'id'                => (int)$t->id,
                    'proyecto_id'       => (int)$t->proyecto_id,
                    'etapa'             => $t->etapa,
                    'estado_anterior'   => $t->estado_anterior,
                    'estado_nuevo'      => $t->estado_nuevo,
                    'actor_id'          => (int)$t->actor_id,
                    'actor_nombre'      => $t->actor ? $t->actor->nombre : 'Sistema',
                    'actor_rol'         => $t->actor ? $t->actor->rol : 'docente',
                    'tipo_evento'       => $t->tipo_evento,
                    'observaciones'     => $t->observaciones,
                    'version_documento' => $t->version_documento !== null ? (int)$t->version_documento : null,
                    'archivo_pdf_url'   => $t->archivo_pdf_url,
                    'fecha_evento'      => $t->fecha_evento
                ];
            })->values()->all(),
            'evaluaciones_pares'        => $p->evaluacionesPares->map(function ($ev) {
                return [
                    'id'                     => (int)$ev->id,
                    'proyecto_id'            => (int)$ev->proyecto_id,
                    'par_usuario_id'         => (int)$ev->par_usuario_id,
                    'par_nombre'             => $ev->par ? $ev->par->nombre : 'Par Evaluador',
                    'par_email'              => $ev->par ? $ev->par->email : '',
                    'par_programa'           => $ev->par ? $ev->par->programa : '',
                    'etapa_evaluada'         => $ev->etapa_evaluada,
                    'ronda'                  => (int)$ev->ronda,
                    'fecha_asignacion'       => $ev->fecha_asignacion,
                    'fecha_concepto'         => $ev->fecha_concepto,
                    'veredicto'              => $ev->veredicto,
                    'concepto_observaciones' => $ev->concepto_observaciones
                ];
            })->values()->all()
        ];
    }

    private function extraerInput(Request $request): array {
        $parsed = $request->getParsedBody();
        if (is_array($parsed) && !empty($parsed)) {
            return $parsed;
        }
        $raw = (string)$request->getBody();
        if ($raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
        return $_POST ?: [];
    }

    private function jsonResponse(Response $response, $payload, int $status = 200): Response {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    public function catalogos(Request $request, Response $response): Response {
        try {
            $catalogos = $this->repository->obtenerCatalogos();
            return $this->jsonResponse($response, $catalogos, 200);
        } catch (\Throwable $e) {
            return $this->jsonResponse($response, ['error' => $e->getMessage()], 500);
        }
    }

    public function listar(Request $request, Response $response): Response {
        try {
            $params = $request->getQueryParams();
            $proyectos = $this->repository->obtenerTodos(
                $params['etapa'] ?? null,
                $params['estado'] ?? null
            );

            $resultado = $proyectos->map(fn($p) => $this->formatearProyecto($p))->values()->all();
            return $this->jsonResponse($response, $resultado, 200);
        } catch (\Throwable $e) {
            return $this->jsonResponse($response, ['error' => $e->getMessage()], 500);
        }
    }

    public function radicar(Request $request, Response $response): Response {
        $input = $this->extraerInput($request);

        if (empty($input['titulo'])) {
            return $this->jsonResponse($response, ['error' => 'El título del proyecto docente es obligatorio.'], 422);
        }

        try {
            $archivo = $_FILES['archivo_pdf'] ?? null;
            $proyecto = $this->repository->crear($input, $archivo);
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Proyecto docente radicado exitosamente en estado En Revisión Líder.',
                'data'    => $this->formatearProyecto($proyecto)
            ], 201);
        } catch (\Throwable $e) {
            return $this->jsonResponse($response, ['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function transicion(Request $request, Response $response, array $args): Response {
        $id = (int)$args['id'];
        $input = $this->extraerInput($request);

        if (empty($input['accion']) && empty($input['tipo_evento'])) {
            return $this->jsonResponse($response, ['error' => 'Debe especificar la acción de transición.'], 422);
        }

        try {
            $proyecto = $this->repository->transicion($id, $input);
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Transición de estado y trazabilidad registradas con éxito.',
                'data'    => $this->formatearProyecto($proyecto)
            ], 200);
        } catch (\Throwable $e) {
            return $this->jsonResponse($response, ['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function registrarPares(Request $request, Response $response, array $args): Response {
        $id = (int)$args['id'];
        $input = $this->extraerInput($request);

        if (empty($input['veredicto'])) {
            return $this->jsonResponse($response, ['error' => 'El veredicto del par evaluador es obligatorio.'], 422);
        }

        try {
            $proyecto = $this->repository->registrarConceptoPar($id, $input);
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Concepto de par evaluador registrado con éxito.',
                'data'    => $this->formatearProyecto($proyecto)
            ], 200);
        } catch (\Throwable $e) {
            return $this->jsonResponse($response, ['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function subsanar(Request $request, Response $response, array $args): Response {
        $id = (int)$args['id'];
        $input = $this->extraerInput($request);

        try {
            $archivo = $_FILES['archivo_pdf'] ?? null;
            $proyecto = $this->repository->subsanar($id, $input, $archivo);
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Subsanación y nueva versión de documento registradas con éxito.',
                'data'    => $this->formatearProyecto($proyecto)
            ], 200);
        } catch (\Throwable $e) {
            return $this->jsonResponse($response, ['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
