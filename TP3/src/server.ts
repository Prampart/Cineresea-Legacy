import app from "./main";

// Choisit le port indiqué dans l'environnement, ou 3000 par défaut.
const PORT = process.env.PORT || 3000;

// Démarre le serveur uniquement lorsque ce fichier est lancé directement.
if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`CinéResa legacy sur http://localhost:${PORT}`)
  );
}

// L'export facilite les tests et la réutilisation de l'application.
export default app;