# CinéResa — TP3, partie A

API de réservation organisée en ports et adaptateurs. Les quatre routes utilisent des use cases et la persistance est en mémoire.

```bash
npm install
npm start              # lance src/main.ts sur http://localhost:3000
npm test               # exécute les tests, y compris la règle d'architecture et la limite des 2h
npm run typecheck      # vérifie les types TypeScript
```

Au démarrage, l'application crée des séances de démonstration en mémoire. Les réservations disparaissent quand le processus s'arrête; la persistance JSON est prévue pour la partie B du TP3.

| Méthode | Route | Body |
|---|---|---|
| GET | `/screenings` | — |
| POST | `/screenings/:id/bookings` | `{ "email": "a@b.fr", "seats": 2, "tariff": "NORMAL" }` (`"STUDENT"` pour le tarif étudiant) |
| DELETE | `/bookings/:id` | — |
| GET | `/bookings?email=a@b.fr` | — |

Les prix sont en centimes. Le paiement est simulé. Les use cases ne dépendent ni d'Express ni des adaptateurs concrets; `src/main.ts` assemble les dépendances.
