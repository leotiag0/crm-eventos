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
        // Tenta buscar nos headers (passados pelo nosso proxy no server.js)
        $headerKey = 'HTTP_X_APP_' . str_replace('-', '_', strtoupper($key));
        if (isset($_SERVER[$headerKey])) {
            return self::castValue($_SERVER[$headerKey]);
        }

        // Tenta buscar em $_SERVER (útil para SetEnv do .htaccess)
        if (isset($_SERVER[$key])) {
            return self::castValue($_SERVER[$key]);
        }

        // Tenta buscar em $_ENV
        if (isset($_ENV[$key])) {
            return self::castValue($_ENV[$key]);
        }

        // Tenta buscar no ambiente do sistema
        $value = getenv($key);
        if ($value === false) {
            return $default;
        }

        return self::castValue($value);
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
