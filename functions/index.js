/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.morningEncouragement = functions.pubsub.schedule('every day 08:00').timeZone('America/New_York').onRun(async (context) => {
  const db = admin.firestore();
  const tokensSnapshot = await db.collection('fcmTokens').get();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateString = yesterday.toISOString().split('T')[0];

  for (const doc of tokensSnapshot.docs) {
    const userId = doc.id;
    const token = doc.data().token;

    // Get yesterday's completed tasks for this user
    const tasksSnapshot = await db.collection('tasks')
      .where('userId', '==', userId)
      .where('date', '==', dateString)
      .where('done', '==', true)
      .get();

    const completedCount = tasksSnapshot.size;

    // Compose message
    const message = completedCount > 0
      ? `Great job! You completed ${completedCount} task${completedCount > 1 ? 's' : ''} yesterday! Keep it up!`
      : `New day, new opportunities! Let's get started!`;

    // Send push notification
    await admin.messaging().send({
      token,
      notification: {
        title: 'Good Morning!',
        body: message,
      },
    });
  }

  return null;
});

// Secret token for security (replace with your own secret or use env variable)
const DAILY_NOTIFY_SECRET = process.env.DAILY_NOTIFY_SECRET || 'changeme123';

exports.sendDailyNotifications = functions.https.onRequest(async (req, res) => {
  // Simple security check
  const authHeader = req.headers['authorization'] || req.query.secret;
  if (authHeader !== `Bearer ${DAILY_NOTIFY_SECRET}` && authHeader !== DAILY_NOTIFY_SECRET) {
    res.status(403).send('Forbidden: Invalid secret');
    return;
  }

  const db = admin.firestore();
  const tokensSnapshot = await db.collection('fcmTokens').get();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateString = yesterday.toISOString().split('T')[0];

  let sentCount = 0;
  for (const doc of tokensSnapshot.docs) {
    const userId = doc.id;
    const token = doc.data().token;

    // Get yesterday's completed tasks for this user
    const tasksSnapshot = await db.collection('tasks')
      .where('userId', '==', userId)
      .where('date', '==', dateString)
      .where('done', '==', true)
      .get();

    const completedTasks = tasksSnapshot.docs.map(t => t.data().text);

    // Compose message
    let message;
    if (completedTasks.length > 0) {
      message = `Yesterday you accomplished: ${completedTasks.join(', ')}. Keep it up!`;
    } else {
      message = `Yesterday you didn't check off any tasks, but today is a new day! Let's get it!`;
    }

    // Send push notification
    try {
      await admin.messaging().send({
        token,
        notification: {
          title: 'Good Morning! 🌞',
          body: message,
        },
        data: {
          url: '/',
        }
      });
      sentCount++;
    } catch (err) {
      console.error(`Error sending to ${userId}:`, err);
    }
  }

  res.send(`Notifications sent to ${sentCount} users.`);
});
