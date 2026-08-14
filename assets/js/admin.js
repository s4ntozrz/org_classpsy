import { auth, db, collection } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// Adicionamos getDocs, doc e deleteDoc na importação abaixo:
import { addDoc, serverTimestamp, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// SEGURANÇA
onAuthStateChanged(auth, (user) => {
    if (!user) {
        localStorage.removeItem('adminLogado');
        window.location.href = "index.html";
    }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    await signOut(auth);
    localStorage.removeItem('adminLogado');
    window.location.href = "index.html";
});

// NAVEGAÇÃO ABAS ADMIN
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
            b.className = 'tab-btn bg-white/5 border border-white/10 px-5 py-2 rounded-full text-sm font-bold text-zinc-400 hover:text-white transition';
        });
        tabContents.forEach(content => content.classList.add('hidden'));

        btn.className = 'tab-btn active bg-[#D4FF00] text-black px-5 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(212,255,0,0.3)] transition';
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
    });
});

// ==========================================
// MÓDULO: GERENCIAMENTO DE ALUNOS
// ==========================================

// Função para buscar e renderizar a lista de alunos (CORRIGIDA)
async function carregarAlunos() {
    const lista = document.getElementById('lista-alunos');
    lista.innerHTML = '<p class="text-zinc-500 text-sm text-center mt-2">Carregando lista...</p>';
    
    try {
        const snap = await getDocs(collection(db, "alunos"));
        if (snap.empty) {
            lista.innerHTML = '<p class="text-zinc-500 text-sm text-center mt-2">Nenhum aluno cadastrado ainda.</p>';
            return;
        }

        lista.innerHTML = ''; // Limpa a lista
        
        let alunosList = [];
        snap.forEach(docSnap => {
            alunosList.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Ordenar em ordem alfabética protegendo contra alunos sem nome (Teste inicial)
        alunosList.sort((a, b) => {
            const nomeA = a.nome || "Aluno sem nome";
            const nomeB = b.nome || "Aluno sem nome";
            return nomeA.localeCompare(nomeB);
        });

        alunosList.forEach(aluno => {
            // Se o aluno não tiver nome (nosso teste antigo), exibe "Aluno sem nome"
            const nomeExibicao = aluno.nome || "Aluno sem nome (Teste)";

            const card = document.createElement('div');
            card.className = "bg-white/[0.04] p-3 rounded-2xl border border-white/10 flex justify-between items-center";
            card.innerHTML = `
                <div>
                    <h4 class="font-bold text-white text-sm">${nomeExibicao}</h4>
                    <p class="text-xs text-zinc-400">Matrícula: <span class="text-indigo-400 font-semibold">${aluno.matricula}</span></p>
                </div>
                <button onclick="window.deletarAluno('${aluno.id}', '${nomeExibicao}')" class="w-10 h-10 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shadow-sm shrink-0">
                    🗑️
                </button>
            `;
            lista.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao puxar alunos:", error);
        lista.innerHTML = '<p class="text-red-500 text-sm text-center">Erro ao carregar lista.</p>';
    }
}

// Função global para excluir aluno (acionada pelo botão 🗑️)
window.deletarAluno = async (idDocumento, nomeAluno) => {
    // Alerta de confirmação nativo
    if(confirm(`ATENÇÃO!\nTem certeza que deseja remover o acesso do estudante: ${nomeAluno}?`)) {
        try {
            await deleteDoc(doc(db, "alunos", idDocumento));
            // Atualiza a lista automaticamente após apagar
            carregarAlunos(); 
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Ocorreu um erro ao excluir o aluno.");
        }
    }
}

// Adicionar Novo Aluno (e atualizar a lista)
document.getElementById('form-aluno').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const nome = document.getElementById('nome-aluno').value;
    const matricula = document.getElementById('matricula-aluno').value;
    
    btn.textContent = "Salvando..."; 
    btn.disabled = true;
    
    try {
        await addDoc(collection(db, "alunos"), { nome, matricula, dataCadastro: serverTimestamp() });
        e.target.reset(); // Limpa o formulário
        carregarAlunos(); // Atualiza a lista imediatamente!
    } catch (error) { 
        alert("Erro ao cadastrar."); 
    } finally { 
        btn.textContent = "Cadastrar Aluno"; 
        btn.disabled = false; 
    }
});

// Inicializa a lista de alunos assim que o admin entra na página
carregarAlunos();

// ==========================================
// MÓDULOS: AVISOS, EVENTOS E MATERIAIS
// ==========================================
document.getElementById('form-aviso').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const titulo = document.getElementById('titulo-aviso').value;
    const texto = document.getElementById('texto-aviso').value;
    const urgencia = document.getElementById('urgencia-aviso').value;
    btn.textContent = "Publicando..."; btn.disabled = true;
    try {
        await addDoc(collection(db, "avisos"), { titulo, texto, urgencia, dataPublicacao: serverTimestamp() });
        alert("Aviso publicado!"); e.target.reset();
    } catch (error) { alert("Erro ao publicar."); } finally { btn.textContent = "Publicar"; btn.disabled = false; }
});

