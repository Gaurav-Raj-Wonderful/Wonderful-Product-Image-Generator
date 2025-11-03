
import 'dotenv/config';
import express from 'express';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getAppCheck } from 'firebase-admin/app-check';
import { generate } from './geminiService.js';
import rateLimit from 'express-rate-limit';

// Initialize Firebase Admin SDK
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: 'gs://automation-dev-596d2.firebasestorage.app',
    });
    console.log("Firebase initialized with service account key.");
  } catch (e) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it is a valid JSON string.', e);
    process.exit(1);
  }
} else {
  initializeApp({
    storageBucket: 'gs://automation-dev-596d2.firebasestorage.app',
  });
  console.log("Firebase initialized with Application Default Credentials.");
}

const app = express();
const port = process.env.PORT || 8080;

// --- Security Middleware ---

// Rate Limiter for login to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiter for generate to prevent API abuse
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 generate requests per hour
  message: 'Too many requests to this endpoint from this IP, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

const appCheckMiddleware = async (req, res, next) => {
  if (req.path === '/login') {
    return next();
  }

  const appCheckToken = req.header('X-Firebase-AppCheck');

  if (!appCheckToken) {
    console.log('Request rejected: Missing App Check token.');
    return res.status(401).send('Unauthorized');
  }

  try {
    await getAppCheck().verifyToken(appCheckToken);
    return next();
  } catch (err) {
    console.log(`Request rejected: Invalid App Check token. Error: ${err.message}`);
    return res.status(401).send('Unauthorized');
  }
};


// --- API Routes ---
const apiRouter = express.Router();

apiRouter.use(appCheckMiddleware);
apiRouter.use(express.json({ limit: '10mb' }));

apiRouter.use((req, res, next) => {
  console.log(`Request passed App Check. Processing: ${req.method} ${req.path}`);
  next();
});

// Apply the login limiter ONLY to the /login route
apiRouter.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (password === process.env.APP_PASSWORD) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect password' });
  }
});

// Apply the generate limiter ONLY to the /generate route
apiRouter.post('/generate', generateLimiter, async (req, res) => {
  try {
    const { type, prompt, imageUrl, sizeReferenceImageUrl } = req.body;
    if (!type || !prompt) {
      return res.status(400).json({ error: 'Request must include "type" and "prompt".' });
    }
    if (type === 'generate' && !imageUrl) {
      return res.status(400).json({ error: "\'generate\' type requires an \'imageUrl\'." });
    }
    
    const result = await generate({ type, prompt, imageUrl, sizeReferenceImageUrl });
    res.status(200).json({ result });
  } catch (error) {
    console.error(`Error in /generate (type: ${req.body.type}):`, error);
    res.status(500).json({ error: 'An error occurred on the server. Please check the logs.' });
  }
});

apiRouter.post('/getImageUrl', async (req, res) => {
  const { imagePath } = req.body;

  if (!imagePath) {
      return res.status(400).json({ error: 'Request must include an "imagePath".' });
  }

  console.log(`Attempting to get signed URL for imagePath: "${imagePath}"`);

  try {
      const bucket = getStorage().bucket();
      const file = bucket.file(imagePath);

      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      const [url] = await file.getSignedUrl({
          action: 'read',
          expires: expiresAt,
      });

      res.status(200).json({ 
        result: { 
          signedUrl: url,
          expiresAt: expiresAt
        } 
      });
  } catch (error) {
      console.error(`Error getting signed URL for ${imagePath}:`, error);
      res.status(500).json({ error: 'An error occurred on the server. Please check the logs.' });
  }
});

app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
