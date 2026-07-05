# Requisitos do NutriDash

## 🛠️ Notas de Manutenção e Arquitetura
> **Atenção:** A função `inicializarGrafico()` deve ser sempre executada antes da função `calcularTudo()`. 
> 
> **Motivo:** O objeto do Chart.js precisa existir na memória antes de qualquer tentativa de atualização de dados (`meuGrafico.update()`), caso contrário, o gráfico não será renderizado no ecrã

> **Atenção:** Proteína x Carboidrato = INVERSAMENTE PROPORCIONAIS (um aumenta e o outro diminui)

> **Atenção:** Gordura x Carboidrato = INVERSAMENTE PROPORCIONAIS (um aumenta e o outro diminui)

## ✅ Funcionalidades Prontas
- [x] Cálculo de TMB e GET
- [x] Busca na TACO
- [x] Soma dinâmica de Macros por Refeição/Dia
- [x] Persistência de dados no pacientes.json
- [x] Implementação de CSS de Impressão (@media)
- [x] Gatilho de impressão via window.print()
- [x] Ajustar ícones das seções
- [x] Imprimir PDF com nome de documento personalizado
- [x] Criar conta no Firebase: criar um projeto "Nutribash".


## 📅 Backlog (A fazer)
- [ ] Adicionar Alimento genérico Manual
- [ ] Alterar peso/altura sem excluir
- [ ] Adicionar validador de exclusão de planos ou alimentos para evitar ações acidentais
- [ ] Criar "Cabeçalho de consultório" personalizado (nome e espaço para data)
- [ ] Cada seção (plano dietético, base de alimentos, pacientes e anamnese) devem ser exibidos como pop-up
- [ ] Adicionar outras tabelas de alimentos, pois a TACO está desatualizada

## 📱 Portabilidade (Mobile)
- [x] Criar conta no Firebase: criar um projeto "Nutribash".
- [x] Substituir ipcRenderer: trocar as chamadas do Electron por funções do Firebase (collection, addDoc, getDocs).
- [x] Criar o manifest.json: é o arquivo que diz ao tablet: "Eu sou um app, pode me adicionar na tela inicial".
- [ ] Hospedagem: usar o Vercel ou GitHub Pages (grátis) para colocar o site no ar
