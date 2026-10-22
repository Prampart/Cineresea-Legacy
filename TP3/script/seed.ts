// Régénère data/db.json avec des séances dans les prochains jours
import fs from "fs";
import path from "path";

// Convertit un nombre d'heures à partir de maintenant en date ISO.
const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

// Jeu de données d'exemple: trois séances et une réservation déjà confirmée.
const db = {
  screenings: [
    { id: "s1", movie: "Dune: Part Three", room: "Salle 1", startsAt: inHours(26), capacity: 120, price: 1150 },
    { id: "s2", movie: "Le Comte de Monte-Cristo", room: "Salle 2", startsAt: inHours(50), capacity: 80, price: 1050 },
    { id: "s3", movie: "Avant-première surprise", room: "Salle 3", startsAt: inHours(1), capacity: 10, price: 900 },
  ],
  bookings: [
    { id: "b1", screeningId: "s3", email: "alice@example.com", seats: 6, tariff: "NORMAL", total: 4860, status: "CONFIRMED", createdAt: new Date().toISOString() },
  ],
};

// Crée le dossier de données s'il n'existe pas, puis écrit le fichier JSON de départ.
fs.mkdirSync(path.join(__dirname, "..", "data"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "..", "data", "db.json"), JSON.stringify(db, null, 2));
console.log("data/db.json régénéré");
