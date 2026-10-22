import { readDb, writeDb } from "./Db";

export class BookingRepository {
  findAll() {
    return readDb().bookings;
  }

  findById(id: string) {
    const db = readDb();
    return db.bookings.find((b: any) => b.id === id);
  }

  save(booking: any) {
    const db = readDb();
    db.bookings.push(booking);
    writeDb(db);
  }

  update(booking: any) {
    const db = readDb();

    const index = db.bookings.findIndex(
      (b: any) => b.id === booking.id
    );

    db.bookings[index] = booking;

    writeDb(db);
  }
}