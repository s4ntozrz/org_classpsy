// ==========================================
// CONFIGURAÇÕES BASE
// ==========================================
function getChaveAluno() {
    const matricula = localStorage.getItem('alunoLogado') || 'desconhecido';
    return `notas_${matricula}`;
}

function getMateriasAluno() { return JSON.parse(localStorage.getItem(getChaveAluno())) || []; }
function salvarMateriasAluno(materias) { localStorage.setItem(getChaveAluno(), JSON.stringify(materias)); }

const formCalc = document.getElementById('form-calc');
const listaMaterias = document.getElementById('lista-materias');

// Controle de Edição
let editIndexNotas = null; 

function toggleEditModeNotas(isEdit) {
    const btnSubmit = document.getElementById('btn-submit-notas');
    const btnCancel = document.getElementById('btn-cancel-notas');
    if(isEdit) {
        btnSubmit.textContent = "Atualizar Notas";
        btnCancel.classList.remove('hidden');
    } else {
        btnSubmit.textContent = "Calcular & Salvar";
        btnCancel.classList.add('hidden');
        if(formCalc) formCalc.reset();
    }
}

// ==========================================
// REGIMENTO UNIVERSO: LÓGICA DE NOTAS
// ==========================================
function processarNotas(v1, vt, v2, r1, vs) {
    let notaV1_Final = v1;
    let usouR1 = false;
    
    if (r1 !== null && !isNaN(r1)) {
        let r1Valida = r1 > 7.0 ? 7.0 : r1;
        if (r1Valida > v1) {
            notaV1_Final = r1Valida;
            usouR1 = true;
        }
    }

    let ms = ((notaV1_Final * 2) + vt + (v2 * 2)) / 5;
    ms = parseFloat(ms.toFixed(1));

    let status = "";
    let corStatus = "";
    let mf = ms;
    let precisaVS = null;

    if (ms >= 7.0) {
        status = "Aprovado por Média"; corStatus = "text-[#D4FF00]";
    } else if (ms < 4.0) {
        status = "Reprovado (Direto)"; corStatus = "text-red-500";
    } else {
        if (vs === null || isNaN(vs)) {
            status = "Em Final (VS)"; corStatus = "text-yellow-400";
            precisaVS = (10 - ms).toFixed(1);
            if (precisaVS < 5.0) precisaVS = 5.0; 
        } else {
            mf = parseFloat(((ms + vs) / 2).toFixed(1));
            if (mf >= 5.0 && vs >= 5.0) {
                status = "Aprovado na VS"; corStatus = "text-indigo-400";
            } else {
                status = "Reprovado na VS"; corStatus = "text-red-500";
            }
        }
    }
    return { ms, mf, status, corStatus, usouR1, precisaVS };
}

