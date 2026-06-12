const API_URL_MAN = 'https://gerenciamento-de-maquinas-back-end-production-2502.up.railway.app/man';


async function carregarMaquinas() {
    try {
        const response = await fetch(API_URL_MAN);
        
        if (!response.ok) throw new Error("Erro ao buscar dados");

        const maquinas = await response.json();
        const tbody = document.getElementById('tabela-maquina');
        
        // LIMPA a tabela antes de preencher
        tbody.innerHTML = ""; 

        maquinas.forEach(maq => {
            const situacaoTexto = maq.situacao == 1 ? 'Ativo' : 'Desativado';
            const situacaoClasse = maq.situacao == 1 ? 'status-ativo' : 'status-inativo';
            
            tbody.innerHTML += `
                <tr>
                    <td data-label="ID">${maq.id_maquina}</td>
                    <td data-label="Máquina">${maq.nome_maquina}</td>
                    <td data-label="Descrição">${maq.descricao}</td>
                    <td data-label="Situação">
                        <span class="${situacaoClasse}">${situacaoTexto}</span>
                    </td>
                    <td data-label="Ações">
                        <button class="btn-edit" onclick='preencherModalEditar(${JSON.stringify(maq)})'>Editar</button>
                        <button class="btn-delete" onclick="deletarMaquina(${maq.id_maquina})">Deletar</button>
                    </td>
                </tr>
            `;
        });
        
    } catch (error) {
        console.error("Erro ao carregar máquinas:", error);
    }
}


function preencherModalEditar(maq) {
    // Abre o modal
    openModal('modalMaquina', true);

    // Preenche os campos com os dados atuais da máquina
    document.getElementById('editId').value = maq.id_maquina;
    document.getElementById('editNome').value = maq.nome_maquina;
    document.getElementById('editDescricao').value = maq.descricao;
    document.getElementById('editSituacao').value = maq.situacao;
}

async function salvarMaquina() {
    const id = document.getElementById('editId').value;
    
    const dados = {
        nome_maquina: document.getElementById('editNome').value,
        descricao: document.getElementById('editDescricao').value,
        situacao: document.getElementById('editSituacao').value
    };

    // Validação
    if (!dados.nome_maquina || !dados.descricao) {
        alert("Preencha o nome e a descrição!");
        return;
    }

    // Se tiver ID, usa PUT na rota com ID. Se não tiver, usa POST na rota base.
    const url = id ? `${API_URL_MAN}/${id}` : `${API_URL_MAN}`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            alert(id ? "Máquina atualizada!" : "Máquina criada!");
            closeModal('modalMaquina');
            carregarMaquinas(); 
        } else {
            const erro = await response.json();
            alert("Erro: " + (erro.message || "Erro na operação"));
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro ao conectar com o servidor.");
    }
}

function limparCampos() {
    document.getElementById('editId').value = "";
    document.getElementById('editNome').value = "";
    document.getElementById('editDescricao').value = "";
    document.getElementById('editSituacao').value = "1";
}

async function deletarMaquina(id) {
    //Pedir confirmação para o usuário
    if (!confirm("Tem certeza que deseja excluir esta máquina?")) {
        return;
    }

    try {
        //Fazer a requisição DELETE para a API
        const response = await fetch(`${API_URL_MAN}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Máquina removida com sucesso!");
            carregarMaquinas(); 
        } else {
            const erro = await response.json();
            alert("Erro ao deletar: " + (erro.mensagem));
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Não foi possível conectar ao servidor.");
    }
}