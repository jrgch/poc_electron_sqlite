let chart;

const nombreInput = document.getElementById('nombre');
const edadInput = document.getElementById('edad');
const guardarBtn = document.getElementById('guardar');
const tablaBody = document.querySelector('#tabla tbody');

async function cargarPersonas() {
    const personas = await window.api.getPersonas();
    tablaBody.innerHTML = '';

    const labels = [];
    const edades = [];

    personas.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${p.nombre}</td>
                          <td>${p.edad}</td>`;
        tablaBody.appendChild(row);

        labels.push(p.nombre);
        edades.push(p.edad);
    });

    actualizarGrafico(labels, edades);
}

function actualizarGrafico(labels, data) {
    if (chart) {
        chart.destroy(); // Destruir el gráfico anterior para evitar superposiciones
    }

    const ctx = document.getElementById('edadChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Edad',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }
        }
    });
}

guardarBtn.addEventListener('click', async () => {
    const nombre = nombreInput.value.trim();
    const edad = parseInt(edadInput.value);
    if (nombre && !isNaN(edad)) {
        await window.api.addPersona({ nombre, edad });
        nombreInput.value = '';
        edadInput.value = '';
        cargarPersonas();
    }
});

cargarPersonas();