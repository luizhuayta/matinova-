<?php
declare(strict_types=1);

/**
 * APP_SCHEMA_VERSION (migrate.php / app_secrets.schema_version): DDL y migraciones de app.
 * CMS_SCHEMA_VERSION (cms-schema.php / document.schemaVersion): forma JSON de cada documento.
 *
 * Las copias editoriales que pisan páginas (cms_studio_sitewide_migrate) solo corren
 * al subir a schema 10 por primera vez, o si APP_MIGRATE_CONTENT=1.
 * El schema 11 reescribe rutas de fotos pesadas a WebP sin pisar el resto del JSON.
 */
function cms_content_overwrite_enabled(): bool
{
    if (cfg('APP_MIGRATE_CONTENT', '0') === '1') {
        return true;
    }
    try {
        $stmt = db()->prepare("SELECT v FROM app_secrets WHERE k = 'schema_version'");
        $stmt->execute();
        $value = $stmt->fetchColumn();
        if ($value === false) {
            return true;
        }
        return (int) $value < 10;
    } catch (Throwable) {
        return true;
    }
}

/** Registra el cambio en la misma transacción que sus escrituras de datos. */
function cms_run_migration_once(string $name, ?callable $migration): void
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO app_secrets (k, v) VALUES (?, '1') ON DUPLICATE KEY UPDATE k = VALUES(k)");
        $stmt->execute(['migration_done:' . $name]);
        if ($stmt->rowCount() === 1 && $migration !== null) {
            $migration();
        }
        $pdo->commit();
    } catch (Throwable $err) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $err;
    }
}
