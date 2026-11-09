/*
?tape 6 - Adaptateur HTTP.
Cette couche transforme les requ?tes HTTP en commandes applicatives et convertit les erreurs m?tier
en codes HTTP. Elle relie la pr?sentation au c?ur de l'application sans violer l'architecture.
*/


import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";
import { BookSeats, BookSeatsCommand } from "../../../application/ports/in/BookSeats";
import {
  CancelBooking,
  CancelBookingCommand,
} from "../../../application/ports/in/CancelBooking";
import {
  ListMyBookings,
  ListMyBookingsCommand,
} from "../../../application/ports/in/ListMyBookings";
import { ListUpcomingScreenings } from "../../../application/ports/in/ListUpcomingScreenings";
import { DomainError } from "../../../domain/DomainError";

// Traduit les erreurs métier connues en statuts HTTP; les autres restent des erreurs techniques.
function sendDomainError(error: unknown, response: Response): boolean {
  if (!(error instanceof DomainError)) {
    return false;
  }

  // Chaque code métier possède une traduction HTTP commune à toutes les routes.
  switch (error.code) {
    case "INVALID":
      response.status(400).json({ error: error.message });
      return true;
    case "NOT_FOUND":
      response.status(404).json({ error: error.message });
      return true;
    case "CONFLICT":
      response.status(409).json({ error: error.message });
      return true;
    case "PAYMENT_REFUSED":
      response.status(402).json({ error: error.message });
      return true;
  }
}

// Type commun aux handlers asynchrones afin de centraliser les erreurs et éviter les try/catch répétés.
type AsyncHandler = (
  request: Request,
  response: Response,
  next: NextFunction
) => Promise<void>;

// Transforme un handler asynchrone en handler Express avec traitement partagé des erreurs.
function handleAsync(handler: AsyncHandler): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch((error: unknown) => {
      if (!sendDomainError(error, response)) {
        next(error);
      }
    });
  };
}

// Fabrique l'adaptateur HTTP à partir des quatre ports entrants de l'application.
export function createRoutes(
  bookSeats: BookSeats,
  cancelBooking: CancelBooking,
  listMyBookings: ListMyBookings,
  listUpcomingScreenings: ListUpcomingScreenings
) {
  // Routeur Express isolé que la composition root monte dans l'application.
  const router = Router();

  // Retourne les séances à venir avec le nom de champ historique "remaining".
  router.get(
    "/screenings",
    handleAsync(async (_request, response) => {
      response.json(await listUpcomingScreenings.execute());
    })
  );

  // Convertit le chemin et le corps HTTP en commande avant d'appeler le port de réservation.
  router.post(
    "/screenings/:id/bookings",
    handleAsync(async (request, response) => {
      const command = new BookSeatsCommand();
      command.screeningId = request.params.id;
      command.email = request.body.email;
      command.seats = Number(request.body.seats);
      command.tariff = request.body.tariff === "STUDENT" ? "STUDENT" : "NORMAL";

      const booking = await bookSeats.execute(command);
      response.status(201).json(booking);
    })
  );

  // Annule la réservation nommée dans le chemin et renvoie son nouvel état.
  router.delete(
    "/bookings/:id",
    handleAsync(async (request, response) => {
      const command = new CancelBookingCommand();
      command.bookingId = request.params.id;

      response.json(await cancelBooking.execute(command));
    })
  );

  // Recherche par e-mail et renvoie les réservations enrichies par le use case.
  router.get(
    "/bookings",
    handleAsync(async (request, response) => {
      const command = new ListMyBookingsCommand();
      command.email = String(request.query.email ?? "");

      response.json(await listMyBookings.execute(command));
    })
  );

  return router;
}
