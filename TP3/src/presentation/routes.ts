import { Router } from "express";
import { BookSeats, BookSeatsCommand } from "../application/ports/in/BookSeats";
import { DomainError } from "../domain/DomainError";

// Ne requiert que les méthodes utilisées par ces anciennes routes.
type LegacyBookingRoutes = {
  cancelBooking(id: string): unknown;
  getBookingsByEmail(email: string): unknown;
};

type LegacyScreeningRoutes = {
  getScreenings(): unknown;
};

// Fabrique les routes HTTP; la nouvelle réservation est fournie par le port d'entrée.
export function createRoutes(
  bookSeats: BookSeats,
  bookingService: LegacyBookingRoutes,
  screeningService: LegacyScreeningRoutes
) {
  const router = Router();

  // Liste les séances via l'ancien service.
  router.get("/screenings", (req, res) => {
    res.json(screeningService.getScreenings());
  });

  // Transforme la requête HTTP en commande puis appelle le cas d'utilisation.
  router.post("/screenings/:id/bookings", async (req, res, next) => {
    const command = new BookSeatsCommand();
    command.screeningId = req.params.id;
    command.email = req.body.email;
    command.seats = Number(req.body.seats);
    command.tariff = req.body.tariff === "STUDENT" ? "STUDENT" : "NORMAL";

    // En cas de succès, répond avec le statut HTTP 201; les erreurs vont au middleware Express.
    try {
      const booking = await bookSeats.execute(command);
      res.status(201).json(booking);
    } catch (error) {
      // Traduit les erreurs métier en statuts et messages HTTP identiques au legacy.
      if (error instanceof DomainError) {
        switch (error.code) {
          case "INVALID":
            return res.status(400).json({ error: error.message });
          case "NOT_FOUND":
            return res.status(404).json({ error: "Séance introuvable" });
          case "CONFLICT":
            return res.status(409).json({ error: error.message });
          case "PAYMENT_REFUSED":
            return res.status(402).json({ error: "Paiement refusé" });
        }
      }

      // Les erreurs techniques non prévues restent visibles dans le gestionnaire Express.
      next(error);
    }
  });

  // Les routes d'annulation et de consultation restent branchées sur le code legacy (migration TP3).
  router.delete("/bookings/:id", (req, res) => {
    try {
      const booking = bookingService.cancelBooking(
        req.params.id
      );

      res.json(booking);
    } catch (e: any) {
      switch (e.message) {
        case "BOOKING_NOT_FOUND":
          return res
            .status(404)
            .json({ error: "Réservation introuvable" });

        case "ALREADY_CANCELLED":
          return res
            .status(409)
            .json({ error: "Déjà annulée" });

        case "TOO_LATE":
          return res.status(409).json({
            error:
              "Annulation impossible moins de 2h avant la séance",
          });
      }
    }
  });

  // Cherche les réservations correspondant à l'adresse e-mail fournie dans l'URL.
  router.get("/bookings", (req, res) => {
    res.json(
      bookingService.getBookingsByEmail(
        String(req.query.email)
      )
    );
  });

  // Retourne le routeur configuré à l'application principale.
  return router;
}