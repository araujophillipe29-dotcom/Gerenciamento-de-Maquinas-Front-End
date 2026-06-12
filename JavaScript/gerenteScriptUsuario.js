const API_URL_USU = 'https://gerenciamento-de-maquinas-back-end-production-2502.up.railway.app/usu';

async function carregarUsuarios() {
    try {
        const response = await fetch(API_URL_USU);
        const usuarios = await response.json();
        const tbody = document.getElementById('tabela-usuario');
        tbody.innerHTML = "";

        usuarios.forEach(user => {
            const userJson = JSON.stringify(user).replace(/'/g, "&apos;");
            
            tbody.innerHTML += `
                <tr>
                    <td data-label="ID">${user.id_usuario}</td>
                    <td data-label="Nome">${user.nome_usuario}</td>
                    <td data-label="E-mail">${user.email}</td>
                    <td data-label="Ações">
                        <button class="btn-edit" onclick='preencherModalUsuario(${userJson})'>Editar</button>
                        <button class="btn-delete" onclick="deletarUsuario(${user.id_usuario})">Deletar</button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
}

function limparModal() {
    document.getElementById('userId').value = ""; // Limpa ID para não editar por engano
    document.getElementById('userName').value = "";
    document.getElementById('userEmail').value = "";
}

//PREENCHER MODAL PARA EDIÇÃO
function preencherModalUsuario(user) {
    openModal('modalUsuario');
    document.getElementById('userId').value = user.id_usuario;
    document.getElementById('userName').value = user.nome_usuario;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userTipo').value = user.tipo;
    document.getElementById('userSenha').value = ""; 
}


//SALVAR (CRIAÇÃO OU ATUALIZAÇÃO)
async function salvarUsuario() {
    const id = document.getElementById('userId').value;
    const dados = {
        nome_usuario: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        tipo: document.getElementById('userTipo').value
    };

    // Adiciona senha apenas se o usuário digitou algo
    const senha = document.getElementById('userSenha').value;
    if (senha) dados.senha = senha;

    try {
        let response;
        
        if (id) {
            // Se tem ID, EDITANDO (PUT)
            response = await fetch(`${API_URL_USU}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        } else {
            // Se não tem ID, CRIANDO (POST)
            response = await fetch(API_URL_USU, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        }

        if (response.ok) {
            alert(id ? "Usuário atualizado!" : "Usuário criado!");
            closeModal('modalUsuario');
            carregarUsuarios();
        } else {
            const erro = await response.json();
            alert("Erro na operação: " + (erro.mensagem || "Verifique os dados, senha necessária"));
        }
    } catch (err) {
        console.error(err);
        alert("Erro de conexão com o servidor");
    }
}

//DELETAR
async function deletarUsuario(id) {
    if (!confirm(`Tem certeza que deseja excluir o usuário ID ${id}?`)) return;

    try {
        const res = await fetch(`${API_URL_USU}/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert("Usuário deletado com sucesso!");
            carregarUsuarios();
        } else {
            alert("Erro ao deletar usuário.");
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao conectar na API");
    }
}