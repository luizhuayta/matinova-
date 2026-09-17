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
        $stmt = db()->prepare('SELECT id, username, password_hash, role, active FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            json_out(['message' => 'Usuario o contraseña incorrectos'], 401);
        }
        if (array_key_exists('active', $user) && (int) $user['active'] !== 1) {
            json_out(['message' => 'Esta cuenta está desactivada'], 403);
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

    if ($path === '/auth/users' && $method === 'GET') {
        require_role('admin');
        $rows = db()->query('SELECT id, username, role, active, created_at FROM users ORDER BY id')->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['active'] = (int) ($row['active'] ?? 1) === 1;
        }
        json_out(['items' => $rows]);
    }

    if ($path === '/auth/users' && $method === 'POST') {
        require_role('admin');
        require_csrf();
        $input = json_input();
        $username = strtolower(trim((string) ($input['username'] ?? '')));
        $password = (string) ($input['password'] ?? '');
        $role = (string) ($input['role'] ?? 'editor');
        if (!preg_match('/^[a-z0-9._-]{3,80}$/', $username)) {
            json_out(['field' => 'username', 'message' => 'Usa un usuario de 3 a 80 caracteres (letras, números, punto o guion).'], 400);
        }
        if (strlen($password) < 8) {
            json_out(['field' => 'password', 'message' => 'La contraseña debe tener al menos 8 caracteres.'], 400);
        }
        if (!in_array($role, ['admin', 'editor'], true)) {
            json_out(['field' => 'role', 'message' => 'El rol debe ser admin o editor.'], 400);
        }
        $exists = db()->prepare('SELECT id FROM users WHERE username = ?');
        $exists->execute([$username]);
        if ($exists->fetch()) {
            json_out(['field' => 'username', 'message' => 'Ese usuario ya existe.'], 409);
        }
        $ins = db()->prepare('INSERT INTO users (username, password_hash, role, active) VALUES (?, ?, ?, 1)');
        $ins->execute([$username, password_hash($password, PASSWORD_DEFAULT), $role]);
        json_out([
            'ok' => true,
            'item' => [
                'id' => (int) db()->lastInsertId(),
                'username' => $username,
                'role' => $role,
                'active' => true,
            ],
        ], 201);
    }

    if (preg_match('#^/auth/users/(\d+)$#', $path, $m) && $method === 'PATCH') {
        require_role('admin');
        require_csrf();
        $id = (int) $m[1];
        $stmt = db()->prepare('SELECT id, username, role, active FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) {
            json_out(['message' => 'Usuario no encontrado'], 404);
        }
        $input = json_input();
        $role = array_key_exists('role', $input) ? (string) $input['role'] : (string) $user['role'];
        if (!in_array($role, ['admin', 'editor'], true)) {
            json_out(['field' => 'role', 'message' => 'El rol debe ser admin o editor.'], 400);
        }
        $active = array_key_exists('active', $input) ? (!empty($input['active']) ? 1 : 0) : (int) $user['active'];
        if ((int) $user['id'] === (int) ($_SESSION['admin_id'] ?? 0) && $active === 0) {
            json_out(['message' => 'No puedes desactivar tu propia cuenta.'], 400);
        }
        if ((int) $user['id'] === (int) ($_SESSION['admin_id'] ?? 0) && $role !== 'admin') {
            json_out(['message' => 'No puedes quitarte el rol de administrador.'], 400);
        }
        $password = (string) ($input['password'] ?? '');
        if ($password !== '') {
            if (strlen($password) < 8) {
                json_out(['field' => 'password', 'message' => 'La contraseña debe tener al menos 8 caracteres.'], 400);
            }
            db()->prepare('UPDATE users SET role = ?, active = ?, password_hash = ? WHERE id = ?')
                ->execute([$role, $active, password_hash($password, PASSWORD_DEFAULT), $id]);
        } else {
            db()->prepare('UPDATE users SET role = ?, active = ? WHERE id = ?')
                ->execute([$role, $active, $id]);
        }
        json_out([
            'ok' => true,
            'item' => [
                'id' => $id,
                'username' => $user['username'],
                'role' => $role,
                'active' => $active === 1,
            ],
        ]);
    }

    json_out(['message' => 'Ruta no encontrada'], 404);
}
