const idTecnicoLogado = localStorage.getItem('user_id');
const API_URL_MAN = 'https://gerenciamento-de-maquinas-back-end-production-2502.up.railway.app/man';
const API_URL_FILA = 'https://gerenciamento-de-maquinas-back-end-production-2502.up.railway.app/fila';
const API_URL_USU = 'https://gerenciamento-de-maquinas-back-end-production-2502.up.railway.app/usu';

document.getElementById('nome-tecnico').innerText = localStorage.getItem('user_nome');

async function carregarPainelTecnico() {
    try {
        const res = await fetch(`${API_URL_FILA}/ativas`);
        const resultado = await res.json();

        // Garante que temos uma lista para trabalhar
        const chamados = Array.isArray(resultado) ? resultado : (resultado.dados || []);

        const tabelaMeus = document.getElementById('tabela-meus-chamados');
        const tabelaLivres = document.getElementById('tabela-chamados-livres');

        if (!tabelaMeus || !tabelaLivres) return;

        tabelaMeus.innerHTML = "";
        tabelaLivres.innerHTML = "";

        
        chamados.forEach(c => {

            const idTecnicoNoBanco = c.id_tecnico;
        
            const statusNoBanco =
                c.status ? c.status.toLowerCase() : "";
        
            // Ignora finalizados/cancelados
            if (
                statusNoBanco === 'cancelado' ||
                statusNoBanco === 'finalizado'
            ) {
                return;
            }
        
            if (idTecnicoNoBanco == idTecnicoLogado) {
        
                let acaoBotao = "";
        
                if (statusNoBanco === 'em aberto') {
        
                    acaoBotao = `
                        <button 
                            class="btn-edit"
                            onclick="iniciarManutencao(${c.id_fila})">
                            Iniciar Manutenção
                        </button>
                    `;
        
                } else {
        
                    acaoBotao = `
                        <button 
                            class="btn-primary"
                            onclick="abrirModal(${c.id_fila})">
                            Finalizar
                        </button>
                    `;
                }
        
                tabelaMeus.innerHTML += `
                    <tr>
                        <td data-label="ID">${c.id_fila}</td>
                        <td data-label="Máquina">${c.nome_maquina}</td>
                        <td data-label="Problema">${c.descricao_problema}</td>
                        <td data-label="Solicitante">${c.nome_solicitante || 'Sistema'}</td>
                        <td data-label="Ações">${acaoBotao}</td>
                    </tr>
                `;
            }
            if (!idTecnicoNoBanco) {
        
                tabelaLivres.innerHTML += `
                    <tr>
                        <td data-label="ID">${c.id_fila}</td>
                        <td data-label="Máquina">${c.nome_maquina}</td>
                        <td data-label="Solicitante">${c.nome_solicitante || 'Sistema'}</td>
        
                        <td data-label="Ações">
                            <button class="btn-create" onclick="assumirChamado(${c.id_fila})">Assumir</button>
                        </td>
                    </tr>
                `;
            }
        });

    } catch (err) {
        console.error("Erro ao carregar painel:", err);
    }
}

