/*
?tape 5 - Cas d'usage : annulation d'une r?servation.
On charge la r?servation et la s?ance concern?e, v?rifie le d?lais autoris?, modifie l'?tat puis enregistre
le changement et notifie le client. L'objectif est de rester coh?rent avec les r?gles du m?tier.
*/


// Port entrant implémenté par ce service.
import { CancelBooking } from "../ports/in/CancelBooking";
import { BookingRepository } from "../ports/out/BookingRepository";
// Erreurs métier renvoyées lorsque l'annulation ne respecte pas les règles.
import { DomainError } from "../../domain/DomainError";
import {CancelBookingCommand} from "../ports/in/CancelBooking";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";
import { Clock } from "../ports/out/Clock";
import { Notifier } from "../ports/out/Notifier";
import { Booking } from "../../domain/Booking";
import { ensureCanCancelBooking } from "../../domain/BookingRules";

// Cas d'utilisation qui orchestre l'annulation sans dépendre des adaptateurs concrets.
export class CancelBookingService implements CancelBooking {
  // Les ports sont injectés pour pouvoir remplacer le stockage et l'horloge dans les tests.
  constructor(
    // Recherche et met à jour la réservation concernée.
    private readonly bookingRepository: BookingRepository,
    // Fournit l'horaire de début de la séance associée.
    private readonly screeningRepository: ScreeningRepository,
    // Fournit une heure contrôlable pour appliquer la limite des deux heures.
    private readonly clock: Clock,
    // Envoie une notification adaptée à une annulation après la sauvegarde.
    private readonly notifier: Notifier
  ) {}

  // Exécute l'annulation et retourne l'entité modifiée après sa sauvegarde.
  async execute(command: CancelBookingCommand): Promise<Booking> {
    // Une réservation absente ne peut pas être annulée.
    const booking = await this.bookingRepository.findById(command.bookingId);
    if (booking === undefined) {
      throw new DomainError("NOT_FOUND", "Réservation introuvable");
    }
    // L'identifiant de séance est indispensable pour vérifier le délai d'annulation.
    if (booking.screeningId === undefined) {
      throw new DomainError("INVALID", "Réservation sans séance associée");
    }

    // Charge la séance pour connaître son heure de début.
    const screening = await this.screeningRepository.findById(booking.screeningId);
    if (screening === undefined) {
      throw new DomainError("NOT_FOUND", "Séance associée introuvable");
    }
    // La fonction métier vérifie l'état et la limite horaire sans modifier les objets.
    const now = this.clock.now();
    ensureCanCancelBooking(booking, screening, now);
    // Met à jour l'état métier et garde la trace de l'instant où l'annulation a eu lieu.
    booking.status = "CANCELLED";
    booking.cancelledAt = now;
    // Persiste l'état avant de renvoyer le résultat au port entrant.
    await this.bookingRepository.save(booking);
    // Notifie le client uniquement après l'enregistrement de l'annulation.
    await this.notifier.bookingCancelled(booking);
    // Retourne la réservation désormais annulée.
    return booking;
  }
}
