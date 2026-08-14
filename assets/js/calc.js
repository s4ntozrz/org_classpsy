// Funções de gaveta por matrícula (Mantém o isolamento de usuários)
function getChaveAluno() {
    const matricula = localStorage.getItem('alunoLogado') || 'desconhecido';
    return `notas_${matricula}`;
}

function getMateriasAluno() { return JSON.parse(localStorage.getItem(getChaveAluno())) || []; }
function salvarMateriasAluno(materias) { localStorage.setItem(getChaveAluno(), JSON.stringify(materias)); }

const formCalc = document.getElementById('form-calc');
const listaMaterias = document.getElementById('lista-materias');

// ==========================================
// REGIMENTO UNIVERSO: LÓGICA DE NOTAS
// ==========================================
function processarNotas(v1, vt, v2, r1, vs) {
    // 1. Regra da R1 (Substitui V1 se for maior, limitada a 7.0)
    let notaV1_Final = v1;
    let usouR1 = false;
    
    if (r1 !== null && !isNaN(r1)) {
        let r1Valida = r1 > 7.0 ? 7.0 : r1; // Trava em 7.0
        if (r1Valida > v1) {
            notaV1_Final = r1Valida;
            usouR1 = true;
        }
    }

    // 2. Cálculo da Média Semestral (MS)
    let ms = ((notaV1_Final * 2) + vt + (v2 * 2)) / 5;
    ms = parseFloat(ms.toFixed(1));

    let status = "";
    let corStatus = "";
    let mf = ms; // Média final começa igual a MS
    let precisaVS = null;

    // 3. Regras de Aprovação
    if (ms >= 7.0) {
        status = "Aprovado por Média";
        corStatus = "text-[#D4FF00]";
    } else if (ms < 4.0) {
        status = "Reprovado (Direto)";
        corStatus = "text-red-500";
    } else {
        // Situação de Final (Verificação Suplementar - VS)
        if (vs === null || isNaN(vs)) {
            status = "Em Final (VS)";
            corStatus = "text-yellow-400";
            
            // Calcula quanto precisa na VS: (MS + VS)/2 = 5 => VS = 10 - MS
            precisaVS = (10 - ms).toFixed(1);
            if (precisaVS < 5.0) precisaVS = 5.0; // Regra: Não pode tirar menos que 5 na VS
            
        } else {
            // Se já fez a VS, calcula a Média Final
            mf = (ms + vs) / 2;
            mf = parseFloat(mf.toFixed(1));
            
            if (mf >= 5.0 && vs >= 5.0) {
                status = "Aprovado na VS";
                corStatus = "text-indigo-400";
            } else {
                status = "Reprovado na VS";
                corStatus = "text-red-500";
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
            <button onclick="deletarMateria(${index})" class="w-10 h-10 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shadow-sm shrink-0 ml-2">
                <i class="ph-bold ph-trash text-sm"></i>
            </button>
        `;
        listaMaterias.appendChild(card);
    });
}

// ==========================================
// SALVAR DADOS
// ==========================================
if (formCalc) {
    formCalc.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('calc-materia').value;
        const v1 = parseFloat(document.getElementById('calc-v1').value);
        const vt = parseFloat(document.getElementById('calc-vt').value);
        const v2 = parseFloat(document.getElementById('calc-v2').value);
        
        // R1 e VS são opcionais. Se vazio, salva como null
        const r1Val = document.getElementById('calc-r1').value;
        const vsVal = document.getElementById('calc-vs').value;
        const r1 = r1Val === "" ? null : parseFloat(r1Val);
        const vs = vsVal === "" ? null : parseFloat(vsVal);

        const materias = getMateriasAluno();
        materias.push({ nome, v1, vt, v2, r1, vs });
        
        salvarMateriasAluno(materias);
        formCalc.reset();
        atualizarLista();
    });
}

window.deletarMateria = function(index) {
    if(confirm("Apagar matéria?")) {
        const materias = getMateriasAluno();
        materias.splice(index, 1);
        salvarMateriasAluno(materias);
        atualizarLista();
    }
}

atualizarLista();