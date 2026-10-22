import express from "express";
import routes from "./presentation/routes";

const app = express();

app.use(express.json());
app.use(routes);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () =>
    console.log(
      `CinéResa sur http://localhost:${PORT}`
    )
  );
}

export default app;