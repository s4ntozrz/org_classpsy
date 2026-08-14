import { db, collection, getDocs } from './firebase.js';

if (!localStorage.getItem('alunoLogado')) window.location.href = "index.html";

document.getElementById('btn-sair').addEventListener('click', () => {
    localStorage.removeItem('alunoLogado');
    window.location.href = "index.html";
});

// NAVEGAÇÃO
const navBtns = document.querySelectorAll('.nav-btn');
const telas = document.querySelectorAll('.tela-app');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        telas.forEach(tela => tela.classList.add('hidden'));
        navBtns.forEach(b => {
            b.className = 'nav-btn w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-white transition-all duration-300';
        });
        const target = btn.getAttribute('data-target');
        document.getElementById(target).classList.remove('hidden');
        btn.className = 'nav-btn active w-12 h-12 flex items-center justify-center bg-[#D4FF00] text-black rounded-full shadow-[0_0_15px_rgba(212,255,0,0.4)] transition-all duration-300 transform scale-105';
    });
});

// AVISOS
async function carregarAvisos() {
    const container = document.getElementById('container-avisos');
    try {
        const snap = await getDocs(collection(db, "avisos"));
        if (snap.empty) return container.innerHTML = '<p class="text-center text-zinc-500 mt-10">Nenhum aviso.</p>';
        container.innerHTML = '';
        let avisosList = [];
        snap.forEach(doc => avisosList.push({ id: doc.id, ...doc.data() }));
        avisosList.sort((a, b) => b.dataPublicacao - a.dataPublicacao);

        avisosList.forEach(aviso => {
            let corBolinha = 'bg-blue-500';
            if (aviso.urgencia === 'importante') corBolinha = 'bg-yellow-400';
            if (aviso.urgencia === 'urgente') corBolinha = 'bg-red-500';
            let data = aviso.dataPublicacao ? aviso.dataPublicacao.toDate().toLocaleDateString('pt-BR') : '';

            const card = document.createElement('div');
            card.className = `bg-white/[0.04] backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 shadow-lg`;
            card.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full ${corBolinha} shadow-[0_0_10px_${corBolinha}]"></div>
                        <span class="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">${aviso.urgencia}</span>
                    </div>
                    <span class="text-xs text-zinc-500">${data}</span>
                </div>
                <h3 class="font-extrabold text-white text-lg mb-2">${aviso.titulo}</h3>
                <p class="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">${aviso.texto}</p>
            `;
            container.appendChild(card);
        });
    } catch (e) { container.innerHTML = '<p class="text-red-500">Erro.</p>'; }
}

// ==========================================
// MÓDULO: CALENDÁRIO VISUAL E EVENTOS
// ==========================================
let eventosGlobais = [];
let dataCalendario = new Date();
let diaSelecionado = null; // Variável para saber se o aluno clicou em um dia específico

async function carregarEventos() {
    try {
        const snap = await getDocs(collection(db, "eventos"));
        eventosGlobais = [];
        snap.forEach(doc => eventosGlobais.push({ id: doc.id, ...doc.data() }));
        renderizarEventosDoMes();
    } catch (e) { console.error(e); }
}

function renderizarEventosDoMes() {
    const mesDisplay = document.getElementById('mes-atual-display');
    const gridDias = document.getElementById('calendario-dias');
    const lista = document.getElementById('lista-eventos-mes');
    const tituloLista = document.getElementById('titulo-lista-eventos');
    
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const anoAtual = dataCalendario.getFullYear();
    const mesAtual = dataCalendario.getMonth();
    mesDisplay.textContent = `${nomesMeses[mesAtual]} ${anoAtual}`;

    // 1. Filtrar os eventos do mês
    const eventosMes = eventosGlobais.filter(e => {
        if(!e.data) return false;
        const [a, m] = e.data.split('-');
        return parseInt(a) === anoAtual && parseInt(m) - 1 === mesAtual;
    });

    // 2. Construir o Grid Visual (Dias)
    gridDias.innerHTML = '';
    const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay(); // 0 a 6
    const totalDiasMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

    // Espaços vazios antes do dia 1
    for(let i = 0; i < primeiroDiaSemana; i++) {
        gridDias.innerHTML += `<div></div>`;
    }

    // Desenhar os dias
    for(let dia = 1; dia <= totalDiasMes; dia++) {
        // Cria a string da data no formato YYYY-MM-DD
        const diaStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        // Verifica se tem evento neste dia
        const temEvento = eventosMes.some(e => e.data === diaStr);
        
        // Estilos e Pontinho
        let classeCaixa = 'text-zinc-300 hover:bg-white/10';
        let pontinho = temEvento ? `<div class="w-1 h-1 bg-[#D4FF00] rounded-full mx-auto mt-0.5 shadow-[0_0_5px_rgba(212,255,0,0.8)]"></div>` : '';
        
        // Se este dia foi clicado/selecionado
        if (diaSelecionado === diaStr) {
            classeCaixa = 'bg-[#D4FF00] text-black font-extrabold shadow-[0_0_15px_rgba(212,255,0,0.4)]';
            pontinho = temEvento ? `<div class="w-1 h-1 bg-black rounded-full mx-auto mt-0.5"></div>` : '';
        }

        const divDia = document.createElement('div');
        divDia.className = "py-1 cursor-pointer";
        divDia.innerHTML = `
            <div class="w-8 h-8 mx-auto flex flex-col items-center justify-center rounded-full transition-all duration-300 ${classeCaixa}">
                <span class="text-sm ${diaSelecionado === diaStr ? 'mt-1' : ''}">${dia}</span>
                ${pontinho}
            </div>
        `;
        
        // Lógica do clique no dia
        divDia.addEventListener('click', () => {
            if (diaSelecionado === diaStr) {
                diaSelecionado = null; // Se clicar de novo, tira a seleção (mostra o mês todo)
            } else {
                diaSelecionado = diaStr; // Seleciona o dia
            }
            renderizarEventosDoMes(); // Atualiza a tela
        });

        gridDias.appendChild(divDia);
    }

    // 3. Renderizar a Lista de Eventos (Resumo ou Dia específico)
    let eventosParaMostrar = eventosMes;
    
    if (diaSelecionado) {
        // Se clicou em um dia, filtra só os eventos daquele dia
        eventosParaMostrar = eventosMes.filter(e => e.data === diaSelecionado);
        
        const [a, m, d] = diaSelecionado.split('-');
        tituloLista.textContent = `Eventos do dia ${d}/${m}`;
    } else {
        tituloLista.textContent = `Resumo de ${nomesMeses[mesAtual]}`;
    }

    eventosParaMostrar.sort((a, b) => new Date(a.data) - new Date(b.data));
    lista.innerHTML = '';
    
    if (eventosParaMostrar.length === 0) {
        lista.innerHTML = `<p class="text-center text-zinc-500 mt-6">Nenhum evento para esta data.</p>`;
        return;
    }

    eventosParaMostrar.forEach(evento => {
        const [, , dia] = evento.data.split('-'); 
        let corBolinha = 'bg-indigo-500';
        if(evento.tipo === 'prova') corBolinha = 'bg-red-500';
        if(evento.tipo === 'trabalho') corBolinha = 'bg-yellow-400';
        if(evento.tipo === 'feriado') corBolinha = 'bg-[#D4FF00]';

        const card = document.createElement('div');
        card.className = `bg-white/[0.04] backdrop-blur-md p-4 rounded-[1.5rem] border border-white/5 flex items-center gap-4`;
        card.innerHTML = `
            <div class="flex flex-col items-center justify-center bg-white/5 rounded-2xl w-14 h-14 border border-white/10">
                <span class="text-xl font-extrabold text-white">${dia}</span>
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="w-2 h-2 rounded-full ${corBolinha}"></span>
                    <span class="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">${evento.tipo}</span>
                </div>
                <h4 class="font-bold text-white text-sm">${evento.titulo}</h4>
            </div>
        `;
        lista.appendChild(card);
    });
}

document.getElementById('btn-mes-anterior').addEventListener('click', () => { 
    diaSelecionado = null; // Reseta seleção ao trocar de mês
    dataCalendario.setMonth(dataCalendario.getMonth() - 1); 
    renderizarEventosDoMes(); 
});
document.getElementById('btn-mes-proximo').addEventListener('click', () => { 
    diaSelecionado = null;
    dataCalendario.setMonth(dataCalendario.getMonth() + 1); 
    renderizarEventosDoMes(); 
});
// MATERIAIS
async function carregarMateriais() {
    const container = document.getElementById('lista-materiais');
    try {
        const snap = await getDocs(collection(db, "materiais"));
        if (snap.empty) return container.innerHTML = '<p class="col-span-2 text-center text-zinc-500 mt-10">Nenhum material.</p>';
        container.innerHTML = '';
        let matList = [];
        snap.forEach(doc => matList.push({ id: doc.id, ...doc.data() }));
        matList.sort((a, b) => b.dataEnvio - a.dataEnvio);

        matList.forEach(item => {
            const card = document.createElement('div');
            card.className = "bg-indigo-600/20 backdrop-blur-xl p-4 rounded-[2rem] border border-indigo-500/30 flex flex-col justify-between h-40 relative overflow-hidden";
            card.innerHTML = `
                <div class="absolute top-0 right-0 w-20 h-20 bg-indigo-500/20 rounded-full blur-[20px]"></div>
                <div>
                    <span class="bg-black/30 text-[#D4FF00] text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider border border-white/10">${item.materia}</span>
                    <h3 class="font-bold text-white text-sm mt-3 leading-tight">${item.titulo}</h3>
                </div>
                <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="mt-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-xl text-center text-xs transition border border-white/10 backdrop-blur-md">
                    Acessar
                </a>
            `;
            container.appendChild(card);
        });
    } catch (e) { container.innerHTML = '<p class="text-red-500">Erro.</p>'; }
}

carregarAvisos();
carregarEventos();
carregarMateriais();