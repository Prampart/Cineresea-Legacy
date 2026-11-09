/*
?tape 5 - Cas d'usage : r?servation de places.
Le sc?nario suit l'ordre m?tier : validation, disponibilit?, paiement, cr?ation de la r?servation,
persistance et notification. On voit ici la vraie orchestration du comportement applicatif.
*/


// Modèle métier créé et retourné par le scénario de réservation.
import { Booking } from "../../domain/Booking";
// Port entrant: contrat de l'action et structure des données demandées par l'appelant.
import { BookSeats, BookSeatsCommand } from "../ports/in/BookSeats";
// Dépendances abstraites: le cas d'utilisation ne choisit pas les implémentations concrètes.
import { BookingRepository } from "../ports/out/BookingRepository";
import { Clock } from "../ports/out/Clock";
import { IdGenerator } from "../ports/out/IdGenerator";
import { Notifier } from "../ports/out/Notifier";
import { PaymentGateway } from "../ports/out/PaymentGateway";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";
// Fonctions métier réutilisables pour garder les validations et calculs cohérents.
import {
  calculatePrice,
  ensureEnoughSeats,
  ensureNotStarted,
  ensureValidEmail,
  ensureValidSeatCount,
} from "../../domain/BookingRules";
// Erreur métier dont le code peut être traduit par la couche de présentation.
import { DomainError } from "../../domain/DomainError";

// Implémente le scénario de réservation en coordonnant les règles métier et les ports.
export class BookSeatsService implements BookSeats {
  // L'injection des ports permet de remplacer stockage, horloge, paiement et notification
  // sans modifier le déroulement du cas d'utilisation.
  constructor(
    // Persiste les réservations et fournit le comptage des places déjà confirmées.
    private readonly bookingRepository: BookingRepository,
    // Fournit les informations de séance nécessaires à la réservation.
    private readonly screeningRepository: ScreeningRepository,
    // Fournit l'heure courante de façon contrôlable, notamment dans les tests.
    private readonly clock: Clock,
    // Produit un identifiant sans lier le service à une stratégie concrète.
    private readonly idGenerator: IdGenerator,
    // Envoie la confirmation après la persistance de la réservation.
    private readonly notifier: Notifier,
    // Autorise ou refuse le paiement avant la création persistée.
    private readonly paymentGateway: PaymentGateway
  ) {}

  // Exécute le scénario à partir d'une commande et renvoie la réservation créée.
  async execute(command: BookSeatsCommand): Promise<Booking> {
    // Vérifie la présence des champs requis avant tout accès aux repositories.
    if (command.screeningId === undefined || command.seats === undefined) {
      throw new DomainError("INVALID", "Identifiant de séance et nombre de places requis");
    }

    // La séance fournit les horaires, le prix et la capacité nécessaires ensuite.
    const screening = await this.screeningRepository.findById(command.screeningId);
    if (screening === undefined) {
      throw new DomainError("NOT_FOUND", "Séance introuvable");
    }

    // Valide le courriel et le nombre de places avant de procéder au paiement.
    if (command.email === undefined) {
      throw new DomainError("INVALID", "Email invalide");
    }
    ensureValidEmail(command.email);
    ensureValidSeatCount(command.seats);

    // Une séance commencée ne peut plus être réservée; le comptage protège la capacité.
    ensureNotStarted(screening, this.clock.now());
    const alreadyTaken = await this.bookingRepository.countConfirmedSeats(command.screeningId);
    // Arrête le scénario si le stockage n'a pas pu fournir un comptage fiable.
    if (alreadyTaken === undefined) {
      throw new Error("Impossible de déterminer le nombre de places déjà réservées.");
    }
    ensureEnoughSeats(screening, alreadyTaken, command.seats);

    // Refuse une donnée de prix absente, puis calcule le total selon les règles métier.
    if (screening.price === undefined) {
      throw new DomainError("INVALID", "Prix de séance absent");
    }
    const total = calculatePrice(screening.price, command.seats, command.tariff);

    // Le paiement précède la sauvegarde afin de ne pas créer une réservation impayée.
    const paymentAccepted = await this.paymentGateway.charge(command.email, total);
    if (!paymentAccepted) {
      throw new DomainError("PAYMENT_REFUSED", "Paiement refusé");
    }

    // Construit l'entité métier qui regroupe toutes les données de la réservation.
    const booking = new Booking();
    booking.id = this.idGenerator.generate();
    booking.screeningId = command.screeningId;
    booking.email = command.email;
    booking.seats = command.seats;
    booking.tariff = command.tariff;
    booking.total = total;
    booking.status = "CONFIRMED";
    booking.createdAt = this.clock.now();
    booking.cancelledAt = undefined;

    // La réservation est enregistrée avant la notification pour éviter une confirmation
    // envoyée pour une réservation qui n'aurait pas été sauvegardée.
    await this.bookingRepository.save(booking);
    
    // Informe le client seulement après la réussite de la persistance.
    await this.notifier.notify(booking, screening);

    // Retourne l'entité créée à la couche appelante.
    return booking; 
  }
}
