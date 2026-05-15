<?php
/**
 * SICAU - Sistema de Reservas Universitarias
 * API REST Backend - PHP 8.4
 * Maneja todas las peticiones del frontend
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir la clase Database MySQL
require_once 'database_mysql.php';
//$conexion = conectar();


// Inicializar la base de datos
try {
    $db = new DatabaseMySQL();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos',
        'error' => $e->getMessage()
    ]);
    exit;
}

// Obtener el método HTTP y la acción
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Procesar la petición según el método y acción
try {
    switch ($method) {
        case 'GET':
            handleGet($action, $db);
            break;
        case 'POST':
            handlePost($action, $db);
            break;
        case 'PUT':
            handlePut($action, $db);
            break;
        case 'DELETE':
            handleDelete($action, $db);
            break;
        case 'OPTIONS':
            http_response_code(200);
            exit;
        default:
            throw new Exception('Método no permitido', 405);
    }
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * Manejar peticiones GET
 */
function handleGet($action, $db)
{
    switch ($action) {
        case 'departamentos':
            getDepartamentos($db);
            break;
        case 'espacios':
            getEspacios($db);
            break;
        case 'reservas':
            getReservas($db);
            break;
        case 'estadisticas':
            getEstadisticas($db);
            break;
        case 'disponibilidad':
            checkDisponibilidad($db);
            break;
        case 'historial_reservas':
            getHistorialReservas($db);
            break;

        default:
            throw new Exception('Acción no válida', 400);
    }
}

/**
 * Manejar peticiones POST
 */
function handlePost($action, $db)
{
    switch ($action) {
        case 'reservar':
            crearReserva($db);
            break;
        case 'editar':
            editarReserva($db);
            break;
        case 'agregar_espacio':
            agregarEspacio($db);
            break;
        case 'editar_espacio':
            editarEspacio($db);
            break;
        default:
            throw new Exception('Acción no válida', 400);
    }
}

/**
 * Manejar peticiones PUT
 */
function handlePut($action, $db)
{
    switch ($action) {
        case 'cancelar_reserva':
            cancelarReserva($db);
            break;
        default:
            throw new Exception('Acción no válida', 400);
    }
}

function editarReserva($db) {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        throw new Exception('Datos JSON inválidos', 400);
    }

    // Validar campos requeridos
    $required = ['id', 'espacio_id', 'departamento_codigo', 'fecha', 'horario'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Campo requerido faltante: $field", 400);
        }
    }

    $id = $data['id'];
    $departamento = $data['departamento_codigo'];
    $espacio = $data['espacio_id'];
    $fecha = $data['fecha'];
    $horario = $data['horario'];

    // Validar formato de fecha
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        throw new Exception('Formato de fecha inválido (YYYY-MM-DD)', 400);
    }

    $sql = "UPDATE reservas
            SET departamento_codigo = ?, espacio_id = ?, fecha = ?, horario = ?,
                updated_at = NOW()
            WHERE id = ? AND estado = 'activa'";

    $stmt = $db->getConnection()->prepare($sql);
    $success = $stmt->execute([$departamento, $espacio, $fecha, $horario, $id]);

    if ($success && $stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Reserva actualizada correctamente'
        ]);
    } else {
        throw new Exception('No se pudo actualizar la reserva o la reserva no existe', 400);
    }
}
/**
 * Manejar peticiones DELETE
 */
function handleDelete($action, $db)
{
    // Implementar si es necesario
    throw new Exception('Método no implementado', 501);
}

/**
 * Obtener todos los departamentos
 */
function getDepartamentos($db)
{
    $departamentos = $db->getDepartamentos();
    echo json_encode([
        'success' => true,
        'data' => $departamentos
    ]);
}

/**
 * Obtener espacios por departamento o todos los espacios
 */
