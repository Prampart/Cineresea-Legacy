import { Screening } from "../../../domain/Screening";

// Contrat de lecture des séances pour le cas d'utilisation.
export interface ScreeningRepository {
  // Cherche une séance par identifiant; undefined signifie qu'aucune séance ne correspond.
  findById(id: string): Promise<Screening | undefined>;
}