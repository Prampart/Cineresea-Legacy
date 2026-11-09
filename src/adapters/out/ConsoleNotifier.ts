/*
?tape 7 - Adaptateur de notification console.
Le notifier concret ?crit les confirmations dans la console du serveur. C'est une impl?mentation simple
utilis?e pour simuler un canal externe avec peu de d?pendances.
*/


import { Booking } from "../../domain/Booking";
import { Screening } from "../../domain/Screening";
import { Notifier } from "../../application/ports/out/Notifier";

// Adaptateur de démonstration: remplace un service de courriel par une sortie console.
export class ConsoleNotifier implements Notifier {
  // Reçoit les deux objets utiles à la confirmation et respecte le port Notifier.
  async notify(booking: Booking, screening: Screening): Promise<void> {
    // L'affichage permet de vérifier le scénario sans configurer de serveur mail.
    console.log(
      `Réservation ${booking.id} confirmée pour ${booking.email} : ` +
        `${booking.seats} place(s) pour "${screening.movie}".`
    );
  }

  // Affiche un message adapté à une annulation plutôt que de réutiliser la confirmation.
  async bookingCancelled(booking: Booking): Promise<void> {
    const refund =
      booking.total === undefined
        ? "montant inconnu"
        : `${(booking.total / 100).toFixed(2)} €`;

    console.log(
      `Réservation ${booking.id} annulée pour ${booking.email}. ` +
        `Remboursement : ${refund}`
    );
  }
}