function getEspacios($db)
{
    $departamento = $_GET['departamento'] ?? null;
    $tipo = $_GET['tipo'] ?? null;

    if ($departamento && $tipo) {
        $espacios = $db->getEspaciosByDepartamentoAndTipo($departamento, $tipo);
    } elseif ($departamento) {
        $espacios = $db->getEspaciosByDepartamento($departamento);
    } elseif ($tipo) {
        $espacios = $db->getEspaciosByTipo($tipo);
    } else {
        $espacios = $db->getAllEspacios();
    }

    echo json_encode([
        'success' => true,
        'data' => $espacios
    ]);
}

/**
 * Obtener reservas activas
 */
function getReservas($db)
{
    $usuarioId = $_GET['usuario_id'] ?? null;
    $reservas = $db->getReservas($usuarioId); // aquí llamamos a TODAS las reservas

    echo json_encode([
        'success' => true,
        'data' => $reservas
    ]);
}


/**
 * Obtener estadísticas del sistema
 */
function getEstadisticas($db)
{
    $stats = $db->getEstadisticas();
    echo json_encode([
        'success' => true,
        'data' => $stats
    ]);
}

/**
 * Verificar disponibilidad de un espacio
 */
function checkDisponibilidad($db)
{
    $espacioId = $_GET['espacio_id'] ?? null;
    $fecha = $_GET['fecha'] ?? null;
    $horario = $_GET['horario'] ?? null;
    $excludeId = $_GET['exclude_id'] ?? null;

    if (!$espacioId || !$fecha || !$horario) {
        throw new Exception('Parámetros faltantes: espacio_id, fecha, horario', 400);
    }

    $disponible = $db->checkDisponibilidad($espacioId, $fecha, $horario, $excludeId);

    echo json_encode([
        'success' => true,
        'disponible' => $disponible,
        'mensaje' => $disponible ? 'Disponible' : 'Ocupado'
    ]);
}

/**
 * Obtener historial de reservas
 */
function getHistorialReservas($db)
{
    $usuarioId = $_GET['usuario_id'] ?? null;
    $reservas = $db->getHistorialReservas($usuarioId);

    echo json_encode([
        'success' => true,
        'data' => $reservas
    ]);
}

/**
 * Crear una nueva reserva
 */
function crearReserva($db)
{
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Datos JSON inválidos', 400);
    }

    // Validar campos requeridos
    $required = ['espacio_id', 'departamento_codigo', 'fecha', 'horario'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            throw new Exception("Campo requerido faltante: $field", 400);
        }
    }

    // Validar formato de fecha
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $input['fecha'])) {
        throw new Exception('Formato de fecha inválido (YYYY-MM-DD)', 400);
    }



    // Validar fecha futura
    $fechaReserva = new DateTime($input['fecha']);
    $hoy = new DateTime();
    $hoy->setTime(0, 0, 0);

    if ($fechaReserva < $hoy) {
        throw new Exception('No se pueden hacer reservas para fechas pasadas', 400);
    }

    try {
        $reservaId = $db->crearReserva(
            $input['espacio_id'],
            $input['departamento_codigo'],
            $input['fecha'],
            $input['horario'],
            $input['usuario_id'] ?? null
        );

        echo json_encode([
            'success' => true,
            'message' => 'Reserva creada exitosamente',
            'data' => [
                'reserva_id' => $reservaId,
                'espacio_id' => $input['espacio_id'],
                'fecha' => $input['fecha'],
                'horario' => $input['horario']
            ]
        ]);
    } catch (Exception $e) {
        throw new Exception('Error al crear la reserva: ' . $e->getMessage(), 500);
    }
}

/**
 * Cancelar una reserva
 */
function cancelarReserva($db)
{
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['reserva_id'])) {
        throw new Exception('ID de reserva requerido', 400);
    }

    try {
        $result = $db->cancelarReserva($input['reserva_id'], $input['usuario_id'] ?? null);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'reserva cancelada correctamente'
            ]);
        } else {
            throw new Exception('No se pudo cancelar la reserva', 500);
        }
    } catch (Exception $e) {
        throw new Exception('Error al cancelar la reserva: ' . $e->getMessage(), 500);
    }
}

