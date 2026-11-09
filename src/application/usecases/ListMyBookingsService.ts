/*
?tape 5 - Cas d'usage : consultation des r?servations du client.
Le use case r?cup?re les r?servations de l'utilisateur et enrichit le r?sultat avec les informations de s?ance
pour que la couche HTTP puisse r?pondre avec un objet pr?t ? l'affichage.
*/


// Le port entrant définit la commande et la forme enrichie de la réponse.
import {
  ListMyBookings,
  ListMyBookingsCommand,
  MyBooking,
} from "../ports/in/ListMyBookings";
// Ces ports fournissent les données requises sans imposer les adaptateurs concrets.
import { BookingRepository } from "../ports/out/BookingRepository";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

// Recherche les réservations d'un client et les enrichit avec les données de séance.
export class ListMyBookingsService implements ListMyBookings {
  // Les repositories sont injectés afin que le scénario reste indépendant du stockage.
  constructor(
    // Source des réservations filtrées par adresse e-mail.
    private readonly bookingRepository: BookingRepository,
    // Source des séances auxquelles les réservations font référence.
    private readonly screeningRepository: ScreeningRepository
  ) {}

  // Renvoie les réservations du client avec le titre du film et la date de séance.
  async execute(command: ListMyBookingsCommand): Promise<MyBooking[]> {
    // Récupère la liste du client; le repository renvoie [] si aucun résultat ne correspond.
    const bookings = await this.bookingRepository.findByEmail(command.email);
    // Charge les séances une seule fois pour pouvoir retrouver chacune des correspondances.
    const screenings = await this.screeningRepository.findAll();

    // Crée une réponse enrichie sans modifier les réservations conservées par le repository.
    return bookings.map((booking) => {
      // Une réservation sans screeningId ne peut pas être associée à une séance.
      const screening =
        booking.screeningId === undefined
          ? undefined
          : screenings.find((item) => item.id === booking.screeningId);

      return {
        ...booking,
        // Préserve le comportement legacy lorsqu'une séance correspondante est absente.
        movie: screening?.movie ?? "?",
        startsAt: screening?.startsAt ?? null,
      };
    });
  }
}
