<?php
use Slim\Factory\AppFactory;
use App\Config\Database;
use App\Middleware\Cors;

require __DIR__ . '/../vendor/autoload.php';

new Database();

$app = AppFactory::create();

$app->setBasePath('/GestionInvestigacionUDB/back/ms-proyectos/public/index.php');

$app->add(new Cors());
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$app->addErrorMiddleware(true, true, true);

$routes = require __DIR__ . '/../app/Endpoints/endpoints.php';
$routes($app);

$app->run();