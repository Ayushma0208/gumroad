import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { adminRouter } from "./modules/admin/admin.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { cartRouter } from "./modules/cart/cart.routes";
import { categoryRouter } from "./modules/categories/category.routes";
import { creatorRouter } from "./modules/creators/creator.routes";
import { healthRouter } from "./modules/health/health.routes";
import { orderRouter } from "./modules/orders/order.routes";
import { paymentRouter } from "./modules/payments/payment.routes";
import { productRouter } from "./modules/products/product.routes";
import { userRouter } from "./modules/users/user.routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  const api = express.Router();
  api.use("/health", healthRouter);
  api.use("/auth", authRouter);
  api.use("/users", userRouter);
  api.use("/creators", creatorRouter);
  api.use("/categories", categoryRouter);
  api.use("/products", productRouter);
  api.use("/cart", cartRouter);
  api.use("/orders", orderRouter);
  api.use("/payments", paymentRouter);
  api.use("/admin", adminRouter);

  app.use("/api/v1", api);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
