import { Booking } from "../../domain/Booking";
import { BookingRepository } from "../../application/ports/out/BookingRepository";

// Stocke les réservations dans un tableau en mémoire plutôt que dans une base de données.
export class InMemoryBookingRepository implements BookingRepository {
  // Le tableau initial peut contenir des réservations de départ; sinon il commence vide.
  constructor(private readonly bookings: Booking[] = []) {}

  // Additionne les places des réservations confirmées liées à la séance demandée.
  async countConfirmedSeats(screeningId: string): Promise<number> {
    return this.bookings
      .filter(
        (booking) =>
          booking.screeningId === screeningId &&
          booking.status === "CONFIRMED"
      )
      .reduce((total, booking) => total + (booking.seats ?? 0), 0);
  }

  // Ajoute la réservation au tableau partagé par cette instance du repository.
  async save(booking: Booking): Promise<void> {
    this.bookings.push(booking);
  }
}
