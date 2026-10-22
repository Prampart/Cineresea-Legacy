import { describe, expect, it, vi } from "vitest";
import { InMemoryBookingRepository } from "../src/adapters/out/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "../src/adapters/out/InMemoryScreeningRepository";
import { BookSeatsService } from "../src/application/usecases/BookSeatsService";
import { BookSeatsCommand } from "../src/application/ports/in/BookSeats";
import { Booking, BookingStatus } from "../src/domain/Booking";
import { DomainError } from "../src/domain/DomainError";
import { Screening } from "../src/domain/Screening";
import { Clock } from "../src/application/ports/out/Clock";
import { IdGenerator } from "../src/application/ports/out/IdGenerator";
import { Notifier } from "../src/application/ports/out/Notifier";
import { PaymentGateway } from "../src/application/ports/out/PaymentGateway";

const fixedNow = new Date("2030-05-10T10:00:00.000Z");

// Construit un service avec des dépendances contrôlées pour rendre les tests prévisibles.
// Les options permettent de modifier la séance, les réservations et le résultat du paiement.
function createFixture(options: {
  screening?: Screening;
  bookings?: Booking[];
  paymentAccepted?: boolean;
} = {}) {
  const screening = options.screening ?? createScreening();
  const bookingRepository = new InMemoryBookingRepository(options.bookings ?? []);
  const screeningRepository = new InMemoryScreeningRepository([screening]);

  // Cette horloge renvoie toujours la même date, sans dépendre de l'heure réelle.
  const clock: Clock = {
    now: () => new Date(fixedNow),
  };

  // Un identifiant fixe facilite la vérification du contenu de la réservation.
  const idGenerator: IdGenerator = {
    generate: () => "booking-test-id",
  };

  // Le faux paiement espion vérifie le montant et accepte ou refuse selon le scénario.
  const paymentGateway: PaymentGateway = {
    charge: vi.fn(async () => options.paymentAccepted ?? true),
  };

  // Le notifier espion enregistre ses appels sans envoyer de vraie notification.
  const notifier: Notifier = {
    notify: vi.fn(async () => undefined),
  };

  const service = new BookSeatsService(
    bookingRepository,
    screeningRepository,
    clock,
    idGenerator,
    notifier,
    paymentGateway
  );

  // Rend le service et les espions accessibles aux tests pour vérifier les effets du scénario.
  return {
    service,
    bookingRepository,
    notifier,
    paymentGateway,
    screening,
  };
}

// Prépare une séance à venir qui peut accueillir plusieurs réservations.
function createScreening(overrides: Partial<Screening> = {}): Screening {
  const screening = new Screening();
  screening.id = "screening-test-id";
  screening.movie = "Film de test";
  screening.room = "Salle 1";
  screening.startsAt = new Date("2030-05-10T12:00:00.000Z");
  screening.capacity = 20;
  screening.price = 1000;
  return Object.assign(screening, overrides);
}

// Prépare une commande valide que chaque test peut ajuster selon son scénario.
function createCommand(overrides: Partial<BookSeatsCommand> = {}): BookSeatsCommand {
  const command = new BookSeatsCommand();
  command.screeningId = "screening-test-id";
  command.email = "client@example.com";
  command.seats = 2;
  command.tariff = "NORMAL";
  return Object.assign(command, overrides);
}

describe("BookSeatsService", () => {
  it("creates, saves, and notifies a confirmed booking with the provided adapters", async () => {
    const { service, bookingRepository, notifier, paymentGateway, screening } =
      createFixture();

    const booking = await service.execute(createCommand());

    // Vérifie que les valeurs produites et la date injectée figurent dans la réservation.
    expect(booking).toMatchObject({
      id: "booking-test-id",
      screeningId: "screening-test-id",
      email: "client@example.com",
      seats: 2,
      tariff: "NORMAL",
      total: 2000,
      status: "CONFIRMED" satisfies BookingStatus,
      createdAt: fixedNow,
    });
    // Vérifie que le repository a enregistré les places de cette réservation.
    await expect(bookingRepository.countConfirmedSeats("screening-test-id")).resolves.toBe(2);
    // Vérifie le montant débité et l'adresse transmis au port de paiement.
    expect(paymentGateway.charge).toHaveBeenCalledWith("client@example.com", 2000);
    // Vérifie qu'une seule notification est envoyée pour la réservation créée.
    expect(notifier.notify).toHaveBeenCalledExactlyOnceWith(booking, screening);
  });

  it("fails when the requested screening does not exist", async () => {
    const { service, notifier, paymentGateway } = createFixture();

    // Une séance inconnue doit produire une erreur métier de type NOT_FOUND.
    await expect(
      service.execute(createCommand({ screeningId: "unknown-screening" }))
    ).rejects.toMatchObject<Partial<DomainError>>({ code: "NOT_FOUND" });

    // Sans séance valide, ni calcul de montant ni notification ne doivent avoir lieu.
    expect(paymentGateway.charge).not.toHaveBeenCalled();
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const { service, notifier } = createFixture();

    // L'adresse mal formée est rejetée comme donnée invalide.
    await expect(
      service.execute(createCommand({ email: "adresse-invalide" }))
    ).rejects.toMatchObject<Partial<DomainError>>({ code: "INVALID" });

    // Aucune confirmation ne doit être envoyée pour une commande refusée.
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("rejects a seat count outside the allowed range", async () => {
    const { service, notifier } = createFixture();

    // Sept places dépassent la limite métier de six places par réservation.
    await expect(
      service.execute(createCommand({ seats: 7 }))
    ).rejects.toMatchObject<Partial<DomainError>>({ code: "INVALID" });

    // Une demande invalide ne doit pas déclencher de notification.
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("rejects a screening that has already started", async () => {
    // Place le début de la séance juste avant l'horloge fixe injectée au service.
    const screening = createScreening({ startsAt: new Date(fixedNow.getTime() - 1) });
    const { service, notifier } = createFixture({ screening });

    // Le service signale un conflit et ne confirme pas la réservation.
    await expect(service.execute(createCommand())).rejects.toMatchObject<
      Partial<DomainError>
    >({ code: "CONFLICT" });

    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("rejects a booking when the screening has insufficient remaining seats", async () => {
    // Deux réservations existantes plus les deux demandées dépasseraient la capacité de trois.
    const screening = createScreening({ capacity: 3 });
    const existingBooking = new Booking();
    existingBooking.screeningId = screening.id;
    existingBooking.seats = 2;
    existingBooking.status = "CONFIRMED";
    const { service, notifier, paymentGateway } = createFixture({
      screening,
      bookings: [existingBooking],
    });

    // Le manque de places est détecté avant le calcul du prix et avant toute notification.
    await expect(service.execute(createCommand({ seats: 2 }))).rejects.toMatchObject<
      Partial<DomainError>
    >({ code: "CONFLICT" });

    expect(paymentGateway.charge).not.toHaveBeenCalled();
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("rejects a booking when payment is refused", async () => {
    const { service, bookingRepository, notifier, paymentGateway } = createFixture({
      paymentAccepted: false,
    });

    // Le faux port de paiement refuse la transaction de manière déterministe.
    await expect(service.execute(createCommand())).rejects.toMatchObject<
      Partial<DomainError>
    >({ code: "PAYMENT_REFUSED" });

    // Un paiement refusé ne doit ni enregistrer la réservation ni notifier le client.
    await expect(bookingRepository.countConfirmedSeats("screening-test-id")).resolves.toBe(0);
    expect(paymentGateway.charge).toHaveBeenCalledWith("client@example.com", 2000);
    expect(notifier.notify).not.toHaveBeenCalled();
  });
});
