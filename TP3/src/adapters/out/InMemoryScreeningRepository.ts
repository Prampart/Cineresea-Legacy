import { Screening } from "../../domain/Screening";
import { ScreeningRepository } from "../../application/ports/out/ScreeningRepository";

// Donne accès à des séances conservées uniquement en mémoire.
export class InMemoryScreeningRepository implements ScreeningRepository {
  private readonly screenings: Screening[];

  // Reçoit les séances initiales et convertit leurs dates en objets Date fiables.
  constructor(screenings: Screening[] = []) {
    this.screenings = screenings.map((screening) =>
      Object.assign(new Screening(), screening, {
        startsAt: new Date(screening.startsAt),
      })
    );
  }

  // Cherche une séance dont l'identifiant correspond et renvoie undefined si elle est absente.
  async findById(id: string): Promise<Screening | undefined> {
    return this.screenings.find((screening) => screening.id === id);
  }
}