const formEvento = document.getElementById('form-evento');
if(formEvento) {
    formEvento.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const titulo = document.getElementById('titulo-evento').value;
        const data = document.getElementById('data-evento').value;
        const tipo = document.getElementById('tipo-evento').value;
        btn.textContent = "Salvando..."; btn.disabled = true;
        try {
            await addDoc(collection(db, "eventos"), { titulo, data, tipo, criadoEm: serverTimestamp() });
            alert("Evento salvo!"); e.target.reset();
        } catch (error) { alert("Erro ao salvar."); } finally { btn.textContent = "Agendar"; btn.disabled = false; }
    });
}

const formMaterial = document.getElementById('form-material');
if(formMaterial) {
    formMaterial.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const materia = document.getElementById('materia-material').value;
        const titulo = document.getElementById('titulo-material').value;
        const link = document.getElementById('link-material').value;
        btn.textContent = "Publicando..."; btn.disabled = true;
        try {
            await addDoc(collection(db, "materiais"), { materia, titulo, link, dataEnvio: serverTimestamp() });
            alert("Material publicado!"); e.target.reset();
        } catch (error) { alert("Erro ao publicar."); } finally { btn.textContent = "Publicar"; btn.disabled = false; }
    });
}

// ==========================================
// IMPORTAÇÃO EM MASSA (CSV)
// ==========================================
document.getElementById('btn-importar-csv').addEventListener('click', () => {
    const fileInput = document.getElementById('arquivo-csv');
    const btn = document.getElementById('btn-importar-csv');
    
    if (!fileInput.files.length) {
        alert("Por favor, selecione um arquivo .csv primeiro.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    
    btn.textContent = "Processando...";
    btn.disabled = true;

    reader.onload = async function(e) {
        const text = e.target.result;
        // Quebra o texto por linhas (Enter)
        const linhas = text.split('\n');
        let importados = 0;

        try {
            // Ignoramos a linha 0 (cabeçalho) e vamos até o final
            for (let i = 1; i < linhas.length; i++) {
                const linha = linhas[i].trim();
                if (!linha) continue; // Pula linha vazia
                
                // Quebra a linha por vírgula ou ponto e vírgula
                const colunas = linha.split(/,|;/);
                
                if (colunas.length >= 3) {
                    const titulo = colunas[0].trim();
                    const data = colunas[1].trim(); 
                    const tipo = colunas[2].trim().toLowerCase();
                    
                    // Salva no banco de dados sem precisar de formulário
                    await addDoc(collection(db, "eventos"), { 
                        titulo: titulo, 
                        data: data, 
                        tipo: tipo, 
                        criadoEm: serverTimestamp() 
                    });
                    importados++;
                }
            }
            alert(`Sucesso! ${importados} eventos foram importados para o calendário.`);
            fileInput.value = ''; // Limpa o arquivo
        } catch (error) {
            console.error("Erro na importação:", error);
            alert("Ocorreu um erro ao importar o arquivo. Verifique se o formato está correto.");
        } finally {
            btn.textContent = "Processar Arquivo CSV";
            btn.disabled = false;
        }
    };

    // Manda o leitor ler o arquivo como texto
    reader.readAsText(file);
});