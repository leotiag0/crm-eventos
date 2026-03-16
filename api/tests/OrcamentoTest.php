<?php
/**
 * Teste unitário para OrcamentoService
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/OrcamentoService.php';
require_once __DIR__ . '/SimpleTestRunner.php';

$test = new SimpleTestRunner();
$service = new OrcamentoService($pdo);

echo "Iniciando testes de OrcamentoService...\n";

// Teste 1: Listagem
$orcamentos = $service->listAll();
$test->assert(is_array($orcamentos), "listAll deve retornar um array");

// Teste 2: Buscar inexistente
$inexistente = $service->getById(999999);
$test->assertEquals(false, $inexistente, "getById de ID inexistente deve retornar false");

// Finalizar
$test->summary();
