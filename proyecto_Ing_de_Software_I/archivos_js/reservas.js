// SECCION ADMINISTRATIVO RESERVAS

// Verificar sesión activa y rol de administrador
(function checkSession() {
    const user = JSON.parse(localStorage.getItem('sicau_user') || 'null');
    if (!user || !user.id) {
        window.location.href = 'login.html';
    } else if (user.tipo !== 'administrador') {
        window.location.href = 'index.html';
    }
})();



document.addEventListener('DOMContentLoaded', () => {
  const btnAgregar = document.getElementById('btn-agregar');
  const btnVerReservas = document.getElementById('btn-ver-reservas');
  const btnConfiguracion = document.getElementById('btn-configuracion');
  const formulario = document.getElementById('formulario-espacio');
  const cancelar = document.getElementById('cancelar');
  const espacioForm = document.getElementById('espacioForm');
  const listaEspacios = document.getElementById('lista-espacios');
  const seccionReservas = document.getElementById('seccion-reservas');
  const seccionConfiguracion = document.getElementById('seccion-configuracion');

  // Mostrar formulario de espacio
  btnAgregar.addEventListener('click', () => {
    formulario.classList.remove('oculto');
    seccionReservas.classList.add('oculto');
    seccionConfiguracion.classList.add('oculto');
  });

  // Cancelar formulario
  cancelar.addEventListener('click', () => {
    formulario.classList.add('oculto');
    espacioForm.reset();
  });

  // Mostrar sección de reservas
  btnVerReservas.addEventListener('click', () => {
    seccionReservas.classList.remove('oculto');
    formulario.classList.add('oculto');
    seccionConfiguracion.classList.add('oculto');
    cargarReservas();
    // Desplazar la página hacia la sección de reservas
    seccionReservas.scrollIntoView({ behavior: 'smooth' });
  });

  // Mostrar configuración
  btnConfiguracion.addEventListener('click', () => {
    seccionConfiguracion.classList.remove('oculto');
    formulario.classList.add('oculto');
    seccionReservas.classList.add('oculto');
    cargarEstadisticas();
    seccionConfiguracion.scrollIntoView({ behavior: 'smooth' });
  });

  // Variables para filtros
  const filtroDepartamento = document.getElementById('filtro-departamento');
  const filtroTipo = document.getElementById('filtro-tipo');
  const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');

  // Cargar espacios al iniciar
  cargarEspacios();

  // Event listeners para filtros
  btnAplicarFiltros.addEventListener('click', () => {
    cargarEspacios();
  });

  // Enviar formulario de espacio
  espacioForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = new FormData(espacioForm);
    datos.append('action', 'agregar_espacio');

    fetch('../archivos_php/reservas.php', {
      method: 'POST',
      body: datos
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        alert(data.message);
        espacioForm.reset();
        formulario.classList.add('oculto');
        cargarEspacios();
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(err => console.error('Error:', err));
  });

  // Función para cargar espacios
  function cargarEspacios() {
    const departamento = filtroDepartamento.value;
    const tipo = filtroTipo.value;
    const params = new URLSearchParams();
    params.append('action', 'espacios');
    if (departamento) params.append('departamento', departamento);
    if (tipo) params.append('tipo', tipo);

    fetch(`../archivos_php/reservas.php?${params.toString()}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Error en la respuesta del servidor');
        }
        return res.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          listaEspacios.innerHTML = '';
          if (data.data.length === 0) {
            listaEspacios.innerHTML = '<p>No se encontraron espacios con los filtros aplicados.</p>';
          } else {
            data.data.forEach(espacio => {
              const card = document.createElement('div');
              card.className = 'espacio-card';
              card.innerHTML = `
                <div class="menu" data-id="${espacio.id}">⋮</div>
                <div class="menu-dropdown" data-id="${espacio.id}">
                  <ul>
                    <li data-action="edit" data-id="${espacio.id}">Configurar Espacio</li>
                  </ul>
                </div>
                <h3>${espacio.nombre}</h3>
                <p><strong>Departamento:</strong> ${espacio.departamento_nombre}</p>
                <p><strong>Tipo:</strong> ${espacio.tipo}</p>
                <p><strong>Capacidad:</strong> ${espacio.capacidad}</p>
                <p>${espacio.descripcion}</p>
              `;
              listaEspacios.appendChild(card);
            });
          }

        } else {
          console.error('Error: Datos no válidos o respuesta fallida');
        }
      })
      .catch(err => console.error('Error al cargar espacios:', err));
  }

  // Event listeners para el menú de configuración
  listaEspacios.addEventListener('click', (e) => {
    if (e.target.classList.contains('menu')) {
      const id = e.target.dataset.id;
      const dropdown = document.querySelector(`.menu-dropdown[data-id="${id}"]`);
      dropdown.classList.toggle('show');
    } else if (e.target.dataset.action === 'edit') {
      const id = e.target.dataset.id;
      const dropdown = document.querySelector(`.menu-dropdown[data-id="${id}"]`);
      dropdown.classList.remove('show');
      editarEspacio(id);
    }
  });

  // Función para editar espacio
  function editarEspacio(id) {
    fetch(`../archivos_php/reservas.php?action=espacios`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const espacio = data.data.find(e => e.id == id);
          if (espacio) {
            document.getElementById('editar-id').value = espacio.id;
            document.getElementById('editar-nombre').value = espacio.nombre;
            document.getElementById('editar-departamento').value = espacio.departamento_codigo;
            document.getElementById('editar-tipo').value = espacio.tipo;
            document.getElementById('editar-capacidad').value = espacio.capacidad;
            document.getElementById('editar-descripcion').value = espacio.descripcion || '';
            document.getElementById('formulario-editar-espacio').classList.remove('oculto');
          }
        }
      });
  }

  // Cancelar edición
  document.getElementById('cancelar-editar').addEventListener('click', () => {
    document.getElementById('formulario-editar-espacio').classList.add('oculto');
    document.getElementById('editarEspacioForm').reset();
  });

  // Enviar formulario de edición
  document.getElementById('editarEspacioForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = new FormData(e.target);
    datos.append('action', 'editar_espacio');

    fetch('../archivos_php/reservas.php', {
      method: 'POST',
      body: datos
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        document.getElementById('formulario-editar-espacio').classList.add('oculto');
        cargarEspacios();
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(err => console.error('Error:', err));
  });



  // Función para cargar estadísticas
  function cargarEstadisticas() {
    fetch('../archivos_php/reservas.php?action=estadisticas')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const s = data.data;
          document.getElementById('stat-reservas-activas').textContent = s.reservas_activas ?? '–';
          document.getElementById('stat-total-reservas').textContent = s.total_reservas ?? '–';
          document.getElementById('stat-espacios').textContent = s.total_espacios ?? '–';
          document.getElementById('stat-departamentos').textContent = s.total_departamentos ?? '–';
        }
      })
      .catch(err => console.error('Error cargando estadísticas:', err));
  }

  // Función para cargar reservas
  function cargarReservas() {
    fetch('../archivos_php/reservas.php?action=reservas')
      .then(res => {
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        return res.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const contenedor = document.getElementById('lista-reservas');
          contenedor.innerHTML = '';
          if (data.data.length === 0) {
            contenedor.innerHTML = '<p>No hay reservas registradas.</p>';
          } else {
            data.data.forEach(reserva => {
              const card = document.createElement('div');
              card.className = 'espacio-card';
              card.innerHTML = `
                <h3>${reserva.fecha} - ${reserva.horario}</h3>
                <p><strong>Espacio:</strong> ${reserva.espacio_nombre || 'N/A'}</p>
                <p><strong>Usuario:</strong> ${reserva.usuario_nombre || 'Sin usuario'}</p>
                <p><strong>Departamento:</strong> ${reserva.departamento_nombre || 'N/A'}</p>
                <p><strong>Estado:</strong> <span class="estado-${reserva.estado}">${reserva.estado}</span></p>
                ${reserva.estado === 'activa' ? `<button class="btn-cancelar-reserva" data-id="${reserva.id}">Cancelar reserva</button>` : ''}
              `;
              contenedor.appendChild(card);
            });

            // Eventos para cancelar
            contenedor.querySelectorAll('.btn-cancelar-reserva').forEach(btn => {
              btn.addEventListener('click', () => {
                if (!confirm('¿Cancelar esta reserva?')) return;
                fetch('../archivos_php/reservas.php?action=cancelar_reserva', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reserva_id: btn.dataset.id })
                })
                .then(r => r.json())
                .then(result => {
                  alert(result.success ? 'Reserva cancelada' : 'Error: ' + result.message);
                  if (result.success) cargarReservas();
                })
                .catch(err => console.error('Error:', err));
              });
            });
          }
        } else {
          document.getElementById('lista-reservas').innerHTML = '<p>Error al cargar reservas.</p>';
        }
      })
      .catch(err => {
        console.error('Error al cargar reservas:', err);
        document.getElementById('lista-reservas').innerHTML = '<p>Error al cargar reservas.</p>';
      });
  }
});






