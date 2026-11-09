/*
?tape 5 - Cas d'usage : liste des s?ances ? venir.
On filtre les s?ances futures, compte les places d?j? utilis?es et renvoie un r?sultat enrichi
avec le nombre restant. Cela donne directement une vue op?rationnelle pour l'API.
*/


// Contrat entrant et format des séances renvoyées au demandeur.
import { ListUpcomingScreenings, UpcomingScreening } from "../ports/in/ListUpcomingScreenings";
// Ports sortants utilisés pour lire séances, réservations et heure courante.
import { BookingRepository } from "../ports/out/BookingRepository";
import { Clock } from "../ports/out/Clock";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

// Orchestration de la recherche de séances à venir et du calcul des places restantes.
export class ListUpcomingScreeningsService implements ListUpcomingScreenings {
  // Les dépendances sont injectées afin de séparer le scénario de ses détails techniques.
  constructor(
    // Source des horaires, salles, films et capacités.
    private readonly screeningRepository: ScreeningRepository,
    // Source du nombre de places déjà réservées et confirmées.
    private readonly bookingRepository: BookingRepository,
    // Horloge injectable pour comparer les dates de manière reproductible.
    private readonly clock: Clock
  ) {}

    // Renvoie les séances futures, enrichies du nombre de places restant à réserver.
    async execute(): Promise<UpcomingScreening[]> {
        // Charge la liste puis capture l'heure une fois pour utiliser le même instant de référence.
        const screenings = await this.screeningRepository.findAll();
        const now = this.clock.now();
        // Les séances passées sont exclues avant de compter leurs réservations.
        const upcomingScreenings = screenings.filter((screening) => screening.startsAt >= now);
        // Accumulateur typé qui garantit la forme définie par le port entrant.
        const screeningsWithRemainingSeats: UpcomingScreening[] = [];

        for (const screening of upcomingScreenings) {
            // L'identifiant sert à interroger le repository de réservations.
            if(screening.id === undefined) {
                throw new Error("Séance sans identifiant défini");
            }
            // Sans capacité, il est impossible de calculer les places disponibles.
            if (screening.capacity === undefined) {
                throw new Error("Séance sans capacité définie");
            }
            // Le comptage exclut les réservations annulées selon le contrat du repository.
            const confirmedSeats = await this.bookingRepository.countConfirmedSeats(screening.id);
            if (confirmedSeats === undefined) {
                throw new Error("Impossible de déterminer le nombre de places déjà réservées.");
            }

            // Construit la réponse avec les champs destinés à l'affichage et la valeur calculée.
            screeningsWithRemainingSeats.push({
                id: screening.id,
                movie: screening.movie || "",
                room: screening.room || "",
                startsAt: screening.startsAt,
                price: screening.price || 0,
                remaining: screening.capacity - confirmedSeats,
            });
        }

        // Si aucune séance ne correspond, l'accumulateur est un tableau vide.
        return screeningsWithRemainingSeats;
    }
}