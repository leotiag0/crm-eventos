<?php
/**
 * Utilitário simples para carregar variáveis de ambiente de um arquivo .env
 */

class Env
{
    private static $loadedPath = null;

    public static function load($path)
    {
        if (!file_exists($path) || !is_readable($path)) {
            return false;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false)
            return false;

        foreach ($lines as $line) {
            $parts = explode('=', $line, 2);
            if (count($parts) !== 2)
                continue;

            $name = trim($parts[0]);
            $value = trim($parts[1]);

            // Remover aspas se existirem
            $value = trim($value, '"\'');

            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }

        self::$loadedPath = $path;
        return true;
    }

    public static function getLoadedPath()
    {
        return self::$loadedPath;
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
