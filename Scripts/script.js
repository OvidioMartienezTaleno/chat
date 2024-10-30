const wsUrl = 'ws://172.24.104.98:8080';
const socket = new WebSocket(wsUrl);
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let selectedUserId = null;

// Verificar si hay un usuario logueado
if (!currentUser) {
    window.location.href = 'index.html';
}

socket.onopen = () => {
    console.log('Conectado al servidor WebSocket');
    requestFriendsList();
    
    // Informar al servidor que el usuario está conectado
    socket.send(JSON.stringify({
        type: 'user_connected',
        data: {
            userId: currentUser.id
        }
    }));
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Mensaje recibido:', data);

    switch(data.type) {
        case 'friends_list':
            if (data.success) {
                updateUsersList(data.friends.filter(friend => friend.id !== currentUser.id));
                
            }
            break;
        case 'messages_history':
            if (data.success) {
                displayMessages(data.messages);
            }
            break;
        case 'message_sent':
            if (data.success) {
                appendMessage(data.message);
                // Actualizar la vista del chat si es necesario
                if (selectedUserId === data.message.receiver_id) {
                    requestMessages(selectedUserId);
                }
            }
            break;
        case 'new_message':
            // Si el mensaje es del usuario seleccionado actualmente, mostrarlo
            if (data.message.sender_id === selectedUserId || 
                data.message.receiver_id === selectedUserId) {
                appendMessage(data.message);
                // Actualizar la vista del chat
                requestMessages(selectedUserId);
            } else {
                // Notificar nuevo mensaje de otro usuario
                notifyNewMessage(data.sender);
            }
            break;
        case 'friends_list':
            if (data.success) {           
                if (Array.isArray(data.friends)) {
                   //updateFriendsList2(data.friends.filter(friend => friend.id !== currentUser.id));
                } else {
                    console.error('Error: data.friends no es un array:', data.friends);
                }
            }
            break;
        case 'success':
            if(data.success){
                alert(data.message);
            }
            break;
        case 'delete':
            if(data.success){
                alert(data.message);
            }
            break;
    }
};


socket.onerror = (error) => {
    console.error('Error en WebSocket:', error);
};

socket.onclose = () => {
    console.log('Conexión cerrada');
};

function requestFriendsList() {
    socket.send(JSON.stringify({
        type: 'get_friends',
        data: {
            userId: currentUser.id 
        }
    }));
}

function updateUsersList(users) {
    const chatList = document.querySelector('.chat-list');
    chatList.innerHTML = '';

    // Itera sobre la lista de amigos o usuarios y crea un elemento para cada uno
    users.forEach(user => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.id = `user-${user.id}`;
        chatItem.innerHTML = `
            <strong>${user.full_name}</strong><br>
            <span class="username">@${user.user_name}</span>
        `;
        chatItem.addEventListener('click', () => selectUser(user));
        chatList.appendChild(chatItem);
    });
}

///=========================================================================================================esta funcion no se usa\
///pero esta por cualquier cosa
function updateFriendsList(friends) {
    const chatList = document.querySelector('.chat-list'); // Selecciona el contenedor de la lista de chats
    chatList.innerHTML = ''; // Limpia la lista actual

    // Itera sobre la lista de amigos y crea un elemento para cada uno
    friends.forEach(friend => {
        const chatItem = document.createElement('div'); // Crea un nuevo div para el amigo
        chatItem.className = 'chat-item'; // Asigna una clase al div
        chatItem.id = `friend-${friend.id}`; // Asigna un ID único al elemento

        // Establece el contenido HTML del elemento
        chatItem.innerHTML = `
            <strong>${friend.full_name}</strong><br>
            <span class="username">@${friend.user_name}</span>
        `;
        // Agrega un evento de clic para seleccionar al amigo
        chatItem.addEventListener('click', () => selectUser(friend)); // Usa la función selectUser para manejar la selección
        chatList.appendChild(chatItem); // Añade el nuevo elemento a la lista de chats
    });
}

function selectUser(user) {
    selectedUserId = user.id;
    document.querySelector('.chat-header div:first-child').textContent = user.full_name;
    
    // Remover notificación de nuevos mensajes
    document.getElementById(`user-${user.id}`).classList.remove('has-new-message');
    
    requestMessages(user.id);

    // Actualizar clase activa
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(`user-${user.id}`).classList.add('active');
}

function requestMessages(userId) {
    socket.send(JSON.stringify({
        type: 'get_messages',
        data: {
            other_user_id: userId
        }
    }));
}

function displayMessages(messages) {
    const messagesContainer = document.querySelector('.messages');
    messagesContainer.innerHTML = '';

    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`;
        messageDiv.innerHTML = `
            <div class="message-content">${msg.content}</div>
            <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(messageDiv);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendMessage(message) {
    const messagesContainer = document.querySelector('.messages');
    const messageDiv = document.createElement('div');
    const isSent = message.sender_id === currentUser.id;
    
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function notifyNewMessage(sender) {
    const userItem = document.getElementById(`user-${sender.id}`);
    if (userItem) {
        userItem.classList.add('has-new-message');
    }
}

// Configurar el header con la información del usuario
document.querySelector('.chat-header').innerHTML = `
    <div>Selecciona un usuario para chatear</div>
    <div class="user-info">
        <span>Usuario: ${currentUser.fullname}</span>
        <button id="logout" class="logout-btn">Cerrar Sesión</button>
    </div>
`;

// Manejar envío de mensajes
document.getElementById('sendMessage').addEventListener('click', () => {
    const inputMessage = document.getElementById('inputMessage').value.trim();
    
    if (inputMessage && selectedUserId) {
        socket.send(JSON.stringify({
            type: 'send_message',
            data: {
                receiver_id: selectedUserId,
                content: inputMessage
            }
        }));
        
        document.getElementById('inputMessage').value = '';
    }
});

// Manejar envío con Enter
document.getElementById('inputMessage').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('sendMessage').click();
    }
});

// Manejar cierre de sesión
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

//Boton para agregar amigos 
document.getElementById('addUserButton').addEventListener('click', () => {
    const userNameN = prompt('Ingrese el nombre del usuario:');
    if (userNameN) {
        
        // Informar al servidor del userName e id
        socket.send(JSON.stringify({
            type: 'add_friend',
            data: {
                userName: userNameN,
                userID: currentUser.id
            }
        }));
        location.reload();
    }
});

//Boton para eliminar amigos 
document.getElementById('deleteUserButton').addEventListener('click', () => {
    const userNameNe = prompt('Ingrese el nombre del usuario:');
    if (userNameNe) {
        
        // Informar al servidor del userName e id
        socket.send(JSON.stringify({
            type: 'delete_friend',
            data: {
                userName: userNameNe,
                userID: currentUser.id
            }
        }));
        location.reload();
    }
});