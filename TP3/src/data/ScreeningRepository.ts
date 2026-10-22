import { readDb } from "./Db";

// Repository legacy qui lit les séances depuis le fichier JSON.
export class ScreeningRepository {
  // Renvoie la liste entière des séances enregistrées.
  findAll() {
    return readDb().screenings;
  }

  // Cherche une séance à l'aide de son identifiant.
  findById(id: string) {
    return readDb().screenings.find((s: any) => s.id === id);
  }
}