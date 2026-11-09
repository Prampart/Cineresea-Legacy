import { describe, expect, it, vi } from "vitest";
import { InMemoryBookingRepository } from "../src/adapters/out/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "../src/adapters/out/InMemoryScreeningRepository";
import { CancelBookingCommand } from "../src/application/ports/in/CancelBooking";
import { CancelBookingService } from "../src/application/usecases/CancelBookingService";
import { Booking } from "../src/domain/Booking";
import { Screening } from "../src/domain/Screening";

const FIXED_NOW = new Date("2026-10-23T08:00:00.000Z");

// Fabrique une réservation liée à la séance utilisée par les tests d'annulation.
function createBooking(status: Booking["status"] = "CONFIRMED"): Booking {
  return Object.assign(new Booking(), {
    id: "b1",
    screeningId: "s1",
    email: "client@example.com",
    seats: 2,
    tariff: "NORMAL" as const,
    total: 2000,
    status,
    createdAt: new Date("2025-10-23T10:00:00.000Z"),
  });
}

// Construit le service avec une heure figée pour tester exactement les limites métier.
function createService(startsAt: Date, status: Booking["status"] = "CONFIRMED") {
  const booking = createBooking(status);
  const screening = Object.assign(new Screening(), {
    id: "s1",
    movie: "Film de test",
    room: "Salle 1",
    startsAt,
    capacity: 20,
    price: 1000,
  });
  const bookingRepository = new InMemoryBookingRepository([booking]);
  const screeningRepository = new InMemoryScreeningRepository([screening]);
  const notifier = {
    // Espion qui permet de vérifier que l'annulation a été notifiée après sauvegarde.
    notify: vi.fn(async () => {}),
    bookingCancelled: vi.fn(async () => {}),
  };
  const service = new CancelBookingService(
    bookingRepository,
    screeningRepository,
    { now: () => new Date(FIXED_NOW) },
    notifier
  );
  const command = new CancelBookingCommand();
  command.bookingId = "b1";

  return { service, command, bookingRepository, notifier };
}

describe("CancelBookingService", () => {
  it("autorise l'annulation exactement deux heures avant la séance", async () => {
    const { service, command, bookingRepository, notifier } = createService(
      new Date(FIXED_NOW.getTime() + 2 * 60 * 60 * 1000)
    );

    const result = await service.execute(command);

    expect(result.status).toBe("CANCELLED");
    expect(result.cancelledAt).toEqual(FIXED_NOW);
    expect(await bookingRepository.findById("b1")).toEqual(result);
    expect(notifier.bookingCancelled).toHaveBeenCalledWith(result);
  });

  it("refuse l'annulation moins de deux heures avant la séance", async () => {
    const { service, command, bookingRepository, notifier } = createService(
      new Date(FIXED_NOW.getTime() + 2 * 60 * 60 * 1000 - 1)
    );

    await expect(service.execute(command)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect((await bookingRepository.findById("b1"))?.status).toBe("CONFIRMED");
    expect(notifier.bookingCancelled).not.toHaveBeenCalled();
  });

  it("refuse une réservation déjà annulée", async () => {
    const { service, command } = createService(
      new Date(FIXED_NOW.getTime() + 4 * 60 * 60 * 1000),
      "CANCELLED"
    );

    await expect(service.execute(command)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("signale une réservation inconnue", async () => {
    const { service, command } = createService(
      new Date(FIXED_NOW.getTime() + 4 * 60 * 60 * 1000)
    );
    command.bookingId = "missing";

    await expect(service.execute(command)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
