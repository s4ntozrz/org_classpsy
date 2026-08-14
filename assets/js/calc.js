// Função que sempre busca a chave exata do aluno ativo no momento
function getChaveAluno() {
    const matricula = localStorage.getItem('alunoLogado') || 'desconhecido';
    return `notas_${matricula}`;
}

// Função que busca as notas exclusivas desse aluno
function getMateriasAluno() {
    return JSON.parse(localStorage.getItem(getChaveAluno())) || [];
}

// Função que salva as notas na gaveta certa
function salvarMateriasAluno(materias) {
    localStorage.setItem(getChaveAluno(), JSON.stringify(materias));
}

function calcularMedia(n1, n2) { 
    return ((n1 + n2) / 2).toFixed(1); 
}

const formCalc = document.getElementById('form-calc');
const listaMaterias = document.getElementById('lista-materias');

function atualizarLista() {
    if (!listaMaterias) return; // Proteção
    
    listaMaterias.innerHTML = '';
    const materias = getMateriasAluno(); // Busca as notas do aluno ativo
    
    if (materias.length === 0) {
        listaMaterias.innerHTML = '<p class="text-center text-zinc-500 text-xs mt-4">Nenhuma matéria salva ainda.</p>';
        return;
    }

    materias.forEach((item, index) => {
        const media = calcularMedia(item.n1, item.n2);
        let status = media >= 7.0 ? '<span class="text-[#D4FF00] font-bold">Aprovado</span>' : '<span class="text-red-400 font-bold">Exame</span>';

        const card = document.createElement('div');
        card.className = "bg-white/[0.04] p-3 rounded-2xl border border-white/10 flex justify-between items-center";
        card.innerHTML = `
            <div>
                <h4 class="font-bold text-white text-sm">${item.nome}</h4>
                <p class="text-[11px] text-zinc-500 mt-0.5">N1: ${item.n1} | N2: ${item.n2}</p>
                <p class="text-xs mt-1 text-zinc-300">Média: <span class="font-bold text-white">${media}</span> - ${status}</p>
            </div>
            <button onclick="deletarMateria(${index})" class="w-9 h-9 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shadow-sm shrink-0">
                <i class="ph-bold ph-trash text-sm"></i>
            </button>
        `;
        listaMaterias.appendChild(card);
    });
}

if (formCalc) {
    formCalc.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('calc-materia').value;
        const n1 = parseFloat(document.getElementById('calc-nota1').value);
        const n2 = parseFloat(document.getElementById('calc-nota2').value);

        const materias = getMateriasAluno(); // Pega a lista atual do aluno
        materias.push({ nome, n1, n2 });
        
        salvarMateriasAluno(materias); // Salva na gaveta dele
        
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

// Inicia a lista ao carregar
atualizarLista();