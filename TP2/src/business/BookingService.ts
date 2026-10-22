import type { BookingRepository } from "../data/BookingRepository";
import type { ScreeningRepository } from "../data/ScreeningRepository";
import type { PaymentGateway } from "../data/PaymentGateway";
import type { Mailer } from "../data/Mailer";

// Service de l'ancienne version: il regroupe encore directement logique métier et accès aux données.
export class BookingService {
  // Les dépendances concrètes sont injectées par main.ts, sans modifier les routes legacy.
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly screeningRepo: ScreeningRepository,
    private readonly payment: PaymentGateway,
    private readonly mailer: Mailer
  ) {}

  // Vérifie une demande, calcule son prix, l'enregistre puis confirme la réservation.
  createBooking(
    screeningId: string,
    email: string,
    seats: number,
    tariff: string
  ) {
    // Une réservation ne peut être créée que pour une séance existante.
    const s = this.screeningRepo.findById(screeningId);

    if (!s) {
      throw new Error("SCREENING_NOT_FOUND");
    }

    // Vérifie le format du courriel avant de poursuivre.
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error("INVALID_EMAIL");
    }

    // Le nombre de places doit être entier et compris entre 1 et 6.
    if (!Number.isInteger(seats) || seats < 1 || seats > 6) {
      throw new Error("INVALID_SEATS");
    }

    // Refuse les séances qui ont déjà commencé.
    if (new Date(s.startsAt) <= new Date()) {
      throw new Error("SCREENING_STARTED");
    }

    // Additionne les places des réservations déjà confirmées pour cette séance.
    const bookings = this.bookingRepo.findAll();

    let taken = 0;

    for (const b of bookings) {
      if (
        b.screeningId === s.id &&
        b.status === "CONFIRMED"
      ) {
        taken += b.seats;
      }
    }

    // Empêche de dépasser la capacité totale de la salle.
    if (taken + seats > s.capacity) {
      throw new Error("NO_SEATS");
    }

    // Calcule le prix à partir du tarif individuel puis applique les réductions.
    let unit = s.price;

    if (tariff === "STUDENT") {
      unit = Math.round(unit * 0.7);
    }

    let total = unit * seats;

    if (seats >= 4) {
      total = Math.round(total * 0.9);
    }

    // Le faux paiement peut refuser la transaction.
    if (!this.payment.pay()) {
      throw new Error("PAYMENT_REFUSED");
    }

    // Prépare les données qui seront enregistrées comme réservation confirmée.
    const booking = {
      id: "b" + Date.now(),
      screeningId: s.id,
      email,
      seats,
      tariff: tariff === "STUDENT" ? "STUDENT" : "NORMAL",
      total,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    // Sauvegarde avant d'envoyer le message de confirmation.
    this.bookingRepo.create(booking);

    this.mailer.sendBookingConfirmation(
      email,
      booking.id,
      s.movie,
      seats,
      total
    );

    return booking;
  }

  // Annule une réservation existante si la séance est encore assez éloignée.
  cancelBooking(id: string) {
    const bookings = this.bookingRepo.findAll();

    const booking = bookings.find(
      (b: any) => b.id === id
    );

    // L'identifiant doit correspondre à une réservation connue.
    if (!booking) {
      throw new Error("BOOKING_NOT_FOUND");
    }

    // Une réservation déjà annulée ne peut pas l'être une seconde fois.
    if (booking.status === "CANCELLED") {
      throw new Error("ALREADY_CANCELLED");
    }

    const screening = this.screeningRepo.findById(
      booking.screeningId
    );

    // Calcule le temps restant avant le début de la séance.
    const diff =
      new Date(screening.startsAt).getTime() -
      new Date().getTime();

    // La règle legacy interdit l'annulation dans les deux dernières heures.
    if (diff < 2 * 60 * 60 * 1000) {
      throw new Error("TOO_LATE");
    }

    // Met à jour l'état, enregistre toutes les réservations, puis informe le client.
    booking.status = "CANCELLED";
    booking.cancelledAt = new Date().toISOString();

    this.bookingRepo.saveAll(bookings);

    this.mailer.sendCancellation(
      booking.email,
      booking.id,
      booking.total
    );

    return booking;
  }

  // Retourne les réservations d'une adresse en ajoutant quelques informations de séance.
  getBookingsByEmail(email: string) {
    const bookings = this.bookingRepo.findAll();
    const screenings = this.screeningRepo.findAll();

    return bookings
      // Ne conserve que les réservations du client demandé.
      .filter((b: any) => b.email === email)
      // Ajoute le titre du film et l'horaire, recherchés dans la liste des séances.
      .map((b: any) => {
        const s = screenings.find(
          (x: any) => x.id === b.screeningId
        );

        return {
          ...b,
          movie: s ? s.movie : "?",
          startsAt: s ? s.startsAt : null,
        };
      });
  }
}