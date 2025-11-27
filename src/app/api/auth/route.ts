
import 'dotenv/config'; // Load environment variables from .env
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { recoverMessageAddress } from 'viem';

let adminApp: admin.app.App | null = null;
let initError: Error | null = null;

// This is a critical check that runs once when the server starts.
// If this fails, the API route will be unusable.
if (admin.apps.length === 0) {
    if (!process.env.FIREBASE_ADMIN_SDK_CONFIG) {
        initError = new Error('CRITICAL: FIREBASE_ADMIN_SDK_CONFIG environment variable is not set on the server.');
        console.error(initError.message);
    } else {
        try {
            const serviceAccountString = process.env.FIREBASE_ADMIN_SDK_CONFIG;
            const serviceAccount = JSON.parse(serviceAccountString);

            // The private_key in the service account JSON often has its newlines
            // escaped as '\\n' when stored as an environment variable.
            // We need to replace these with actual newline characters.
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }

            adminApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } catch (error: any) {
            initError = new Error(`CRITICAL: Failed to parse or initialize Firebase Admin SDK: ${error.message}`);
            console.error(initError.message);
            adminApp = null; // Ensure adminApp is null on failure
        }
    }
} else {
    adminApp = admin.apps[0];
}

export async function POST(req: NextRequest) {
  // Check if initialization failed and immediately return an error if so.
  if (initError) {
      return NextResponse.json(
          { error: 'Internal Server Error', details: initError.message },
          { status: 500 }
      );
  }
  if (!adminApp) {
      return NextResponse.json(
          { error: 'Internal Server Error', details: 'Firebase Admin SDK failed to initialize for an unknown reason.' },
          { status: 500 }
      );
  }

  const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS as string;
  if (!ADMIN_ADDRESS) {
      return NextResponse.json(
          { error: 'Internal Server Error', details: 'The NEXT_PUBLIC_ADMIN_ADDRESS environment variable is not configured on the server.' },
          { status: 500 }
      );
  }

  try {
    const { address, signature, message } = await req.json();
    
    // Non-interactive admin-only login flow
    if (!signature && !message) {
        if (address && address.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
             // This is a secure, non-interactive flow for the designated admin address ONLY.
             // It is safe because it only ever generates a token for the pre-configured admin address.
            const customToken = await admin.auth().createCustomToken(address);
            return NextResponse.json({ token: customToken });
        } else {
             return NextResponse.json({ error: 'Missing signature for non-admin user.' }, { status: 400 });
        }
    }

    // Standard interactive signature-based login for all users
    if (!address || !signature || !message) {
      return NextResponse.json({ error: 'Missing address, signature, or message' }, { status: 400 });
    }

    // Verify the signature to ensure the user owns the address
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature,
    });
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 403 });
    }

    // Create a custom token with the UID set to the user's wallet address
    const customToken = await admin.auth().createCustomToken(address);

    return NextResponse.json({ token: customToken });

  } catch (error: any) {
    console.error('Error creating custom token:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message || 'An unknown server error occurred.' }, { status: 500 });
  }
}
