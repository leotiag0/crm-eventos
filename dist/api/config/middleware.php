<?php
/**
 * Middleware de Segurança e Funções Utilitárias Centralizadas
 */

/**
 * Adiciona headers de segurança em todas as respostas
 */
function addSecurityHeaders()
{
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: DENY");
    header("X-XSS-Protection: 1; mode=block");
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';");

    // HSTS (Apenas se estiver em HTTPS)
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
    }
}

/**
 * Verifica se o usuário está autenticado
 */
function checkAuth()
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(["error" => "Não autenticado"]);
        exit;
    }
}

/**
 * Verifica se o usuário tem um papel específico
 */
function checkRole($roleSlug)
{
    checkAuth();
    if ($_SESSION['user']['papel_slug'] !== $roleSlug) {
        http_response_code(403);
        echo json_encode(["status" => "error", "error" => "Acesso negado: permissão insuficiente"]);
        exit;
    }
}

/**
 * Proteção básica contra CSRF via verificação de Origin/Referer
 */
function checkCSRF()
{
    $method = $_SERVER['REQUEST_METHOD'];
    if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
        $allowedOrigin = $_SERVER['HTTP_HOST'];
        $origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';

        // Em desenvolvimento local (localhost), permitir diferentes portas
        if (strpos($allowedOrigin, 'localhost') !== false) {
            return;
        }

        if ($origin && strpos($origin, $allowedOrigin) === false) {
            http_response_code(403);
            echo json_encode(["status" => "error", "error" => "Requisição bloqueada por política CSRF"]);
            exit;
        }
    }
}

/**
 * Envia uma resposta JSON padronizada
 */
function sendJson($data, $statusCode = 200)
{
    http_response_code($statusCode);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode($data);
    exit;
}

/**
 * Envia uma resposta JSON de sucesso padronizada
 */
function sendSuccess($message, $data = [], $statusCode = 200)
{
    if (empty($data)) {
        sendJson(["status" => "success", "message" => $message], $statusCode);
    } else {
        sendJson(array_merge(["status" => "success", "message" => $message], $data), $statusCode);
    }
}

/**
 * Envia uma resposta JSON de erro padronizada
 */
function sendError($message, $statusCode = 400, $details = [])
{
    $response = ["status" => "error", "error" => $message];
    if (!empty($details)) {
        $response['details'] = $details;
    }
    sendJson($response, $statusCode);
}

// Execução imediata de medidas globais
addSecurityHeaders();
checkCSRF();
