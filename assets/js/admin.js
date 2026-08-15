import { auth, db, collection } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { addDoc, updateDoc, serverTimestamp, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

onAuthStateChanged(auth, (user) => { if (!user) { localStorage.removeItem('adminLogado'); window.location.href = "index.html"; } });
document.getElementById('btn-logout').addEventListener('click', async () => { await signOut(auth); localStorage.removeItem('adminLogado'); window.location.href = "index.html"; });

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.className = 'tab-btn bg-brand-white/5 border border-brand-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-brand-mist/70 hover:text-brand-white transition flex items-center gap-1');
        tabContents.forEach(content => content.classList.add('hidden'));
        btn.className = 'tab-btn active bg-brand-blue text-brand-white px-4 py-1.5 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(0,48,207,0.3)] transition flex items-center gap-1';
        document.getElementById(btn.getAttribute('data-target')).classList.remove('hidden');
    });
});

let editIds = { aluno: null, aviso: null, evento: null, material: null, horario: null, contato: null };
function toggleEditMode(formId, submitBtnId, cancelBtnId, isEdit, defaultText = "Salvar") {
    const submitBtn = document.getElementById(submitBtnId); const cancelBtn = document.getElementById(cancelBtnId);
    if(isEdit) { submitBtn.textContent = "Atualizar"; cancelBtn.classList.remove('hidden'); } 
    else { submitBtn.textContent = defaultText; cancelBtn.classList.add('hidden'); document.getElementById(formId).reset(); }
}

async function carregarAlunos() {
    const lista = document.getElementById('lista-alunos');
    try {
        const snap = await getDocs(collection(db, "alunos"));
        if (snap.empty) return lista.innerHTML = '<p class="text-brand-mist/70 text-xs text-center mt-2">Nenhum aluno cadastrado.</p>';
        lista.innerHTML = ''; let list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        list.forEach(item => {
            const card = document.createElement('div');
            card.className = "bg-brand-white/[0.04] p-3 rounded-xl border border-brand-white/10 flex justify-between items-center";
            card.innerHTML = `
                <div>
                    <h4 class="font-bold text-brand-white text-sm">${item.nome || "Sem Nome"}</h4>
                    <p class="text-[11px] text-brand-mist/70">Matrícula: <span class="text-brand-mist font-bold bg-brand-white/10 px-1.5 rounded">${item.matricula}</span></p>
                </div>
                <div class="flex gap-1">
                    <button onclick="window.editarAluno('${item.id}', '${item.nome}', '${item.matricula}')" class="w-8 h-8 bg-brand-blue text-brand-white rounded-full flex items-center justify-center hover:bg-brand-blue/80 transition shrink-0 shadow-[0_0_10px_rgba(0,48,207,0.4)]"><i class="ph-bold ph-pencil-simple text-sm"></i></button>
                    <button onclick="window.deletarAluno('${item.id}', '${item.nome}')" class="w-8 h-8 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shrink-0"><i class="ph-bold ph-trash text-sm"></i></button>
                </div>
            `;
            lista.appendChild(card);
        });
    } catch (e) { lista.innerHTML = '<p class="text-red-500 text-xs text-center">Erro.</p>'; }
}
window.deletarAluno = async (id, nome) => { if(confirm(`Remover acesso: ${nome}?`)) { await deleteDoc(doc(db, "alunos", id)); carregarAlunos(); } }
window.editarAluno = (id, nome, matricula) => { editIds.aluno = id; document.getElementById('nome-aluno').value = nome; document.getElementById('matricula-aluno').value = matricula; toggleEditMode('form-aluno', 'btn-submit-aluno', 'btn-cancel-aluno', true); }
document.getElementById('btn-cancel-aluno').addEventListener('click', () => { editIds.aluno = null; toggleEditMode('form-aluno', 'btn-submit-aluno', 'btn-cancel-aluno', false, "Cadastrar"); });
document.getElementById('form-aluno').addEventListener('submit', async (e) => {
    e.preventDefault(); const nome = document.getElementById('nome-aluno').value; const matricula = document.getElementById('matricula-aluno').value;
    try {
        if(editIds.aluno) await updateDoc(doc(db, "alunos", editIds.aluno), { nome, matricula });
        else await addDoc(collection(db, "alunos"), { nome, matricula, dataCadastro: serverTimestamp() });
        editIds.aluno = null; toggleEditMode('form-aluno', 'btn-submit-aluno', 'btn-cancel-aluno', false, "Cadastrar"); carregarAlunos();
    } catch (e) { alert("Erro."); }
});

