import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from './lib/prisma.js';
import passport from './config/passport.js';
import express from 'express';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/', folderRoutes);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
