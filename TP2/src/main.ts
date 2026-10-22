import express from "express";
import { BookSeatsService } from "./application/usecases/BookSeatsService";
import { ConsoleNotifier } from "./adapters/out/ConsoleNotifier";
import { FakePaymentGateway } from "./adapters/out/FakePaymentGateway";
import { InMemoryBookingRepository } from "./adapters/out/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "./adapters/out/InMemoryScreeningRepository";
import { SystemClock } from "./adapters/out/SystemClock";
import { UuidGenerator } from "./adapters/out/UuidGenerator";
import { BookingService } from "./business/BookingService";
import { ScreeningService } from "./business/ScreeningService";
import { BookingRepository } from "./data/BookingRepository";
import { readDb } from "./data/Db";
import { Mailer } from "./data/Mailer";
import { PaymentGateway as LegacyPaymentGateway } from "./data/PaymentGateway";
import { ScreeningRepository } from "./data/ScreeningRepository";
import { createRoutes } from "./presentation/routes";

// Composition root: seul endroit qui choisit les implémentations concrètes des ports.
// Les données du fichier servent à initialiser les repositories conservés en mémoire.
const initialData = readDb();
// Construit le cas d'utilisation en lui fournissant tous ses adapters sortants.
const bookSeats = new BookSeatsService(
  new InMemoryBookingRepository(initialData.bookings),
  new InMemoryScreeningRepository(initialData.screenings),
  new SystemClock(),
  new UuidGenerator(),
  new ConsoleNotifier(),
  new FakePaymentGateway()
);

// Les mêmes adapters legacy restent fournis aux trois routes non migrées.
const legacyBookingRepository = new BookingRepository();
const legacyScreeningRepository = new ScreeningRepository();
const bookingService = new BookingService(
  legacyBookingRepository,
  legacyScreeningRepository,
  new LegacyPaymentGateway(),
  new Mailer()
);
const screeningService = new ScreeningService(
  legacyScreeningRepository,
  legacyBookingRepository
);

// Crée l'application HTTP et branche ses routes sur le cas d'utilisation.
const app = express();

// Le middleware convertit le corps JSON des requêtes en objets JavaScript.
app.use(express.json());
app.use(createRoutes(bookSeats, bookingService, screeningService));

// L'application est exportée pour être démarrée par le serveur ou utilisée dans des tests.
export default app;