async function carregarAvisos() {
    const lista = document.getElementById('lista-admin-avisos');
    try {
        const snap = await getDocs(collection(db, "avisos"));
        if (snap.empty) return lista.innerHTML = '<p class="text-brand-mist/70 text-xs text-center mt-2">Nenhum aviso.</p>';
        lista.innerHTML = ''; let list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => b.dataPublicacao - a.dataPublicacao);
        list.forEach(item => {
            const card = document.createElement('div');
            card.className = "bg-brand-white/[0.04] p-3 rounded-xl border border-brand-white/10 flex justify-between items-center";
            card.innerHTML = `
                <div class="flex-1 pr-2">
                    <h4 class="font-bold text-brand-white text-sm truncate">${item.titulo}</h4>
                    <p class="text-[11px] text-brand-mist/70">Tipo: <span class="uppercase font-bold">${item.urgencia}</span></p>
                </div>
                <div class="flex gap-1">
                    <button onclick="window.editarAviso('${item.id}', '${item.titulo.replace(/'/g, "\\'")}', '${item.texto.replace(/'/g, "\\'").replace(/\n/g, "\\n")}', '${item.urgencia}')" class="w-8 h-8 bg-brand-blue text-brand-white rounded-full flex items-center justify-center hover:bg-brand-blue/80 transition shrink-0 shadow-[0_0_10px_rgba(0,48,207,0.4)]"><i class="ph-bold ph-pencil-simple text-sm"></i></button>
                    <button onclick="window.deletarAviso('${item.id}')" class="w-8 h-8 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shrink-0"><i class="ph-bold ph-trash text-sm"></i></button>
                </div>
            `;
            lista.appendChild(card);
        });
    } catch (e) { lista.innerHTML = '<p class="text-red-500 text-xs text-center">Erro.</p>'; }
}
window.deletarAviso = async (id) => { if(confirm(`Apagar aviso?`)) { await deleteDoc(doc(db, "avisos", id)); carregarAvisos(); } }
window.editarAviso = (id, titulo, texto, urgencia) => { editIds.aviso = id; document.getElementById('titulo-aviso').value = titulo; document.getElementById('texto-aviso').value = texto; document.getElementById('urgencia-aviso').value = urgencia; toggleEditMode('form-aviso', 'btn-submit-aviso', 'btn-cancel-aviso', true); }
document.getElementById('btn-cancel-aviso').addEventListener('click', () => { editIds.aviso = null; toggleEditMode('form-aviso', 'btn-submit-aviso', 'btn-cancel-aviso', false, "Publicar"); });
document.getElementById('form-aviso').addEventListener('submit', async (e) => {
    e.preventDefault(); const titulo = document.getElementById('titulo-aviso').value; const texto = document.getElementById('texto-aviso').value; const urgencia = document.getElementById('urgencia-aviso').value;
    try {
        if(editIds.aviso) await updateDoc(doc(db, "avisos", editIds.aviso), { titulo, texto, urgencia });
        else await addDoc(collection(db, "avisos"), { titulo, texto, urgencia, dataPublicacao: serverTimestamp() });
        editIds.aviso = null; toggleEditMode('form-aviso', 'btn-submit-aviso', 'btn-cancel-aviso', false, "Publicar"); carregarAvisos();
    } catch (e) { alert("Erro."); }
});

