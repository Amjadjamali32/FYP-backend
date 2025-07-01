// import admin from "firebase-admin";
// import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// export default admin;


import admin from "firebase-admin";

// Parse the JSON from an environment variable
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
