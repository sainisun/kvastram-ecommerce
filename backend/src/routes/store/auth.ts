import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  customerAuthService,
  LoginCustomerSchema,
  RegisterCustomerSchema,
} from "../../services/customer-auth-service";

const storeAuthRouter = new Hono();

storeAuthRouter.post(
  "/register",
  zValidator("json", RegisterCustomerSchema),
  async (c) => {
    const data = c.req.valid("json");
    try {
      const customer = await customerAuthService.register(data);
      // Auto login after register
      const { token } = await customerAuthService.login({
        email: data.email,
        password: data.password,
      });
      return c.json({ customer, token });
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  },
);

storeAuthRouter.post(
  "/login",
  zValidator("json", LoginCustomerSchema),
  async (c) => {
    const data = c.req.valid("json");
    try {
      const result = await customerAuthService.login(data);
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message }, 401);
    }
  },
);

export default storeAuthRouter;
