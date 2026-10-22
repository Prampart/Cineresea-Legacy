import type { ScreeningRepository } from "../data/ScreeningRepository";
import type { BookingRepository } from "../data/BookingRepository";

// Service legacy qui prépare les séances destinées à l'affichage.
export class ScreeningService {
  // Les repositories sont fournis depuis le composition root.
  constructor(
    private readonly screeningRepo: ScreeningRepository,
    private readonly bookingRepo: BookingRepository
  ) {}
  // Calcule le nombre de places libres à partir des réservations confirmées.
  private getRemainingSeats(
  screeningId: string,
  capacity: number
) {
  const bookings = this.bookingRepo.findAll();

  let taken = 0;

  for (const b of bookings) {
    if (
      b.screeningId === screeningId &&
      b.status === "CONFIRMED"
    ) {
      taken += b.seats;
    }
  }

  return capacity - taken;
}
  // Renvoie les séances à venir avec le nombre de places restantes.
  getScreenings() {
    const screenings = this.screeningRepo.findAll();
    const bookings = this.bookingRepo.findAll();

    // L'heure actuelle permet d'écarter les séances déjà commencées.
    const now = new Date();

    return screenings
      // Ne conserve que les séances qui n'ont pas encore commencé.
      .filter((s: any) => new Date(s.startsAt) >= now)
      .map((s: any) => {
        // Compte les places prises pour calculer le nombre encore disponible.
        let taken = 0;

        for (const b of bookings) {
          if (
            b.screeningId === s.id &&
            b.status === "CONFIRMED"
          ) {
            taken += b.seats;
          }
        }

        // Renvoie uniquement les informations nécessaires à la présentation.
        return {
          id: s.id,
          movie: s.movie,
          room: s.room,
          startsAt: s.startsAt,
          price: s.price,
          remaining: s.capacity - taken,
        };
      });
  }
}
