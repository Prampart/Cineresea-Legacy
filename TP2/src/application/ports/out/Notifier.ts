import {Booking} from "../../../domain/Booking";
import {Screening} from "../../../domain/Screening";

// Contrat qui sépare le cas d'utilisation du moyen concret de prévenir le client.
export interface Notifier {
    // Envoie ou affiche une confirmation associée à la réservation et à sa séance.
    notify(booking: Booking, screening: Screening): Promise<void>;
}

// Implémentation de démonstration; l'application utilise plutôt ConsoleNotifier.
export class NotifierImpl implements Notifier {
    async notify(booking: Booking, screening: Screening): Promise<void> {
        // Ici, la notification est simulée par un message dans la console.
        console.log(`Notification envoyée pour la réservation ${booking.id} à l'adresse ${booking.email}`);
    }
}
