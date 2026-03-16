<?php
/**
 * ConfigService - Lógica de negócio para Configurações do Sistema
 */

class ConfigService
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function get()
    {
        $stmt = $this->pdo->query("SELECT * FROM configuracoes WHERE id = 1");
        return $stmt->fetch() ?: [];
    }

    public function updateLogo($file)
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("Falha no upload do arquivo.");
        }

        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!in_array($file['type'], $allowed)) {
            throw new Exception("Formato de arquivo não permitido");
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'logo_' . time() . '.' . $ext;
        $uploadDir = __DIR__ . '/../uploads/logos/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $targetPath = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $publicPath = '/api/uploads/logos/' . $filename;
            $stmt = $this->pdo->prepare("UPDATE configuracoes SET logo_path = ? WHERE id = 1");
            $stmt->execute([$publicPath]);
            return $publicPath;
        } else {
            throw new Exception("Falha ao mover arquivo");
        }
    }

    public function update($data)
    {
        $fields = [
            'nome_empresa',
            'razao_social',
            'cnpj',
            'logo_path',
            'cor_primaria',
            'cor_secundaria',
            'endereco',
            'telefone',
            'email_contato',
            'site'
        ];

        $sets = [];
        $params = [];
        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $sets[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($sets)) {
            throw new Exception("Nenhum dado fornecido para atualização");
        }

        $sql = "UPDATE configuracoes SET " . implode(", ", $sets) . " WHERE id = 1";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }
}
