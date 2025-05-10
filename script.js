// script.js

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    let user = JSON.parse(localStorage.getItem('user'));
    let editingIndex = null;
    let consumoChartInstance = null;

    const IMPLEMENTOS = [
        "Nenhum/Transporte",
        "Plantadora de Cana",
        "Subsolador / Descompactador",
        "Grade Aradora",
        "Grade Intermediária",
        "Grade Niveladora",
        "Arado (de discos ou aiveca)",
        "Eliminador de Soqueiras"
    ];

    // Detecção de Tema
    const applyTheme = () => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

    const formatarDataParaExibicao = (dataString) => {
        if (!dataString || !/^\d{4}-\d{2}-\d{2}$/.test(dataString)) return dataString;
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const popularSelectImplementos = (selectElementId) => {
        const select = document.getElementById(selectElementId);
        if (select) {
            select.innerHTML = '<option value="">Todos os Implementos</option>';
            if (selectElementId === "implemento") {
                 select.innerHTML = '<option value="">Selecione um Implemento</option>';
            }
            IMPLEMENTOS.forEach(implemento => {
                const option = document.createElement('option');
                option.value = implemento;
                option.textContent = implemento;
                select.appendChild(option);
            });
        }
    };

    // Função para exibir alertas de feedback (simples, pode ser substituída por toasts)
    const showFeedback = (message, type = 'info') => {
        // Para simplificar, usaremos alert. Em uma app real, use toasts/snackbars.
        const prefix = type === 'success' ? '✅ Sucesso: ' : type === 'error' ? '❌ Erro: ' : 'ℹ️ Info: ';
        alert(prefix + message);
    };


    const loadPage = (page) => {
        try {
            user = JSON.parse(localStorage.getItem('user'));
            let pageContent = '';
            editingIndex = null;

            if (consumoChartInstance) {
                consumoChartInstance.destroy();
                consumoChartInstance = null;
            }

            if (!user && page !== 'login') { loadPage('login'); return; }
            if (user && page === 'login') { loadPage('abastecimento'); return; }

            if (user && page !== 'login') {
                pageContent += `
                    <div class="container mx-auto p-4">
                        <nav class="card mb-6">
                            <div class="flex items-center justify-between">
                                <span class="text-lg font-semibold flex items-center">
                                    <i class="fas fa-tractor mr-2 text-xl text-blue-500"></i> Controle de Abastecimento (Trator)
                                </span>
                                <div class="flex items-center space-x-4">
                                    <span id="user-info" class="text-sm hidden md:inline">Olá, ${user.nome} (${user.cs})</span>
                                    <button id="menu-button" class="text-xl focus:outline-none">
                                        <i class="fas fa-bars"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="menu" class="hidden mt-4 space-y-2">
                                <a href="#" data-page="abastecimento" class="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i class="fas fa-plus-circle w-5 mr-2"></i>Novo Abastecimento</a>
                                <a href="#" data-page="historico" class="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i class="fas fa-history w-5 mr-2"></i>Histórico</a>
                                <a href="#" data-page="graficos" class="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i class="fas fa-chart-line w-5 mr-2"></i>Gráficos</a>
                                <a href="#" id="logout" class="block px-4 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"><i class="fas fa-sign-out-alt w-5 mr-2"></i>Sair</a>
                            </div>
                        </nav>
                        <main id="content" class="card">
                        </main>
                    </div>
                `;
            }

            let mainContent = '';
            switch (page) {
                case 'login':
                    mainContent = `
                        <div class="login-container">
                            <div class="login-box card">
                                <h2 class="text-2xl font-semibold text-center mb-6"><i class="fas fa-lock mr-2"></i>Login</h2>
                                <div class="mb-4">
                                    <label for="cs">CS:</label>
                                    <input type="text" id="cs" placeholder="Digite seu CS (apenas números)" pattern="[0-9]*" inputmode="numeric">
                                </div>
                                <div class="mb-6">
                                    <label for="nome">Nome:</label>
                                    <input type="text" id="nome" placeholder="Digite seu nome">
                                </div>
                                <button id="login-button" class="btn btn-primary w-full"><i class="fas fa-sign-in-alt"></i>Entrar</button>
                            </div>
                        </div>`;
                    appContainer.innerHTML = mainContent;
                    initLogin();
                    applyTheme();
                    return;

                case 'abastecimento':
                    mainContent = `
                        <h2 class="text-2xl font-semibold mb-6"><i class="fas fa-plus-circle mr-2"></i>Registrar Novo Abastecimento de Trator</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="mb-4">
                                <label for="data">Data:</label>
                                <input type="date" id="data">
                            </div>
                            <div class="mb-4">
                                <label for="trator">Trator:</label>
                                <input type="text" id="trator" placeholder="Identificação do Trator">
                            </div>
                            <div class="mb-4">
                                <label for="implemento">Implemento:</label>
                                <select id="implemento"></select>
                            </div>
                            <div class="mb-4">
                                <label for="horimetroInicial">Horímetro Inicial:</label>
                                <input type="number" id="horimetroInicial" step="0.1" placeholder="Horas">
                            </div>
                            <div class="mb-4">
                                <label for="horimetroFinal">Horímetro Final:</label>
                                <input type="number" id="horimetroFinal" step="0.1" placeholder="Horas">
                            </div>
                            <div class="mb-4">
                                <label for="litros">Litros:</label>
                                <input type="number" id="litros" step="0.01" placeholder="Litros Abastecidos">
                            </div>
                        </div>
                        <div class="mt-6 text-right">
                            <button id="salvar-abastecimento" class="btn btn-success"><i class="fas fa-save"></i>Salvar Registro</button>
                        </div>`;
                    break;

                case 'historico':
                    mainContent = `
                        <h2 class="text-2xl font-semibold mb-6"><i class="fas fa-history mr-2"></i>Histórico de Abastecimentos</h2>
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border border-dashed rounded-lg">
                            <div>
                                <label for="filtro-data">Filtrar por Data:</label>
                                <input type="date" id="filtro-data">
                            </div>
                            <div>
                                <label for="filtro-trator">Filtrar por Trator:</label>
                                <input type="text" id="filtro-trator" placeholder="Identificação do Trator">
                            </div>
                            <div>
                                <label for="filtro-implemento-historico">Filtrar por Implemento:</label>
                                <select id="filtro-implemento-historico"></select>
                            </div>
                            <div class="filter-button-group">
                                 <button id="aplicar-filtro" class="btn btn-primary w-full md:w-auto"><i class="fas fa-filter"></i>Aplicar</button>
                                 <button id="limpar-filtro" class="btn btn-danger w-full md:w-auto" title="Limpar Filtros"><i class="fas fa-times"></i>Limpar</button>
                            </div>
                        </div>
                        <div class="table-responsive card p-0">
                            <table class="w-full">
                                <thead>
                                    <tr>
                                        <th>CS</th><th>Data</th><th>Trator</th><th>Implemento</th><th>Hor. Inicial</th><th>Hor. Final</th><th>Litros</th><th>Consumo (L/h)</th><th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="tabela-historico"></tbody>
                            </table>
                        </div>
                        <div id="historico-vazio" class="text-center text-muted py-6 hidden">Nenhum abastecimento encontrado com os filtros atuais. Tente outros filtros ou registre um novo abastecimento.</div>
                        <div class="mt-6 p-4 border border-dashed rounded-lg">
                            <h3 class="text-lg font-semibold mb-3"><i class="fas fa-file-pdf mr-2 text-red-500"></i>Gerar Relatório PDF</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label for="pdf-data-inicio">Data Início:</label><input type="date" id="pdf-data-inicio"></div>
                                <div><label for="pdf-data-fim">Data Fim:</label><input type="date" id="pdf-data-fim"></div>
                                <div class="pdf-button-group">
                                    <button id="download-pdf-button" class="btn btn-danger w-full md:w-auto"><i class="fas fa-download"></i>Baixar PDF</button>
                                    <button id="share-pdf-button" class="btn btn-secondary w-full md:w-auto" title="Compartilhar PDF"><i class="fas fa-share"></i>Compartilhar</button>
                                </div>
                            </div>
                        </div>`;
                    break;
                case 'graficos':
                    mainContent = `
                        <h2 class="text-2xl font-semibold mb-6"><i class="fas fa-chart-line mr-2"></i>Análise Gráfica de Consumo (L/h)</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border border-dashed rounded-lg">
                            <div>
                                <label for="filtro-data-inicio-grafico">Data Início:</label>
                                <input type="date" id="filtro-data-inicio-grafico">
                            </div>
                            <div>
                                <label for="filtro-data-fim-grafico">Data Fim:</label>
                                <input type="date" id="filtro-data-fim-grafico">
                            </div>
                            <div>
                                <label for="filtro-trator-grafico">Trator (opcional):</label>
                                <input type="text" id="filtro-trator-grafico" placeholder="Identificação do Trator">
                            </div>
                            <div>
                                <label for="filtro-implemento-grafico">Implemento:</label>
                                <select id="filtro-implemento-grafico"></select>
                            </div>
                            <div class="md:col-span-2 lg:col-span-4 filter-button-group mt-2">
                                <button id="aplicar-filtro-grafico" class="btn btn-primary w-full md:w-auto"><i class="fas fa-filter"></i>Aplicar Filtro</button>
                                <button id="limpar-filtro-grafico" class="btn btn-danger w-full md:w-auto" title="Limpar Filtros"><i class="fas fa-times"></i>Limpar</button>
                            </div>
                        </div>
                        <div id="grafico-container" class="p-4 rounded-lg"><canvas id="consumoChart"></canvas></div>
                        <div id="grafico-vazio" class="text-center text-muted py-6 hidden">Nenhum dado encontrado para os filtros aplicados. Ajuste os filtros para visualizar o gráfico.</div>`;
                    break;
                default: mainContent = '<p>Página não encontrada.</p>';
            }

            if (page !== 'login') {
                appContainer.innerHTML = pageContent;
                document.getElementById('content').innerHTML = mainContent;
            }

            if (user && page !== 'login') {
                const menuButton = document.getElementById('menu-button');
                const menu = document.getElementById('menu');
                if (menuButton && menu) {
                    menuButton.addEventListener('click', () => menu.classList.toggle('hidden'));
                    menu.addEventListener('click', (event) => {
                        const link = event.target.closest('a');
                        if (link && link.dataset.page) { event.preventDefault(); loadPage(link.dataset.page); menu.classList.add('hidden'); }
                        else if (link && link.id === 'logout') { event.preventDefault(); localStorage.removeItem('user'); localStorage.removeItem('lastVisitedPage'); loadPage('login');}
                    });
                }
            }

            if (page === 'abastecimento') initAbastecimento();
            else if (page === 'historico') initHistorico();
            else if (page === 'graficos') initGraficos();
            
            if (page === 'abastecimento') popularSelectImplementos('implemento');
            if (page === 'historico') popularSelectImplementos('filtro-implemento-historico');
            if (page === 'graficos') popularSelectImplementos('filtro-implemento-grafico');


            applyTheme();
        } catch (error) {
            console.error(`Erro ao carregar a página '${page}':`, error);
            showFeedback(`Erro ao carregar conteúdo: ${error.message}.`, 'error');
            if (appContainer) appContainer.innerHTML = `<div class="p-6 text-red-600">Erro: ${error.message}.</div>`;
        }
    };

    function initLogin() {
        const loginButton = document.getElementById('login-button');
        const csInput = document.getElementById('cs');
        const nomeInput = document.getElementById('nome');
        if (!loginButton || !csInput || !nomeInput) {
            console.error("Elementos do formulário de login não encontrados.");
            return;
        }
        csInput.focus(); // Foco no primeiro campo

        loginButton.addEventListener('click', () => {
            const cs = csInput.value.trim();
            const nome = nomeInput.value.trim();
            if (cs && nome) {
                if (csInput.pattern && !new RegExp(`^${csInput.pattern}$`).test(cs)) {
                    showFeedback('CS deve conter apenas números.', 'error'); 
                    csInput.focus(); return;
                }
                user = { cs, nome };
                localStorage.setItem('user', JSON.stringify(user));
                showFeedback(`Bem-vindo, ${nome}!`, 'success');
                loadPage('abastecimento');
            } else {
                showFeedback('Por favor, preencha seu CS e Nome.', 'error'); 
                if (!cs) csInput.focus(); else if (!nome) nomeInput.focus();
            }
        });
        [csInput, nomeInput].forEach(input => input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); loginButton.click(); }
        }));
    }

    function initAbastecimento() {
        const dataInput = document.getElementById('data');
        const tratorInput = document.getElementById('trator');
        const implementoSelect = document.getElementById('implemento');
        const horimetroInicialInput = document.getElementById('horimetroInicial');
        const horimetroFinalInput = document.getElementById('horimetroFinal');
        const litrosInput = document.getElementById('litros');
        const saveButton = document.getElementById('salvar-abastecimento');

        if (!dataInput || !tratorInput || !implementoSelect || !horimetroInicialInput || !horimetroFinalInput || !litrosInput || !saveButton) {
            console.error("Elementos da página de abastecimento não encontrados."); return;
        }
        dataInput.value = new Date().toISOString().split('T')[0];
        dataInput.focus(); // Foco no primeiro campo visível após a data (que já está preenchida)

        saveButton.addEventListener('click', () => {
            const data = dataInput.value;
            const trator = tratorInput.value.trim();
            const implemento = implementoSelect.value;
            const horimetroInicial = parseFloat(horimetroInicialInput.value);
            const horimetroFinal = parseFloat(horimetroFinalInput.value);
            const litros = parseFloat(litrosInput.value);

            if (!data || !trator || isNaN(horimetroInicial) || isNaN(horimetroFinal) || !implemento || isNaN(litros) || litros <= 0 || horimetroInicial < 0 || horimetroFinal < 0) {
                showFeedback('Preencha todos os campos corretamente. Litros e Horímetro devem ser positivos.', 'error'); return;
            }
            if (horimetroFinal <= horimetroInicial) {
                showFeedback('Horímetro Final deve ser maior que Horímetro Inicial.', 'error'); 
                horimetroFinalInput.focus(); return;
            }
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (!currentUser) { showFeedback("Usuário não encontrado. Faça login novamente.", 'error'); loadPage('login'); return; }

            const abastecimento = {
                id: Date.now().toString(), cs: currentUser.cs, data, trator, implemento,
                horimetroInicial, horimetroFinal, litros
            };
            let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
            abastecimentos.push(abastecimento);
            abastecimentos.sort((a, b) => new Date(b.data) - new Date(a.data));
            localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));

            showFeedback('Abastecimento salvo com sucesso!', 'success');
            [tratorInput, horimetroInicialInput, horimetroFinalInput, litrosInput].forEach(el => el.value = '');
            implementoSelect.value = ""; 
            dataInput.value = new Date().toISOString().split('T')[0];
            tratorInput.focus();
        });
    }

    function initHistorico() {
        const tabelaHistorico = document.getElementById('tabela-historico');
        const filtroData = document.getElementById('filtro-data');
        const filtroTrator = document.getElementById('filtro-trator');
        const filtroImplemento = document.getElementById('filtro-implemento-historico');
        const aplicarFiltroButton = document.getElementById('aplicar-filtro');
        const limparFiltroButton = document.getElementById('limpar-filtro');
        const downloadPdfButton = document.getElementById('download-pdf-button');
        const sharePdfButton = document.getElementById('share-pdf-button');
        const pdfDataInicio = document.getElementById('pdf-data-inicio');
        const pdfDataFim = document.getElementById('pdf-data-fim');
        const historicoVazioMsg = document.getElementById('historico-vazio');

        if (!tabelaHistorico || !aplicarFiltroButton || !downloadPdfButton || !sharePdfButton || !pdfDataInicio || !pdfDataFim || !historicoVazioMsg || !filtroImplemento) {
            console.error("Elementos da página de histórico não encontrados."); return;
        }

        const exibirHistorico = (abastecimentosFiltrados) => {
            tabelaHistorico.innerHTML = '';
            historicoVazioMsg.classList.toggle('hidden', abastecimentosFiltrados.length > 0);
            if (abastecimentosFiltrados.length === 0) return;

            let allAbastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
            abastecimentosFiltrados.forEach(ab => {
                const horasTrabalhadas = ab.horimetroFinal - ab.horimetroInicial;
                const consumo = (horasTrabalhadas > 0 && ab.litros > 0) ? (ab.litros / horasTrabalhadas) : 0;
                const row = document.createElement('tr');
                const currentUser = JSON.parse(localStorage.getItem('user'));
                const isOwner = currentUser && currentUser.cs === ab.cs;
                const originalIndex = allAbastecimentos.findIndex(item => item.id === ab.id);
                const consumoDisplay = (isFinite(consumo) && consumo > 0) ? consumo.toFixed(2) : 'N/A';
                const litrosDisplay = typeof ab.litros === 'number' ? ab.litros.toFixed(2) : 'N/A';

                let implementoSelectHTML = `<select class="edit-input" data-field="implemento" aria-label="Selecionar implemento para edição">`;
                IMPLEMENTOS.forEach(imp => {
                    implementoSelectHTML += `<option value="${imp}" ${ab.implemento === imp ? 'selected' : ''}>${imp}</option>`;
                });
                implementoSelectHTML += `</select>`;


                if (editingIndex === originalIndex && isOwner) {
                    row.innerHTML = `
                        <td>${ab.cs}</td>
                        <td><input type="date" class="edit-input" value="${ab.data || ''}" data-field="data" aria-label="Editar data"></td>
                        <td><input type="text" class="edit-input" value="${ab.trator || ''}" data-field="trator" aria-label="Editar trator"></td>
                        <td>${implementoSelectHTML}</td>
                        <td><input type="number" step="0.1" class="edit-input" value="${ab.horimetroInicial || ''}" data-field="horimetroInicial" min="0" aria-label="Editar horímetro inicial"></td>
                        <td><input type="number" step="0.1" class="edit-input" value="${ab.horimetroFinal || ''}" data-field="horimetroFinal" min="0" aria-label="Editar horímetro final"></td>
                        <td><input type="number" step="0.01" class="edit-input" value="${ab.litros || ''}" data-field="litros" min="0" aria-label="Editar litros"></td>
                        <td>${consumoDisplay} L/h</td>
                        <td class="whitespace-nowrap">
                            <button class="btn btn-success btn-sm salvar-button" data-original-index="${originalIndex}" aria-label="Salvar edição"><i class="fas fa-check"></i></button>
                            <button class="btn btn-secondary btn-sm cancelar-button" aria-label="Cancelar edição"><i class="fas fa-times"></i></button>
                        </td>`;
                } else {
                    row.innerHTML = `
                        <td>${ab.cs}</td><td>${formatarDataParaExibicao(ab.data) || 'N/A'}</td><td>${ab.trator || 'N/A'}</td>
                        <td>${ab.implemento || 'N/A'}</td>
                        <td>${ab.horimetroInicial || 'N/A'} h</td><td>${ab.horimetroFinal || 'N/A'} h</td><td>${litrosDisplay}</td>
                        <td>${consumoDisplay} L/h</td>
                        <td class="whitespace-nowrap">
                            ${isOwner ? `
                                <button class="btn btn-primary btn-sm editar-button" data-original-index="${originalIndex}" aria-label="Editar registro"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm excluir-button" data-original-index="${originalIndex}" aria-label="Excluir registro"><i class="fas fa-trash"></i></button>`
                                : '<span class="text-xs text-muted">Outro</span>'}
                        </td>`;
                }
                tabelaHistorico.appendChild(row);
            });
            attachTableButtonListeners();
        };
        
        const attachTableButtonListeners = () => {
            tabelaHistorico.querySelectorAll('.editar-button, .excluir-button, .salvar-button, .cancelar-button').forEach(btn => {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                const action = newBtn.classList.contains('editar-button') ? 'editar' :
                               newBtn.classList.contains('excluir-button') ? 'excluir' :
                               newBtn.classList.contains('salvar-button') ? 'salvar' : 'cancelar';
                newBtn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.dataset.originalIndex);
                    if (action === 'editar') { editingIndex = idx; carregarHistorico(); }
                    else if (action === 'excluir') { 
                        if (confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
                            excluirAbastecimento(idx); 
                        }
                    }
                    else if (action === 'salvar') { salvarEdicao(idx, e.currentTarget.closest('tr')); }
                    else if (action === 'cancelar') { editingIndex = null; carregarHistorico(); }
                });
            });
        };

        const excluirAbastecimento = (originalIndex) => {
            let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
            if (originalIndex >= 0 && originalIndex < abastecimentos.length) {
                abastecimentos.splice(originalIndex, 1);
                localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));
                showFeedback('Registro excluído com sucesso.', 'success');
                editingIndex = null; carregarHistorico();
            } else {
                showFeedback('Não foi possível excluir o registro.', 'error');
            }
        };

        const salvarEdicao = (originalIndex, rowElement) => {
            let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
            if (originalIndex >= 0 && originalIndex < abastecimentos.length && rowElement) {
                try {
                    const newData = {
                        cs: abastecimentos[originalIndex].cs, id: abastecimentos[originalIndex].id,
                        data: rowElement.querySelector('[data-field="data"]').value,
                        trator: rowElement.querySelector('[data-field="trator"]').value.trim(),
                        implemento: rowElement.querySelector('[data-field="implemento"]').value,
                        horimetroInicial: parseFloat(rowElement.querySelector('[data-field="horimetroInicial"]').value),
                        horimetroFinal: parseFloat(rowElement.querySelector('[data-field="horimetroFinal"]').value),
                        litros: parseFloat(rowElement.querySelector('[data-field="litros"]').value)
                    };
                    if (!newData.data || !newData.trator || !newData.implemento || isNaN(newData.horimetroInicial) || isNaN(newData.horimetroFinal) || isNaN(newData.litros) || newData.litros <= 0 || newData.horimetroInicial < 0 || newData.horimetroFinal < 0) {
                        showFeedback('Preencha todos os campos corretamente ao editar.', 'error'); return;
                    }
                    if (newData.horimetroFinal <= newData.horimetroInicial) {
                        showFeedback('Horímetro Final deve ser maior que Inicial ao editar.', 'error'); return;
                    }
                    abastecimentos[originalIndex] = newData;
                    abastecimentos.sort((a, b) => new Date(b.data) - new Date(a.data));
                    localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));
                    showFeedback('Registro atualizado com sucesso!', 'success');
                    editingIndex = null; carregarHistorico();
                } catch (error) { showFeedback("Erro ao salvar edição.", 'error'); }
            }
        };
        
        const carregarHistorico = () => {
            let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
            const dataF = filtroData.value;
            const tratorF = filtroTrator.value.trim().toLowerCase();
            const implementoF = filtroImplemento.value;
            let filtrados = abastecimentos.filter(ab => 
                (!dataF || ab.data === dataF) &&
                (!tratorF || (ab.trator && ab.trator.toLowerCase().includes(tratorF))) &&
                (!implementoF || ab.implemento === implementoF)
            );
            exibirHistorico(filtrados);
            if (dataF || tratorF || implementoF) { // Se algum filtro estiver ativo
                showFeedback(`Exibindo ${filtrados.length} registro(s) com os filtros aplicados.`, 'info');
            }
        };

        const createPDFBlob = (dataInicio, dataFim) => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (!currentUser) { showFeedback("Usuário não encontrado para gerar PDF.", 'error'); return null; }

                let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
                let filteredPDF = abastecimentos.filter(ab =>
                    ab.cs === currentUser.cs && ab.data >= dataInicio && ab.data <= dataFim
                );
                if (filteredPDF.length === 0) { showFeedback("Nenhum registro encontrado para o período do PDF.", 'info'); return null; }
                filteredPDF.sort((a, b) => new Date(a.data) - new Date(b.data));

                const tableColumn = ["Data", "Trator", "Implemento", "Hor. Inicial", "Hor. Final", "Litros", "Consumo (L/h)"];
                const tableRows = filteredPDF.map(ab => {
                    const horasTrabalhadas = ab.horimetroFinal - ab.horimetroInicial;
                    const consumo = (horasTrabalhadas > 0 && ab.litros > 0) ? (ab.litros / horasTrabalhadas).toFixed(2) : 'N/A';
                    return [
                        formatarDataParaExibicao(ab.data), ab.trator, ab.implemento,
                        ab.horimetroInicial, ab.horimetroFinal,
                        typeof ab.litros === 'number' ? ab.litros.toFixed(2) : 'N/A', consumo
                    ];
                });
                doc.setFontSize(16); doc.text(`Relatório - ${currentUser.nome} (${currentUser.cs})`, 14, 20);
                doc.setFontSize(10); doc.setTextColor(100); doc.text(`Período: ${formatarDataParaExibicao(dataInicio)} a ${formatarDataParaExibicao(dataFim)}`, 14, 26);
                doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30, theme: 'striped', headStyles: { fillColor: [41, 128, 185], fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { top: 30 }});
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.text(`Página ${i}/${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
                    doc.text(`Gerado: ${new Date().toLocaleString('pt-BR')}`, 14, doc.internal.pageSize.height - 10);
                }
                return doc.output('blob');
            } catch (e) { console.error("Erro PDF:", e); showFeedback("Erro ao gerar PDF.", 'error'); return null; }
        };

        downloadPdfButton.addEventListener('click', () => {
            const di = pdfDataInicio.value, df = pdfDataFim.value;
            if (!di || !df) { showFeedback("Selecione Data Início e Fim para o PDF.", 'error'); return; }
            if (new Date(df) < new Date(di)) { showFeedback("Data Fim não pode ser anterior à Data Início para o PDF.", 'error'); return; }
            
            showFeedback("Gerando PDF... Aguarde.", 'info'); // Feedback de carregamento
            setTimeout(() => { // Simula um pequeno delay para o usuário ver a mensagem
                const blob = createPDFBlob(di, df);
                if (!blob) { /* showFeedback já foi chamado em createPDFBlob */ return; }
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `Relatorio_Trator_${di}_${df}.pdf`;
                link.click(); URL.revokeObjectURL(link.href);
                showFeedback("PDF pronto para download! Verifique a pasta de downloads do seu navegador.", 'success');
            }, 100);
        });
        sharePdfButton.addEventListener('click', async () => {
            const di = pdfDataInicio.value, df = pdfDataFim.value;
            if (!di || !df) { showFeedback("Selecione Data Início e Fim para compartilhar.", 'error'); return; }
            if (new Date(df) < new Date(di)) { showFeedback("Data Fim não pode ser anterior à Data Início para compartilhar.", 'error'); return; }
            
            showFeedback("Preparando PDF para compartilhar...", 'info');
            const blob = createPDFBlob(di, df);
            if (!blob) { /* showFeedback já foi chamado em createPDFBlob */ return; }
            const file = new File([blob], `Relatorio_Trator_${di}_${df}.pdf`, { type: 'application/pdf' });
            const shareData = { files: [file], title: 'Relatório de Abastecimento', text: `Relatório ${formatarDataParaExibicao(di)} a ${formatarDataParaExibicao(df)}.` };
            
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try { 
                    await navigator.share(shareData); 
                    showFeedback("PDF compartilhado (ou tentativa iniciada)!", 'success');
                } catch (err) { 
                    if (err.name !== 'AbortError') showFeedback('Erro ao compartilhar o PDF.', 'error');
                    console.error('Erro ao compartilhar:', err);
                }
            } else if (navigator.share) { // Fallback
                 console.warn("navigator.canShare(shareData) com arquivo retornou false. Tentando compartilhar de qualquer forma...");
                 try { await navigator.share(shareData); showFeedback("PDF compartilhado (ou tentativa iniciada)!", 'success'); }
                 catch (err) { if (err.name !== 'AbortError') showFeedback('Erro ao compartilhar o PDF (fallback).', 'error'); console.error('Erro ao compartilhar (fallback):', err);}
            } else { 
                showFeedback('Seu navegador não suporta o compartilhamento de arquivos. Tente fazer o download.', 'info'); 
            }
        });

        aplicarFiltroButton.addEventListener('click', carregarHistorico);
        limparFiltroButton.addEventListener('click', () => {
            [filtroData, filtroTrator, filtroImplemento].forEach(el => el.value = '');
            carregarHistorico();
            showFeedback("Filtros limpos.", 'info');
        });
        carregarHistorico(); // Carga inicial sem feedback de filtro
    }

    function initGraficos() {
        const filtroDataInicioGrafico = document.getElementById('filtro-data-inicio-grafico');
        const filtroDataFimGrafico = document.getElementById('filtro-data-fim-grafico');
        const filtroTratorGrafico = document.getElementById('filtro-trator-grafico');
        const filtroImplementoGrafico = document.getElementById('filtro-implemento-grafico');
        const aplicarFiltroGraficoButton = document.getElementById('aplicar-filtro-grafico');
        const limparFiltroGraficoButton = document.getElementById('limpar-filtro-grafico');
        const graficoContainerEl = document.getElementById('grafico-container');
        const graficoVazioMsgEl = document.getElementById('grafico-vazio');
        const chartCanvas = document.getElementById('consumoChart');

        if (!chartCanvas || !graficoContainerEl || !graficoVazioMsgEl || !aplicarFiltroGraficoButton || !limparFiltroGraficoButton || !filtroImplementoGrafico) {
             console.error("Elementos da página de gráficos não encontrados."); return;
        }
        const ctx = chartCanvas.getContext('2d');

        const renderizarGrafico = (labels, dataConsumo, implementoSelecionado) => {
            if (consumoChartInstance) consumoChartInstance.destroy();
            const isDarkMode = document.documentElement.classList.contains('dark');
            const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            const textColor = isDarkMode ? '#f3f4f6' : '#1f2937';
            const tituloGrafico = implementoSelecionado && implementoSelecionado !== "Nenhum/Transporte" && implementoSelecionado !== "Todos os Implementos" ?
                                 `Consumo (L/h) - ${implementoSelecionado}` :
                                 'Consumo Geral (L/h)';


            consumoChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Consumo Real (L/h)',
                        data: dataConsumo,
                        borderColor: isDarkMode ? '#60a5fa' : '#2563eb',
                        backgroundColor: isDarkMode ? 'rgba(96,165,250,0.2)' : 'rgba(37,99,235,0.2)',
                        tension: 0.1, fill: false,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: false, title: { display: true, text: 'Consumo (L/h)', color: textColor }, grid: { color: gridColor }, ticks: { color: textColor }},
                        x: { title: { display: true, text: 'Data do Abastecimento', color: textColor }, grid: { color: gridColor }, ticks: { autoSkip: true, maxTicksLimit: 15, color: textColor }}
                    },
                    plugins: {
                        title: { display: true, text: tituloGrafico, color: textColor, font: {size: 16} },
                        legend: { labels: { color: textColor } },
                        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label || ''}: ${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(2) : ''} L/h`}}
                    }
                }
            });
        };

        const carregarDadosParaGrafico = () => {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (!currentUser) {
                graficoVazioMsgEl.textContent = "Usuário não encontrado. Faça login novamente."; graficoVazioMsgEl.classList.remove('hidden');
                graficoContainerEl.classList.add('hidden'); if (consumoChartInstance) consumoChartInstance.destroy();
                return;
            }
            let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]').filter(ab => ab.cs === currentUser.cs);
            const dataInicio = filtroDataInicioGrafico.value;
            const dataFim = filtroDataFimGrafico.value;
            const tratorF = filtroTratorGrafico.value.trim().toLowerCase();
            const implementoF = filtroImplementoGrafico.value;

            if (dataInicio && dataFim && new Date(dataFim) < new Date(dataInicio)) {
                showFeedback("Data Fim não pode ser anterior à Data Início para o gráfico.", 'error');
                graficoVazioMsgEl.textContent = "Período inválido."; graficoVazioMsgEl.classList.remove('hidden');
                graficoContainerEl.classList.add('hidden'); if (consumoChartInstance) consumoChartInstance.destroy();
                return;
            }
            abastecimentos = abastecimentos.filter(ab => 
                (!dataInicio || ab.data >= dataInicio) &&
                (!dataFim || ab.data <= dataFim) &&
                (!tratorF || (ab.trator && ab.trator.toLowerCase().includes(tratorF))) &&
                (!implementoF || ab.implemento === implementoF)
            );
            abastecimentos.sort((a, b) => new Date(a.data) - new Date(b.data));

            const labels = [], dataConsumo = [];
            abastecimentos.forEach(ab => {
                const horas = ab.horimetroFinal - ab.horimetroInicial;
                if (horas > 0 && ab.litros > 0) {
                    labels.push(formatarDataParaExibicao(ab.data));
                    dataConsumo.push(ab.litros / horas);
                }
            });
            
            const implementoSelecionadoTexto = filtroImplementoGrafico.value;

            graficoVazioMsgEl.classList.toggle('hidden', labels.length > 0);
            graficoContainerEl.classList.toggle('hidden', labels.length === 0);

            if (labels.length > 0) {
                renderizarGrafico(labels, dataConsumo, implementoSelecionadoTexto);
                showFeedback(`Gráfico gerado para ${implementoSelecionadoTexto || 'todos os implementos'}.`, 'info');
            } else {
                if (consumoChartInstance) consumoChartInstance.destroy();
                showFeedback("Nenhum dado para exibir no gráfico com os filtros atuais.", 'info');
            }
        };

        aplicarFiltroGraficoButton.addEventListener('click', carregarDadosParaGrafico);
        limparFiltroGraficoButton.addEventListener('click', () => {
            const hoje = new Date(), umMesAtras = new Date(); umMesAtras.setMonth(hoje.getMonth() - 1);
            if(filtroDataInicioGrafico) filtroDataInicioGrafico.value = umMesAtras.toISOString().split('T')[0];
            if(filtroDataFimGrafico) filtroDataFimGrafico.value = hoje.toISOString().split('T')[0];
            if(filtroTratorGrafico) filtroTratorGrafico.value = '';
            if(filtroImplementoGrafico) filtroImplementoGrafico.value = '';
            carregarDadosParaGrafico();
            showFeedback("Filtros do gráfico limpos.", 'info');
        });
        const hoje = new Date(), umMesAtras = new Date(); umMesAtras.setMonth(hoje.getMonth() - 1);
        if(filtroDataInicioGrafico && !filtroDataInicioGrafico.value) filtroDataInicioGrafico.value = umMesAtras.toISOString().split('T')[0];
        if(filtroDataFimGrafico && !filtroDataFimGrafico.value) filtroDataFimGrafico.value = hoje.toISOString().split('T')[0];
        carregarDadosParaGrafico(); // Carga inicial sem feedback de filtro
    }

    try {
        applyTheme();
        const initialUser = JSON.parse(localStorage.getItem('user'));
        if (initialUser) {
            user = initialUser;
            const lastPage = localStorage.getItem('lastVisitedPage');
            loadPage(lastPage && ['abastecimento', 'historico', 'graficos'].includes(lastPage) ? lastPage : 'abastecimento');
        } else { loadPage('login'); }

        window.addEventListener('beforeunload', () => {
            const contentElement = document.getElementById('content');
            const currentUserOnUnload = JSON.parse(localStorage.getItem('user'));
            if (contentElement && contentElement.innerHTML !== '' && currentUserOnUnload) {
                const currentPageH2 = contentElement.querySelector('h2');
                if (currentPageH2) {
                    if (currentPageH2.textContent.includes("Novo Abastecimento")) localStorage.setItem('lastVisitedPage', 'abastecimento');
                    else if (currentPageH2.textContent.includes("Histórico")) localStorage.setItem('lastVisitedPage', 'historico');
                    else if (currentPageH2.textContent.includes("Análise Gráfica")) localStorage.setItem('lastVisitedPage', 'graficos');
                }
            } else if (!currentUserOnUnload) localStorage.removeItem('lastVisitedPage');
        });
    } catch (criticalError) {
        console.error("Erro crítico:", criticalError);
        showFeedback(`Erro crítico: ${criticalError.message}`, 'error');
        if (appContainer) appContainer.innerHTML = `<div class="p-6 text-red-600"><h1>Erro crítico.</h1><p>${criticalError.message}</p></div>`;
    }
});