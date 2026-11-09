import { describe, expect, it, vi } from "vitest";
import { InMemoryBookingRepository } from "../src/adapters/out/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "../src/adapters/out/InMemoryScreeningRepository";
import { Clock } from "../src/application/ports/out/Clock";
import { IdGenerator } from "../src/application/ports/out/IdGenerator";
import { Notifier } from "../src/application/ports/out/Notifier";
import { PaymentGateway } from "../src/application/ports/out/PaymentGateway";
import { ScreeningRepository } from "../src/application/ports/out/ScreeningRepository";
import { BookSeatsCommand } from "../src/application/ports/in/BookSeats";
import { BookSeatsService } from "../src/application/usecases/BookSeatsService";
import { Booking, BookingStatus } from "../src/domain/Booking";
import { DomainError } from "../src/domain/DomainError";
import { Screening } from "../src/domain/Screening";

const fixedNow = new Date("2030-05-10T10:00:00.000Z");

// Crée un service dont les dépendances sont contrôlables pour tester chaque règle sans réseau.
function createFixture(options: {
  screening?: Screening;
  bookings?: Booking[];
  paymentAccepted?: boolean;
} = {}) {
  const screening = options.screening ?? createScreening();
  const bookingRepository = new InMemoryBookingRepository(options.bookings ?? []);
  const screeningRepository = new InMemoryScreeningRepository([screening]);

  // L'horloge fixe rend reproductibles les validations liées à l'heure de séance.
  const clock: Clock = {
    now: () => new Date(fixedNow),
  };
  // Un identifiant déterministe facilite les assertions sur la réservation produite.
  const idGenerator: IdGenerator = {
    generate: () => "booking-test-id",
  };
  // Le port de paiement simule les résultats acceptés ou refusés sans hasard.
  const paymentGateway: PaymentGateway = {
    charge: vi.fn(async () => options.paymentAccepted ?? true),
  };
  // Les appels au notifier sont espionnés sans envoyer de message réel.
  const notifier: Notifier = {
    notify: vi.fn(async () => undefined),
    bookingCancelled: vi.fn(async () => undefined),
  };

  const service = new BookSeatsService(
    bookingRepository,
    screeningRepository as unknown as ScreeningRepository,
    clock,
    idGenerator,
    notifier,
    paymentGateway
  );

  return { service, bookingRepository, notifier, paymentGateway, screening };
}

// Prépare une séance de test réservable avec une capacité et un prix connus.
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

// Prépare une commande valide que chaque test peut ajuster pour vérifier une erreur.
function createCommand(overrides: Partial<BookSeatsCommand> = {}): BookSeatsCommand {
  const command = new BookSeatsCommand();
  command.screeningId = "screening-test-id";
  command.email = "client@example.com";
  command.seats = 2;
  command.tariff = "NORMAL";
  return Object.assign(command, overrides);
}

describe("BookSeatsService", () => {
  it("crée, sauvegarde et notifie une réservation confirmée", async () => {
    const { service, bookingRepository, notifier, paymentGateway, screening } =
      createFixture();

    const booking = await service.execute(createCommand());

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
    await expect(
      bookingRepository.countConfirmedSeats("screening-test-id")
    ).resolves.toBe(2);
    expect(paymentGateway.charge).toHaveBeenCalledWith(
      "client@example.com",
      2000
    );
    expect(notifier.notify).toHaveBeenCalledExactlyOnceWith(booking, screening);
  });

  it("refuse une séance inconnue avant le paiement", async () => {
    const { service, notifier, paymentGateway } = createFixture();

    await expect(
      service.execute(createCommand({ screeningId: "unknown-screening" }))
    ).rejects.toMatchObject<Partial<DomainError>>({ code: "NOT_FOUND" });

    expect(paymentGateway.charge).not.toHaveBeenCalled();
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("refuse une adresse e-mail invalide", async () => {
    const { service, notifier } = createFixture();

    await expect(
      service.execute(createCommand({ email: "adresse-invalide" }))
    ).rejects.toMatchObject<Partial<DomainError>>({ code: "INVALID" });

    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("refuse un nombre de places hors limites", async () => {
    const { service, notifier } = createFixture();

    await expect(
      service.execute(createCommand({ seats: 7 }))
    ).rejects.toMatchObject<Partial<DomainError>>({ code: "INVALID" });

    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("refuse une séance qui a déjà commencé", async () => {
    const screening = createScreening({
      startsAt: new Date(fixedNow.getTime() - 1),
    });
    const { service, notifier } = createFixture({ screening });

    await expect(service.execute(createCommand())).rejects.toMatchObject<
      Partial<DomainError>
    >({ code: "CONFLICT" });

    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("refuse une réservation qui dépasserait la capacité", async () => {
    const screening = createScreening({ capacity: 3 });
    const existingBooking = new Booking();
    existingBooking.screeningId = screening.id;
    existingBooking.seats = 2;
    existingBooking.status = "CONFIRMED";
    const { service, notifier, paymentGateway } = createFixture({
      screening,
      bookings: [existingBooking],
    });

    await expect(
      service.execute(createCommand({ seats: 2 }))
    ).rejects.toMatchObject<Partial<DomainError>>({ code: "CONFLICT" });

    expect(paymentGateway.charge).not.toHaveBeenCalled();
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("ne sauvegarde et ne notifie pas si le paiement est refusé", async () => {
    const { service, bookingRepository, notifier, paymentGateway } =
      createFixture({ paymentAccepted: false });

    await expect(service.execute(createCommand())).rejects.toMatchObject<
      Partial<DomainError>
    >({ code: "PAYMENT_REFUSED" });

    await expect(
      bookingRepository.countConfirmedSeats("screening-test-id")
    ).resolves.toBe(0);
    expect(paymentGateway.charge).toHaveBeenCalledWith(
      "client@example.com",
      2000
    );
    expect(notifier.notify).not.toHaveBeenCalled();
  });
});
