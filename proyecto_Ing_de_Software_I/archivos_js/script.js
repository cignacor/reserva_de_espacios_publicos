
//     PATRÓN APLICADO: SINGLETON PATTERN

// Verificar sesión activa
(function checkSession() {
    const user = JSON.parse(localStorage.getItem('sicau_user') || 'null');
    if (!user || !user.id) {
        window.location.href = 'login.html';
    }
})();


const SICAUSystemSingleton = (() => {

    let instance = null; // ÚNICA instancia permitida

    // Clase original
    class SICAUReservationSystem {
        constructor() {
            this.currentStep = 1;
            this.selectedDepartamento = null;
            this.selectedEspacio = null;
            this.selectedFecha = null;
            this.selectedHorario = null;
            this.selectedHorarios = [];
            this.reservaEnEdicion = null;
            this.reservas = [];
            this.departamentos = [];
            this.espacios = [];

            this.apiBaseUrl = '/Ing_Soft_Kathe/proyecto_Ing_de_Software_I/archivos_php/reservas.php';

            this.init();
            this.setupHeaderScroll();
        }

        init() {
            this.loadEventListeners();
            this.loadDepartamentos();
            this.loadEspacios();
            this.setupDateValidation();
            this.loadReservas();
            this.setupMobileMenu();
            this.setupTabs();
            this.setupFilters();
            this.loadEspaciosShowcase();
        }

        setupHeaderScroll() {
            const header = document.querySelector(".header");

            if (!header) return;

            window.addEventListener("scroll", () => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                if (scrollTop <= 10) {
                    header.classList.remove("hidden");
                    header.classList.add("show");
                }
                else {
                    header.classList.remove("show");
                    header.classList.add("hidden");
                }
            }, { passive: true });
        }

        loadEventListeners() {
            document.getElementById('nextToStep2')?.addEventListener('click', () => this.nextStep(2));
            document.getElementById('backToStep1')?.addEventListener('click', () => this.prevStep(1));
            document.getElementById('nextToStep3')?.addEventListener('click', () => this.nextStep(3));
            document.getElementById('backToStep2')?.addEventListener('click', () => this.prevStep(2));
            document.getElementById('nextToStep4')?.addEventListener('click', () => this.nextStep(4));
            document.getElementById('backToStep3')?.addEventListener('click', () => this.prevStep(3));
            document.getElementById('confirmarReserva')?.addEventListener('click', () => this.confirmarReserva());

            document.querySelectorAll('.departamento-card').forEach(card => {
                card.addEventListener('click', (e) => this.selectDepartamento(e));
            });

            document.getElementById('fechaReserva')?.addEventListener('change', (e) => this.validateFecha(e));
            document.getElementById('horaInicio')?.addEventListener('change', (e) => this.validateHorario(e));
            document.getElementById('horaFin')?.addEventListener('change', (e) => this.validateHorario(e));

            document.getElementById('mobileMenuToggle')?.addEventListener('click', this.toggleMobileMenu);
            document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

            document.querySelectorAll('.modal .btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const modalId = e.target.closest('.modal').id;
                    this.closeModal(modalId);
                });
            });
        }

        async loadDepartamentos() {
            try {
                const response = await fetch(`${this.apiBaseUrl}?action=departamentos`);
                const result = await response.json();

                if (result.success) {
                    this.departamentos = result.data;
                    this.updateDepartamentosDisplay();
                } else {
                    console.error('Error cargando departamentos:', result.message);
                    this.showError('Error cargando departamentos');
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                this.showError('Error de conexión con el servidor');
            }
        }

        updateDepartamentosDisplay() {}

        async loadEspacios() {
            try {
                const response = await fetch(`${this.apiBaseUrl}?action=espacios`);
                const result = await response.json();

                if (result.success) {
                    this.espacios = result.data;
                } else {
                    console.error('Error cargando espacios:', result.message);
                    this.showError('Error cargando espacios');
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                this.showError('Error de conexión con el servidor');
            }
        }

        loadEspaciosShowcase() {
            setTimeout(() => {
                this.filterEspacios('todos');
            }, 100);
        }

        selectDepartamento(event) {
            const card = event.currentTarget;
            const departamentoId = card.dataset.departamento;

            document.querySelectorAll('.departamento-card').forEach(c => c.classList.remove('selected'));

            card.classList.add('selected');
            this.selectedDepartamento = departamentoId;

            const nextBtn = document.getElementById('nextToStep2');
            if (nextBtn) {
                nextBtn.disabled = false;
            }

            this.loadEspaciosByDepartamento(departamentoId);
        }

        async loadEspaciosByDepartamento(departamentoId) {
            try {
                const response = await fetch(`${this.apiBaseUrl}?action=espacios&departamento=${departamentoId}`);
                const result = await response.json();

                if (result.success) {
                    const container = document.getElementById('espaciosContainer');
                    if (!container) return;

                    container.innerHTML = '';

                    result.data.forEach(espacio => {
                        const espacioCard = document.createElement('div');
                        espacioCard.className = 'espacio-card';
                        espacioCard.dataset.espacioId = espacio.id;
                        espacioCard.addEventListener('click', (e) => this.selectEspacio(e, espacio));

                        espacioCard.innerHTML = `
                            <div class="espacio-header">
                                <span class="espacio-nombre">${espacio.nombre}</span>
                                <span class="espacio-tipo ${espacio.tipo}">${this.getTipoLabel(espacio.tipo)}</span>
                            </div>
                            <div class="espacio-capacidad">
                                <i class="fas fa-users"></i> Capacidad: ${espacio.capacidad} personas
                            </div>
                            <div class="espacio-descripcion">${espacio.descripcion}</div>
                        `;

                        container.appendChild(espacioCard);
                    });
                } else {
                    console.error('Error cargando espacios:', result.message);
                    this.showError('Error cargando espacios del departamento');
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                this.showError('Error de conexión con el servidor');
            }
        }

        getTipoLabel(tipo) {
            const labels = {
                'aula': 'Aula',
                'laboratorio': 'Laboratorio',
                'comun': 'Espacio Común'
            };
            return labels[tipo] || tipo;
        }

        selectEspacio(event, espacio) {
            const card = event.currentTarget;

            document.querySelectorAll('.espacio-card').forEach(c => c.classList.remove('selected'));

            card.classList.add('selected');
            this.selectedEspacio = espacio;

            const nextBtn = document.getElementById('nextToStep3');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        }

        setupDateValidation() {
            const fechaInput = document.getElementById('fechaReserva');
            if (fechaInput) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                fechaInput.min = tomorrow.toISOString().split('T')[0];
            }
        }

        validateFecha(event) {
            const fecha = event.target.value;
            this.selectedFecha = fecha;

            if (fecha) {
                const horarioSection = document.getElementById('horarioSection');
                if (horarioSection) {
                    horarioSection.style.display = 'block';
                }
                this.loadHorariosDisponibles(fecha);
            } else {
                const horarioSection = document.getElementById('horarioSection');
                if (horarioSection) {
                    horarioSection.style.display = 'none';
                }
                this.selectedHorarios = [];
                this.updateHorariosSeleccionados();
            }

            this.updateNextButton();
        }

        validateHorario(event) {
            const horaInicio = document.getElementById('horaInicio')?.value;
            const horaFin = document.getElementById('horaFin')?.value;

            if (!horaInicio || !horaFin) {
                this.selectedHorario = null;
                this.updateNextButton();
                return;
            }

            if (horaInicio >= horaFin) {
                this.showError('La hora de fin debe ser posterior a la de inicio');
                this.selectedHorario = null;
                this.updateNextButton();
                return;
            }

            if (this.selectedFecha && this.selectedEspacio) {
                const conflicto = this.verificarConflictoReserva(this.selectedFecha, `${horaInicio}-${horaFin}`, this.selectedEspacio.id);
                if (conflicto) {
                    this.showError('Este horario ya está reservado para este espacio. Por favor selecciona otro horario.');
                    this.selectedHorario = null;
                    this.updateNextButton();
                    return;
                }
            }

            this.selectedHorario = `${horaInicio}-${horaFin}`;
            this.updateNextButton();
        }

        verificarConflictoReserva(fecha, horario, espacioId) {
            return this.reservas.some(reserva => {
                return reserva.estado === 'activa' &&
                    reserva.fecha === fecha &&
                    reserva.espacio.id === espacioId &&
                    reserva.horario === horario;
            });
        }

        updateNextButton() {
            const nextBtn = document.getElementById('nextToStep4');
            if (nextBtn) {
                const isValid = this.selectedFecha && this.selectedHorario && this.selectedEspacio;
                nextBtn.disabled = !isValid;
            }
        }

        nextStep(step) {
            if (this.validateCurrentStep()) {
                this.showStep(step);
                this.updateProgressBar(step);

                if (step === 4) {
                    this.mostrarResumenReserva();
                }
            }
        }

        prevStep(step) {
            this.showStep(step);
            this.updateProgressBar(step);
        }

        showStep(step) {
            document.querySelectorAll('.reserva-step').forEach(s => s.classList.remove('active'));

            const stepElement = document.getElementById(`step${step}`);
            if (stepElement) {
                stepElement.classList.add('active');
            }
            this.currentStep = step;

            stepElement?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }

        updateProgressBar(step) {
            const progressFill = document.getElementById('progressFill');
            const steps = document.querySelectorAll('.progress-step');

            steps.forEach((stepElement, index) => {
                const stepNumber = index + 1;

                stepElement.classList.remove('active', 'completed');

                if (stepNumber < step) {
                    stepElement.classList.add('completed');
                } else if (stepNumber === step) {
                    stepElement.classList.add('active');
                }
            });

            if (progressFill) {
                const progress = ((step - 1) / 3) * 100;
                progressFill.style.width = `${progress}%`;
            }
        }

        validateCurrentStep() {
            switch (this.currentStep) {
                case 1:
                    return this.selectedDepartamento !== null;
                case 2:
                    return this.selectedEspacio !== null;
                case 3:
                    return this.selectedFecha !== null && this.selectedHorario !== null;
                default:
                    return true;
            }
        }

        async confirmarReserva() {
            if (!this.validateCurrentStep()) {
                this.showError('Por favor complete todos los campos requeridos');
                return;
            }

            this.showLoading();

            try {
                const horarioBackend = this.selectedHorario;

                const user = JSON.parse(localStorage.getItem('sicau_user') || '{}');
                const reservaData = {
                    id: this.reservaEnEdicion ?? null,
                    espacio_id: this.selectedEspacio.id,
                    departamento_codigo: this.selectedDepartamento,
                    fecha: this.selectedFecha,
                    horario: horarioBackend,
                    usuario_id: user.id ?? null
                };

                const action = this.reservaEnEdicion ? 'editar' : 'reservar';

                const response = await fetch(`${this.apiBaseUrl}?action=${action}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reservaData)
                });

                const result = await response.json();

                if (result.success) {
                    this.showSuccess(this.reservaEnEdicion ? '¡Reserva actualizada!' : '¡Reserva confirmada exitosamente!');
                    this.resetForm();
                    this.loadReservas();
                    this.reservaEnEdicion = null;
                } else {
                    this.showError(result.message || 'Error al procesar la reserva');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showError('Error de conexión con el servidor');
            }
        }

        async loadReservas() {
            try {
                const user = JSON.parse(localStorage.getItem('sicau_user') || '{}');
                const params = user.id ? `?action=reservas&usuario_id=${user.id}` : `?action=reservas`;
                const response = await fetch(`${this.apiBaseUrl}${params}`);
                const result = await response.json();

                if (result.success) {
                    this.reservas = result.data;
                    this.updateReservasDisplay();
                } else {
                    console.error('Error cargando reservas:', result.message);
                }
            } catch (error) {
                console.error('Error de conexión:', error);
            }
        }

        updateReservasDisplay() {
            this.updateReservasActivas();
            this.updateHistorialReservas();
        }

        updateReservasActivas() {
            const container = document.getElementById('reservasActivasGrid');
            if (!container) return;

            const activas = this.reservas.filter(r => r.estado === 'activa');

            if (activas.length === 0) {
                container.innerHTML = '<p class="text-center">No tienes reservas activas</p>';
                return;
            }

            container.innerHTML = activas.map(reserva => `
                <div class="reserva-item" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div class="reserva-info">
                            <span class="reserva-titulo">${reserva.espacio_nombre}</span>
                            <span class="reserva-estado activa">Activa</span>
                        </div>
                        <div class="reserva-detalles">
                            <strong>Departamento:</strong> ${reserva.departamento_nombre}<br>
                            <strong>Fecha:</strong> ${this.formatDate(reserva.fecha)}<br>
                            <strong>Horario:</strong> ${this.getHorarioLabel(reserva.horario)}
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 0.85rem; color: #666;">
                        <div><strong>Creación:</strong> ${this.formatDateTime(reserva.created_at)}</div>
                        <div><strong>Edición:</strong> ${reserva.updated_at ? this.formatDateTime(reserva.updated_at) : 'N/A'}</div>
                        <div class="reserva-acciones" style="margin-top: 10px;">
                            <button class="btn btn-small btn-warning" onclick="sicau.cargarReservaEnPasos(${reserva.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-small btn-secondary" onclick="sicau.cancelarReserva(${reserva.id})">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        updateHistorialReservas() {
            const container = document.getElementById('reservasHistorialGrid');
            if (!container) return;

            const hoy = new Date().toISOString().split('T')[0];
            const historial = this.reservas.filter(r => r.estado !== 'activa' || r.fecha < hoy);

            if (historial.length === 0) {
                container.innerHTML = '<p class="text-center">No hay historial de reservas</p>';
                return;
            }

            container.innerHTML = historial.map(reserva => `
                <div class="reserva-item">
                    <div class="reserva-info">
                        <span class="reserva-titulo">${reserva.espacio_nombre}</span>
                        <span class="reserva-estado ${reserva.estado}">${this.getStatusLabel(reserva.estado)}</span>
                    </div>
                    <div class="reserva-detalles">
                        <strong>Departamento:</strong> ${reserva.departamento_nombre}<br>
                        <strong>Fecha:</strong> ${this.formatDate(reserva.fecha)}<br>
                        <strong>Horario:</strong> ${this.getHorarioLabel(reserva.horario)}<br>
                        ${reserva.estado === 'cancelada' ? '<strong>Estado:</strong> <span class="estado-cancelada">CANCELADA</span>' : ''}
                        ${reserva.estado === 'completada' ? '<strong>Estado:</strong> <span class="estado-completada">COMPLETADA</span>' : ''}
                    </div>
                </div>
            `).join('');
        }

        getStatusLabel(estado) {
            const labels = {
                'activa': 'Activa',
                'cancelada': 'Cancelada',
                'completada': 'Completada',
                'pendiente': 'Pendiente',
                'rechazada': 'Rechazada'
            };
            return labels[estado] || estado;
        }

        async cancelarReserva(reservaId) {
            if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
                return;
            }

            try {
                const response = await fetch(`${this.apiBaseUrl}?action=cancelar_reserva`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        reserva_id: reservaId,
                        usuario_id: null
                    })
                });

                const result = await response.json();

                if (result.success) {
                    this.showSuccess('Reserva cancelada con éxito');
                    this.loadReservas();
                } else {
                    this.showError(result.message || 'Error al cancelar la reserva');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showError('Error de conexión con el servidor');
            }
        }

        async cargarReservaEnPasos(reservaId) {
            const reserva = this.reservas.find(r => r.id === reservaId);
            if (!reserva) return;

            this.reservaEnEdicion = reserva.id;

            // Paso 1: pre-seleccionar departamento
            this.selectedDepartamento = reserva.departamento_codigo;
            document.querySelectorAll(".departamento-card").forEach(card => {
                card.classList.toggle("selected", card.dataset.departamento === reserva.departamento_codigo);
            });
            const nextBtn2 = document.getElementById('nextToStep2');
            if (nextBtn2) nextBtn2.disabled = false;

            // Cargar espacios del departamento y pre-seleccionar el espacio
            await this.loadEspaciosByDepartamento(reserva.departamento_codigo);
            this.selectedEspacio = { id: reserva.espacio_id, nombre: reserva.espacio_nombre, capacidad: reserva.capacidad };
            setTimeout(() => {
                document.querySelectorAll('.espacio-card').forEach(card => {
                    card.classList.toggle('selected', card.dataset.espacioId == reserva.espacio_id);
                });
                const nextBtn3 = document.getElementById('nextToStep3');
                if (nextBtn3) nextBtn3.disabled = false;
            }, 100);

            // Paso 3: pre-seleccionar fecha y cargar disponibilidad
            this.selectedFecha = reserva.fecha;
            const fechaInput = document.getElementById("fechaReserva");
            if (fechaInput) {
                fechaInput.min = ''; // permitir fechas pasadas al editar
                fechaInput.value = reserva.fecha;
            }
            const horarioSection = document.getElementById('horarioSection');
            if (horarioSection) horarioSection.style.display = 'block';
            await this.loadHorariosDisponibles(reserva.fecha);

            // Re-seleccionar el horario actual
            this.selectedHorario = reserva.horario;
            this.selectedHorarios = [reserva.horario];
            const bloqueActual = document.querySelector(`[data-horario="${reserva.horario}"]`);
            if (bloqueActual) {
                bloqueActual.classList.add('selected');
                bloqueActual.classList.add('selectable');
            }
            this.updateHorariosSeleccionados();

            // Ir al paso 1 para que el usuario navegue
            this.showStep(1);
            this.updateProgressBar(1);

            // Scroll hacia arriba
            document.querySelector('.reserva-step')?.scrollIntoView({ behavior: 'smooth' });
        }

        mostrarResumenReserva() {
            const resumenContainer = document.getElementById('resumenReserva');
            if (!resumenContainer) return;

            const departamento = this.departamentos.find(d => d.codigo === this.selectedDepartamento);
            const departamentoNombre = departamento ? departamento.nombre : this.selectedDepartamento;

            let fechaDate = new Date(this.selectedFecha);
            fechaDate = new Date(fechaDate.getTime() + fechaDate.getTimezoneOffset() * 60000);

            const fechaFormateada = fechaDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const horarioFormateado = this.getHorarioLabel(this.selectedHorario);

            resumenContainer.innerHTML = `
                <div class="resumen-item">
                    <div class="resumen-label">Departamento:</div>
                    <div class="resumen-value">${departamentoNombre}</div>
                </div>
                <div class="resumen-item">
                    <div class="resumen-label">Espacio:</div>
                    <div class="resumen-value">${this.selectedEspacio.nombre}</div>
                </div>
                <div class="resumen-item">
                    <div class="resumen-label">Fecha:</div>
                    <div class="resumen-value">${fechaFormateada}</div>
                </div>
                <div class="resumen-item">
                    <div class="resumen-label">Horario:</div>
                    <div class="resumen-value">${horarioFormateado}</div>
                </div>
                <div class="resumen-item">
                    <div class="resumen-label">Capacidad:</div>
                    <div class="resumen-value">${this.selectedEspacio.capacidad} personas</div>
                </div>
            `;
        }

        getHorarioLabel(horario) {
            const labels = {
                'manana': 'Mañana (8:00 - 12:00)',
                'tarde': 'Tarde (14:00 - 18:00)'
            };

            if (horario && horario.includes('-') && !labels[horario]) {
                const [horaInicio, horaFin] = horario.split('-');
                return `Personalizado (${horaInicio} - ${horaFin})`;
            }

            return labels[horario] || horario;
        }

        formatDate(dateString) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        formatDateTime(dateTimeString) {
            const date = new Date(dateTimeString);
            return date.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        resetForm() {
            this.currentStep = 1;
            this.selectedDepartamento = null;
            this.selectedEspacio = null;
            this.selectedFecha = null;
            this.selectedHorario = null;
            this.selectedHorarios = [];
            this.reservaEnEdicion = null;

            document.querySelectorAll('.departamento-card').forEach(c => c.classList.remove('selected'));
            document.querySelectorAll('.espacio-card').forEach(c => c.classList.remove('selected'));

            const fechaInput = document.getElementById('fechaReserva');
            const horaInicio = document.getElementById('horaInicio');
            const horaFin = document.getElementById('horaFin');

            if (fechaInput) {
                fechaInput.value = '';
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                fechaInput.min = tomorrow.toISOString().split('T')[0];
            }
            if (horaInicio) horaInicio.value = '';
            if (horaFin) horaFin.value = '';

            const nextBtn2 = document.getElementById('nextToStep2');
            const nextBtn3 = document.getElementById('nextToStep3');
            const nextBtn4 = document.getElementById('nextToStep4');

            if (nextBtn2) nextBtn2.disabled = true;
            if (nextBtn3) nextBtn3.disabled = true;
            if (nextBtn4) nextBtn4.disabled = true;

            this.showStep(1);
            this.updateProgressBar(1);
        }

        setupMobileMenu() {
            const toggle = document.getElementById('mobileMenuToggle');
            const menu = document.querySelector('.nav-menu');

            if (toggle && menu) {
                toggle.addEventListener('click', () => {
                    menu.classList.toggle('active');
                });
            }
        }

        setupTabs() {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tabName = e.target.dataset.tab;

                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');

                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.style.display = 'none';
                    });
                    const targetTab = document.getElementById(`reservas${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
                    if (targetTab) {
                        targetTab.style.display = 'block';
                    }
                });
            });
        }

        setupFilters() {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const filter = e.target.dataset.filter;

                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');

                    this.filterEspacios(filter);
                });
            });
        }

        filterEspacios(filter) {
            const container = document.getElementById('espaciosShowcase');
            if (!container) return;

            let filteredEspacios = this.espacios;

            if (filter !== 'todos') {
                const tipoMap = {
                    'aulas': 'aula',
                    'laboratorios': 'laboratorio',
                    'comunes': 'comun'
                };

                const tipoFiltro = tipoMap[filter] || filter;
                filteredEspacios = this.espacios.filter(e => e.tipo === tipoFiltro);
            }

            container.innerHTML = filteredEspacios.map(espacio => `
                <div class="espacio-showcase">
                    <div class="espacio-imagen">
                        <i class="${this.getEspacioIcon(espacio.tipo)}"></i>
                    </div>
                    <div class="espacio-contenido">
                        <div class="espacio-header">
                            <span class="espacio-nombre">${espacio.nombre}</span>
                            <span class="espacio-tipo ${espacio.tipo}">${this.getTipoLabel(espacio.tipo)}</span>
                        </div>
                        <div class="espacio-meta">
                            <span><i class="fas fa-building"></i> ${espacio.departamento_nombre}</span>
                            <span><i class="fas fa-users"></i> ${espacio.capacidad}</span>
                        </div>
                        <div class="espacio-descripcion">${espacio.descripcion}</div>
                    </div>
                </div>
            `).join('');
        }

        getEspacioIcon(tipo) {
            const icons = {
                'aula': 'fas fa-chalkboard-teacher',
                'laboratorio': 'fas fa-flask',
                'comun': 'fas fa-users'
            };
            return icons[tipo] || 'fas fa-door-open';
        }

        showLoading() {
            const modal = document.getElementById('loadingModal');
            if (modal) {
                modal.classList.add('active');
            }
        }

        hideLoading() {
            const modal = document.getElementById('loadingModal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        showSuccess(message) {
            this.hideLoading();
            const modal = document.getElementById('successModal');
            if (modal) {
                const messageElement = document.getElementById('successMessage');
                if (messageElement) {
                    messageElement.textContent = message;
                }
                modal.classList.add('active');
            }
        }

        showError(message) {
            this.hideLoading();
            const errorModal = document.getElementById('errorModal');
            if (errorModal) {
                const errorMessage = document.getElementById('errorMessage');
                if (errorMessage) {
                    errorMessage.textContent = message;
                }
                errorModal.classList.add('active');
            }
        }

        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
            }
        }

        toggleMobileMenu() {
            const menu = document.querySelector('.nav-menu');
            if (menu) {
                menu.classList.toggle('active');
            }
        }

        logout() {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                window.location.href = 'login.html';
            }
        }

        async loadHorariosDisponibles(fecha) {

            const container = document.getElementById('horariosDisponibles');

            if (!container || !this.selectedEspacio) return;

            container.innerHTML = '';

            const bloquesHorarios = [
                { inicio: '06:00', fin: '08:00', label: '6:00 AM - 8:00 AM' },
                { inicio: '08:00', fin: '10:00', label: '8:00 AM - 10:00 AM' },
                { inicio: '10:00', fin: '12:00', label: '10:00 AM - 12:00 PM' },
                { inicio: '12:00', fin: '14:00', label: '12:00 PM - 2:00 PM' },
                { inicio: '14:00', fin: '16:00', label: '2:00 PM - 4:00 PM' },
                { inicio: '16:00', fin: '18:00', label: '4:00 PM - 6:00 PM' },
                { inicio: '18:00', fin: '20:00', label: '6:00 PM - 8:00 PM' },
                { inicio: '20:00', fin: '22:00', label: '8:00 PM - 10:00 PM' }
            ];

            for (const bloque of bloquesHorarios) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}?action=disponibilidad&espacio_id=${this.selectedEspacio.id}&fecha=${fecha}&horario=${bloque.inicio}-${bloque.fin}${this.reservaEnEdicion ? '&exclude_id=' + this.reservaEnEdicion : ''}`);
                    const result = await response.json();

                    const bloqueElement = document.createElement('div');
                    bloqueElement.className = 'horario-bloque';
                    bloqueElement.dataset.horario = bloque.inicio + '-' + bloque.fin;

                    const disponible = result.disponible;
                    const mensaje = result.mensaje || (disponible ? 'Disponible' : 'Ocupado');

                    bloqueElement.innerHTML = `
                        <div class="horario-tiempo">${bloque.label}</div>
                        <div class="horario-estado ${disponible ? 'disponible' : 'ocupado'}">
                            ${mensaje}
                        </div>
                    `;

                    if (disponible) {
                        bloqueElement.addEventListener('click', () => this.toggleHorarioSeleccion(bloque.inicio + '-' + bloque.fin));
                        bloqueElement.classList.add('selectable');
                    } else {
                        bloqueElement.classList.add('ocupado');
                    }

                    container.appendChild(bloqueElement);

                } catch (error) {
                    console.error('Error verificando disponibilidad:', error);
                }
            }

            this.selectedHorarios = [];
            this.updateHorariosSeleccionados();
        }

        toggleHorarioSeleccion(horario) {
            if (!this.selectedFecha) {
                this.showError('Por favor selecciona primero una fecha antes de elegir un horario.');
                return;
            }

            const bloque = document.querySelector(`[data-horario="${horario}"]`);

            if (bloque.classList.contains('selected')) {
                bloque.classList.remove('selected');
                this.selectedHorarios = this.selectedHorarios.filter(h => h !== horario);
            } else {
                bloque.classList.add('selected');
                this.selectedHorarios.push(horario);
            }

            this.updateHorariosSeleccionados();
        }

        updateHorariosSeleccionados() {
            const horaInicio = document.getElementById('horaInicio');
            const horaFin = document.getElementById('horaFin');

            if (this.selectedHorarios.length === 1) {
                const horario = this.selectedHorarios[0];
                const [inicio, fin] = horario.split('-');
                if (horaInicio) horaInicio.value = inicio;
                if (horaFin) horaFin.value = fin;
                this.selectedHorario = horario;
            } else {
                if (horaInicio) horaInicio.value = '';
                if (horaFin) horaFin.value = '';
                this.selectedHorario = null;
            }

            this.updateNextButton();
        }
    }

   
    //   MÉTODO PÚBLICO DEL SINGLETON
  
    function getInstance() {
        if (!instance) {
            instance = new SICAUReservationSystem();
        }
        return instance;
    }

    return { getInstance };

})();


//    INICIALIZACIÓN – GARANTIZADA UNA SOLA INSTANCIA

document.addEventListener('DOMContentLoaded', () => {
    window.sicau = SICAUSystemSingleton.getInstance();
});
