<?php
use App\Controllers\ProyectoController;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function (App $app) {
    $app->group('/view', function (RouteCollectorProxy $group) {
        $group->get('/catalogos', [ProyectoController::class, 'catalogos']);
        $group->get('/proyectos', [ProyectoController::class, 'listar']);
        $group->post('/proyectos', [ProyectoController::class, 'radicar']);
        $group->post('/proyectos/{id}/transicion', [ProyectoController::class, 'transicion']);
        $group->post('/proyectos/{id}/pares', [ProyectoController::class, 'registrarPares']);
        $group->post('/proyectos/{id}/subsanar', [ProyectoController::class, 'subsanar']);
    });

    $app->options('/{routes:.+}', function ($request, $response) {
        return $response;
    });
};
