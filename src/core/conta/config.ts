// O projeto do Firebase da conta opcional (ver .specs/001-conta-e-sincronizacao.md). Estes valores são públicos por natureza
// (vão no navegador de quem entra); quem protege os dados são as regras do Firestore (firestore.rules, na raiz).
export const FIREBASE = {
  apiKey: "AIzaSyCkNsjUVdy1lVxkYROR-ce0kBh41SaVg5U",
  authDomain: "marmota-music-app.firebaseapp.com",
  projectId: "marmota-music-app",
  appId: "1:363668945683:web:50f7615ee4192f452d78e6",
} as const;
