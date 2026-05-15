<?php
header('Content-Type: application/json');
require_once 'database_mysql.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    $db = new DatabaseMySQL();
    $conn = $db->getConnection();

    // Verificar si el correo existe como estudiante o profesor
    if ($action === 'verificar') {
        $email = $input['email'] ?? '';

        if (empty($email)) {
            echo json_encode(['success' => false, 'message' => 'Correo requerido']);
            exit;
        }

        $stmt = $conn->prepare(
            "SELECT id, nombre, tipo FROM usuarios 
             WHERE email = ? AND tipo IN ('estudiante', 'profesor') AND activo = 1"
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode([
                'success' => true,
                'message' => 'Correo encontrado',
                'nombre' => $user['nombre'],
                'tipo' => $user['tipo']
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'El correo no está registrado en el sistema como estudiante o profesor'
            ]);
        }
        exit;
    }

    // Cambiar la contraseña
    if ($action === 'cambiar') {
        $email = $input['email'] ?? '';
        $nueva = $input['nueva_contrasena'] ?? '';
        $confirmar = $input['confirmar_contrasena'] ?? '';

        if (empty($email) || empty($nueva) || empty($confirmar)) {
            echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
            exit;
        }

        if ($nueva !== $confirmar) {
            echo json_encode(['success' => false, 'message' => 'Las contraseñas no coinciden']);
            exit;
        }

        if (strlen($nueva) < 6) {
            echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
            exit;
        }

        $stmt = $conn->prepare(
            "UPDATE usuarios SET contrasena = ?, updated_at = NOW()
             WHERE email = ? AND tipo IN ('estudiante', 'profesor') AND activo = 1"
        );
        $stmt->execute([$nueva, $email]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No se pudo actualizar la contraseña']);
        }
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Acción no válida']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}
?>
