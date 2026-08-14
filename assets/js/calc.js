const formCalc = document.getElementById('form-calc');
const listaMaterias = document.getElementById('lista-materias');
let materias = JSON.parse(localStorage.getItem('notas_turma')) || [];

function calcularMedia(n1, n2) { return ((n1 + n2) / 2).toFixed(1); }

function atualizarLista() {
    listaMaterias.innerHTML = '';
    if (materias.length === 0) return listaMaterias.innerHTML = '<p class="text-center text-zinc-500 text-sm mt-4">Nenhuma matéria salva.</p>';

    materias.forEach((item, index) => {
        const media = calcularMedia(item.n1, item.n2);
        let status = media >= 7.0 ? '<span class="text-[#D4FF00] font-bold">Aprovado</span>' : '<span class="text-red-400 font-bold">Exame</span>';

        const card = document.createElement('div');
        card.className = "bg-white/[0.04] p-4 rounded-2xl border border-white/10 flex justify-between items-center";
        card.innerHTML = `
            <div>
                <h4 class="font-bold text-white">${item.nome}</h4>
                <p class="text-xs text-zinc-500">N1: ${item.n1} | N2: ${item.n2}</p>
                <p class="text-sm mt-1 text-zinc-300">Média: <span class="font-bold text-white">${media}</span> - ${status}</p>
            </div>
            <button onclick="deletarMateria(${index})" class="w-10 h-10 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500/30 transition shadow-sm shrink-0">
                <i class="ph-bold ph-trash text-lg"></i>
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
    localStorage.setItem('notas_turma', JSON.stringify(materias));
    formCalc.reset();
    atualizarLista();
});

window.deletarMateria = function(index) {
    if(confirm("Apagar matéria?")) {
        materias.splice(index, 1);
        localStorage.setItem('notas_turma', JSON.stringify(materias));
        atualizarLista();
    }
}
atualizarLista();