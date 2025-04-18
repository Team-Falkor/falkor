/**
 * UUID v4 Generator
 * 
 * A custom implementation of UUID v4 (random) following RFC 4122 standard.
 * This replaces the deprecated uuid package with a native implementation.
 */

import crypto from 'crypto';

/**
 * Generates a RFC 4122 compliant UUID v4 (random-based)
 * 
 * @returns A randomly generated UUID string
 */
export function uuidv4(): string {
  // Use crypto.randomBytes for cryptographically strong random values
  const randomBytes = crypto.randomBytes(16);
  
  // Set the version (4) and variant bits according to RFC 4122
  // Version 4 means random UUID
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // variant 1
  
  // Convert to hex string with proper formatting
  const hex = randomBytes.toString('hex');
  
  // Format with dashes in the standard UUID format: 8-4-4-4-12
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
}

/**
 * Validates if a string is a valid UUID
 * 
 * @param uuid The string to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generates a UUID v4 with a namespace prefix
 * Useful for creating identifiers within a specific domain
 * 
 * @param namespace A string namespace to prefix the UUID
 * @returns A namespaced UUID string
 */
export function namespacedUUID(namespace: string): string {
  return `${namespace}-${uuidv4()}`;
}