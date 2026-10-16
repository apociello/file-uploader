import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from './lib/prisma.js';
import passport from './config/passport.js';
import express from 'express';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import { formatSize } from './lib/format.js';
import { MAX_FILE_SIZE } from './config/multer.js';
import { loadSystemFolders } from './middlewares/middleware.js';
const app = express();
const port = process.env.PORT || 3000;

// Middleware
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Available in every view
app.locals.formatSize = formatSize;
app.locals.MAX_FILE_SIZE = MAX_FILE_SIZE;

app.use(express.static(path.join(__dirname, '../public')));
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
  res.locals.username = req.user?.email.split('@')[0];
  next();
});

app.use(loadSystemFolders);

// Routes
app.use('/', authRoutes);
app.use('/', folderRoutes);
app.use('/', fileRoutes);

// No route matched the request
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// Unexpected errors (anything passed to next(err)): the details stay in the
// server log, never on the page
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { message: 'Something went wrong' });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