async function carregarEventos() {
    const lista = document.getElementById('lista-admin-eventos');
    try {
        const snap = await getDocs(collection(db, "eventos"));
        if (snap.empty) return lista.innerHTML = '<p class="text-brand-mist/70 text-xs text-center mt-2">Nenhum evento.</p>';
        lista.innerHTML = ''; let list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(a.data) - new Date(b.data));
        list.forEach(item => {
            const card = document.createElement('div');
            card.className = "bg-brand-white/[0.04] p-3 rounded-xl border border-brand-white/10 flex justify-between items-center";
            card.innerHTML = `
                <div class="flex-1 pr-2">
                    <h4 class="font-bold text-brand-white text-sm truncate">${item.titulo}</h4>
                    <p class="text-[11px] text-brand-mist/70">${item.data} - <span class="uppercase font-bold">${item.tipo}</span></p>
                </div>
                <div class="flex gap-1">
                    <button onclick="window.editarEvento('${item.id}', '${item.titulo.replace(/'/g, "\\'")}', '${item.data}', '${item.tipo}')" class="w-8 h-8 bg-brand-blue text-brand-white rounded-full flex items-center justify-center hover:bg-brand-blue/80 transition shrink-0 shadow-[0_0_10px_rgba(0,48,207,0.4)]"><i class="ph-bold ph-pencil-simple text-sm"></i></button>
                    <button onclick="window.deletarEvento('${item.id}')" class="w-8 h-8 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shrink-0"><i class="ph-bold ph-trash text-sm"></i></button>
                </div>
            `;
            lista.appendChild(card);
        });
    } catch (e) { lista.innerHTML = '<p class="text-red-500 text-xs text-center">Erro.</p>'; }
}
window.deletarEvento = async (id) => { if(confirm(`Apagar evento?`)) { await deleteDoc(doc(db, "eventos", id)); carregarEventos(); } }
window.editarEvento = (id, titulo, data, tipo) => { editIds.evento = id; document.getElementById('titulo-evento').value = titulo; document.getElementById('data-evento').value = data; document.getElementById('tipo-evento').value = tipo; toggleEditMode('form-evento', 'btn-submit-evento', 'btn-cancel-evento', true); }
document.getElementById('btn-cancel-evento').addEventListener('click', () => { editIds.evento = null; toggleEditMode('form-evento', 'btn-submit-evento', 'btn-cancel-evento', false, "Agendar"); });
const formEvento = document.getElementById('form-evento');
if(formEvento) {
    formEvento.addEventListener('submit', async (e) => {
        e.preventDefault(); const titulo = document.getElementById('titulo-evento').value; const data = document.getElementById('data-evento').value; const tipo = document.getElementById('tipo-evento').value;
        try {
            if(editIds.evento) await updateDoc(doc(db, "eventos", editIds.evento), { titulo, data, tipo });
            else await addDoc(collection(db, "eventos"), { titulo, data, tipo, criadoEm: serverTimestamp() });
            editIds.evento = null; toggleEditMode('form-evento', 'btn-submit-evento', 'btn-cancel-evento', false, "Agendar"); carregarEventos();
        } catch (e) { alert("Erro."); }
    });
}
document.getElementById('btn-importar-csv').addEventListener('click', () => {
    const fileInput = document.getElementById('arquivo-csv'); if (!fileInput.files.length) return alert("Selecione um CSV");
    const reader = new FileReader();
    reader.onload = async function(e) {
        const linhas = e.target.result.split('\n');
        for (let i = 1; i < linhas.length; i++) {
            const col = linhas[i].trim().split(/,|;/);
            if (col.length >= 3) await addDoc(collection(db, "eventos"), { titulo: col[0].trim(), data: col[1].trim(), tipo: col[2].trim().toLowerCase(), criadoEm: serverTimestamp() });
        }
        alert(`Importado!`); fileInput.value = ''; carregarEventos();
    };
    reader.readAsText(fileInput.files[0]);
});

