import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { FakePaymentGateway } from "../src/adapters/out/FakePaymentGateway";
import { InMemoryBookingRepository } from "../src/adapters/out/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "../src/adapters/out/InMemoryScreeningRepository";
import { UuidGenerator } from "../src/adapters/out/UuidGenerator";
import { BookSeatsService } from "../src/application/usecases/BookSeatsService";
import { CancelBookingService } from "../src/application/usecases/CancelBookingService";
import { ListMyBookingsService } from "../src/application/usecases/ListMyBookingsService";
import { ListUpcomingScreeningsService } from "../src/application/usecases/ListUpcomingScreeningsService";
import { Booking } from "../src/domain/Booking";
import { Screening } from "../src/domain/Screening";
import { createRoutes } from "../src/adapters/in/http/routes";

// Construit une API de test avec une séance future et des repositories partagés.
function buildTestApp() {
  const screening = Object.assign(new Screening(), {
    id: "s1",
    movie: "Dune",
    room: "Salle 1",
    startsAt: new Date("2030-01-01T20:00:00Z"),
    capacity: 10,
    price: 1000,
  });
  const bookings = new InMemoryBookingRepository();
  const screenings = new InMemoryScreeningRepository([screening]);
  const clock = {
    // Cette heure fixe maintient la séance future et l'annulation autorisée.
    now: () => new Date("2029-12-31T10:00:00Z"),
  };

  // Assemble les use cases réels avec des adaptateurs prévisibles pour les tests.
  const app = express();
  app.use(express.json());
  app.use(
    createRoutes(
      new BookSeatsService(
        bookings,
        screenings,
        clock,
        new UuidGenerator(),
        {
          notify: async (_booking: Booking, _screening: Screening) => {},
          bookingCancelled: async () => {},
        },
        new FakePaymentGateway(true)
      ),
      new CancelBookingService(bookings, screenings, clock, {
        notify: async (_booking: Booking, _screening: Screening) => {},
        bookingCancelled: async () => {},
      }),
      new ListMyBookingsService(bookings, screenings),
      new ListUpcomingScreeningsService(screenings, bookings, clock)
    )
  );

  return app;
}

describe("API HTTP", () => {
  it("liste, réserve, consulte et annule avec les nouveaux use cases", async () => {
    const app = buildTestApp();

    const screeningsBefore = await request(app).get("/screenings").expect(200);
    expect(screeningsBefore.body[0].remaining).toBe(10);

    const created = await request(app)
      .post("/screenings/s1/bookings")
      .send({ email: "a@b.fr", seats: 2 })
      .expect(201);
    expect(created.body.total).toBe(2000);

    const myBookings = await request(app)
      .get("/bookings?email=a@b.fr")
      .expect(200);
    expect(myBookings.body).toHaveLength(1);
    expect(myBookings.body[0].movie).toBe("Dune");
    expect(myBookings.body[0].startsAt).toBe("2030-01-01T20:00:00.000Z");

    await request(app).delete(`/bookings/${created.body.id}`).expect(200);

    const screeningsAfter = await request(app).get("/screenings").expect(200);
    expect(screeningsAfter.body[0].remaining).toBe(10);
  });

  it("traduit les erreurs métier en statuts HTTP", async () => {
    const app = buildTestApp();

    await request(app)
      .post("/screenings/missing/bookings")
      .send({ email: "a@b.fr", seats: 1 })
      .expect(404);
    await request(app)
      .post("/screenings/s1/bookings")
      .send({ email: "a@b.fr", seats: 9 })
      .expect(400);
    await request(app).delete("/bookings/missing").expect(404);
  });
});
