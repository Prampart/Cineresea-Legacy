/*
?tape 4 - Contrat de notification.
Le use case publie l'information au client ou ? une couche externe sans d?pendre d'un canal sp?cifique.
C'est le point d'entr?e pour les messages de confirmation ou d'annulation.
*/


import {Booking} from "../../../domain/Booking";
import {Screening} from "../../../domain/Screening";

// Port sortant: sépare le use case de confirmation du canal concret de notification.
export interface Notifier {
    // Envoie ou affiche une confirmation construite à partir de la réservation et de la séance.
    notify(booking: Booking, screening: Screening): Promise<void>;
    // Envoie ou affiche un avis d'annulation distinct d'une confirmation.
    bookingCancelled(booking: Booking): Promise<void>;
}

// Implémentation de démonstration qui respecte le contrat sans dépendance externe.
export class NotifierImpl implements Notifier {
    async notify(booking: Booking, screening: Screening): Promise<void> {
        // Ici, la notification est simulée par un message dans la console.
        console.log(`Notification envoyée pour la réservation ${booking.id} à l'adresse ${booking.email}`);
    }

    // Implémentation de démonstration de la notification d'annulation.
    async bookingCancelled(booking: Booking): Promise<void> {
        console.log(`Annulation notifiée pour la réservation ${booking.id} à l'adresse ${booking.email}`);
    }
}