async function carregarMateriais() {
    const lista = document.getElementById('lista-admin-materiais');
    try {
        const snap = await getDocs(collection(db, "materiais"));
        if (snap.empty) return lista.innerHTML = '<p class="text-brand-mist/70 text-xs text-center mt-2">Nenhum material.</p>';
        lista.innerHTML = ''; let list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => b.dataEnvio - a.dataEnvio);
        list.forEach(item => {
            const card = document.createElement('div');
            card.className = "bg-brand-white/[0.04] p-3 rounded-xl border border-brand-white/10 flex justify-between items-center";
            card.innerHTML = `
                <div class="flex-1 pr-2">
                    <h4 class="font-bold text-brand-white text-sm truncate">${item.titulo}</h4>
                    <p class="text-[11px] text-brand-mist/70">Disciplina: <span class="text-brand-mist font-bold">${item.materia}</span></p>
                </div>
                <div class="flex gap-1">
                    <button onclick="window.editarMaterial('${item.id}', '${item.materia.replace(/'/g, "\\'")}', '${item.titulo.replace(/'/g, "\\'")}', '${item.link}')" class="w-8 h-8 bg-brand-blue text-brand-white rounded-full flex items-center justify-center hover:bg-brand-blue/80 transition shrink-0 shadow-[0_0_10px_rgba(0,48,207,0.4)]"><i class="ph-bold ph-pencil-simple text-sm"></i></button>
                    <button onclick="window.deletarMaterial('${item.id}')" class="w-8 h-8 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shrink-0"><i class="ph-bold ph-trash text-sm"></i></button>
                </div>
            `;
            lista.appendChild(card);
        });
    } catch (e) { lista.innerHTML = '<p class="text-red-500 text-xs text-center">Erro.</p>'; }
}
window.deletarMaterial = async (id) => { if(confirm(`Apagar material?`)) { await deleteDoc(doc(db, "materiais", id)); carregarMateriais(); } }
window.editarMaterial = (id, materia, titulo, link) => { editIds.material = id; document.getElementById('materia-material').value = materia; document.getElementById('titulo-material').value = titulo; document.getElementById('link-material').value = link; toggleEditMode('form-material', 'btn-submit-material', 'btn-cancel-material', true); }
document.getElementById('btn-cancel-material').addEventListener('click', () => { editIds.material = null; toggleEditMode('form-material', 'btn-submit-material', 'btn-cancel-material', false, "Publicar"); });
const formMaterial = document.getElementById('form-material');
if(formMaterial) {
    formMaterial.addEventListener('submit', async (e) => {
        e.preventDefault(); const materia = document.getElementById('materia-material').value; const titulo = document.getElementById('titulo-material').value; const link = document.getElementById('link-material').value;
        try {
            if(editIds.material) await updateDoc(doc(db, "materiais", editIds.material), { materia, titulo, link });
            else await addDoc(collection(db, "materiais"), { materia, titulo, link, dataEnvio: serverTimestamp() });
            editIds.material = null; toggleEditMode('form-material', 'btn-submit-material', 'btn-cancel-material', false, "Publicar"); carregarMateriais();
        } catch (e) { alert("Erro."); }
    });
}

async function carregarHorarios() {
    const lista = document.getElementById('lista-admin-horarios');
    try {
        const snap = await getDocs(collection(db, "horarios"));
        if (snap.empty) return lista.innerHTML = '<p class="text-brand-mist/70 text-xs text-center mt-2">Nenhuma aula na grade.</p>';
        lista.innerHTML = ''; let list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => a.dia.localeCompare(b.dia));
        list.forEach(aula => {
            const nomeDoDia = aula.dia.split('-')[1];
            const card = document.createElement('div');
            card.className = "bg-brand-white/[0.04] p-3 rounded-xl border border-brand-white/10 flex justify-between items-center";
            card.innerHTML = `
                <div>
                    <h4 class="font-bold text-brand-white text-sm">${aula.materia} <span class="text-[10px] text-brand-mist/70 font-normal ml-1">(${nomeDoDia})</span></h4>
                    <p class="text-[11px] text-brand-mist/70 mt-0.5">Hora: <span class="text-brand-white font-extrabold bg-brand-blue/40 px-1.5 rounded">${aula.hora}</span> | Prof: ${aula.prof}</p>
                </div>
                <div class="flex gap-1">
                    <button onclick="window.editarHorario('${aula.id}', '${aula.dia}', '${aula.materia}', '${aula.hora}', '${aula.prof}')" class="w-8 h-8 bg-brand-blue text-brand-white rounded-full flex items-center justify-center hover:bg-brand-blue/80 transition shrink-0 shadow-[0_0_10px_rgba(0,48,207,0.4)]"><i class="ph-bold ph-pencil-simple text-sm"></i></button>
                    <button onclick="window.deletarHorario('${aula.id}', '${aula.materia}')" class="w-8 h-8 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shrink-0"><i class="ph-bold ph-trash text-sm"></i></button>
                </div>
            `;
            lista.appendChild(card);
        });
    } catch (e) { lista.innerHTML = '<p class="text-red-500 text-center text-xs">Erro.</p>'; }
}
window.deletarHorario = async (id, materia) => { if(confirm(`Remover aula de ${materia}?`)) { await deleteDoc(doc(db, "horarios", id)); carregarHorarios(); } }
window.editarHorario = (id, dia, materia, hora, prof) => { editIds.horario = id; document.getElementById('dia-horario').value = dia; document.getElementById('materia-horario').value = materia; document.getElementById('hora-horario').value = hora; document.getElementById('prof-horario').value = prof; toggleEditMode('form-horario', 'btn-submit-horario', 'btn-cancel-horario', true); }
document.getElementById('btn-cancel-horario').addEventListener('click', () => { editIds.horario = null; toggleEditMode('form-horario', 'btn-submit-horario', 'btn-cancel-horario', false, "Salvar Aula"); });
const formHorario = document.getElementById('form-horario');
if(formHorario) {
    formHorario.addEventListener('submit', async (e) => {
        e.preventDefault(); const dia = document.getElementById('dia-horario').value; const materia = document.getElementById('materia-horario').value; const hora = document.getElementById('hora-horario').value; const prof = document.getElementById('prof-horario').value;
        try {
            if(editIds.horario) await updateDoc(doc(db, "horarios", editIds.horario), { dia, materia, hora, prof });
            else await addDoc(collection(db, "horarios"), { dia, materia, hora, prof, criadoEm: serverTimestamp() });
            editIds.horario = null; toggleEditMode('form-horario', 'btn-submit-horario', 'btn-cancel-horario', false, "Salvar Aula"); carregarHorarios();
        } catch (e) { alert("Erro."); }
    });
}

