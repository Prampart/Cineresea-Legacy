import { readDb, writeDb } from "./Db";

// Repository legacy qui lit et modifie les réservations dans le fichier JSON.
export class BookingRepository {
  // Renvoie toutes les réservations enregistrées.
  findAll() {
    return readDb().bookings;
  }

  // Recherche une réservation à partir de son identifiant.
  findById(id: string) {
    return readDb().bookings.find((b: any) => b.id === id);
  }

  // Ajoute une réservation au tableau puis réécrit le fichier de données.
  create(booking: any) {
    const db = readDb();
    db.bookings.push(booking);
    writeDb(db);
  }

  // Remplace la liste complète des réservations et sauvegarde le résultat.
  saveAll(bookings: any[]) {
    const db = readDb();
    db.bookings = bookings;
    writeDb(db);
  }
}