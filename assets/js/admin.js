import { auth, db, collection } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { addDoc, serverTimestamp, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// NAVEGAÇÃO ABAS (Atualizado para botões menores e com ícones)
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
            b.className = 'tab-btn bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition flex items-center gap-1';
        });
        tabContents.forEach(content => content.classList.add('hidden'));

        btn.className = 'tab-btn active bg-[#D4FF00] text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(212,255,0,0.3)] transition flex items-center gap-1';
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
    });
});

// ALUNOS
async function carregarAlunos() {
    const lista = document.getElementById('lista-alunos');
    lista.innerHTML = '<p class="text-zinc-500 text-xs text-center mt-2">Carregando lista...</p>';
    try {
        const snap = await getDocs(collection(db, "alunos"));
        if (snap.empty) return lista.innerHTML = '<p class="text-zinc-500 text-xs text-center mt-2">Nenhum aluno cadastrado.</p>';
        lista.innerHTML = '';
        let alunosList = [];
        snap.forEach(docSnap => alunosList.push({ id: docSnap.id, ...docSnap.data() }));
        
        alunosList.sort((a, b) => {
            const nomeA = a.nome || "Aluno sem nome";
            const nomeB = b.nome || "Aluno sem nome";
            return nomeA.localeCompare(nomeB);
        });

        alunosList.forEach(aluno => {
            const nomeExibicao = aluno.nome || "Aluno sem nome (Teste)";
            const card = document.createElement('div');
            card.className = "bg-white/[0.04] p-3 rounded-xl border border-white/10 flex justify-between items-center";
            card.innerHTML = `
                <div>
                    <h4 class="font-bold text-white text-sm">${nomeExibicao}</h4>
                    <p class="text-[11px] text-zinc-400">Matrícula: <span class="text-[#D4FF00] font-semibold">${aluno.matricula}</span></p>
                </div>
                <button onclick="window.deletarAluno('${aluno.id}', '${nomeExibicao}')" class="w-8 h-8 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shrink-0">
                    <i class="ph-bold ph-trash text-sm"></i>
                </button>
            `;
            lista.appendChild(card);
        });
    } catch (e) { lista.innerHTML = '<p class="text-red-500 text-xs text-center">Erro.</p>'; }
}

window.deletarAluno = async (id, nome) => {
    if(confirm(`Remover acesso do aluno: ${nome}?`)) {
        try { await deleteDoc(doc(db, "alunos", id)); carregarAlunos(); } catch(e) { alert("Erro ao excluir."); }
    }
}

document.getElementById('form-aluno').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const nome = document.getElementById('nome-aluno').value;
    const matricula = document.getElementById('matricula-aluno').value;
    btn.textContent = "Salvando..."; btn.disabled = true;
    try {
        await addDoc(collection(db, "alunos"), { nome, matricula, dataCadastro: serverTimestamp() });
        e.target.reset(); carregarAlunos();
    } catch (e) { alert("Erro."); } finally { btn.textContent = "Cadastrar Aluno"; btn.disabled = false; }
});
carregarAlunos();

// AVISOS
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
    } catch (e) { alert("Erro."); } finally { btn.textContent = "Publicar"; btn.disabled = false; }
});

// EVENTOS (MANUAL E CSV)
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
        } catch (e) { alert("Erro."); } finally { btn.textContent = "Agendar Manualmente"; btn.disabled = false; }
    });
}
document.getElementById('btn-importar-csv').addEventListener('click', () => {
    const fileInput = document.getElementById('arquivo-csv');
    const btn = document.getElementById('btn-importar-csv');
    if (!fileInput.files.length) return alert("Selecione um arquivo .csv");
    const file = fileInput.files[0];
    const reader = new FileReader();
    btn.textContent = "Processando..."; btn.disabled = true;
    reader.onload = async function(e) {
        const linhas = e.target.result.split('\n');
        let importados = 0;
        try {
            for (let i = 1; i < linhas.length; i++) {
                const linha = linhas[i].trim();
                if (!linha) continue;
                const col = linha.split(/,|;/);
                if (col.length >= 3) {
                    await addDoc(collection(db, "eventos"), { titulo: col[0].trim(), data: col[1].trim(), tipo: col[2].trim().toLowerCase(), criadoEm: serverTimestamp() });
                    importados++;
                }
            }
            alert(`Sucesso! ${importados} eventos importados.`); fileInput.value = '';
        } catch (e) { alert("Erro na importação."); } finally { btn.textContent = "Processar CSV"; btn.disabled = false; }
    };
    reader.readAsText(file);
});

// MATERIAIS
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
        } catch (e) { alert("Erro."); } finally { btn.textContent = "Publicar"; btn.disabled = false; }
    });
}

