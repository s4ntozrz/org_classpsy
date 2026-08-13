// Importando as funções do Firebase via CDN (Como não usamos Node.js, essa é a forma correta)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// COLOQUE AS SUAS CHAVES AQUI DENTRO:
const firebaseConfig = {
  apiKey: "AIzaSyCYdlJUI-uatBDVClZYHS-t2J46pCGd0Pg",
  authDomain: "app-turma-3b13c.firebaseapp.com",
  projectId: "app-turma-3b13c",
  storageBucket: "app-turma-3b13c.firebasestorage.app",
  messagingSenderId: "648025109794",
  appId: "1:648025109794:web:d132d121692fe18b8ae17b",
  measurementId: "G-7B3CFVEF2M"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);

// Inicializando os serviços (Autenticação e Banco de Dados)
const auth = getAuth(app);
const db = getFirestore(app);

// Exportando para podermos usar em outros arquivos (como no auth.js)
export { auth, db, signInWithEmailAndPassword, collection, getDocs, query, where };