import { db, collection, getDocs, query, where } from './firebase.js';

if (!localStorage.getItem('alunoLogado')) window.location.href = "index.html";
document.getElementById('btn-sair').addEventListener('click', () => { localStorage.removeItem('alunoLogado'); window.location.href = "index.html"; });

const navBtns = document.querySelectorAll('.nav-btn');
const telas = document.querySelectorAll('.tela-app');
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        telas.forEach(tela => tela.classList.add('hidden'));
        navBtns.forEach(b => b.className = 'nav-btn w-10 h-10 flex items-center justify-center text-brand-mist/70 hover:text-brand-white transition-all duration-300');
        const target = btn.getAttribute('data-target');
        document.getElementById(target).classList.remove('hidden');
        btn.className = 'nav-btn active w-10 h-10 flex items-center justify-center bg-brand-blue text-brand-white rounded-full shadow-[0_0_15px_rgba(0,48,207,0.4)] transition-all duration-300 transform scale-105';
    });
});

async function carregarAvisos() {
    const container = document.getElementById('container-avisos');
    try {
        const snap = await getDocs(collection(db, "avisos"));
        if (snap.empty) return container.innerHTML = '<p class="text-center text-brand-mist/70 mt-10 text-sm">Nenhum aviso.</p>';
        container.innerHTML = '';
        let avisosList = []; snap.forEach(doc => avisosList.push({ id: doc.id, ...doc.data() }));
        avisosList.sort((a, b) => b.dataPublicacao - a.dataPublicacao);

        avisosList.forEach(aviso => {
            let corBolinha = 'bg-brand-blue shadow-[0_0_10px_#0030CF]';
            if (aviso.urgencia === 'importante') corBolinha = 'bg-yellow-400 shadow-[0_0_10px_#facc15]';
            if (aviso.urgencia === 'urgente') corBolinha = 'bg-red-500 shadow-[0_0_10px_#ef4444]';
            let data = aviso.dataPublicacao ? aviso.dataPublicacao.toDate().toLocaleDateString('pt-BR') : '';

            const card = document.createElement('div');
            card.className = `bg-brand-white/[0.04] backdrop-blur-xl p-4 rounded-2xl border border-brand-white/10 shadow-lg`;
            card.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full ${corBolinha}"></div>
                        <span class="text-[10px] font-extrabold text-brand-mist/70 uppercase tracking-wider">${aviso.urgencia}</span>
                    </div>
                    <span class="text-xs text-brand-mist/50">${data}</span>
                </div>
                <h3 class="font-extrabold text-brand-white text-lg mb-2">${aviso.titulo}</h3>
                <p class="text-brand-mist/90 text-sm leading-relaxed whitespace-pre-line">${aviso.texto}</p>
            `;
            container.appendChild(card);
        });
    } catch (e) { container.innerHTML = '<p class="text-red-500">Erro.</p>'; }
}

let eventosGlobais = []; let dataCalendario = new Date(); let diaSelecionado = null;
async function carregarEventos() {
    try {
        const snap = await getDocs(collection(db, "eventos"));
        eventosGlobais = []; snap.forEach(doc => eventosGlobais.push({ id: doc.id, ...doc.data() }));
        renderizarEventosDoMes();
    } catch (e) { console.error(e); }
}

function renderizarEventosDoMes() {
    const mesDisplay = document.getElementById('mes-atual-display'); const gridDias = document.getElementById('calendario-dias');
    const lista = document.getElementById('lista-eventos-mes'); const tituloLista = document.getElementById('titulo-lista-eventos');
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const anoAtual = dataCalendario.getFullYear(); const mesAtual = dataCalendario.getMonth();
    mesDisplay.textContent = `${nomesMeses[mesAtual]} ${anoAtual}`;

    const eventosMes = eventosGlobais.filter(e => {
        if(!e.data) return false; const [a, m] = e.data.split('-'); return parseInt(a) === anoAtual && parseInt(m) - 1 === mesAtual;
    });

    gridDias.innerHTML = '';
    const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay(); const totalDiasMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
    for(let i = 0; i < primeiroDiaSemana; i++) gridDias.innerHTML += `<div></div>`;

    for(let dia = 1; dia <= totalDiasMes; dia++) {
        const diaStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const temEvento = eventosMes.some(e => e.data === diaStr);
        
        let classeCaixa = 'text-brand-mist/70 hover:bg-brand-white/10';
        let pontinho = temEvento ? `<div class="w-1 h-1 bg-brand-blue rounded-full mx-auto mt-0.5 shadow-[0_0_5px_rgba(0,48,207,0.8)]"></div>` : '';
        
        if (diaSelecionado === diaStr) {
            classeCaixa = 'bg-brand-blue text-brand-white font-extrabold shadow-[0_0_10px_rgba(0,48,207,0.5)]';
            pontinho = temEvento ? `<div class="w-1 h-1 bg-brand-white rounded-full mx-auto mt-0.5"></div>` : '';
        }

        const divDia = document.createElement('div'); divDia.className = "py-1 cursor-pointer";
        divDia.innerHTML = `
            <div class="w-7 h-7 mx-auto flex flex-col items-center justify-center rounded-full transition-all duration-300 ${classeCaixa}">
                <span class="text-xs ${diaSelecionado === diaStr ? 'mt-1' : ''}">${dia}</span>
                ${pontinho}
            </div>
        `;
        divDia.addEventListener('click', () => { diaSelecionado = diaSelecionado === diaStr ? null : diaStr; renderizarEventosDoMes(); });
        gridDias.appendChild(divDia);
    }

    let eventosParaMostrar = eventosMes;
    if (diaSelecionado) {
        eventosParaMostrar = eventosMes.filter(e => e.data === diaSelecionado);
        const [, m, d] = diaSelecionado.split('-'); tituloLista.textContent = `Eventos do dia ${d}/${m}`;
    } else {
        tituloLista.textContent = `Resumo de ${nomesMeses[mesAtual]}`;
    }

    eventosParaMostrar.sort((a, b) => new Date(a.data) - new Date(b.data)); lista.innerHTML = '';
    if (eventosParaMostrar.length === 0) return lista.innerHTML = `<p class="text-center text-brand-mist/50 mt-4 text-xs">Nenhum evento.</p>`;

    eventosParaMostrar.forEach(evento => {
        const [, , dia] = evento.data.split('-'); 
        let corBolinha = 'bg-brand-blue';
        if(evento.tipo === 'prova') corBolinha = 'bg-red-500';
        if(evento.tipo === 'trabalho') corBolinha = 'bg-yellow-400';

        const card = document.createElement('div');
        card.className = `bg-brand-white/[0.04] backdrop-blur-md p-3 rounded-[1.2rem] border border-brand-white/5 flex items-center gap-3`;
        card.innerHTML = `
            <div class="flex flex-col items-center justify-center bg-brand-white/5 rounded-xl w-12 h-12 border border-brand-white/10">
                <span class="text-lg font-extrabold text-brand-white">${dia}</span>
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="w-2 h-2 rounded-full ${corBolinha}"></span>
                    <span class="text-[10px] font-extrabold text-brand-mist/70 uppercase tracking-wider">${evento.tipo}</span>
                </div>
                <h4 class="font-bold text-brand-white text-sm">${evento.titulo}</h4>
            </div>
        `;
        lista.appendChild(card);
    });
}
document.getElementById('btn-mes-anterior').addEventListener('click', () => { diaSelecionado = null; dataCalendario.setMonth(dataCalendario.getMonth() - 1); renderizarEventosDoMes(); });
document.getElementById('btn-mes-proximo').addEventListener('click', () => { diaSelecionado = null; dataCalendario.setMonth(dataCalendario.getMonth() + 1); renderizarEventosDoMes(); });

async function carregarMateriais() {
    const container = document.getElementById('lista-materiais');
    try {
        const snap = await getDocs(collection(db, "materiais"));
        if (snap.empty) return container.innerHTML = '<p class="col-span-2 text-center text-brand-mist/50 mt-10 text-sm">Nenhum material.</p>';
        container.innerHTML = '';
        let matList = []; snap.forEach(doc => matList.push({ id: doc.id, ...doc.data() }));
        matList.sort((a, b) => b.dataEnvio - a.dataEnvio);

        matList.forEach(item => {
            const card = document.createElement('div');
            card.className = "bg-brand-blue/20 backdrop-blur-xl p-4 rounded-2xl border border-brand-blue/30 flex flex-col justify-between h-32 relative overflow-hidden";
            card.innerHTML = `
                <div class="absolute top-0 right-0 w-20 h-20 bg-brand-blue/30 rounded-full blur-[20px]"></div>
                <div class="z-10">
                    <span class="bg-black/30 text-brand-mist text-[9px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider border border-brand-white/10">${item.materia}</span>
                    <h3 class="font-bold text-brand-white text-sm mt-2 leading-tight">${item.titulo}</h3>
                </div>
                <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="z-10 mt-2 bg-brand-white/10 hover:bg-brand-white/20 text-brand-white font-semibold py-1.5 rounded-lg text-center text-xs transition border border-brand-white/10 backdrop-blur-md">
                    Acessar
                </a>
            `;
            container.appendChild(card);
        });
    } catch (e) { container.innerHTML = '<p class="text-red-500">Erro.</p>'; }
}

async function carregarHorarios() {
    const container = document.getElementById('lista-horarios');
    try {
        const snap = await getDocs(collection(db, "horarios"));
        if (snap.empty) return container.innerHTML = '<p class="text-brand-mist/50 text-xs">Nenhuma aula cadastrada.</p>';
        container.innerHTML = '';
        let horariosList = []; snap.forEach(doc => horariosList.push({ id: doc.id, ...doc.data() }));
        horariosList.sort((a, b) => a.dia.localeCompare(b.dia));
        let diaAtual = "";

        horariosList.forEach(aula => {
            const nomeDoDia = aula.dia.split('-')[1];
            if (nomeDoDia !== diaAtual) {
                const tituloDia = document.createElement('h4');
                tituloDia.className = "text-brand-white text-sm font-extrabold mt-3 mb-1.5";
                tituloDia.textContent = nomeDoDia;
                container.appendChild(tituloDia);
                diaAtual = nomeDoDia;
            }

            const card = document.createElement('div');
            card.className = "bg-brand-white/[0.03] backdrop-blur-md p-3 rounded-xl border border-brand-white/5 flex gap-3 items-center";
            card.innerHTML = `
                <!-- CORRIGIDO: Fundo Azul sólido, Texto Branco para máximo contraste -->
                <div class="bg-brand-blue text-brand-white font-extrabold px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-[0_0_10px_rgba(0,48,207,0.4)]">
                    <i class="ph-bold ph-clock mr-1"></i> ${aula.hora}
                </div>
                <div>
                    <h5 class="text-brand-white font-bold text-xs">${aula.materia}</h5>
                    <p class="text-brand-mist/70 text-[10px] mt-0.5"><i class="ph-fill ph-chalkboard-teacher mr-1"></i> ${aula.prof}</p>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) { container.innerHTML = '<p class="text-red-500">Erro.</p>'; }
}

async function carregarContatos() {
    const container = document.getElementById('lista-contatos');
    try {
        const snap = await getDocs(collection(db, "contatos"));
        if (snap.empty) return container.innerHTML = '<p class="text-brand-mist/50 text-xs">Nenhum contato salvo.</p>';
        container.innerHTML = '';
        let contatosList = []; snap.forEach(doc => contatosList.push({ id: doc.id, ...doc.data() }));
        contatosList.sort((a, b) => a.nome.localeCompare(b.nome));

        contatosList.forEach(contato => {
            const card = document.createElement('div');
            card.className = "bg-brand-white/[0.03] backdrop-blur-md p-3 rounded-[1.2rem] border border-brand-white/5 flex justify-between items-center gap-2";
            card.innerHTML = `
                <div>
                    <h5 class="text-brand-white font-bold text-sm">${contato.nome}</h5>
                    <p class="text-brand-mist/70 text-[9px] uppercase font-bold tracking-wider mt-0.5">${contato.cargo}</p>
                </div>
                <div class="flex gap-2">
                    <a href="tel:${contato.numero}" class="w-8 h-8 bg-brand-white/5 hover:bg-brand-white/10 rounded-full flex items-center justify-center text-brand-white transition border border-brand-white/10">
                        <i class="ph-fill ph-phone text-sm"></i>
                    </a>
                    <a href="https://wa.me/55${contato.numero}" target="_blank" class="w-8 h-8 bg-[#25D366]/20 hover:bg-[#25D366]/30 rounded-full flex items-center justify-center text-[#25D366] transition border border-[#25D366]/30">
                        <i class="ph-fill ph-whatsapp-logo text-sm"></i>
                    </a>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) { container.innerHTML = '<p class="text-red-500">Erro.</p>'; }
}

async function carregarNomeAluno() {
    const matricula = localStorage.getItem('alunoLogado'); 
    const displayNome = document.getElementById('nome-aluno-display');
    
    if (!matricula) return;
    
    try {
        const q = query(collection(db, "alunos"), where("matricula", "==", matricula));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            // Pega o nome completo, remove espaços extras e divide em um array
            const partesNome = snap.docs[0].data().nome.trim().split(' ');
            
            if (partesNome.length > 1) {
                // Se tiver mais de um nome, mostra o Primeiro e o Último (Sobrenome)
                const primeiroNome = partesNome[0];
                const ultimoNome = partesNome[partesNome.length - 1];
                displayNome.textContent = `${primeiroNome} ${ultimoNome}`;
            } else {
                // Se o administrador cadastrou só um nome, mostra só ele
                displayNome.textContent = partesNome[0];
            }
        } else { 
            // Texto caso não encontre
            displayNome.textContent = "Futuro(a) Psi"; 
        }
    } catch (error) { 
        displayNome.textContent = "Futuro(a) Psi"; 
    }
}

carregarNomeAluno(); carregarAvisos(); carregarEventos(); carregarMateriais(); carregarHorarios(); carregarContatos();

carregarNomeAluno(); carregarAvisos(); carregarEventos(); carregarMateriais(); carregarHorarios(); carregarContatos();