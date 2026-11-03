import app from "./app.js";
import { env } from "./config/env.js";

app.listen(
  env.port,
  () => {
    console.log(
      `MedGuard server running at http://localhost:${env.port}`
    );
  }
);