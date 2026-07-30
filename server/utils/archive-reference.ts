import type { H3Event } from 'h3';
import { Buffer } from 'node:buffer';
import { createCipheriv, createDecipheriv, createHmac, hkdfSync } from 'node:crypto';

const REFERENCE_VERSION = 1;
const NONCE_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const KEY_SALT = Buffer.from('ensik-archive-reference-v1', 'utf8');
const VERSION_BYTES = Buffer.from([REFERENCE_VERSION]);

function deriveReferenceKeys(secret: string) {
  if (secret.length < 32)
    throw new Error('Archive reference secret must be at least 32 characters.');

  const keyMaterial = Buffer.from(secret, 'utf8');
  return {
    encryption: Buffer.from(
      hkdfSync('sha256', keyMaterial, KEY_SALT, Buffer.from('encryption'), KEY_LENGTH),
    ),
    nonce: Buffer.from(
      hkdfSync('sha256', keyMaterial, KEY_SALT, Buffer.from('nonce'), KEY_LENGTH),
    ),
  };
}

function referenceSecret(event: H3Event) {
  const password = useRuntimeConfig(event).session.password;
  if (typeof password !== 'string' || password.length < 32) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Archive media is not configured.',
    });
  }

  return password;
}

function createArchiveReference(pathname: string, secret: string) {
  const plaintext = Buffer.from(pathname, 'utf8');
  const keys = deriveReferenceKeys(secret);
  const nonce = createHmac('sha256', keys.nonce)
    .update(plaintext)
    .digest()
    .subarray(0, NONCE_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', keys.encryption, nonce);
  cipher.setAAD(VERSION_BYTES);

  const encrypted = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ]);

  return Buffer.concat([
    VERSION_BYTES,
    nonce,
    cipher.getAuthTag(),
    encrypted,
  ]).toString('base64url');
}

function parseArchiveReference(reference: string, secret: string) {
  try {
    const payload = Buffer.from(reference, 'base64url');
    const minimumLength = 1 + NONCE_LENGTH + AUTH_TAG_LENGTH + 1;
    if (payload.length < minimumLength || payload[0] !== REFERENCE_VERSION)
      throw new Error('Invalid archive reference.');

    const keys = deriveReferenceKeys(secret);
    const nonceStart = 1;
    const tagStart = nonceStart + NONCE_LENGTH;
    const contentStart = tagStart + AUTH_TAG_LENGTH;
    const nonce = payload.subarray(nonceStart, tagStart);
    const authTag = payload.subarray(tagStart, contentStart);
    const encrypted = payload.subarray(contentStart);
    const decipher = createDecipheriv('aes-256-gcm', keys.encryption, nonce);
    decipher.setAAD(VERSION_BYTES);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }
  catch {
    throw new Error('Invalid archive reference.');
  }
}

export function toArchiveReference(event: H3Event, pathname: string) {
  return createArchiveReference(pathname, referenceSecret(event));
}

export function fromArchiveReference(event: H3Event, reference: string) {
  try {
    return parseArchiveReference(reference, referenceSecret(event));
  }
  catch {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found.',
    });
  }
}
