<?php
require_once 'api/config/database.php';
if (isset($pdo)) {
    echo "PDO existe\n";
} else {
    echo "PDO não existe\n";
}
