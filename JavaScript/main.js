function openTab(tabName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    
    // Lógica de carregamento
    if (tabName === 'usuarios') {
        carregarUsuarios(); 
    } else if (tabName === 'maquinas') {
        carregarMaquinas();
    } else if (tabName === 'solicitacao') {
        carregarMeusChamados()
    } else if (tabName === 'todas-solicitacoes') {
        carregarFilaGlobal();
    }
}

setTimeout(() => {
    openTab('usuarios');
}, 500);
/**
 * Abre o modal específico
 * @param {string} modalId  ID do elemento modal
 * @param {boolean} isEdit Define se é modo edição para mostrar/ocultar campos
 */
function openModal(modalId, isEdit = false) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';

    // Lógica para o campo ID em máquinas
    if (modalId === 'modalMaquina') {
        const idField = document.getElementById('idField');
        idField.style.display = isEdit ? 'block' : 'none';
    }
}

//Fecha o modal específico
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function fazerLogout() {
    localStorage.clear();
    window.location.href = 'index.html'; 
}