// HORÁRIOS
async function carregarAdminHorarios() {
    const lista = document.getElementById('lista-admin-horarios');
    try {
        const snap = await getDocs(collection(db, "horarios"));
        if (snap.empty) return lista.innerHTML = '<p class="text-zinc-500 text-xs text-center">Nenhuma aula na grade.</p>';
        lista.innerHTML = '';
        let horariosList = [];
        snap.forEach(doc => horariosList.push({ id: doc.id, ...doc.data() }));
        horariosList.sort((a, b) => a.dia.localeCompare(b.dia));

        horariosList.forEach(aula => {
            const nomeDoDia = aula.dia.split('-')[1];
            const card = document.createElement('div');
            card.className = "bg-white/[0.04] p-3 rounded-xl border border-white/5 flex justify-between items-center";
            card.innerHTML = `
                <div>
                    <h4 class="font-bold text-white text-sm">${aula.materia} <span class="text-[10px] text-zinc-500 font-normal ml-1">(${nomeDoDia})</span></h4>
                    <p class="text-[11px] text-zinc-400 mt-0.5">Hora: <span class="text-[#D4FF00]">${aula.hora}</span> | Prof: ${aula.prof}</p>
                </div>
                <button onclick="window.deletarHorario('${aula.id}', '${aula.materia}')" class="w-8 h-8 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shrink-0">
                    <i class="ph-bold ph-trash text-sm"></i>
                </button>
            `;
            lista.appendChild(card);
        });
    } catch (e) { lista.innerHTML = '<p class="text-red-500 text-center text-xs">Erro.</p>'; }
}
window.deletarHorario = async (id, materia) => {
    if(confirm(`Remover a aula de ${materia}?`)) {
        try { await deleteDoc(doc(db, "horarios", id)); carregarAdminHorarios(); } catch(e) { alert("Erro."); }
    }
}
const formHorario = document.getElementById('form-horario');
if(formHorario) {
    formHorario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const dia = document.getElementById('dia-horario').value; 
        const materia = document.getElementById('materia-horario').value;
        const hora = document.getElementById('hora-horario').value;
        const prof = document.getElementById('prof-horario').value;
        btn.textContent = "Salvando..."; btn.disabled = true;
        try {
            await addDoc(collection(db, "horarios"), { dia, materia, hora, prof, criadoEm: serverTimestamp() });
            e.target.reset(); carregarAdminHorarios();
        } catch (e) { alert("Erro."); } finally { btn.textContent = "Adicionar na Grade"; btn.disabled = false; }
    });
}
carregarAdminHorarios();

// CONTATOS
async function carregarAdminContatos() {
    const lista = document.getElementById('lista-admin-contatos');
    try {
        const snap = await getDocs(collection(db, "contatos"));
        if (snap.empty) return lista.innerHTML = '<p class="text-zinc-500 text-xs text-center">Nenhum contato salvo.</p>';
        lista.innerHTML = '';
        let contatosList = [];
        snap.forEach(doc => contatosList.push({ id: doc.id, ...doc.data() }));
        contatosList.sort((a, b) => a.nome.localeCompare(b.nome));

        contatosList.forEach(contato => {
            const card = document.createElement('div');
            card.className = "bg-white/[0.04] p-3 rounded-xl border border-white/5 flex justify-between items-center";
            card.innerHTML = `
                <div>
                    <h4 class="font-bold text-white text-sm">${contato.nome}</h4>
                    <p class="text-[11px] text-zinc-400 mt-0.5">Cargo: <span class="text-indigo-400">${contato.cargo}</span></p>
                </div>
                <button onclick="window.deletarContato('${contato.id}', '${contato.nome}')" class="w-8 h-8 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shrink-0">
                    <i class="ph-bold ph-trash text-sm"></i>
                </button>
            `;
            lista.appendChild(card);
        });
    } catch (e) { lista.innerHTML = '<p class="text-red-500 text-center text-xs">Erro.</p>'; }
}
window.deletarContato = async (id, nome) => {
    if(confirm(`Apagar o contato de ${nome}?`)) {
        try { await deleteDoc(doc(db, "contatos", id)); carregarAdminContatos(); } catch(e) { alert("Erro."); }
    }
}
const formContato = document.getElementById('form-contato');
if(formContato) {
    formContato.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const nome = document.getElementById('nome-contato').value;
        const cargo = document.getElementById('cargo-contato').value;
        const numero = document.getElementById('numero-contato').value; 
        btn.textContent = "Salvando..."; btn.disabled = true;
        try {
            await addDoc(collection(db, "contatos"), { nome, cargo, numero, criadoEm: serverTimestamp() });
            e.target.reset(); carregarAdminContatos();
        } catch (e) { alert("Erro."); } finally { btn.textContent = "Salvar Contato"; btn.disabled = false; }
    });
}
carregarAdminContatos();