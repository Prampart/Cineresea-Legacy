import { describe, expect, it } from "vitest";
import { FakePaymentGateway } from "../src/adapters/out/FakePaymentGateway";
import { InMemoryBookingRepository } from "../src/adapters/out/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "../src/adapters/out/InMemoryScreeningRepository";
import { Booking } from "../src/domain/Booking";
import { Screening } from "../src/domain/Screening";

// Vérifie que l'adaptateur en mémoire respecte le contrat de recherche des séances.
describe("InMemoryScreeningRepository", () => {
  // Une séance connue est renvoyée; un identifiant inconnu ne donne aucun résultat.
  it("finds a screening by id", async () => {
    const screening = new Screening();
    screening.id = "screening-1";
    const repository = new InMemoryScreeningRepository([screening]);

    await expect(repository.findById("screening-1")).resolves.toMatchObject({
      id: "screening-1",
    });
    await expect(repository.findById("screening-1")).resolves.toHaveProperty(
      "startsAt",
      expect.any(Date)
    );
    await expect(repository.findById("missing")).resolves.toBeUndefined();
  });
});

// Vérifie le comptage et la sauvegarde avec le repository de réservations.
describe("InMemoryBookingRepository", () => {
  // Les réservations annulées ne doivent pas occuper de places.
  it("counts only confirmed seats for the requested screening and saves bookings", async () => {
    const confirmed = new Booking();
    confirmed.screeningId = "screening-1";
    confirmed.seats = 2;
    confirmed.status = "CONFIRMED";

    const cancelled = new Booking();
    cancelled.screeningId = "screening-1";
    cancelled.seats = 3;
    cancelled.status = "CANCELLED";

    const repository = new InMemoryBookingRepository([confirmed, cancelled]);
    await expect(repository.countConfirmedSeats("screening-1")).resolves.toBe(2);

    const nextBooking = new Booking();
    nextBooking.screeningId = "screening-1";
    nextBooking.seats = 1;
    nextBooking.status = "CONFIRMED";
    await repository.save(nextBooking);

    await expect(repository.countConfirmedSeats("screening-1")).resolves.toBe(3);
  });
});

// Vérifie que le faux adaptateur de paiement peut simuler un succès ou un refus.
describe("FakePaymentGateway", () => {
  // Le paiement est accepté par défaut, mais son résultat peut être forcé pour les tests.
  it("accepts payment by default and can be forced to refuse", async () => {
    const gateway = new FakePaymentGateway();

    await expect(gateway.charge("client@example.com", 2000)).resolves.toBe(true);

    gateway.setResponse(false);
    await expect(gateway.charge("client@example.com", 2000)).resolves.toBe(false);
  });
});
