import { Booking } from "../../domain/Booking";
import { Screening } from "../../domain/Screening";
import { Notifier } from "../../application/ports/out/Notifier";

// Adaptateur simple qui remplace l'envoi d'un vrai courriel par un message dans la console.
export class ConsoleNotifier implements Notifier {
  // Reçoit les informations nécessaires et affiche une confirmation de réservation.
  async notify(booking: Booking, screening: Screening): Promise<void> {
    console.log(
      `Réservation ${booking.id} confirmée pour ${booking.email} : ` +
        `${booking.seats} place(s) pour "${screening.movie}".`
    );
  }
}
