    // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
  import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js"; // Importa ferramenta de Autenticação

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDfpBNJcyGXWhLJoa41Utnohlp2RTFgikE",
    authDomain: "nutridash-ce2c9.firebaseapp.com",
    projectId: "nutridash-ce2c9",
    storageBucket: "nutridash-ce2c9.firebasestorage.app",
    messagingSenderId: "964653490902",
    appId: "1:964653490902:web:442dae297e929655249f77",
    measurementId: "G-CLH84RJ1P5"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize Firestore
  const db = getFirestore(app);
  // Initialize Firebase Authentication
  const auth = getAuth(app);

  // EXecuta o login anõnimo para que o usuário possa acessar o banco de dados
  signInAnonymously(auth)
    .then(() => {
      console.log("Autenticado anonimamente com sucesso!");
    })
    .catch((error) => {
      console.error("Erro ao autenticar anonimamente:", error);
    });

  // Exporta para que outros arquivos possam usar
  export { db, auth };

  console.log("NutriDash Conectado: Banco de Dados pronto!");
  console.log("NutriDash Conectado: Autenticação pronta!");