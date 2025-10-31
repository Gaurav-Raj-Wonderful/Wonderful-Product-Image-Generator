
import 'dotenv/config';
import express from 'express';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { generate } from './geminiService.js';

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '');
} catch (e) {
  console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY: ', e);
  console.error('Make sure the service account key is properly set in your .env file.');
}

if (serviceAccount) {
    initializeApp({
        credential: cert(serviceAccount),
        storageBucket: 'gs://twc-agency-pistachio-generator.firebasestorage.app'
    });
}

const app = express();
const port = process.env.PORT || 8080;

// --- API Routes ---
const apiRouter = express.Router();
apiRouter.use(express.json({ limit: '10mb' }));

// Add a logging middleware to see the requests
apiRouter.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.path}`);
  next();
});

apiRouter.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.APP_PASSWORD) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect password' });
  }
});

apiRouter.post('/generate', async (req, res) => {
  try {
    const { type, prompt, imageUrl, sizeReferenceImageUrl } = req.body;
    if (!type || !prompt) {
      return res.status(400).json({ error: 'Request must include "type" and "prompt".' });
    }
    if (type === 'generate' && !imageUrl) {
      return res.status(400).json({ error: "'generate' type requires an 'imageUrl'." });
    }
    
    const result = await generate({ type, prompt, imageUrl, sizeReferenceImageUrl });
    res.status(200).json({ result });
  } catch (error) {
    console.error(`Error in /generate (type: ${req.body.type}):`, error);
    res.status(500).json({ error: 'An error occurred on the server. Please check the logs.' });
  }
});

// Endpoint to get a signed URL for a Firebase Storage image
apiRouter.post('/getImageUrl', async (req, res) => {
  const { imagePath } = req.body;

  if (!imagePath) {
      return res.status(400).json({ error: 'Request must include an "imagePath".' });
  }

  console.log(`Attempting to get signed URL for imagePath: "${imagePath}"`);

  try {
      const bucket = getStorage().bucket();
      const file = bucket.file(imagePath);

      // Get a signed URL for the file that expires in 1 hour
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      const [url] = await file.getSignedUrl({
          action: 'read',
          expires: expiresAt,
      });

      res.status(200).json({ 
        result: { 
          signedUrl: url,
          expiresAt: expiresAt // Send expiration time to client
        } 
      });
  } catch (error) {
      console.error(`Error getting signed URL for ${imagePath}:`, error);
      res.status(500).json({ error: 'An error occurred on the server. Please check the logs.' });
  }
});

app.use('/api', apiRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
