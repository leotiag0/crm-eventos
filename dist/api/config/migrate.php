<?php
/**
 * Script para executar migrações via CLI
 */

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/MigrationRunner.php';

echo "Iniciando migrações...\n";

$migrationsDir = __DIR__ . '/../migrations';
if (!is_dir($migrationsDir)) {
    mkdir($migrationsDir, 0755, true);
}

$runner = new MigrationRunner($pdo, $migrationsDir);
$executedCount = $runner->run();

if ($executedCount === 0) {
    echo "Nenhuma migração pendente.\n";
} else {
    echo "Total de migrações executadas: $executedCount\n";
}
