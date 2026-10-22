import { BookingRepository } from "../data/BookingRepository";
import { ScreeningRepository } from "../data/ScreeningRepository";
import { Mailer } from "../data/Mailer";
import { PaymentGateway } from "../data/PaymentGateway";
import { BusinessError } from "./BusinessError";

export class BookingService {
  constructor(
    private bookings = new BookingRepository(),
    private screenings = new ScreeningRepository(),
    private mailer = new Mailer(),
    private payment = new PaymentGateway()
  ) {}

  create(screeningId: string, body: any) {
    const s = this.screenings.findById(screeningId);

    if (!s) {
      throw new BusinessError(
        "Séance introuvable",
        404
      );
    }

    const email = body.email;

    if (
      !email ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ) {
      throw new BusinessError(
        "Email invalide",
        400
      );
    }

    const seats = Number(body.seats);

    if (
      !Number.isInteger(seats) ||
      seats < 1 ||
      seats > 6
    ) {
      throw new BusinessError(
        "Entre 1 et 6 places par réservation",
        400
      );
    }

    if (new Date(s.startsAt) <= new Date()) {
      throw new BusinessError(
        "La séance a déjà commencé",
        409
      );
    }

    let taken = 0;

    for (const b of this.bookings.findAll()) {
      if (
        b.screeningId === s.id &&
        b.status === "CONFIRMED"
      ) {
        taken += b.seats;
      }
    }

    if (taken + seats > s.capacity) {
      throw new BusinessError(
        "Plus assez de places",
        409
      );
    }

    let unit = s.price;

    if (body.tariff === "STUDENT") {
      unit = Math.round(unit * 0.7);
    }

    let total = unit * seats;

    if (seats >= 4) {
      total = Math.round(total * 0.9);
    }

    if (!this.payment.pay()) {
      throw new BusinessError(
        "Paiement refusé",
        402
      );
    }

    const booking = {
      id: "b" + Date.now(),
      screeningId: s.id,
      email,
      seats,
      tariff:
        body.tariff === "STUDENT"
          ? "STUDENT"
          : "NORMAL",
      total,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    this.bookings.save(booking);

    this.mailer.sendBookingConfirmation(
      email,
      booking.id,
      s.movie,
      seats,
      total
    );

    return booking;
  }

  cancel(id: string) {
    const booking = this.bookings.findById(id);

    if (!booking) {
      throw new BusinessError(
        "Réservation introuvable",
        404
      );
    }

    if (booking.status === "CANCELLED") {
      throw new BusinessError(
        "Déjà annulée",
        409
      );
    }

    const screening =
      this.screenings.findById(
        booking.screeningId
      );

    const diff =
      new Date(screening.startsAt).getTime() -
      new Date().getTime();

    if (diff < 2 * 60 * 60 * 1000) {
      throw new BusinessError(
        "Annulation impossible moins de 2h avant la séance",
        409
      );
    }

    booking.status = "CANCELLED";
    booking.cancelledAt =
      new Date().toISOString();

    this.bookings.update(booking);

    this.mailer.sendCancellation(
      booking.email,
      booking.id,
      booking.total
    );

    return booking;
  }

  getByEmail(email: string) {
    const bookings = this.bookings
      .findAll()
      .filter((b: any) => b.email === email);

    return bookings.map((b: any) => {
      const s = this.screenings.findById(
        b.screeningId
      );

      return {
        ...b,
        movie: s ? s.movie : "?",
        startsAt: s ? s.startsAt : null,
      };
    });
  }
}