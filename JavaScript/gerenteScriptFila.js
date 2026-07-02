const API_URL_FILA = 'https://gerenciamento-de-maquinas-back-end-production-2502.up.railway.app/fila';

async function preencherFormularioOS() {
    console.log("Tentando preencher o formulário...");
    try {
        // Busca os dados. Usamos Promise.allSettled para que se uma rota falhar, as outras ainda carreguem.
        const resultados = await Promise.allSettled([
            fetch(API_URL_MAN),
            fetch(`${API_URL_USU}/solicitantes`),
            fetch(`${API_URL_USU}/tecnicos`)
        ]);

        // Função auxiliar para extrair o JSON apenas se a requisição deu certo
        const extrairDados = async (res) => {
            if (res.status === 'fulfilled' && res.value.ok) {
                return await res.value.json();
            }
            return []; // Retorna array vazio caso a rota dê 404 ou erro
        };

        const maquinas = await extrairDados(resultados[0]);
        const solicitantes = await extrairDados(resultados[1]);
        const tecnicos = await extrairDados(resultados[2]);

        //PREENCHIMENTO DOS SELECTS

        // Solicitantes
        const selSol = document.getElementById('select-solicitante-os');
        if (selSol) {
            selSol.innerHTML = '<option value=""> Selecione o Solicitante </option>';
            if (solicitantes.length > 0) {
                selSol.innerHTML += solicitantes.map(s => 
                    `<option value="${s.id_usuario}">${s.nome_usuario}</option>`
                ).join('');
            }
        }

        // Técnicos
        const selTec = document.getElementById('select-tecnico-os');
        if (selTec) {
            selTec.innerHTML = '<option value="">Aguardar técnico disponível</option>';
            if (tecnicos.length > 0) {
                selTec.innerHTML += tecnicos.map(t => 
                    `<option value="${t.id_usuario}">${t.nome_usuario}</option>`
                ).join('');
            }
        }

        // Máquinas
        const selMaq = document.getElementById('select-maquinas-os');
        if (selMaq) {
            selMaq.innerHTML = '<option value=""> Selecione a Máquina </option>';
            if (maquinas.length > 0) {
                // Filtramos apenas as máquinas com situação 1 (Ativas)
                selMaq.innerHTML += maquinas
                    .filter(m => m.situacao == 1)
                    .map(m => `<option value="${m.id_maquina}">${m.nome_maquina} (${m.descricao || 'Sem descrição'})</option>`)
                    .join('');
            }
        }

        console.log("Formulário populado com sucesso!");

    } catch (error) { 
        console.error("Erro crítico ao popular formulário de OS:", error); 
    }
}

//Envia os dados da nova OS, incluindo solicitante e técnico (se houver)
async function enviarNovaSolicitacao() {
    const id_maquina = document.getElementById('select-maquinas-os').value;
    const id_solicitante = document.getElementById('select-solicitante-os').value;
    const id_tecnico = document.getElementById('select-tecnico-os').value; 
    const descricao_problema = document.getElementById('input-problema-os').value;

    if (!id_maquina || !id_solicitante || !descricao_problema) {
        alert("Por favor, preencha o solicitante, a máquina e o problema!");
        return;
    }

    const dados = {
        id_maquina: parseInt(id_maquina),
        id_solicitante: parseInt(id_solicitante),
        id_tecnico: id_tecnico ? parseInt(id_tecnico) : null,
        descricao_problema: descricao_problema
    };

    try {
        const response = await fetch(`${API_URL_FILA}/abrir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        if (response.ok && resultado.sucess) {

            alert("Solicitação registrada com sucesso!");
        
            document.getElementById('input-problema-os').value = "";
            document.getElementById('select-maquinas-os').value = "";
            document.getElementById('select-solicitante-os').value = "";
            document.getElementById('select-tecnico-os').value = "";
        
            if (typeof carregarFilaGlobal === 'function') {
                carregarFilaGlobal();
            }
        
            // Atualiza a aba de próximas manutenções
            carregarProximasManutencoes();
        
            if (typeof openTab === 'function') {
                openTab('todas-solicitacoes');
            }
        } else {
            // Busca por .message ou por .erro, o que tiver disponível
            const mensagemErro = resultado.message || resultado.erro || "Erro ao registrar no servidor.";
            alert("Erro: " + mensagemErro);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro de conexão com o servidor.");
    }
}

async function cancelarSolicitacao(id_fila) {
    // Pergunta ao usuário se ele tem certeza
    const confirmar = confirm("Tem certeza que deseja cancelar esta solicitação?");
    
    if (!confirmar) return;

    try {
        const response = await fetch(`${API_URL_FILA}/cancelar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_fila: id_fila })
        });

        const resultado = await response.json();

        if (response.ok && resultado.sucess) {
            alert(resultado.message);
            // Atualiza a tabela que está na tela
            if (typeof carregarFilaGlobal === 'function') carregarFilaGlobal();
        } else {
            alert("Erro ao cancelar: " + (resultado.message || "Erro desconhecido"));
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro de conexão com o servidor.");
    }
}


