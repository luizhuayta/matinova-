<?php
declare(strict_types=1);

function handle_auth(string $path, string $method): void
{
    start_admin_session();

    if ($path === '/auth/login' && $method === 'POST') {
        rate_limit('login', 8, 300);
        $input = json_input();
        $username = trim((string) ($input['username'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        if ($username === '' || $password === '') {
            json_out(['message' => 'Escribe tu usuario y contraseña'], 400);
        }
        $stmt = db()->prepare('SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            json_out(['message' => 'Usuario o contraseña incorrectos'], 401);
        }
        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int) $user['id'];
        $_SESSION['admin_username'] = $user['username'];
        $_SESSION['admin_role'] = (string) ($user['role'] ?? 'admin');
        unset($_SESSION['csrf']);
        json_out([
            'ok' => true,
            'username' => $user['username'],
            'role' => $_SESSION['admin_role'],
            'csrfToken' => csrf_token(),
        ]);
    }

    if ($path === '/auth/logout' && $method === 'POST') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', (bool) $p['secure'], (bool) $p['httponly']);
        }
        session_destroy();
        json_out(['ok' => true]);
    }

    if ($path === '/auth/me' && $method === 'GET') {
        if (empty($_SESSION['admin_id'])) {
            json_out(['authenticated' => false], 200);
        }
        json_out([
            'authenticated' => true,
            'username' => $_SESSION['admin_username'] ?? 'admin',
            'role' => admin_role(),
            'csrfToken' => csrf_token(),
        ]);
    }

    json_out(['message' => 'Ruta no encontrada'], 404);
}
