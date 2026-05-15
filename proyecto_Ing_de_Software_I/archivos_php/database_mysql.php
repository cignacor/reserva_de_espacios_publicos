<?php

class DatabaseMySQL {
    private $db;

  
    private $host = 'localhost';
    private $username = 'root';
    private $password = '';
    private $database = 'kkjs_bd';

  
    private const ESTADO_ACTIVA = 'activa';
    private const ESTADO_CANCELADA = 'cancelada';
    private const ESTADO_COMPLETADA = 'completada';

    private const SQL_COUNT_DEPT = "SELECT COUNT(*) as total FROM departamentos";
    private const SQL_COUNT_RES = "SELECT COUNT(*) as total FROM reservas";

    public function __construct() {
        $this->connect();
        $this->seedData();
    }

    public function getConnection() {
        return $this->db;
    }

    private function connect() {
        try {
            $this->db = new PDO(
                "mysql:host={$this->host};dbname={$this->database};charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
        } catch (PDOException $e) {
            throw new Exception("Error de conexión: " . $e->getMessage());
        }
    }

   
    private function seedData() {
        if ($this->db->query(self::SQL_COUNT_DEPT)->fetch()['total'] == 0) {
            $this->insertDepartamentos();
            $this->insertEspacios();
            $this->insertUsuarios();
            $this->insertReservas();
        } elseif ($this->db->query(self::SQL_COUNT_RES)->fetch()['total'] == 0) {
            $this->insertReservas();
        }
    }

    private function insertDepartamentos() {
        $data = [
            ['diseno', 'Diseño', 'fas fa-palette', 'Talleres de diseño gráfico y digital'],
            ['electrica', 'Eléctrica', 'fas fa-bolt', 'Laboratorios de circuitos y electrónica'],
            ['mecanica', 'Mecánica', 'fas fa-cog', 'Talleres de mecánica y maquinaria'],
            ['produccion', 'Producción', 'fas fa-industry', 'Instalaciones de producción industrial'],
            ['sistemas-digitales', 'Sistemas Digitales', 'fas fa-microchip', 'Laboratorios de sistemas embebidos'],
            ['deportivos', 'Deportivos', 'fas fa-futbol', 'Instalaciones deportivas y gimnasios'],
        ];

        $stmt = $this->db->prepare(
            "INSERT INTO departamentos (codigo, nombre, icono, descripcion) VALUES (?, ?, ?, ?)"
        );

        foreach ($data as $row) $stmt->execute($row);
    }

    private function insertEspacios() {
       
        $espacios = [
            [1, 'Taller de Diseño Gráfico 1', 'laboratorio', 20, 'Equipado con computadoras Mac y software Adobe'],
            [1, 'Taller de Diseño Gráfico 2', 'laboratorio', 20, 'Especializado en diseño digital y multimedia'],
            [1, 'Aula de Diseño A', 'aula', 35, 'Aula teórica con proyector HD'],
            [1, 'Aula de Diseño B', 'aula', 30, 'Aula práctica con mesas de dibujo'],
            // …
        ];

        $stmt = $this->db->prepare(
            "INSERT INTO espacios (departamento_id, nombre, tipo, capacidad, descripcion)
             VALUES (?, ?, ?, ?, ?)"
        );

        foreach ($espacios as $e) $stmt->execute($e);
    }

    private function insertUsuarios() {
        $usuarios = [
            ['Ana García', 'ana.garcia@universidad.edu', '3001234567', 'EST2024001', 'estudiante', 'Diseño', 'password123'],
            ['Carlos Rodríguez', 'carlos.rodriguez@universidad.edu', '3002345678', 'EST2024002', 'estudiante', 'Eléctrica', 'password123'],
            ['María López', 'maria.lopez@universidad.edu', '3003456789', 'EST2024003', 'estudiante', 'Mecánica', 'password123'],
            // …
        ];

        $stmt = $this->db->prepare(
            "INSERT INTO usuarios (nombre, email, telefono, codigo_estudiante, tipo, departamento, contrasena)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );

        foreach ($usuarios as $u) $stmt->execute($u);
    }

    private function insertReservas() {
        $reservas = [
            [1, 1, 'diseno', '2024-12-01', '08:00-10:00', self::ESTADO_ACTIVA],
            // …
        ];

        $stmt = $this->db->prepare(
            "INSERT INTO reservas (espacio_id, usuario_id, departamento_codigo, fecha, horario, estado)
             VALUES (?, ?, ?, ?, ?, ?)"
        );

        foreach ($reservas as $r) $stmt->execute($r);
    }

  
    public function checkDisponibilidad($espacioId, $fecha, $horario, $excludeReservaId = null) {
        $sql = "SELECT COUNT(*) AS count FROM reservas
                WHERE espacio_id = ? AND fecha = ? AND horario = ? AND estado = '" . self::ESTADO_ACTIVA . "'";
        $params = [$espacioId, $fecha, $horario];
        if ($excludeReservaId) {
            $sql .= " AND id != ?";
            $params[] = $excludeReservaId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch()['count'] == 0;
    }

    public function getDepartamentos() {
        $stmt = $this->db->query("SELECT * FROM departamentos WHERE activo = 1 ORDER BY nombre");
        return $stmt->fetchAll();
    }

    public function getAllEspacios() {
        $stmt = $this->db->query("
            SELECT e.*, d.nombre as departamento_nombre, d.codigo as departamento_codigo
            FROM espacios e
            JOIN departamentos d ON e.departamento_id = d.id
            WHERE e.activo = 1 ORDER BY d.nombre, e.nombre
        ");
        return $stmt->fetchAll();
    }

    public function getEspaciosByDepartamento($departamentoCodigo) {
        $stmt = $this->db->prepare("
            SELECT e.*, d.nombre as departamento_nombre, d.codigo as departamento_codigo
            FROM espacios e
            JOIN departamentos d ON e.departamento_id = d.id
            WHERE d.codigo = ? AND e.activo = 1 ORDER BY e.nombre
        ");
        $stmt->execute([$departamentoCodigo]);
        return $stmt->fetchAll();
    }

    public function getEspaciosByTipo($tipo) {
        $stmt = $this->db->prepare("
            SELECT e.*, d.nombre as departamento_nombre, d.codigo as departamento_codigo
            FROM espacios e
            JOIN departamentos d ON e.departamento_id = d.id
            WHERE e.tipo = ? AND e.activo = 1 ORDER BY e.nombre
        ");
        $stmt->execute([$tipo]);
        return $stmt->fetchAll();
    }

    public function getEspaciosByDepartamentoAndTipo($departamentoCodigo, $tipo) {
        $stmt = $this->db->prepare("
            SELECT e.*, d.nombre as departamento_nombre, d.codigo as departamento_codigo
            FROM espacios e
            JOIN departamentos d ON e.departamento_id = d.id
            WHERE d.codigo = ? AND e.tipo = ? AND e.activo = 1 ORDER BY e.nombre
        ");
        $stmt->execute([$departamentoCodigo, $tipo]);
        return $stmt->fetchAll();
    }

    public function getReservas($usuarioId = null) {
        $sql = "
            SELECT r.id, r.fecha, r.horario, r.estado, r.created_at, r.updated_at,
                   r.espacio_id, r.departamento_codigo,
                   e.nombre as espacio_nombre, e.capacidad, e.tipo as espacio_tipo,
                   d.nombre as departamento_nombre, d.codigo as departamento_codigo,
                   u.nombre as usuario_nombre, u.email as usuario_email
            FROM reservas r
            JOIN espacios e ON r.espacio_id = e.id
            JOIN departamentos d ON r.departamento_codigo = d.codigo
            LEFT JOIN usuarios u ON r.usuario_id = u.id
        ";
        if ($usuarioId) {
            $stmt = $this->db->prepare($sql . " WHERE r.usuario_id = ? ORDER BY r.fecha DESC");
            $stmt->execute([$usuarioId]);
        } else {
            $stmt = $this->db->query($sql . " ORDER BY r.fecha DESC");
        }
        return $stmt->fetchAll();
    }

    public function getHistorialReservas($usuarioId = null) {
        return $this->getReservas($usuarioId);
    }

    public function getEstadisticas() {
        return [
            'total_reservas' => $this->db->query("SELECT COUNT(*) FROM reservas")->fetchColumn(),
            'reservas_activas' => $this->db->query("SELECT COUNT(*) FROM reservas WHERE estado = 'activa'")->fetchColumn(),
            'total_espacios' => $this->db->query("SELECT COUNT(*) FROM espacios WHERE activo = 1")->fetchColumn(),
            'total_departamentos' => $this->db->query("SELECT COUNT(*) FROM departamentos WHERE activo = 1")->fetchColumn(),
        ];
    }

    public function crearReserva($espacioId, $departamentoCodigo, $fecha, $horario, $usuarioId = null) {
        $stmt = $this->db->prepare("
            INSERT INTO reservas (espacio_id, departamento_codigo, fecha, horario, usuario_id, estado)
            VALUES (?, ?, ?, ?, ?, 'activa')
        ");
        $stmt->execute([$espacioId, $departamentoCodigo, $fecha, $horario, $usuarioId]);
        return $this->db->lastInsertId();
    }

    public function cancelarReserva($reservaId, $usuarioId = null) {
        $stmt = $this->db->prepare("UPDATE reservas SET estado = 'cancelada' WHERE id = ?");
        $stmt->execute([$reservaId]);
        return $stmt->rowCount() > 0;
    }

    public function addEspacio($nombre, $tipo, $capacidad, $descripcion, $departamentoId) {
        $stmt = $this->db->prepare("
            INSERT INTO espacios (nombre, tipo, capacidad, descripcion, departamento_id)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$nombre, $tipo, $capacidad, $descripcion, $departamentoId]);
        return $this->db->lastInsertId();
    }

    public function editEspacio($id, $nombre, $tipo, $capacidad, $descripcion, $departamentoId) {
        $stmt = $this->db->prepare("
            UPDATE espacios SET nombre = ?, tipo = ?, capacidad = ?, descripcion = ?, departamento_id = ?
            WHERE id = ?
        ");
        $stmt->execute([$nombre, $tipo, $capacidad, $descripcion, $departamentoId, $id]);
        return $stmt->rowCount() > 0;
    }

}
