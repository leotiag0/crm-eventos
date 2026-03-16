<?php
header("Content-Type: text/plain");
require_once 'api/config/database.php';

echo "Database: " . $db . "\n";
echo "Host: " . $host . "\n";

try {
    echo "Describing equipamentos table:\n";
    $stmt = $pdo->query("DESCRIBE equipamentos");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
