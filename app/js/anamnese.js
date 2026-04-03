// 1. Importa do Firebase e do firebase.config.js as ferramentas necessárias para manipular o banco de dados
import { db } from './firebase-config.js';
import { collection , addDoc , serverTimestamp  } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const form = document.getElementById('formAnamnese');


// 2. Adiciona um "ouvinte" para o evento de 'submit' (envio) do formulário
form.addEventListener('submit', async function(event) {
    
    // 3. Impede o comportamento padrão do formulário (que é recarregar a página)
    event.preventDefault(); 
    console.log("Iniciando salvamento no Firebase...");

    // 4. Cria um objeto FormData a partir do nosso formulário
    // Isso captura automaticamente todos os campos (name, value)
    const dadosFormulario = new FormData(form);

    // 5. Cria um objeto JavaScript vazio para armazenar os dados
    const paciente = {}
    
    // 6. Itera sobre cada par [chave, valor] capturado pelo FormData
    // e adiciona ao nosso objeto 'paciente'
    for (let [chave, valor] of dadosFormulario.entries()) {
        paciente[chave] = valor;
    }
    // Cálculo do IMC (Peso / Altura em metros ao quadrado)
    if (paciente.peso && paciente.altura) {
        const peso = parseFloat(paciente.peso);
        const altura = parseFloat(paciente.altura) / 100; // converte cm para metros
        const imc = (peso / (altura * altura)).toFixed(2);
    
    // Adicionamos o IMC ao objeto do paciente
    paciente.imc = imc;
    
    console.log(`IMC calculado para ${paciente.nome}: ${imc}`);
}

    // 7. A MÁGICA! Exibe o objeto completo no console
    console.log("Dados do Paciente Capturados:");
    console.log(paciente);

    try {
        // 8. Envia o objeto 'paciente' para o Firestore, dentro da coleção "pacientes"
        const docRef = await addDoc(collection(db, "pacientes"), {
            ...paciente,
            dataCriacao: serverTimestamp() // Registra a data e hora exata do cadastro
    });
        console.log("Paciente salvo com ID: ", docRef.id);   

        // 9. Exibe um alerta de sucesso para o usuário
        alert("Paciente cadastrado com sucesso na nuvem!");

        form.reset(); // Limpa o formulário para a próxima entrada

    } catch (error) {
        console.error("Erro ao salvar no Firebase:", error);
        alert("Erro ao salvar paciente. Verifique sua conexão.");
    }
});