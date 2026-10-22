import { Booking } from "../../../domain/Booking";

// Contrat de stockage utilisé par le cas d'utilisation, sans dépendre d'une base concrète.
export interface BookingRepository {
  // Calcule le nombre de places prises par les réservations confirmées d'une séance.
  countConfirmedSeats(screeningId: string): Promise<number | undefined>;
  // Enregistre une réservation sans renvoyer de valeur.
  save(booking: Booking): Promise<void>;
}