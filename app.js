const API_BASE = 'http://localhost:8080/api/publicacoes';
let publicacaoParaExcluir = null;
let autoresDisponiveis = ['Kaique', 'Admin', 'Larissa'];

// Função principal que roda quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    carregarPublicacoes();
    carregarAutores();

    // Configurar o formulário
    document.getElementById('publicacao-form').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarPublicacao();
    });
});

// Carrega a lista de autores (para garantir que está atualizada)
async function carregarAutores() {
    try {
        const response = await fetch(`${API_BASE}/autores`);
        autoresDisponiveis = await response.json();
        atualizarSelectAutores();
    } catch (error) {
        console.log('Usando autores padrão');
        atualizarSelectAutores();
    }
}

// Atualiza o select de autores no formulário
function atualizarSelectAutores() {
    const selectAutor = document.getElementById('autor');
    selectAutor.innerHTML = '<option value="">Selecione um autor</option>';

    autoresDisponiveis.forEach(autor => {
        const option = document.createElement('option');
        option.value = autor;
        option.textContent = autor;
        selectAutor.appendChild(option);
    });
}

// Carrega todas as publicações da API
async function carregarPublicacoes() {
    try {
        const response = await fetch(`${API_BASE}/listar`);
        const publicacoes = await response.json();
        exibirPublicacoes(publicacoes);
    } catch (error) {
        mostrarAlerta('Erro ao carregar publicações: ' + error.message, 'error');
    }
}

// Exibe as publicações na tela
function exibirPublicacoes(publicacoes) {
    const container = document.getElementById('publicacoes-container');

    if (publicacoes.length === 0) {
        container.innerHTML = '<div class="publicacao"><p>Nenhuma publicação cadastrada.</p></div>';
        return;
    }

    container.innerHTML = publicacoes.map(publicacao => `
        <div class="publicacao ${!publicacao.publicado ? 'nao-publicado' : ''}">
            <h2>${publicacao.titulo}</h2>
            <div class="meta">
                <strong>Autor:</strong> ${publicacao.autor} |
                <strong>Publicado em:</strong> ${formatarData(publicacao.dataPublicacao)}
                ${!publicacao.publicado ? ' | <strong style="color: #e74c3c;">NÃO PUBLICADO</strong>' : ''}
            </div>
            <p>${publicacao.texto}</p>
            <div>
                <button class="btn btn-warning" onclick="editarPublicacao(${publicacao.id})">Alterar</button>
                <button class="btn btn-danger" onclick="solicitarExclusao(${publicacao.id})">Excluir</button>
            </div>
        </div>
    `).join('');
}

// Formata a data para o formato brasileiro
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Mostra o formulário para criar nova publicação
function mostrarFormulario() {
    document.getElementById('listagem-publicacoes').style.display = 'none';
    document.getElementById('formulario-publicacao').style.display = 'block';
    document.getElementById('form-titulo').textContent = 'Incluir nova publicação';
    document.getElementById('publicacao-form').reset();
    document.getElementById('publicacao-id').value = '';
}

// Mostra a listagem de publicações
function mostrarListagem() {
    document.getElementById('formulario-publicacao').style.display = 'none';
    document.getElementById('listagem-publicacoes').style.display = 'block';
    carregarPublicacoes();
}

// Preenche o formulário para editar uma publicação
async function editarPublicacao(id) {
    try {
        const response = await fetch(`${API_BASE}/buscar/${id}`);
        const publicacao = await response.json();

        document.getElementById('publicacao-id').value = publicacao.id;
        document.getElementById('titulo').value = publicacao.titulo;
        document.getElementById('autor').value = publicacao.autor;
        document.getElementById('dataPublicacao').value = publicacao.dataPublicacao;
        document.getElementById('texto').value = publicacao.texto;

        document.getElementById('form-titulo').textContent = `Alterar publicação - ID ${publicacao.id}`;
        document.getElementById('listagem-publicacoes').style.display = 'none';
        document.getElementById('formulario-publicacao').style.display = 'block';

    } catch (error) {
        mostrarAlerta('Erro ao carregar publicação para edição: ' + error.message, 'error');
    }
}

// Salva uma publicação (cria ou atualiza)
async function salvarPublicacao() {
    const id = document.getElementById('publicacao-id').value;
    const publicacao = {
        titulo: document.getElementById('titulo').value,
        autor: document.getElementById('autor').value,
        dataPublicacao: document.getElementById('dataPublicacao').value,
        texto: document.getElementById('texto').value
    };

    // Validação básica no frontend
    if (!publicacao.autor) {
        mostrarAlerta('Por favor, selecione um autor', 'error');
        return;
    }

    if (publicacao.texto.length < 10) {
        mostrarAlerta('O texto deve ter no mínimo 10 caracteres', 'error');
        return;
    }

    try {
        const url = id ? `${API_BASE}/atualizar/${id}` : `${API_BASE}/postar`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(publicacao)
        });

        if (response.ok) {
            mostrarAlerta(`Publicação ${id ? 'atualizada' : 'criada'} com sucesso!`, 'success');
            mostrarListagem();
        } else {
            const error = await response.text();
            mostrarAlerta('Erro ao salvar publicação: ' + error, 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro ao salvar publicação: ' + error.message, 'error');
    }
}

// Solicita a exclusão de uma publicação (abre o modal)
function solicitarExclusao(id) {
    publicacaoParaExcluir = id;
    document.getElementById('modal-excluir').style.display = 'block';
}

// Confirma a exclusão da publicação
async function confirmarExclusao() {
    if (!publicacaoParaExcluir) return;

    try {
        const response = await fetch(`${API_BASE}/excluir/${publicacaoParaExcluir}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            mostrarAlerta('Publicação excluída com sucesso!', 'success');
            carregarPublicacoes();
        } else {
            mostrarAlerta('Erro ao excluir publicação', 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro ao excluir publicação: ' + error.message, 'error');
    }

    fecharModal();
}

// Fecha o modal de exclusão
function fecharModal() {
    document.getElementById('modal-excluir').style.display = 'none';
    publicacaoParaExcluir = null;
}

// Mostra mensagens de alerta
function mostrarAlerta(mensagem, tipo) {
    const container = document.getElementById('alert-container');
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-error';

    container.innerHTML = `
        <div class="alert ${alertClass}">
            ${mensagem}
        </div>
    `;

    // Remove o alerta após 5 segundos
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Fecha o modal se clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('modal-excluir');
    if (event.target === modal) {
        fecharModal();
    }
}