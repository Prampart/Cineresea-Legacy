/*
?tape 7 - Adaptateur de stockage des s?ances en m?moire.
Ce repository initialise une liste de s?ances et la renvoie sans d?pendre d'un syst?me externe.
Il sert de base de travail pour le d?veloppement et les tests du cas d'usage.
*/


import { Screening } from "../../domain/Screening";
import { ScreeningRepository } from "../../application/ports/out/ScreeningRepository";

// Donne accès à des séances conservées uniquement en mémoire.
export class InMemoryScreeningRepository implements ScreeningRepository {
  // Tableau utilisé comme source de données pour toute la durée de vie de l'adaptateur.
  private readonly screenings: Screening[];

  // Copie les données initiales dans des objets Screening et normalise les dates.
  // Le paramètre par défaut permet de créer un repository vide dans les tests.
  constructor(screenings: Screening[] = []) {
    this.screenings = screenings.map((screening) =>
      Object.assign(new Screening(), screening, {
        startsAt: new Date(screening.startsAt),
      })
    );
  }
  // Renvoie toutes les séances pour que le use case applique ses critères métier.
  findAll(): Promise<Screening[]> {
    return Promise.resolve(this.screenings);
  }

  // Recherche une séance précise; undefined permet au use case de traiter l'absence.
  async findById(id: string): Promise<Screening | undefined> {
    return this.screenings.find((screening) => screening.id === id);
  }
}