async function carregarContatos() {
    const lista = document.getElementById('lista-admin-contatos');
    try {
        const snap = await getDocs(collection(db, "contatos"));
        if (snap.empty) return lista.innerHTML = '<p class="text-brand-mist/70 text-xs text-center mt-2">Nenhum contato salvo.</p>';
        lista.innerHTML = ''; let list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => a.nome.localeCompare(b.nome));
        list.forEach(contato => {
            const card = document.createElement('div');
            card.className = "bg-brand-white/[0.04] p-3 rounded-xl border border-brand-white/10 flex justify-between items-center";
            card.innerHTML = `
                <div>
                    <h4 class="font-bold text-brand-white text-sm">${contato.nome}</h4>
                    <p class="text-[11px] text-brand-mist/70 mt-0.5">Cargo: <span class="text-brand-mist font-bold">${contato.cargo}</span></p>
                </div>
                <div class="flex gap-1">
                    <button onclick="window.editarContato('${contato.id}', '${contato.nome}', '${contato.cargo}', '${contato.numero}')" class="w-8 h-8 bg-brand-blue text-brand-white rounded-full flex items-center justify-center hover:bg-brand-blue/80 transition shrink-0 shadow-[0_0_10px_rgba(0,48,207,0.4)]"><i class="ph-bold ph-pencil-simple text-sm"></i></button>
                    <button onclick="window.deletarContato('${contato.id}', '${contato.nome}')" class="w-8 h-8 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shrink-0"><i class="ph-bold ph-trash text-sm"></i></button>
                </div>
            `;
            lista.appendChild(card);
        });
    } catch (e) { lista.innerHTML = '<p class="text-red-500 text-center text-xs">Erro.</p>'; }
}
window.deletarContato = async (id, nome) => { if(confirm(`Apagar contato de ${nome}?`)) { await deleteDoc(doc(db, "contatos", id)); carregarContatos(); } }
window.editarContato = (id, nome, cargo, numero) => { editIds.contato = id; document.getElementById('nome-contato').value = nome; document.getElementById('cargo-contato').value = cargo; document.getElementById('numero-contato').value = numero; toggleEditMode('form-contato', 'btn-submit-contato', 'btn-cancel-contato', true); }
document.getElementById('btn-cancel-contato').addEventListener('click', () => { editIds.contato = null; toggleEditMode('form-contato', 'btn-submit-contato', 'btn-cancel-contato', false, "Salvar Contato"); });
const formContato = document.getElementById('form-contato');
if(formContato) {
    formContato.addEventListener('submit', async (e) => {
        e.preventDefault(); const nome = document.getElementById('nome-contato').value; const cargo = document.getElementById('cargo-contato').value; const numero = document.getElementById('numero-contato').value; 
        try {
            if(editIds.contato) await updateDoc(doc(db, "contatos", editIds.contato), { nome, cargo, numero });
            else await addDoc(collection(db, "contatos"), { nome, cargo, numero, criadoEm: serverTimestamp() });
            editIds.contato = null; toggleEditMode('form-contato', 'btn-submit-contato', 'btn-cancel-contato', false, "Salvar Contato"); carregarContatos();
        } catch (e) { alert("Erro."); }
    });
}

carregarAlunos(); carregarAvisos(); carregarEventos(); carregarMateriais(); carregarHorarios(); carregarContatos();