const admin = require('firebase-admin');

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

exports.handler = async function(event, context) {
  // Optional: Add a simple secret check for security
  const secret = event.headers['authorization'] || event.queryStringParameters?.secret;
  if (secret !== `Bearer ${process.env.DAILY_NOTIFY_SECRET}` && secret !== process.env.DAILY_NOTIFY_SECRET) {
    return {
      statusCode: 403,
      body: 'Forbidden: Invalid secret',
    };
  }

  const db = admin.firestore();
  const tokensSnapshot = await db.collection('fcmTokens').get();
  console.log('Number of tokens found:', tokensSnapshot.size);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateString = yesterday.toISOString().split('T')[0];

  let sentCount = 0;
  for (const doc of tokensSnapshot.docs) {
    const userId = doc.id;
    const token = doc.data().token;
    console.log('Processing user:', userId, 'with token:', token);

    // Get yesterday's completed tasks for this user
    const tasksSnapshot = await db.collection('tasks')
      .where('userId', '==', userId)
      .where('date', '==', dateString)
      .where('done', '==', true)
      .get();

    const completedTasks = tasksSnapshot.docs.map(t => t.data().text);
    console.log('Completed tasks for', userId, ':', completedTasks);

    // Compose message
    let message;
    if (completedTasks.length > 0) {
      message = `Yesterday you accomplished: ${completedTasks.join(', ')}. Keep it up!`;
    } else {
      message = `Yesterday you didn't check off any tasks, but today is a new day! Let's get it!`;
    }
    console.log('Message to send:', message);

    // Send push notification
    try {
      const sendResult = await admin.messaging().send({
        token,
        notification: {
          title: 'Good Morning! 🌞',
          body: message,
        },
        data: {
          url: '/',
        }
      });
      console.log('Notification sent to', userId, 'result:', sendResult);
      sentCount++;
    } catch (err) {
      console.error(`Error sending to ${userId}:`, err);
    }
  }

  console.log('Total notifications sent:', sentCount);
  return {
    statusCode: 200,
    body: `Notifications sent to ${sentCount} users.`,
  };
};
