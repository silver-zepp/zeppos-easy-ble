/**
 * Object containing BLE permissions.
 * Each permission is a property with a detailed description and a numeric value.
 * In many scenarios, it's sufficient to use the built-in generateProfileObject(...) auto-permission 32.
 * However, for complex and encrypted communications, specific permissions defined here may be required.
 */
export const PERMISSIONS: {
    /** Allows reading the characteristic value. */
    READ: {
        description: string;
        value: number;
    };
    /** Allows reading the characteristic value with an encrypted link. */
    READ_ENCRYPTED: {
        description: string;
        value: number;
    };
    /** Allows reading the characteristic value with an encrypted and authenticated link (MITM protection). */
    READ_ENCRYPTED_MITM: {
        description: string;
        value: number;
    };
    /** Allows writing the characteristic value. */
    WRITE: {
        description: string;
        value: number;
    };
    /** Allows writing the characteristic value with an encrypted link. */
    WRITE_ENCRYPTED: {
        description: string;
        value: number;
    };
    /** Allows writing the characteristic value with an encrypted and authenticated link (MITM protection). */
    WRITE_ENCRYPTED_MITM: {
        description: string;
        value: number;
    };
    /** Allows writing the characteristic value with a signed write (without response). */
    WRITE_SIGNED: {
        description: string;
        value: number;
    };
    /** Allows writing the characteristic value with a signed write (without response) and authenticated link (MITM protection). */
    WRITE_SIGNED_MITM: {
        description: string;
        value: number;
    };
    /** Allows reading the descriptor value. */
    READ_DESCRIPTOR: {
        description: string;
        value: number;
    };
    /** Allows writing the descriptor value. */
    WRITE_DESCRIPTOR: {
        description: string;
        value: number;
    };
    /** Allows both reading and writing the descriptor value. */
    READ_WRITE_DESCRIPTOR: {
        description: string;
        value: number;
    };
    /** No permissions granted. */
    NONE: {
        description: string;
        value: number;
    };
    /** All permissions granted. */
    ALL: {
        description: string;
        value: number;
    };
};