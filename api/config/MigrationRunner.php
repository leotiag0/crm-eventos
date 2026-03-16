<?php
/**
 * MigrationRunner - Gerenciador simples de migrações de banco de dados
 */

class MigrationRunner
{
    private $pdo;
    private $migrationsDir;

    public function __construct($pdo, $migrationsDir)
    {
        $this->pdo = $pdo;
        $this->migrationsDir = $migrationsDir;
        $this->ensureMigrationsTable();
    }

    private function ensureMigrationsTable()
    {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        ");
    }

    public function run()
    {
        $executedMigrations = $this->getExecutedMigrations();
        $files = glob($this->migrationsDir . '/*.sql');
        sort($files);

        $count = 0;
        foreach ($files as $file) {
            $migrationName = basename($file);
            if (!in_array($migrationName, $executedMigrations)) {
                $this->executeMigration($file);
                $count++;
            }
        }

        return $count;
    }

    private function getExecutedMigrations()
    {
        $stmt = $this->pdo->query("SELECT migration FROM migrations");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    private function executeMigration($file)
    {
        $sql = file_get_contents($file);
        $migrationName = basename($file);

        try {
            // Executar o SQL (pode conter múltiplas instruções)
            // MySQL DDL statements trigger implicit commits, so we don't use transactions here
            if (!empty(trim($sql))) {
                $this->pdo->exec($sql);
            }

            $stmt = $this->pdo->prepare("INSERT INTO migrations (migration) VALUES (?)");
            $stmt->execute([$migrationName]);

            echo "Migração executada: $migrationName\n";
        } catch (Exception $e) {
            die("Erro ao executar migração $migrationName: " . $e->getMessage() . "\n");
        }
    }
}
