const API_URL_AUTH = 'http://localhost:3000/auth';

async function efetuarLoguin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Preencha todos os campos!');
        return;
    }

    try {
        const response = await fetch(`${API_URL_AUTH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }) 
        });

        const data = await response.json();
        
        if (data.sucess) {
            localStorage.setItem('usuario_logado', 'true');
            localStorage.setItem('user_id', data.id_usuario); 
            localStorage.setItem('user_nome', data.nome_usuario); 
            localStorage.setItem('user_tipo', data.tipo);
    
            // Lógica de Redirecionamento baseada no tipo de usuário
            if (data.tipo === 'admin') {
                window.location.href = 'area-gerente.html';
            } else if (data.tipo === 'tecnico') {
                window.location.href = 'area-tecnico.html';
            } else if (data.tipo === 'solicitante') {
                // Redireciona para a nova tela que criamos
                window.location.href = 'area-solicitante.html';
            } else {
                alert("Tipo de usuário não reconhecido.");
            }
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Erro ao conectar com a API', error);
        alert("Erro ao conectar com o servidor.");
    }
}