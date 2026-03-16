<?php
/**
 * SimpleTestRunner - Utilitário para testes unitários básicos
 */

class SimpleTestRunner
{
    private $passes = 0;
    private $fails = 0;
    private $results = [];

    public function assert($condition, $message)
    {
        if ($condition) {
            $this->passes++;
            $this->results[] = "✅ PASS: $message";
        } else {
            $this->fails++;
            $this->results[] = "❌ FAIL: $message";
        }
    }

    public function assertEquals($expected, $actual, $message)
    {
        $this->assert($expected === $actual, "$message (Esperado: " . json_encode($expected) . ", Obtido: " . json_encode($actual) . ")");
    }

    public function summary()
    {
        echo implode("\n", $this->results) . "\n\n";
        echo "---------------------------------\n";
        echo "RESULTADO FINAL: " . ($this->fails === 0 ? "TODOS PASSARAM!" : "HOUVE FALHAS.") . "\n";
        echo "Sucessos: {$this->passes} | Falhas: {$this->fails}\n";
        return $this->fails === 0;
    }
}
