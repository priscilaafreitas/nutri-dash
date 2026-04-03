// Ouve o clique no botão de salvar plano para enviar os dados para o main.js
const {ipcRenderer} = require('electron');
let meuGrafico = null;
let listaALimentos = []; // Variável global para guardar a TACO

function inicializarGrafico() {
    const ctx = document.getElementById('graficoMacros').getContext('2d');

    meuGrafico = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Proteína (kcal)', 'Gordura (kcal)', 'Carboidrato (kcal)'],
            datasets: [{
                data: [0, 0, 0], // Começa zerado
                backgroundColor: ['#2e7d32','#fbc02d','#1976d2'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function calcularIdade (dataNascimento) {
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
    }
    return idade;
}

function calcularTMB (paciente, equacao) {
    const peso = parseFloat(paciente.peso);
    const altura = parseFloat(paciente.altura);
    const idade = calcularIdade(paciente.nascimento);
    const sexo = paciente.sexo;

    switch (equacao) {
        case 'mifflin': //Mifflin-St Jeor
            const s = (sexo === 'masculino') ? 5 : -161;
            return (10 * peso) + (6.25 * altura) - (5 * idade) + s;
            
        case 'fao': //FAO/WHO (18-30 anos)
            if (sexo === 'masculino') return (15.3 * peso) + 679;
            return (14.7 * peso) + 496;

        case 'henry': //Henry
            if (sexo === 'masculino') return (14.4 * peso) + 313 * (altura/100) + 113;
            return (10.4 * peso) + 615 * (altura/100)  - 282;

        case 'schofield': //Schofield
            if (sexo === 'masculino') return (15.057 * peso) + 692.2;
            return (14.818 * peso) + 486.6;

        case 'eer': //EER (simplificada)
            if (sexo === 'masculino') return 662 - (9.53 * idade) + 1.2 * ((15.91 * peso) + (539.6 * altura/100));
            return 354 - (6.91 * idade) + 1.2 * ((9.36 * peso) + (726 * altura/100));

        case 'harris': //Harris-Benedict
        default:
            if (sexo === 'masculino') return 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * idade);
            return 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * idade);

    }
}

function formatarNutriente(valor) {
    if (!valor || valor ==="NA") return 0;
    return parseFloat(valor.toString().replace(',','.'));
}

document.addEventListener('DOMContentLoaded', () => {
    const dadosResumo = document.getElementById('dadosResumo');
    const tmbValor = document.getElementById('tmbValor');
    const getValor = document.getElementById('getValor'); // Pegando o campo do GET
    const seletorAtividade = document.getElementById('fatorAtividade'); // Pegando o Select pelo ID
    const seletorEquacao = document.getElementById('equacaoTMB'); // Pega a equação que o nutricionista escolheu no HTML
    const containerRefeicoes = document.getElementById('containerRefeicoes'); // Container onde as refeições serão adicionadas
    const btnAddRefeicao = document.getElementById('btnAdicionarRefeicao'); // Botão para adicionar refeição

    const paciente = JSON.parse(localStorage.getItem('pacienteAtivo'));

    if (!paciente) {
        dadosResumo.innerHTML = "<p>Nenhum paciente selecionado.</p>";
        return;
    }

    dadosResumo.innerHTML = `
        <p><strong>Paciente:</strong> ${paciente.nome}</p>
        <p><strong>Peso:</strong> ${paciente.peso}kg | <strong>Altura:</strong> ${paciente.altura}cm</p>
    `;

    // Persistência: Carrega valores salvos
    if (paciente.fatorAtividade) {
        seletorAtividade.value = paciente.fatorAtividade;
    }
    if (paciente.equacaoTMB) {
        seletorEquacao.value = paciente.equacaoTMB;
    }
    if (paciente.protGKg) {
        document.getElementById('protGKg').value = paciente.protGKg;
    }
    if (paciente.gordPerc) {
        document.getElementById('gordPerc').value = paciente.gordPerc;
    }

    
    // Chamar para a montagem do gráfico
    inicializarGrafico();

    calcularTudo();// Lógica para adicionar refeição
    // Executa uma vez ao abrir a página

    // Verifica se o paciente já possui um plano salvo e reconstroi a interface
    if (paciente.planoAlimentar && paciente.planoAlimentar.length > 0) {
        paciente.planoAlimentar.forEach(ref => {
            // Criamos o card usando a função que você já tem
            criarCardRefeicao(ref.titulo);

            // Pegamos o último card criado para adicionar os alimentos nele
            const todosCards = document.querySelectorAll('.card-refeicao');
            const ultimoCard = todosCards[todosCards.length - 1];
            const corpoTabela = ultimoCard.querySelector('.corpo-refeicao');

            ref.alimentos.forEach(alimento => {
                // Criamos um objeto temporário para passar para sua função adicionarLinhaALimento
                const objetoAlimento = {
                    nome_alimento: alimento.nome,
                    proteína_g: alimento.pBase,
                    lipídeos_g: alimento.gBase,
                    carboidrato_g: alimento.cBase,
                    calorias_kcal: alimento.kBase
                };

                adicionarLinhaAlimento(corpoTabela, objetoAlimento);

                // Ajusta a quantidade salva
                const todasLinhas = corpoTabela.querySelectorAll('tr');
                const ultimaLinha = todasLinhas[todasLinhas.length - 1];
                const inputQtd = ultimaLinha.querySelector('.input-qtd-alimento');
                inputQtd.value = alimento.quantidade;

                // Força o recálculo dos macros daquela linha
                calcularLinhaProporcional(ultimaLinha);
            });
        });

        // Atualiza o total do dia após carregar tudo
        atualizarTotaisDoDia();
    }

    // Função que faz o cálculo completo
    function calcularTudo() {
        // 1. Necessário para as Macros
        const peso = parseFloat(paciente.peso);

        // 2. Chama a função mestre 
        const tmb = calcularTMB(paciente, seletorEquacao.value);


        // 3. Calcula e atualiza o GET
        const fator = parseFloat(seletorAtividade.value);
        const get = tmb * fator;

        // 4. Atualiza TMB e GET na tela
        tmbValor.innerText = tmb.toFixed(0);
        getValor.innerText = get.toFixed(0);

        // 5. Cácula Macronutrientes
        // Proteína
        const gkgProt = parseFloat(document.getElementById('protGKg').value) || 0;
        const protG = peso * gkgProt;
        const protKcal = protG * 4;

        // Gordura
        const percGord = parseFloat(document.getElementById('gordPerc').value) || 0;
        const gordKcal = get * (percGord / 100);
        const gordG = gordKcal / 9;

        // Carboidrato (restante)
        const carboKcal = get - (protKcal + gordKcal);
        const carboG = carboKcal / 4;
       
        //  Exibir na tela
        // Proteína (g/kg)
        document.getElementById('resProtG').innerText = protG.toFixed(1);
        document.getElementById('resProtKcal').innerText = protKcal.toFixed(0);

        // Gordura (%)
        document.getElementById('resGordG').innerText = gordG.toFixed(1);
        document.getElementById('resGordKcal').innerText = gordKcal.toFixed(0);

       // Carboidrato (restante)
        document.getElementById('resCarboG').innerText = carboG.toFixed(1);
        document.getElementById('resCarboKcal').innerText = carboKcal.toFixed(0);

        // Atualizar gráfico
        if (meuGrafico) {
            meuGrafico.data.datasets[0].data = [protKcal, gordKcal, carboKcal];
            meuGrafico.update();
        }
    }

    async function carregarBaseAlimentos() {
        listaALimentos = await ipcRenderer.invoke('obter-alimentos');
        console.log("TACO carregada!");
    }

    carregarBaseAlimentos();

    // ---FUNÇÃO DE BUSCA E ADIÇÃO DE ALIMENTOS---
    function adicionarLinhaAlimento(corpoTabela, alimento) {
        const tr = document.createElement('tr');

        //Converte valores da TACO para números
        const pBase = formatarNutriente(alimento.proteína_g);
        const gBase = formatarNutriente(alimento.lipídeos_g);
        const cBase = formatarNutriente(alimento.carboidrato_g);
        const kBase = formatarNutriente(alimento.calorias_kcal);
        
        tr.innerHTML = `
        <td>${alimento.nome_alimento}</td>
        <td> <input type="number" value="100" class="input-qtd-alimento" data-p="${pBase}" data-g="${gBase}" data-c="${cBase}" data-k="${kBase}"></td>
        <td class="res-p">${pBase.toFixed(1)}</td>
        <td class="res-g">${gBase.toFixed(1)}</td>
        <td class="res-c">${cBase.toFixed(1)}</td>
        <td class="res-k">${kBase.toFixed(0)}</td>
        <td><button class="btn-remover-alimento" title="Remover alimento">x</button></td>
        `;

        // Adiciona o evento de recálculo quando mudar a quantidade
        const inputQtd = tr.querySelector('.input-qtd-alimento');
        inputQtd.addEventListener('input', () => {
            calcularLinhaProporcional(tr)
            atualizarTotaisDoDia(); //Recalcula a soma geral
        });

        // Evento: remove apenas o alimento e atualiza o TOTAL DO DIA
        tr.querySelector('.btn-remover-alimento').addEventListener('click', ()=> {
            tr.remove();
            atualizarTotaisDoDia();
        });

        corpoTabela.appendChild(tr);
        atualizarTotaisDoDia(); // Soma o alimento assim que ele é inserido
    }

    // ---FUNÇÃO DE RECÁLCULO DA LINHA---
    function calcularLinhaProporcional(tr) {
        const input = tr.querySelector('.input-qtd-alimento');

        const qtd = parseFloat(input.value) || 0;

        // Recupera valores base guardadas em 'data -'
        const pBase = parseFloat(input.dataset.p);
        const gBase = parseFloat(input.dataset.g);
        const cBase = parseFloat(input.dataset.c);
        const kBase = parseFloat(input.dataset.k);

        // Cálculo proporcional: (Quantidade / 100) * ValorBase
        // Utiliza-se LaTex para a lógica: $$Valor_{final} = \frac{Qtd \times Valor_{base}}{100}$$
        tr.querySelector('.res-p').innerText = ((qtd * pBase) / 100).toFixed(1);
        tr.querySelector('.res-g').innerText = ((qtd * gBase) / 100).toFixed(1);
        tr.querySelector('.res-c').innerText = ((qtd * cBase) / 100).toFixed(1);
        tr.querySelector('.res-k').innerText = ((qtd * kBase) / 100).toFixed(0);
    }
    
    // ---FUNÇÕES PARA GERENCIAR REFEIÇÕES---
    function criarCardRefeicao(titulo) {
        const div = document.createElement('div');
        div.className = 'card-refeicao';
        div.innerHTML = `
            <div class="refeicao-topo">
                <input type="text" value="${titulo}" class="input-transparente">
                <button class="btn-delete">🗑️</button>
                </div>
            <div class="busca-alimento-container">
                <input type="text" class="input-busca" placeholder="Buscar alimento na TACO...">
                <div class="lista-sugestoes"></div>
            </div>
            <table class="tabela-alimentos">
                <thead>
                    <tr>
                        <th>Alimento</th>
                        <th>Qtd (g)</th>
                        <th>P</th>
                        <th>G</th>
                        <th>C</th>
                        <th>Kcal</th>
                    </tr>
                </thead>
                <tbody class="corpo-refeicao"></tbody>
            </table>
            <button class="btn-add-alimento">+ Alimento</button>
        `;
        const inputBusca = div.querySelector('.input-busca');
        const listaSugestoes = div.querySelector('.lista-sugestoes');
        const corpoTabela = div.querySelector('.corpo-refeicao');
        const btnAddAlimento = div.querySelector('.btn-add-alimento');

        // Botão "+Alimento" leva o foco para a busca

        btnAddAlimento.addEventListener('click', () =>{
            inputBusca.focus();
        });

        // Lógica de filtro enquanto digita
        inputBusca.addEventListener('input', (e) =>{
            const termo = e.target.value.toLowerCase();
            listaSugestoes.innerHTML = ''; // Limpa sugestões anteriores

            if (termo.length < 3) return; // Buscas a partir de 3 letras

            const resultados = listaALimentos.filter(a =>
                a.nome_alimento.toLowerCase().includes(termo)
            ).slice(0, 5); //Mostra apenas 5 primeiros

            resultados.forEach(alimento => {
                const item = document.createElement('div');
                item.className = 'sugestao-item';
                item.innerHTML = alimento.nome_alimento;
                item.onclick = () => {
                    adicionarLinhaAlimento(corpoTabela, alimento);
                    listaSugestoes.innerHTML = '';
                    inputBusca.value = '';
                };
                listaSugestoes.appendChild(item);
            });
        });

        // Lógica para deletar alimento
        div.querySelector('.btn-delete').addEventListener('click', () => {
            div.remove();
            atualizarTotaisDoDia();
        }); // Lógica para deletar refeição
        containerRefeicoes.appendChild(div);
    }

    // ---FUNÇÃO Soma Total vs. Meta---
    function atualizarTotaisDoDia () {
        let totalP = 0, totalG = 0, totalC = 0, totalKcal = 0;

        // Varre todas as células de resultado na tela e soma os valores
        document.querySelectorAll('.res-p').forEach(td => totalP += parseFloat(td.innerText) || 0);
        document.querySelectorAll('.res-g').forEach(td => totalG += parseFloat(td.innerText) || 0);
        document.querySelectorAll('.res-c').forEach(td => totalC += parseFloat(td.innerText) || 0);
        document.querySelectorAll('.res-k').forEach(td => totalKcal += parseFloat(td.innerText) || 0);

        // Busca as metas (GET) que calculamos lá no topo
        const metaKcal = parseFloat(document.getElementById('getValor').innerText) || 0;

        // Calcula a porcentagem para a barra de progresso
        const progressoDiv = document.getElementById('progressoMacros');

        if (progressoDiv) {
            progressoDiv.innerHTML = `
                <div>
                    <div>
                        <strong>Energia Total:</strong> ${totalKcal.toFixed(1)} / ${metaKcal.toFixed(0)} kcal
                    </div>
                    <div>
                        <span>P: <strong>${totalP.toFixed(1)}</strong></span>
                        <span>G: <strong>${totalG.toFixed(1)}</strong></span>
                        <span>C: <strong>${totalC.toFixed(1)}</strong></span>
                    </div>
                </div>
            `;
        }
    }
    // "Ouve" quando você muda a opção no Select
    seletorAtividade.addEventListener('change', calcularTudo);
    seletorEquacao.addEventListener('change', calcularTudo);
    document.getElementById('protGKg').addEventListener('input', calcularTudo); // Ouve mudanças no campo de proteína por kg
    document.getElementById('gordPerc').addEventListener('input', calcularTudo); // Ouve mudanças no campo de gordura percentual

    document.getElementById('btnSalvarPlano').addEventListener('click', async () => {
        const listaRefeicoesParaSalvar = [];
        
        // Percorre cada card de refeição (Café, Almoço, etc)
        document.querySelectorAll('.card-refeicao').forEach(card => {
            const tituloRefeicao = card.querySelector('.input-transparente').value;
            const alimentos = [];

            // Percorre cada linha de alimento dentro desta refeição
            card.querySelectorAll('.corpo-refeicao tr').forEach(linha => {
                const inputQtd = linha.querySelector('.input-qtd-alimento');

                alimentos.push({
                    nome: linha.cells[0].innerText,
                    quantidade: inputQtd.value,
                    //Guardamos os valores base para reconstruir a linha depois
                    pBase: inputQtd.dataset.p,
                    gBase: inputQtd.dataset.g,
                    cBase: inputQtd.dataset.c,
                    kBase: inputQtd.dataset.k
                });
            });

            listaRefeicoesParaSalvar.push({
                titulo: tituloRefeicao,
                alimentos: alimentos
            });
        })

        const planoCompleto = {
            id: paciente.nome, // Para saber quem vamos atualizar
            equacaoTMB: seletorEquacao.value,
            fatorAtividade: seletorAtividade.value,
            protGKg: document.getElementById('protGKg').value,
            gordPerc: document.getElementById('gordPerc').value,
            planoAlimentar: listaRefeicoesParaSalvar, // Aqui enviamos as refeições
            dataAtualizacao: new Date().toISOString()
        };

        try {
            // Carrega as ferramentas de escrita do Firebase
            const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js");

            // Salva no Firestore: Coleção "pacientes" documento com o nome do paciente
            await setDoc(doc(window.db, "pacientes", paciente.nome), planoCompleto); 

            const pacienteAtualizado = { ...paciente, ...planoCompleto };
        localStorage.setItem('pacienteAtivo', JSON.stringify(pacienteAtualizado));

        alert("Plano salvo na nuvem com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar no Firebase:" , error);
            alert("Erro ao salvar na nuvem. Verifque sua conexão.");
        } 
    });

    btnAddRefeicao.addEventListener('click', () => {
        criarCardRefeicao("Nova Refeição");
    }); 

    document.getElementById('btnImprimirPlano').addEventListener('click', () => {
        // Guarda o nome que está na aba 
        const tituloOriginal = document.title;

        // Limpar o nome
        const nomeLimpo = paciente.nome.replace(/\s+/g,'_');

        // Construindo o nome do arquivo dinamicamente
        const nomeArquivo = `Plano_Alimentar_${nomeLimpo}`;

        // Aplicar novo nome ao arquivo
        document.title = nomeArquivo;
        
        window.print(); // Abre a caixa de diálogo de impressão do sistema

        // Título volta a ser "tituloOriginal"
        document.title = tituloOriginal;
    });
});