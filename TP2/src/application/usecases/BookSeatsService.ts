import { Booking } from "../../domain/Booking";
import {BookSeats, BookSeatsCommand} from "../ports/in/BookSeats";
import { BookingRepository } from "../ports/out/BookingRepository";
import { Clock } from "../ports/out/Clock";
import { IdGenerator } from "../ports/out/IdGenerator";
import { Notifier } from "../ports/out/Notifier";
import { PaymentGateway } from "../ports/out/PaymentGateway";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";
import {
  calculatePrice,
  ensureEnoughSeats,
  ensureNotStarted,
  ensureValidEmail,
  ensureValidSeatCount,
} from "../../domain/BookingRules";
import { DomainError } from "../../domain/DomainError";

// Cas d'utilisation qui orchestre la création d'une réservation à partir des ports.
export class BookSeatsService implements BookSeats {
  // Les dépendances sont fournies de l'extérieur: ce service ne crée pas les adapters.
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly screeningRepository: ScreeningRepository,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
    private readonly notifier: Notifier,
    private readonly paymentGateway: PaymentGateway
  ) {}

  // Exécute les étapes du scénario de réservation et renvoie la réservation créée.
  async execute(command: BookSeatsCommand): Promise<Booking> {
    // Vérifie les données obligatoires avant d'utiliser les ports.
    if (command.screeningId === undefined || command.seats === undefined) {
      throw new DomainError("INVALID", "Identifiant de séance et nombre de places requis");
    }

    // Recherche les informations de la séance demandée.
    const screening = await this.screeningRepository.findById(command.screeningId);
    if (screening === undefined) {
      throw new DomainError("NOT_FOUND", "Séance introuvable");
    }

    // Applique les mêmes validations de courriel et de places que l'ancienne route.
    if (command.email === undefined) {
      throw new DomainError("INVALID", "Email invalide");
    }
    ensureValidEmail(command.email);
    ensureValidSeatCount(command.seats);

    // Vérifie que la séance n'a pas commencé et que sa capacité suffit.
    ensureNotStarted(screening, this.clock.now());
    const alreadyTaken = await this.bookingRepository.countConfirmedSeats(command.screeningId);
    // Arrête le scénario si le stockage n'a pas pu fournir un comptage fiable.
    if (alreadyTaken === undefined) {
      throw new Error("Impossible de déterminer le nombre de places déjà réservées.");
    }
    ensureEnoughSeats(screening, alreadyTaken, command.seats);

    // Calcule le montant en centimes en appliquant les règles métier de réduction.
    if (screening.price === undefined) {
      throw new DomainError("INVALID", "Prix de séance absent");
    }
    const total = calculatePrice(screening.price, command.seats, command.tariff);

    // Tente le paiement avant de créer la réservation.
    const paymentAccepted = await this.paymentGateway.charge(command.email, total);
    if (!paymentAccepted) {
      throw new DomainError("PAYMENT_REFUSED", "Paiement refusé");
    }

    // Crée l'objet métier qui regroupe les informations de la nouvelle réservation.
    const booking = new Booking();
    booking.id = this.idGenerator.generate();
    booking.screeningId = command.screeningId;
    booking.email = command.email;
    booking.seats = command.seats;
    booking.tariff = command.tariff;
    booking.total = total;
    booking.status = "CONFIRMED";
    booking.createdAt = this.clock.now();
    // Persiste la réservation avant d'envoyer la confirmation.
    await this.bookingRepository.save(booking);
    
    // Notifie le client une fois la réservation enregistrée.
    await this.notifier.notify(booking, screening);

    // Renvoie à l'appelant les informations complètes de la réservation.
    return booking; 
  }
}
