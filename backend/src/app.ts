import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { env, isAllowedOrigin } from './config/env';

export function createApp(): Express {
  const app = express();

  // Security Middleware
  app.use(helmet());

  /**
   * CORS, as an explicit allowlist.
   *
   * The frontend is deployed separately from this service, so its origin has to
   * be named rather than inferred. `credentials` is deliberately off: this API
   * authenticates with `Authorization: Bearer`, never with cookies, so there is
   * no credentialed cross-origin case to support — and a wildcard origin with
   * credentials enabled is the classic way to make every user's session
   * readable by any site they visit.
   *
   * A request with no Origin header (curl, a server-to-server call, a health
   * probe) is allowed: CORS is a browser protection and such requests were
   * never subject to it.
   */
  app.use(
    cors({
      origin(origin, callback) {
        // Reflect the origin only when it is on the list. An unlisted origin is
        // answered *without* the header rather than with an error: the browser
        // then blocks the response, which is the actual CORS mechanism, while
        // raising an Error here would return a 500 that reads in the logs as a
        // server fault. CORS is not an authorisation control — the bearer token
        // is — so refusing to add a header is the whole of the job.
        callback(null, !origin || isAllowedOrigin(origin));
      },
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Logging Middleware
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Body Parsing Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', routes);

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Not Found - ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
