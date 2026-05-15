document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    try {
        const rol = document.getElementById('tipo_persona').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Validar que todos los campos estén completos
        if (!rol || !email || !password) {
            alert("Por favor complete todos los campos");
            return;
        }

        // Enviar datos al servidor para autenticación
        fetch('../archivos_php/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo_persona: rol,
                email: email,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Guardar información del usuario en localStorage
                localStorage.setItem('sicau_user', JSON.stringify(data.user));

                // Redirigir basado en el tipo de usuario
                window.location.href = data.redirect;
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Error al procesar el login: " + error.message);
        });

    } catch (error) {
        console.error("Error:", error);
        alert("Error al procesar el login: " + error.message);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Pre-llenar el correo si viene desde verificar_correo.html
    const params = new URLSearchParams(window.location.search);
    const correo = params.get('correo');
    if (correo) {
        document.getElementById('email').value = decodeURIComponent(correo);
    }

    // Botón olvidé mi clave
    document.getElementById('btnOlvideClave').addEventListener('click', () => {
        const email = document.getElementById('email').value.trim();
        const correoParam = email ? `?correo=${encodeURIComponent(email)}` : '';
        window.location.href = `recuperar_clave.html${correoParam}`;
    });

    console.log("Sistema SICAU - Login cargado");
    console.log("Redirigiendo basado en tipo de usuario");

    // Mostrar información del sistema en consola
    console.log("=== SICAU - Sistema de Reservas Universitarias ===");
    console.log("✅ 6 departamentos académicos");
    console.log("✅ 27 espacios disponibles");
    console.log("✅ Sistema de reservas completo");
    console.log("✅ Base de datos MySQL integrada");
    console.log("✅ Responsive design");
});
