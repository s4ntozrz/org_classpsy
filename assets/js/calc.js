// 1. Pega a matrícula de quem está logado no momento
const matriculaAluno = localStorage.getItem('alunoLogado');

// 2. Cria uma "gaveta" (chave) única para este aluno no celular (Ex: notas_2024001)
const chaveNotas = `notas_${matriculaAluno}`;

const formCalc = document.getElementById('form-calc');
const listaMaterias = document.getElementById('lista-materias');

// 3. Agora ele busca as notas APENAS na gaveta dessa matrícula
let materias = JSON.parse(localStorage.getItem(chaveNotas)) || [];

function calcularMedia(n1, n2) { 
    return ((n1 + n2) / 2).toFixed(1); 
}

function atualizarLista() {
    listaMaterias.innerHTML = '';
    
    if (materias.length === 0) {
        return listaMaterias.innerHTML = '<p class="text-center text-zinc-500 text-xs mt-4">Nenhuma matéria salva ainda.</p>';
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

formCalc.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('calc-materia').value;
    const n1 = parseFloat(document.getElementById('calc-nota1').value);
    const n2 = parseFloat(document.getElementById('calc-nota2').value);

    materias.push({ nome, n1, n2 });
    
    // 4. Salva as notas na gaveta específica dessa matrícula
    localStorage.setItem(chaveNotas, JSON.stringify(materias));
    
    formCalc.reset();
    atualizarLista();
});

window.deletarMateria = function(index) {
    if(confirm("Apagar matéria?")) {
        materias.splice(index, 1);
        // Atualiza a gaveta específica ao deletar
        localStorage.setItem(chaveNotas, JSON.stringify(materias));
        atualizarLista();
    }
}

// Renderiza as notas assim que o aluno abre a tela
atualizarLista();