/**
 * Agregar un nuevo espacio
 */
function agregarEspacio($db)
{
    $nombre = $_POST['nombre'] ?? null;
    $departamento = $_POST['departamento'] ?? null;
    $tipo = $_POST['tipo'] ?? null;
    $capacidad = $_POST['capacidad'] ?? null;
    $descripcion = $_POST['descripcion'] ?? null;

    if (!$nombre || !$departamento || !$tipo || !$capacidad) {
        throw new Exception('Campos requeridos faltantes: nombre, departamento, tipo, capacidad', 400);
    }

    try {
        // Obtener el ID del departamento
        $stmt = $db->getConnection()->prepare("SELECT id FROM departamentos WHERE codigo = ?");
        $stmt->execute([$departamento]);
        $depto = $stmt->fetch();

        if (!$depto) {
            throw new Exception('Departamento no encontrado', 400);
        }

        $departamentoId = $depto['id'];

        $result = $db->addEspacio($nombre, $tipo, $capacidad, $descripcion, $departamentoId);

        echo json_encode([
            'success' => $result,
            'message' => $result ? 'Espacio agregado correctamente' : 'Error al agregar espacio'
        ]);
    } catch (Exception $e) {
        throw new Exception('Error al agregar espacio: ' . $e->getMessage(), 500);
    }
}

/**
 * Editar un espacio existente
 */
function editarEspacio($db)
{
    $id = $_POST['id'] ?? null;
    $nombre = $_POST['nombre'] ?? null;
    $departamento = $_POST['departamento'] ?? null;
    $tipo = $_POST['tipo'] ?? null;
    $capacidad = $_POST['capacidad'] ?? null;
    $descripcion = $_POST['descripcion'] ?? null;

    if (!$id || !$nombre || !$departamento || !$tipo || !$capacidad) {
        throw new Exception('Campos requeridos faltantes: id, nombre, departamento, tipo, capacidad', 400);
    }

    try {
        // Obtener el ID del departamento
        $stmt = $db->getConnection()->prepare("SELECT id FROM departamentos WHERE codigo = ?");
        $stmt->execute([$departamento]);
        $depto = $stmt->fetch();

        if (!$depto) {
            throw new Exception('Departamento no encontrado', 400);
        }

        $departamentoId = $depto['id'];

        $result = $db->editEspacio($id, $nombre, $tipo, $capacidad, $descripcion, $departamentoId);

        echo json_encode([
            'success' => $result,
            'message' => $result ? 'Espacio editado correctamente' : 'Error al editar espacio'
        ]);
    } catch (Exception $e) {
        throw new Exception('Error al editar espacio: ' . $e->getMessage(), 500);
    }
}

/**
 * Función auxiliar para sanitizar entrada
 */
function sanitizeInput($data)
{
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Función auxiliar para validar email
 */
function isValidEmail($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Función auxiliar para validar teléfono
 */
function isValidPhone($phone)
{
    return preg_match('/^[\+]?[1-9][\d]{0,15}$/', $phone);
}

/**
 * Función auxiliar para validar fecha
 */
function isValidDate($date, $format = 'Y-m-d')
{
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

/**
 * Función para logging de errores
 */
function logError($message, $context = [])
{
    $logFile = 'sicau_errors.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message";

    if (!empty($context)) {
        $logEntry .= " | Context: " . json_encode($context);
    }

    $logEntry .= PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Función para logging de accesos
 */
function logAccess($endpoint, $method, $userAgent = '')
{
    $logFile = 'sicau_access.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    $logEntry = "[$timestamp] $method $endpoint - IP: $ip";
    if ($userAgent) {
        $logEntry .= " - UA: $userAgent";
    }
    $logEntry .= PHP_EOL;

    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}


