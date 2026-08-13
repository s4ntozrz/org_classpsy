import { auth, db, signInWithEmailAndPassword, collection, getDocs, query, where } from './firebase.js';

const studentForm = document.getElementById('student-form');
const adminForm = document.getElementById('admin-form');
const toggleBtn = document.getElementById('toggle-login');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
let isAdminView = false;

toggleBtn.addEventListener('click', () => {
    isAdminView = !isAdminView;
    if (isAdminView) {
        studentForm.classList.add('hidden');
        adminForm.classList.remove('hidden');
        pageTitle.textContent = "Acesso Admin";
        pageSubtitle.textContent = "Gestão da plataforma";
        toggleBtn.innerHTML = "← Voltar para Aluno";
    } else {
        studentForm.classList.remove('hidden');
        adminForm.classList.add('hidden');
        pageTitle.textContent = "Portal Turma";
        pageSubtitle.textContent = "Digite sua matrícula para entrar";
        toggleBtn.innerHTML = "🔒 Acesso Restrito (Administrador)";
    }
});

// LOGIN ALUNO
studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = studentForm.querySelector('button');
    const matriculaInput = document.getElementById('matricula').value;
    btn.textContent = "Verificando..."; 
    btn.disabled = true;

    try {
        const alunosRef = collection(db, "alunos");
        const q = query(alunosRef, where("matricula", "==", matriculaInput));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            localStorage.setItem('alunoLogado', matriculaInput);
            window.location.href = "app.html"; 
        } else {
            alert("Matrícula não encontrada!");
            btn.textContent = "Acessar Plataforma";
            btn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        alert("Erro ao conectar.");
        btn.textContent = "Acessar Plataforma";
        btn.disabled = false;
    }
});

// LOGIN ADMIN
adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = adminForm.querySelector('button');
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;
    btn.textContent = "Autenticando...";
    btn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
        localStorage.setItem('adminLogado', 'true');
        window.location.href = "admin.html";
    } catch (error) {
        alert("Acesso negado.");
        btn.textContent = "Entrar no Painel";
        btn.disabled = false;
    }
});