// Alternar entre Ativas e Concluídas dentro da aba global
function switchSubTab(tipo) {
    const btnAtivas = document.getElementById('sub-btn-ativas');
    const btnConcluidas = document.getElementById('sub-btn-concluidas');
    const contAtivas = document.getElementById('container-ativas');
    const contConcluidas = document.getElementById('container-concluidas');

    if (tipo === 'ativas') {
        btnAtivas.classList.add('sub-active');
        btnConcluidas.classList.remove('sub-active');
        contAtivas.style.display = 'block';
        contConcluidas.style.display = 'none';
    } else {
        btnConcluidas.classList.add('sub-active');
        btnAtivas.classList.remove('sub-active');
        contConcluidas.style.display = 'block';
        contAtivas.style.display = 'none';
    }
}

// Carregar todos os dados da fila (Ativos e Histórico)
async function carregarFilaGlobal() {
    try {
        const response = await fetch(`${API_URL_FILA}/ativas`); 
        const dados = await response.json();
        if (!dados.sucess) return;

        const tabelaAtivas = document.getElementById('tabela-fila-ativas');
        const tabelaConcluidas = document.getElementById('tabela-fila-concluidas');

        tabelaAtivas.innerHTML = "";
        tabelaConcluidas.innerHTML = "";

        dados.dados.forEach(item => {
            if (item.status !== 'finalizado') {
                tabelaAtivas.innerHTML += `
                    <tr>
                        <td data-label="ID">${item.id_fila}</td>
                        <td data-label="Máquina">${item.nome_maquina}</td>
                        <td data-label="Solicitante">${item.nome_solicitante || 'Não informado'}</td>
                        <td data-label="Técnico">${item.nome_tecnico || 'Aguardando...'}</td>
                        <td data-label="Status"><span class="status-${item.status === 'em aberto' ? 'em aberto' : 'processo'}">${item.status}</span></td>
                        <td data-label="Ação">
                            <button class="btn-delete" onclick="cancelarSolicitacao(${item.id_fila})">Cancelar</button>
                        </td>
                    </tr>`;
            } else {
                tabelaConcluidas.innerHTML += `
                    <tr>
                        <td data-label="ID">${item.id_fila}</td>
                        <td data-label="Máquina">${item.nome_maquina}</td>
                        <td data-label="Data">${new Date(item.data_conclusao).toLocaleDateString()}</td>
                        <td data-label="Relato">${item.manutencoes_realizadas || 'Sem relato'}</td>
                        <td data-label="Status"><span class="status-ativo">Concluído</span></td>
                    </tr>`;
            }
        });
    } catch (error) {
        console.error("Erro ao carregar fila global:", error);
    }
}

