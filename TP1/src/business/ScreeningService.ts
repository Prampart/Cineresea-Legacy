import { ScreeningRepository } from "../data/ScreeningRepository";
import { BookingRepository } from "../data/BookingRepository";

export class ScreeningService {
  constructor(
    private screenings = new ScreeningRepository(),
    private bookings = new BookingRepository()
  ) {}

  list() {
    const now = new Date();

    return this.screenings
      .findAll()
      .filter((s: any) => new Date(s.startsAt) >= now)
      .map((s: any) => {
        let taken = 0;

        for (const b of this.bookings.findAll()) {
          if (
            b.screeningId === s.id &&
            b.status === "CONFIRMED"
          ) {
            taken += b.seats;
          }
        }

        return {
          id: s.id,
          movie: s.movie,
          room: s.room,
          startsAt: s.startsAt,
          price: s.price,
          remaining: s.capacity - taken,
        };
      });
  }
}