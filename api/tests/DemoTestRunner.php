<?php
/**
 * Teste de demonstração para o SimpleTestRunner
 */

require_once __DIR__ . '/SimpleTestRunner.php';

// 1. Uma classe simples de exemplo para testarmos
class CalculadoraSimples
{
    public function somar($a, $b)
    {
        return $a + $b;
    }

    public function dividir($a, $b)
    {
        if ($b === 0) {
            throw new InvalidArgumentException("Divisão por zero.");
        }
        return $a / $b;
    }
}

// 2. Inicializamos o executor de testes
$test = new SimpleTestRunner();
$calc = new CalculadoraSimples();

echo "Iniciando testes da CalculadoraSimples...\n\n";

// Teste 1: Soma de números inteiros
$test->assertEquals(4, $calc->somar(2, 2), "Soma de 2 + 2 deve ser igual a 4");

// Teste 2: Divisão de números decimais
$test->assertEquals(2.5, $calc->dividir(5, 2), "Divisão de 5 / 2 deve ser igual a 2.5");

// Teste 3: Teste de condição booleana
$resultadoSoma = $calc->somar(10, 5);
$test->assert($resultadoSoma > 10, "Resultado da soma de 10 + 5 deve ser maior que 10");

// Teste 4: Demonstração de falha (descomente para testar comportamento de falha)
// $test->assertEquals(5, $calc->somar(2, 2), "Soma de 2 + 2 deve ser 5 (Teste de Falha Propositada)");

// 3. Exibir o resumo final
$test->summary();