async function carregarManutencoesConcluidas() {
    try {
        const res = await fetch(`${API_URL_FILA}/concluidas`);
        const resultado = await res.json();
        const chamados = resultado.dados || [];
        const tabela = document.getElementById('tabela-fila-concluidas');
        if (!tabela) return;

        tabela.innerHTML = "";

        if (chamados.length === 0) {
            tabela.innerHTML = "<tr><td colspan='5' style='text-align:center'>Nenhuma manutenção finalizada encontrada.</td></tr>";
            return;
        }

        chamados.forEach(c => {
            const ehCancelado = c.status === 'cancelado';
            const corStatus = ehCancelado ? 'red' : 'green';
            const textoStatus = ehCancelado ? 'Cancelado' : 'Finalizado';
            const relato = c.manutencoes_realizadas || 'Sem relato';
            const dataBruta = c.data_conclusao || c.data_solicitacao;
            const dataFormatada = dataBruta ? new Date(dataBruta).toLocaleString('pt-BR') : '---';
        
            tabela.innerHTML += `
                <tr>
                    <td data-label="ID">${c.id_fila}</td>
                    <td data-label="Máquina">${c.nome_maquina}</td>
                    <td data-label="Data">${dataFormatada}</td>
                    <td data-label="Relato" title="${relato}">${relato.substring(0, 30)}${relato.length > 30 ? '...' : ''}</td>
                    <td data-label="Status"><b style="color: ${corStatus};">${textoStatus}</b></td>
                </tr>`;
        });
    } catch (err) {
        console.error("Erro ao carregar tabela de concluídas:", err);
    }
}

async function carregarProximasManutencoes() {
    try {
        const res = await fetch(`${API_URL_FILA}/proximas`);
        const respostaObjeto = await res.json();
        const dados = Array.isArray(respostaObjeto) ? respostaObjeto : (respostaObjeto.dados || []);

        const tabela = document.getElementById('tabela-proximas');
        if (!tabela) return;

        tabela.innerHTML = "";
        if (dados.length === 0) {
            tabela.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhuma manutenção programada.</td></tr>`;
            return;
        }

        dados.forEach(p => {
            const dias = Number(p.dias_restantes);
            
            let cor = "#27ae60"; // Verde (Tranquilo)
            let textoPrazo = `${dias} dias`;

            if (dias <= 5 && dias >= 0) {
                cor = "#f39c12"; // Amarelo/Laranja (Atenção, prazo curto)
            } else if (dias < 0) {
                cor = "#c0392b"; // Vermelho (Atrasado!)
                textoPrazo = `Atrasado em ${Math.abs(dias)} dias`;
            }

            tabela.innerHTML += `
                <tr>
                    <td data-label="Máquina">${p.nome_maquina}</td>
                    <td data-label="Tipo">${p.proxima_manutencao_tipo}</td>
                    <td data-label="Prazo"><b style="color:${cor}">${textoPrazo}</b></td>
                    <td data-label="Ação">
                        <button class="btn-create" onclick="abrirModalOSRapida(${p.id_maquina}, '${p.proxima_manutencao_tipo}')">
                            Criar Solicitação
                        </button>
                    </td>
                </tr>`;
        });
    } catch (err) {
        console.error("Erro ao carregar próximas manutenções:", err);
    }
}

function abrirModalOSRapida(idMaquina, tipo) {

    // Vai para aba Nova Solicitação
    openTab('solicitacao');

    setTimeout(() => {

        // Seleciona máquina automaticamente
        document.getElementById('select-maquinas-os').value = idMaquina;

        // Preenche descrição
        document.getElementById('input-problema-os').value =
            `Manutenção Preventiva: ${tipo}`;

    }, 200);
}
document.addEventListener('DOMContentLoaded', () => {
    preencherFormularioOS();
    carregarFilaGlobal();
    carregarProximasManutencoes();
});
