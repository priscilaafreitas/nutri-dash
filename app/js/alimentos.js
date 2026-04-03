import { baseDeAlimentosCompleta } from './alimentos_data.js';

// Seleciona os elementos do HTML
const inputBusca = document.getElementById('buscaALimentos');
const tabelaCorpo = document.querySelector('#tabelaAlimentos tbody');


function exibirAlimentos(alimentos) {
    // Limpa a tabela antes de adicionar novas linhas
    tabelaCorpo.innerHTML = '';

    // Verifica se há resultados
    if (alimentos.length === 0) {
        tabelaCorpo.innerHTML = `<tr><td colspan="9">Nenhum alimento encontrado.</td></tr>`;
        return;
    }

    // Cria uma linha (tr) para cada alimento
    alimentos.forEach(alimento => {
        const tr = document.createElement('tr');


        tr.innerHTML = `
            <td>${alimento.nome_alimento}</td>
            <td>${alimento.grupo_alimento || 'N/D'}</td>
            <td>${alimento.umidade_percentual || 'N/D'}</td>
            <td>${alimento.calorias_kcal || 'N/D'}</td>
            <td>${alimento.proteína_g || 'N/D'}</td>
            <td>${alimento.lipídeos_g || 'N/D'}</td>
            <td>${alimento.colesterol_mg || 'N/D'}</td>
            <td>${alimento.carboidrato_g || 'N/D'}</td>
            <td>${alimento.fibra_g || 'N/D'}</td>
        `;
        tabelaCorpo.appendChild(tr);
    });
}

function filtrarEExibirAlimentos() {
    const termoBusca = inputBusca.value.toLowerCase();

    const resultados = baseDeAlimentosCompleta.filter(alimento =>
        alimento.nome_alimento.toLowerCase().includes(termoBusca) || 
        (alimento.grupo_alimento && alimento.grupo_alimento.toLowerCase().includes(termoBusca))
    );
    exibirAlimentos(resultados);
}

exibirAlimentos(baseDeAlimentosCompleta); // Exibe a lista completa ao carregar a página

// Adiciona o evento para filtrar a cada tecla digitada no campo de busca
inputBusca.addEventListener('input', filtrarEExibirAlimentos);