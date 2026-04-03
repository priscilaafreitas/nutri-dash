import { db } from './firebase-config.js';
import { collection, getDocs , doc , deleteDoc , getDoc  } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// collection referencia um grupo de documentos dentro do Firestore, nesse caso a coleção "pacientes". collection(db , "pacientes").
// getDocs busca vários documentos de uma vez (o "s" vem do plural) e retorna um snapshot com os resultados. getDocs(collection(db, "pacientes")). Carrega a tabela toda de pacientes cadastrados.
// doc  referencia um único documento específico. Necessário definir ID. doc(db , "pacientes", "id_do-joão").
// deleteDoc é a função que deleta um documento específico (quando a função removerPaciente é acionada). deleteDoc(doc(db, "pacientes", id)).
// getDoc busca um único documento específico e retorna um snapshot com os dados. getDoc(doc(db, "pacientes", id)). 

async function carregarLista() {
    const tabelaCorpo = document.getElementById('corpoTabelaPacientes');

    // Limpa a tabela antes de preencher
    tabelaCorpo.innerHTML = "<tr><td colspan='6'>Carregando...</td></tr>";

    try {
        // Busca a coleção completa de pacientes no db 
        const querySnapshot = await getDocs(collection(db, "pacientes"));
        
        tabelaCorpo.innerHTML = ""; // Limpa a mensagem de "Carregando..." antes de preencher com os dados reais
        
        // Itera pelos documentos retornados pela nuvem
        querySnapshot.forEach((doc) => {
            const p = doc.data();
            const idPaciente = doc.id; // ID do documento no Firestore

            const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nome || idPaciente}</td>
            <td>${p.nascimento || '--'}</td>
            <td>${p.peso || '--'} kg</td>
            <td><strong>${p.imc || 'N/D'}</strong></td>
            <td>${p.objetivo || '--'}</td>
            <td>
                <button class="btn-plano" onclick="irParaPlano('${idPaciente}')">🍎</button>
                <button class="btn-excluir" onclick="removerPaciente('${idPaciente}')">🗑️</button>
            </td>
        `;
        tabelaCorpo.appendChild(tr);
    });

    if (querySnapshot.empty) {
        tabelaCorpo.innerHTML = "<tr><td colspan='6'>Nenhum paciente encontrado.</td></tr>";
    }

    } catch (error) {
        console.error("Error ao carregar lista do Firebase:", error);
        tabelaCorpo.innerHTML = "<tr><td colspan='6'>Erro ao carregar dados.</td></tr>";
    }
}

// Função para remover paciente usando o ID (nome)
async function removerPaciente(id){
    if (confirm(`Tem certeza que deseja excluir o paciente ${id}?`)) {
        try {
            await deleteDoc(doc(db, "pacientes", id));

            alert("Paciente removido com sucesso!");
            carregarLista(); // Recarrega a lista na tela
        } catch (error) {
            console.error("Erro ao remover:", error);
            alert("Erro ao remover paciente da nuvem.");
        }
    }
}

async function irParaPlano(id) {
    try {
        //Busca os dados completos desse paciente específico
        const docSnap = await getDoc(doc(db, "pacientes", id));

        if (docSnap.exists()) {
            // Armazena no localStorage para a página plano_dietetico.js acessar
            localStorage.setItem('pacienteAtivo', JSON.stringify(docSnap.data()));
            window.location.href = 'plano_dietetico.html'; // Redireciona para a página do plano dietético
        } else {
            alert("Erro ao encontrar dados do paciente.");
        }
    } catch (error) {
        console.error("Erro ao buscar paciente:", error);
    }
}

// Carrega assim que a página abre
document.addEventListener('DOMContentLoaded', carregarLista);

// --- Registro do Service Worker ---
// Verifica se o navegador suporta Service Workers
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // O '../' é vital aqui para sair da pasta 'js' e achar o 'sw.js' na 'app'
        navigator.serviceWorker.register('../sw.js') 
            .then(reg => console.log('PWA ativo no escopo:', reg.scope))
            .catch(err => console.log('Erro no registro do PWA:', err));
    });
}