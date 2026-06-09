# Parcel Point Firebase Setup

Use a fresh Firebase project for this standalone app.

1. Create a Firebase project for Parcel Point.
2. Add a Web App in Firebase project settings.
3. Copy the Web App config values into `.env.local` using the keys shown in `.env.example`.
4. Enable Firestore Database for the project.
5. The app writes shipment records into the `waybills` collection. You do not need to create the collection manually; it will appear after the first saved waybill.
6. Restart the Next.js dev server after changing `.env.local`.

For development, you can use temporary Firestore rules like this, then tighten them before production:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /waybills/{waybillId} {
      allow read, write: if true;
    }
  }
}
```

Before production, replace the open rule with authenticated/admin-only writes and public reads only for the fields your tracking page needs.
