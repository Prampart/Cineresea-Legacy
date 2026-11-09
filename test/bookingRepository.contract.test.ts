import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryBookingRepository } from "../src/adapters/out/InMemoryBookingRepository";
import { BookingRepository } from "../src/application/ports/out/BookingRepository";
import { Booking } from "../src/domain/Booking";

// Fabrique une entité valide et permet de remplacer les champs dans chaque scénario de test.
const createBooking = (overrides: Partial<Booking> = {}): Booking =>
  Object.assign(new Booking(), {
    id: "b1",
    screeningId: "s1",
    email: "a@b.fr",
    seats: 2,
    tariff: "NORMAL",
    total: 2000,
    status: "CONFIRMED",
    createdAt: new Date("2026-10-20T10:00:00Z"),
    ...overrides,
  });

// Vérifie le contrat du repository mémoire utilisé par les use cases.
describe("BookingRepository en mémoire", () => {
  let repository: BookingRepository;

  // Chaque test commence avec un dépôt vide pour éviter le partage d'état.
  beforeEach(() => {
    repository = new InMemoryBookingRepository();
  });

  it("sauvegarde puis retrouve une réservation par identifiant", async () => {
    const savedBooking = createBooking();

    await repository.save(savedBooking);

    expect(await repository.findById("b1")).toEqual(savedBooking);
  });

  it("renvoie undefined lorsqu'un identifiant est inconnu", async () => {
    expect(await repository.findById("unknown")).toBeUndefined();
  });

  it("remplace une réservation ayant le même identifiant", async () => {
    await repository.save(createBooking());
    await repository.save(
      createBooking({
        status: "CANCELLED",
        cancelledAt: new Date("2026-10-20T11:00:00Z"),
      })
    );

    expect((await repository.findById("b1"))?.status).toBe("CANCELLED");
    expect(await repository.findByEmail("a@b.fr")).toHaveLength(1);
  });

  it("compte seulement les places confirmées de la séance demandée", async () => {
    await repository.save(createBooking({ id: "b1", seats: 2 }));
    await repository.save(createBooking({ id: "b2", seats: 3 }));
    await repository.save(
      createBooking({ id: "b3", seats: 4, status: "CANCELLED" })
    );
    await repository.save(
      createBooking({ id: "b4", seats: 5, screeningId: "s2" })
    );

    expect(await repository.countConfirmedSeats("s1")).toBe(5);
  });
});
