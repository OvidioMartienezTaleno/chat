const wsUrl = 'ws://172.24.104.98:8080';
const socket = new WebSocket(wsUrl);

// Verificar si ya hay una sesión activa
if (localStorage.getItem('currentUser')) {
    window.location.href = 'chats.html';
}

socket.onopen = () => {
    console.log('Conectado al servidor WebSocket');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'login') {
        if (data.success) {
            // Guardar información del usuario en localStorage
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            // Redirigir al usuario a index.html
            window.location.href = "chats.html";
        } else {
            const errorMessage = document.getElementById("error-message");
            errorMessage.style.display = "block";
            errorMessage.textContent = data.message || "Usuario o contraseña incorrectos.";
        }
    }
};

socket.onerror = (error) => {
    console.error('Error en WebSocket:', error);
    const errorMessage = document.getElementById("error-message");
    errorMessage.style.display = "block";
    errorMessage.textContent = 'Error en la conexión.';
};

socket.onclose = () => {
    console.log('Conexión cerrada');
};

document.getElementById("registro").addEventListener("click", function() {
    window.location.href = "registro.html";
});

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    errorMessage.style.display = "none";
    errorMessage.textContent = "";

    if (username.trim() && password.trim()) {
        const loginData = {
            type: 'login',
            data: {
                username: username,
                password: password
            }
        };
        socket.send(JSON.stringify(loginData));
    } else {
        errorMessage.style.display = "block";
        errorMessage.textContent = "Por favor, ingresa usuario y contraseña.";
    }
});

// Manejar Enter en los campos de entrada
document.getElementById("username").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("password").focus();
    }
});

document.getElementById("password").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("loginForm").dispatchEvent(new Event('submit'));
    }
});