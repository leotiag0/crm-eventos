<?php
require_once 'api/config/database.php';
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $table) {
    echo $table . PHP_EOL;
}
