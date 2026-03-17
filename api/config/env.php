<?php
/**
 * Utilitário simples para carregar variáveis de ambiente de um arquivo .env
 */

class Env
{
    public static function load($path)
    {
        if (!file_exists($path)) {
            return false;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0 || !strpos($line, '=')) {
                continue;
            }

            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            // Remover aspas se existirem
            $value = trim($value, '"\'');

            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
        return true;
    }

    public static function get($key, $default = null)
    {
        // 1. Tenta buscar em $_ENV (onde carregamos o nosso .env via Env::load)
        if (isset($_ENV[$key])) {
            return self::castValue($_ENV[$key]);
        }

        // 2. Tenta buscar em $_SERVER (útil para variáveis do Apache ou SetEnv)
        if (isset($_SERVER[$key])) {
            return self::castValue($_SERVER[$key]);
        }

        // 3. Tenta buscar nos headers (fallback para o proxy se nada mais existir)
        $headerKey = 'HTTP_X_APP_' . str_replace('-', '_', strtoupper($key));
        if (isset($_SERVER[$headerKey])) {
            return self::castValue($_SERVER[$headerKey]);
        }

        // 4. Fallback final para getenv() ou o default
        $val = getenv($key);
        return $val !== false ? self::castValue($val) : $default;
    }

    private static function castValue($value)
    {
        // Remover aspas se existirem
        $value = trim($value, '"\'');

        // Converter valores booleanos e nulos
        switch (strtolower($value)) {
            case 'true':
                return true;
            case 'false':
                return false;
            case 'null':
                return null;
        }

        return $value;
    }
}
