import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";

const RP_NAME = process.env.NEXT_PUBLIC_WEBAUTHN_RP_NAME || "Spendy";
const RP_ID = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN || "http://localhost:3000";

/**
 * Simple in-memory challenge store.
 * In production, use a database or Redis.
 */
const challengeStore = new Map<string, string>();

function getRPID(): string {
  return RP_ID;
}

function getOrigin(): string {
  return ORIGIN;
}

/**
 * Generate WebAuthn registration options for a new user.
 */
export async function generateRegisterOptions(
  userId: string,
  email: string,
  existingCredentialId?: string
) {
  const opts: GenerateRegistrationOptionsOpts = {
    rpName: RP_NAME,
    rpID: getRPID(),
    userName: email,
    userDisplayName: email,
    userID: new TextEncoder().encode(userId).slice(),
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Use Face ID / Touch ID
      residentKey: "preferred",
      userVerification: "required",
    },
  };

  // Exclude existing credential if re-registering
  if (existingCredentialId) {
    opts.excludeCredentials = [
      { id: existingCredentialId, transports: ["internal"] },
    ];
  }

  const options = await generateRegistrationOptions(opts);

  // Store challenge for verification
  challengeStore.set(userId, options.challenge);

  return options;
}

/**
 * Verify WebAuthn registration response from the browser.
 */
export async function verifyRegisterResponse(
  userId: string,
  response: any,
  expectedChallenge?: string
) {
  const storedChallenge = expectedChallenge || challengeStore.get(userId);

  if (!storedChallenge) {
    throw new Error("No challenge found for user");
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: storedChallenge,
    expectedOrigin: getOrigin(),
    expectedRPID: getRPID(),
  });

  // Clean up challenge
  challengeStore.delete(userId);

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Registration verification failed");
  }

  const { credential } = verification.registrationInfo;

  return {
    verified: true,
    credential: {
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: credential.transports || ["internal"],
    },
  };
}

/**
 * Generate WebAuthn authentication options for login.
 */
export async function generateLoginOptions(userId: string, credentialId: string) {
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID: getRPID(),
    allowCredentials: [
      {
        id: credentialId,
        transports: ["internal"],
      },
    ],
    userVerification: "required",
  };

  const options = await generateAuthenticationOptions(opts);

  // Store challenge
  challengeStore.set(userId, options.challenge);

  return options;
}

/**
 * Verify WebAuthn authentication response from the browser.
 */
export async function verifyLoginResponse(
  userId: string,
  response: any,
  storedCredential: { id: string; publicKey: string; counter: number }
) {
  const storedChallenge = challengeStore.get(userId);

  if (!storedChallenge) {
    throw new Error("No challenge found for user");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: storedChallenge,
    expectedOrigin: getOrigin(),
    expectedRPID: getRPID(),
    credential: {
      id: storedCredential.id,
      publicKey: Buffer.from(storedCredential.publicKey, "base64url").slice(),
      counter: storedCredential.counter,
    },
  });

  // Clean up challenge
  challengeStore.delete(userId);

  if (!verification.verified) {
    throw new Error("Authentication verification failed");
  }

  return {
    verified: true,
    newCounter: verification.authenticationInfo.newCounter,
  };
}

/**
 * Check if WebAuthn is supported by the browser (client-side check).
 */
export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined";
}
