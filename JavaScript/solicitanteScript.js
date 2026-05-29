
const USUARIO_LOGADO_ID = localStorage.getItem('user_id');

async function popularMaquinas() {
    try {
        const response = await fetch('http://localhost:3000/man');
        const maquinas = await response.json();
        const selMaq = document.getElementById('select-maquinas-os');

        if (selMaq) {
            selMaq.innerHTML = '<option value="">-- Selecione a Máquina --</option>';
            selMaq.innerHTML += maquinas
                .filter(m => m.situacao == 1)
                .map(m => `<option value="${m.id_maquina}">${m.nome_maquina}</option>`)
                .join('');
        }
    } catch (error) {
        console.error("Erro ao carregar máquinas:", error);
    }
}

async function enviarSolicitacaoSimples() {
    // Verificação de segurança: se não houver ID, o usuário não deve estar aqui
    if (!USUARIO_LOGADO_ID) {
        alert("Erro: Usuário não identificado. Por favor, faça login novamente.");
        window.location.href = 'login.html';
        return;
    }

    const id_maquina = document.getElementById('select-maquinas-os').value;
    const descricao_problema = document.getElementById('input-problema-os').value;

    if (!id_maquina || !descricao_problema) {
        alert("Preencha todos os campos!");
        return;
    }

    const dados = {
        id_maquina: parseInt(id_maquina),
        id_solicitante: parseInt(USUARIO_LOGADO_ID),
        id_tecnico: null,
        descricao_problema: descricao_problema
    };

    try {
        const response = await fetch('http://localhost:3000/fila/abrir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            alert("Chamado aberto com sucesso!");
            document.getElementById('input-problema-os').value = "";
            openTab('meus-chamados');
            carregarMeusChamados();
        } else {
            const erro = await response.json();
            alert("Erro do servidor: " + erro.message);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro ao conectar com o servidor.");
    }
}

async function carregarMeusChamados() {
    try {
        const response = await fetch(`http://localhost:3000/fila/ativas`);
        const resultado = await response.json();
        const tabela = document.getElementById('tabela-minhas-ativas');
        tabela.innerHTML = "";

        const meusChamados = resultado.dados.filter(item => 
            item.id_solicitante == USUARIO_LOGADO_ID && item.status !== 'finalizado'
        );

        meusChamados.forEach(item => {
            tabela.innerHTML += `
                <tr>
                    <td data-label="ID">${item.id_fila}</td>
                    <td data-label="Máquina">${item.nome_maquina}</td>
                    <td data-label="Técnico">${item.tecnico || '<i>Aguardando...</i>'}</td>
                    <td data-label="Status"><span class="status-${item.status}">${item.status}</span></td>
                    <td data-label="Ação">
                        ${item.status === 'solicitado' ? 
                        `<button class="btn-delete" onclick="cancelarMeuChamado(${item.id_fila})">Cancelar</button>` : 
                        'Em atendimento'}
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("Erro ao carregar chamados:", error);
    }
}

async function carregarHistoricoPessoal() {
    try {
        const res = await fetch('http://localhost:3000/fila/concluidas');
        const resultado = await res.json();
        const tabela = document.getElementById('tabela-minhas-concluidas');
        tabela.innerHTML = "";

        const historico = resultado.dados.filter(item => item.id_solicitante == USUARIO_LOGADO_ID);

        historico.forEach(c => {
            tabela.innerHTML += `
                <tr>
                    <td data-label="ID">${c.id_fila}</td>
                    <td data-label="Máquina">${c.nome_maquina}</td>
                    <td data-label="Data">${new Date(c.data_conclusao).toLocaleDateString()}</td>
                    <td data-label="Relato">${c.manutencoes_realizadas || 'Nenhum relato'}</td>
                    <td data-label="Status"><b style="color: green;">Concluído</b></td>
                </tr>`;
        });
    } catch (err) {
        console.error("Erro no histórico:", err);
    }
}

function switchSubTab(tipo) {
    const contAtivas = document.getElementById('container-ativas');
    const contConcluidas = document.getElementById('container-concluidas');
    const btnAtivas = document.getElementById('sub-btn-ativas');
    const btnConcluidas = document.getElementById('sub-btn-concluidas');

    if (tipo === 'ativas') {
        contAtivas.style.display = 'block';
        contConcluidas.style.display = 'none';
        btnAtivas.classList.add('sub-active');
        btnConcluidas.classList.remove('sub-active');
    } else {
        contAtivas.style.display = 'none';
        contConcluidas.style.display = 'block';
        btnConcluidas.classList.add('sub-active');
        btnAtivas.classList.remove('sub-active');
    }
}

async function cancelarMeuChamado(id) {
    if (!confirm("Deseja cancelar seu pedido?")) return;
    try {
        await fetch(`http://localhost:3000/fila/cancelar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_fila: id })
        });
        carregarMeusChamados();
    } catch (error) {
        alert("Erro ao cancelar.");
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    popularMaquinas();
    carregarMeusChamados();
});