// ==========================================
// RENDERIZAR NA TELA
// ==========================================
function atualizarLista() {
    if (!listaMaterias) return; 
    
    listaMaterias.innerHTML = '';
    const materias = getMateriasAluno();
    
    if (materias.length === 0) {
        listaMaterias.innerHTML = '<p class="text-center text-zinc-500 text-xs mt-4">Nenhuma disciplina salva.</p>';
        return;
    }

    materias.forEach((item, index) => {
        const result = processarNotas(item.v1, item.vt, item.v2, item.r1, item.vs);
        
        let tagsExtras = result.usouR1 ? `<span class="bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-2 border border-yellow-500/30">R1 Aplicada</span>` : '';
        
        let linhaExtra = '';
        if (result.precisaVS !== null) {
            linhaExtra = `<p class="text-xs text-yellow-400 mt-1 font-semibold">⚠️ Precisa de <span class="font-extrabold text-white">${result.precisaVS}</span> na VS.</p>`;
        } else if (item.vs !== null && !isNaN(item.vs)) {
            linhaExtra = `<p class="text-[11px] text-zinc-400 mt-1">VS: <span class="text-white font-bold">${item.vs}</span> | MF: <span class="text-white font-bold">${result.mf}</span></p>`;
        }

        const card = document.createElement('div');
        card.className = "bg-white/[0.04] p-4 rounded-2xl border border-white/10 flex justify-between items-center relative overflow-hidden";
        card.innerHTML = `
            <div class="flex-1">
                <h4 class="font-bold text-white text-sm mb-1">${item.nome} ${tagsExtras}</h4>
                <div class="flex gap-2 text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-2">
                    <span class="bg-white/5 px-2 py-1 rounded">V1: ${item.v1}</span>
                    <span class="bg-white/5 px-2 py-1 rounded">VT: ${item.vt}</span>
                    <span class="bg-white/5 px-2 py-1 rounded">V2: ${item.v2}</span>
                </div>
                <p class="text-[11px] text-zinc-300">MS: <span class="font-bold text-white text-sm">${result.ms}</span> - <span class="${result.corStatus} font-extrabold">${result.status}</span></p>
                ${linhaExtra}
            </div>
            <div class="flex gap-1 shrink-0 ml-2">
                <button onclick="editarMateria(${index})" class="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500/30 transition shadow-sm">
                    <i class="ph-bold ph-pencil-simple text-sm"></i>
                </button>
                <button onclick="deletarMateria(${index})" class="w-9 h-9 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shadow-sm">
                    <i class="ph-bold ph-trash text-sm"></i>
                </button>
            </div>
        `;
        listaMaterias.appendChild(card);
    });
}

// ==========================================
// AÇÕES DE DADOS (Salvar, Editar, Apagar)
// ==========================================
if (formCalc) {
    formCalc.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('calc-materia').value;
        const v1 = parseFloat(document.getElementById('calc-v1').value);
        const vt = parseFloat(document.getElementById('calc-vt').value);
        const v2 = parseFloat(document.getElementById('calc-v2').value);
        
        const r1Val = document.getElementById('calc-r1').value;
        const vsVal = document.getElementById('calc-vs').value;
        const r1 = r1Val === "" ? null : parseFloat(r1Val);
        const vs = vsVal === "" ? null : parseFloat(vsVal);

        const novaMateria = { nome, v1, vt, v2, r1, vs };
        const materias = getMateriasAluno();

        // Se estiver editando, atualiza. Se não, adiciona nova.
        if (editIndexNotas !== null) {
            materias[editIndexNotas] = novaMateria;
        } else {
            materias.push(novaMateria);
        }
        
        salvarMateriasAluno(materias);
        
        editIndexNotas = null;
        toggleEditModeNotas(false);
        atualizarLista();
    });
}

// Evento do botão Cancelar
document.getElementById('btn-cancel-notas')?.addEventListener('click', () => {
    editIndexNotas = null;
    toggleEditModeNotas(false);
});

window.editarMateria = function(index) {
    const materias = getMateriasAluno();
    const item = materias[index];
    
    document.getElementById('calc-materia').value = item.nome;
    document.getElementById('calc-v1').value = item.v1;
    document.getElementById('calc-vt').value = item.vt;
    document.getElementById('calc-v2').value = item.v2;
    document.getElementById('calc-r1').value = item.r1 !== null ? item.r1 : "";
    document.getElementById('calc-vs').value = item.vs !== null ? item.vs : "";
    
    editIndexNotas = index;
    toggleEditModeNotas(true);
    
    // Rola a tela para o topo para o aluno ver o formulário
    document.getElementById('tela-notas').scrollIntoView({ behavior: 'smooth' });
}

window.deletarMateria = function(index) {
    if(confirm("Deseja realmente apagar esta matéria?")) {
        const materias = getMateriasAluno();
        materias.splice(index, 1);
        salvarMateriasAluno(materias);
        
        // Se apagar a matéria que estava editando, limpa o formulário
        if(editIndexNotas === index) {
            editIndexNotas = null;
            toggleEditModeNotas(false);
        }
        atualizarLista();
    }
}

atualizarLista();