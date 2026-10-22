import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { BookSeats } from "../src/application/ports/in/BookSeats";
import { DomainError } from "../src/domain/DomainError";
import { createRoutes } from "../src/presentation/routes";

// Construit une application HTTP en mémoire avec un cas d'utilisation simulé.
function createTestApp(execute: BookSeats["execute"]) {
  const app = express();
  app.use(express.json());
  app.use(
    createRoutes(
      { execute },
      {
        cancelBooking: vi.fn(),
        getBookingsByEmail: vi.fn(() => []),
      },
      { getScreenings: vi.fn(() => []) }
    )
  );
  return app;
}

describe("POST /screenings/:id/bookings", () => {
  // La création réussie renvoie 201 sans démarrer le serveur applicatif.
  it("returns 201 when the booking succeeds", async () => {
    const execute = vi.fn(async () => ({
      id: "booking-1",
      screeningId: "s1",
      email: "client@example.com",
      seats: 2,
      tariff: "NORMAL" as const,
      total: 2000,
      status: "CONFIRMED" as const,
      createdAt: new Date("2030-05-10T10:00:00.000Z"),
    }));

    const response = await request(createTestApp(execute))
      .post("/screenings/s1/bookings")
      .send({ email: "client@example.com", seats: 2 });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe("booking-1");
  });

  // Les quatre erreurs métier gardent les statuts HTTP et messages du service legacy.
  it.each([
    ["INVALID", 400, "Email invalide"],
    ["INVALID", 400, "Entre 1 et 6 places par réservation"],
    ["NOT_FOUND", 404, "Séance introuvable"],
    ["CONFLICT", 409, "Plus assez de places"],
    ["PAYMENT_REFUSED", 402, "Paiement refusé"],
  ] as const)(
    "maps the %s error to HTTP %i",
    async (code, expectedStatus, expectedMessage) => {
      const execute = vi.fn(async () => {
        throw new DomainError(code, expectedMessage);
      });

      const response = await request(createTestApp(execute))
        .post("/screenings/s1/bookings")
        .send({ email: "client@example.com", seats: 2 });

      expect(response.status).toBe(expectedStatus);
      expect(response.body).toEqual({ error: expectedMessage });
    }
  );
});
