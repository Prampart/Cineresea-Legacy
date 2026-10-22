import { readDb } from "./Db";

export class ScreeningRepository {
  findById(id: string) {
    const db = readDb();
    return db.screenings.find((s: any) => s.id === id);
  }

  findAll() {
    const db = readDb();
    return db.screenings;
  }
}
``