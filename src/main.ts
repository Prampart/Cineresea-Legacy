/*
?tape 0 - Point d'entr?e de l'application.
L'application assemble les d?pendances concr?tes (m?moires, horloge, notifier, paiement simul?),
puis branche les use cases dans l'API Express. C'est le moment o? le syst?me ?mont?? devient ex?cutable.
*/


// Express héberge l'API; ce fichier compose les adapters et les cas d'utilisation.
import express from "express";
import { ConsoleNotifier } from "./adapters/out/ConsoleNotifier";
import { FakePaymentGateway } from "./adapters/out/FakePaymentGateway";
import { InMemoryBookingRepository } from "./adapters/out/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "./adapters/out/InMemoryScreeningRepository";
import { SystemClock } from "./adapters/out/SystemClock";
import { UuidGenerator } from "./adapters/out/UuidGenerator";
import { createRoutes } from "./adapters/in/http/routes";
import { BookSeatsService } from "./application/usecases/BookSeatsService";
import { CancelBookingService } from "./application/usecases/CancelBookingService";
import { ListMyBookingsService } from "./application/usecases/ListMyBookingsService";
import { ListUpcomingScreeningsService } from "./application/usecases/ListUpcomingScreeningsService";
import { Screening } from "./domain/Screening";

// Composition root: les implementations concrètes ne sont choisies qu'ici.
// L'horloge système permet de construire des séances de démonstration toujours futures.
const clock = new SystemClock();
const startupTime = clock.now();
const initialScreenings = [
  Object.assign(new Screening(), {
    id: "s1",
    movie: "Dune: Part Three",
    room: "Salle 1",
    startsAt: new Date(startupTime.getTime() +  1 * 60 * 60 * 1000),
    capacity: 120,
    price: 1150,
  }),
  Object.assign(new Screening(), {
    id: "s2",
    movie: "Le Comte de Monte-Cristo",
    room: "Salle 2",
    startsAt: new Date(startupTime.getTime() + 150 * 60 * 60 * 1000),
    capacity: 80,
    price: 1050,
  }),
    Object.assign(new Screening(), {
    id: "s4",
    movie: "Fast and Furious 10",
    room: "Salle 1",
    startsAt: new Date(startupTime.getTime() + 48 * 60 * 60 * 1000),
    capacity: 120,
    price: 1050,
  }),
];

// Partage les mêmes repositories entre les cas d'utilisation pour qu'ils observent le même état.
const bookingRepository = new InMemoryBookingRepository();
const screeningRepository = new InMemoryScreeningRepository(initialScreenings);
const notifier = new ConsoleNotifier();

// Chaque service implémente un port entrant et dépend uniquement de ports sortants.
const bookSeats = new BookSeatsService(
  bookingRepository,
  screeningRepository,
  clock,
  new UuidGenerator(),
  notifier,
  new FakePaymentGateway()
);
const cancelBooking = new CancelBookingService(
  bookingRepository,
  screeningRepository,
  clock,
  notifier
);
const listMyBookings = new ListMyBookingsService(
  bookingRepository,
  screeningRepository
);
const listUpcomingScreenings = new ListUpcomingScreeningsService(
  screeningRepository,
  bookingRepository,
  clock
);

// Assemble l'application après avoir créé tous ses services applicatifs.
const app = express();
// Analyse le JSON avant que l'adaptateur HTTP lise request.body.
app.use(express.json());
// L'adaptateur HTTP ne reçoit que les ports entrants, jamais les adaptateurs de stockage.
app.use(
  createRoutes(
    bookSeats,
    cancelBooking,
    listMyBookings,
    listUpcomingScreenings
  )
);

// Permet aux tests d'importer l'application sans ouvrir un port réseau.
export default app;

// Démarre le serveur uniquement quand main.ts est lancé directement par npm.
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`CinéResa disponible sur http://localhost:${port}`);
  });
}
