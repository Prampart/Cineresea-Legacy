import { Router } from "express";
import { BookingService } from "../business/BookingService";
import { ScreeningService } from "../business/ScreeningService";
import { BusinessError } from "../business/BusinessError";

const router = Router();

const bookingService = new BookingService();
const screeningService = new ScreeningService();

router.get("/screenings", (req, res) => {
  res.json(screeningService.list());
});

router.post(
  "/screenings/:id/bookings",
  (req, res) => {
    try {
      const result =
        bookingService.create(
          req.params.id,
          req.body
        );

      res.status(201).json(result);
    } catch (error) {
      handleError(error, res);
    }
  }
);

router.delete("/bookings/:id", (req, res) => {
  try {
    const result =
      bookingService.cancel(
        req.params.id
      );

    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});

router.get("/bookings", (req, res) => {
  const email = String(
    req.query.email || ""
  );

  res.json(
    bookingService.getByEmail(email)
  );
});

function handleError(error: any, res: any) {
  if (error instanceof BusinessError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  return res.status(500).json({
    error: "Erreur interne",
  });
}

export default router;