// Função para o técnico "se atribuir" a uma máquina
async function assumirChamado(idFila) {

    console.log("ID do Técnico no LocalStorage:", idTecnicoLogado);

    if (!idTecnicoLogado || idTecnicoLogado === "undefined") {
        alert("Erro: Seu perfil de técnico não foi identificado. Por favor, saia e faça login novamente.");
        return;
    }

    try {
        const res = await fetch(`${API_URL_FILA}/assumir`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id_fila: idFila, 
                id_tecnico: parseInt(idTecnicoLogado) // Garante que é um número
            })
        });
        
        const resultado = await res.json();

        if (res.ok && resultado.sucess) {
            alert("Chamado assumido com sucesso!");
            carregarPainelTecnico(); // Atualiza as tabelas
        } else {
            alert("Erro ao assumir: " + (resultado.message || "Tente novamente"));
        }
    } catch (err) { 
        console.error("Erro na requisição:", err); 
    }
}
// Funções de interface
function switchTecTab(tab) {
    // Seleciona as seções de conteúdo
    const secMeus = document.getElementById('meus-chamados');
    const secLivres = document.getElementById('chamados-livres');

    // Seleciona os botões (precisamos adicionar IDs ou classes específicas neles no HTML)
    const btnMeus = document.getElementById('btn-meus');
    const btnDisponiveis = document.getElementById('btn-disponiveis');

    if (tab === 'meus') {
        // Ativa seção Meus e desativa Livres
        secMeus.classList.add('active');
        secLivres.classList.remove('active');

        // Estiliza botões
        if(btnMeus) btnMeus.classList.add('active');
        if(btnDisponiveis) btnDisponiveis.classList.remove('active');
        
        console.log("Exibindo: Minhas Manutenções");
    } else {
        // Ativa seção Livres e desativa Meus
        secMeus.classList.remove('active');
        secLivres.classList.add('active');

        // Estiliza botões
        if(btnMeus) btnMeus.classList.remove('active');
        if(btnDisponiveis) btnDisponiveis.classList.add('active');
        
        console.log("Exibindo: Chamados Disponíveis");
    }
    
    // Opcional: Recarregar os dados sempre que trocar de aba para garantir atualização
    carregarPainelTecnico();
}

// Abre o pop-up (Modal)
function finalizarChamado(id) {
    document.getElementById('finalizar-id-fila').value = id;
    document.getElementById('descricao-finalizacao').value = ""; // Limpa o texto anterior
    document.getElementById('modal-finalizar').style.display = 'flex'; // Exibe o modal
}

// Fecha o pop-up
function fecharModal() {
    document.getElementById('modal-finalizar').style.display = 'none';
}

async function salvarFinalizacao() {
    const id_fila = document.getElementById('finalizar-id-fila').value;
    const relato = document.getElementById('descricao-finalizacao').value;
    
    // Captura os dias, mas deixa como null se estiver vazio
    const diasInput = document.getElementById('proxima-dias').value;
    const dias = diasInput ? parseInt(diasInput) : null;
    
    const tipo = document.getElementById('proxima-tipo').value;

    // Agora exigimos APENAS o preenchimento do relato
    if (!relato) {
        alert("Por favor, preencha o relato do que foi realizado na máquina!");
        return;
    }

    const dados = {
        id_fila: parseInt(id_fila),
        manutencoes_realizadas: relato,
        dias: dias,
        // Envia null se o tipo não for selecionado adequadamente ou se os dias forem nulos
        tipo: dias ? tipo : null 
    };

    try {
        const res = await fetch(`${API_URL_FILA}/finalizar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await res.json();

        if (res.ok && resultado.sucess) {
            alert(resultado.message || "Manutenção finalizada com sucesso!");
            fecharModal();
            carregarPainelTecnico(); 
        } else {
            alert("Erro: " + (resultado.message || "Não foi possível finalizar."));
        }
    } catch (err) {
        console.error("Erro na requisição:", err);
        alert("Erro de conexão com o servidor.");
    }
}

async function iniciarManutencao(id_fila) {
    try {
        const res = await fetch(`${API_URL_FILA}/iniciar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id_fila: id_fila,
                id_tecnico: idTecnicoLogado // Garante que o técnico que inicia é o logado
            })
        });

        const resultado = await res.json();

        if (res.ok && resultado.sucess) {
            alert("Manutenção iniciada com sucesso!");
            carregarPainelTecnico();
        } else {
            alert("Erro ao iniciar: " + (resultado.message || "Tente novamente."));
        }
    } catch (err) {
        console.error("Erro na requisição:", err);
        alert("Erro de conexão com o servidor.");
    }
}

// Esta função precisa existir com esse nome exato
function abrirModal(id) {
    document.getElementById('finalizar-id-fila').value = id;
    document.getElementById('modal-finalizar').style.display = 'flex';
}
// Inicia
carregarPainelTecnico();
