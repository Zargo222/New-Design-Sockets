const URL_SERVER = 'https://soatpagoweb.online';
// const URL_SERVER = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const linkId = urlParams.get('id');

        // Obtener la información del enlace con el ID proporcionado
        const response = await fetch(`${URL_SERVER}/links/${linkId}`);
        const { data } = await response.json();

        // Rellenar los campos del formulario con la información del enlace
        document.getElementById('editValueLink').value = data.valueLink;
        document.getElementById('editLink').value = data.link;

        // Agregar un controlador de eventos para el formulario de edición
        document.getElementById('editLinkForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const newValueLink = document.getElementById('editValueLink').value;
            const newLink = document.getElementById('editLink').value;

            // Realizar la petición para actualizar el enlace
            await updateLink(linkId, newValueLink, newLink);
        });
    } catch (error) {
        console.error('Error al cargar la página de edición', error);
    }
});

const updateLink = async (linkId, newValueLink, newLink) => {
    try {
        await fetch(`${URL_SERVER}/links/${linkId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ valueLink: newValueLink, link: newLink })
        });

        window.location.href = URL_SERVER + '/dashboard';
    } catch (error) {
        console.error('Error al actualizar el enlace', error);
    }
}
