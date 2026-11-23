<?php
declare(strict_types=1);

// Prueba aislada del router; no abre conexiones ni escribe contenido.
function handle_site(string $method): never
{
    throw new RuntimeException('site:' . $method);
}

function json_out(mixed $data, int $code = 200): never
{
    throw new RuntimeException('http:' . $code);
}

require __DIR__ . '/../Http/Router.php';

$cases = [
    ['GET', '/site', 'site:GET'],
    ['PUT', '/site', 'site:PUT'],
    ['POST', '/site', 'site:POST'],
    ['DELETE', '/site', 'site:DELETE'],
    ['GET', '/no-existe', 'http:404'],
];
foreach ($cases as [$method, $path, $expected]) {
    try {
        api_dispatch($method, $path);
        fwrite(STDERR, "FAIL $method $path: no se llamó al handler\n");
        exit(1);
    } catch (RuntimeException $e) {
        if ($e->getMessage() !== $expected) {
            fwrite(STDERR, "FAIL $method $path: handler incorrecto\n");
            exit(1);
        }
        echo "OK $method $path\n";
    }
}
