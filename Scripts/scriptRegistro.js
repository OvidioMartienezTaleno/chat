const wsUrl = 'ws://172.24.104.98:8080';
const socket = new WebSocket(wsUrl);
const errorMessage = document.getElementById('error-message');

socket.onopen = () => {
    console.log('Conectado al servidor WebSocket');
};

document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const fullname = document.getElementById('fullname').value;

    // Validaciones
    if (!username || !password || !confirmPassword || !fullname) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Todos los campos son obligatorios.';
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Las contraseñas no coinciden.';
        return;
    }

    const registerData = {
        type: 'register',
        data: {
            username: username,
            password: password,
            fullname: fullname
        }
    };

    socket.send(JSON.stringify(registerData));
});

socket.onmessage = (event) => {
    try {
        const response = JSON.parse(event.data);
        console.log('Respuesta recibida:', response); // Para depuración

        if (response.type === 'register') {
            if (response.success) {
                alert('Registro exitoso');
                // Pequeño retraso antes de la redirección
                setTimeout(() => {
                    window.location.replace('index.html');
                }, 1000);
            } else {
                errorMessage.style.display = 'block';
                errorMessage.textContent = response.message || 'Error en el registro.';
            }
        }
    } catch (error) {
        console.error('Error al procesar la respuesta:', error);
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Error en el procesamiento de la respuesta.';
    }
};

socket.onerror = (error) => {
    console.error('Error en WebSocket:', error);
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Error en la conexión.';
};

socket.onclose = () => {
    console.log('Conexión WebSocket cerrada');
};