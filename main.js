const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

app.disableHardwareAcceleration(); //Desativa a aceleração de hardware para evitar problemas gráficos
app.commandLine.appendSwitch('disable-software-rasterizer');// Desativa o rasterizador de software para evitar problemas gráficos
app.commandLine.appendSwitch('disable-gpu');// Desativa a aceleração de GPU para evitar problemas gráficos
app.commandLine.appendSwitch('disable-dev-shm-usage');// Desabilitar o uso de memória compartilhada
app.commandLine.appendSwitch('no-sandbox');// Desativa o sandbox para evitar problemas de permissão em algumas distribuições Linux
app.commandLine.appendSwitch('remote-debugging-port', '9222');
app.commandLine.appendSwitch('remote-allow-origins', '*'); //Permite que o depurador externo se conecte sem ser rejeitado

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Aqui dizemos para o Electron abrir o seu index.html
    win.loadFile('app/index.html');
}

// PONTE IPC PARA LER O ARQUIVO JSON
ipcMain.on('salvar-paciente', (event, novoPaciente) => {
    const caminhoArquivo = path.join(__dirname, 'data', 'pacientes.json');

    // Lê o arquivo JSON existente
    fs.readFile(caminhoArquivo, 'utf-8', (err, data) => {
        let pacientes = [];
        if (!err && data) {
            pacientes = JSON.parse(data); // transforma o texto em lista, se o arquivo existir
        }

        // Adiciona o novo paciente à lista
        pacientes.push(novoPaciente);

        // Escreve a lista atualizada de volta no arquivo JSON
        fs.writeFile(caminhoArquivo, JSON.stringify(pacientes, null, 2), (err) => {
            if (err) {
                console.error('Erro ao salvar paciente:', err);
            } else {
                console.log('Paciente salvo com sucesso no arquivo JSON!');
            }
            });
        });
});
//---------------------------------------------------------------------------------------------------------------
//Exibir tabela de pacientes registrados na tela
ipcMain.handle('obter-pacientes', async () => {
    const caminhoArquivo = path.join(__dirname, 'data', 'pacientes.json');
    try {
        const data = fs.readFileSync(caminhoArquivo, 'utf-8');
        return JSON.parse(data); // Manda a lista de volta para a tela
    } catch (err) {
        return []; // Se der erro (ex: arquivo não existe), retorna uma lista vazia
        }
    }
);


//-----PONTE IPC: BUSCAR ALIMENTOS PARA CRIAR PLANOS ALIMENTARES--------------------------------------------------
ipcMain.handle('obter-alimentos', async() => {
    const caminho = path.join(__dirname, 'data', 'alimentos.json');
    try {
        const data = fs.readFileSync(caminho, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erro ao ler alimentos.json", err);
        return [];
    }
});

//-----PONTE IPC: ATUALIZAR PACIENTE NO PLANO EXISTENTE---------------------------------------------------------------------------------------------------------------------------

ipcMain.on('atualizar-plano-paciente', (event, planoCompleto) => {
    const caminhoArquivo = path.join(__dirname, 'data', 'pacientes.json');
    try {
        const data = fs.readFileSync(caminhoArquivo, 'utf8');
        let pacientes = JSON.parse(data);

        // Encontra o paciente pelo ID e atualiza os campos
        pacientes = pacientes.map(p =>{
            if (p.nome === planoCompleto.id) {
                return { ...p, ...planoCompleto}; // Mantém o que já havia e adiciona novas metas}
            }
            return p;
        });

        fs.writeFileSync(caminhoArquivo, JSON.stringify(pacientes, null, 2));
    } catch (error) {
        console.error("Erro ao atualizar o arquivo:", error);
    }
});
//-----PONTE IPC: EXCLUIR PACIENTE-----------------------------------------------------------------------------------------------------------
ipcMain.on('remover-paciente', (event, index) => {
    const caminhoArquivo = path.join(__dirname, 'data', 'pacientes.json');

    // Lê arquivos atuais
    const data = fs.readFileSync(caminhoArquivo, 'utf-8');
    let pacientes = JSON.parse(data);

    // Remove o paciente pelo índice
    pacientes.splice(index, 1);

    // Escreve a lista atualizada de volta no arquivo JSON
    fs.writeFileSync(caminhoArquivo, JSON.stringify(pacientes, null, 2));

    // Opcional: Enviar uma resposta de volta para a tela (se necessário)
     event.reply('paciente-removido', index);
});
//----------------------------------------------------------------------------------------------------------------
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

/*Força o software a rodar sem os impedimentos do Linux*/
/* ELECTRON_DISABLE_SANDBOX=1 npm start -- --disable-gpu --disable-software-rasterized --ozone-plataform=x11*/
/* execução de debugger externo http://localhost:9222/ */