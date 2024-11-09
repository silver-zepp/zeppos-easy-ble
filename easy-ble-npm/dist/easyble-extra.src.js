/**
 * Object containing BLE permissions.
 * Each permission is a property with a detailed description and a numeric value.
 * In many scenarios, it's sufficient to use the built-in generateProfileObject(...) auto-permission 32.
 * However, for complex and encrypted communications, specific permissions defined here may be required.
 */
export const PERMISSIONS = {
  // ===============================
  // Characteristic Read Permissions
  // ===============================
  "READ": {
      description: "Allows reading the characteristic value.",
      value: 0x01
  },
  "READ_ENCRYPTED": {
      description: "Allows reading the characteristic value with an encrypted link.",
      value: 0x02
  },
  "READ_ENCRYPTED_MITM": {
      description: "Allows reading the characteristic value with an encrypted and authenticated link (MITM protection).",
      value: 0x04
  },

  // ================================
  // Characteristic Write Permissions
  // ================================
  "WRITE": {
      description: "Allows writing the characteristic value.",
      value: 0x10
  },
  "WRITE_ENCRYPTED": {
      description: "Allows writing the characteristic value with an encrypted link.",
      value: 0x20
  },
  "WRITE_ENCRYPTED_MITM": {
      description: "Allows writing the characteristic value with an encrypted and authenticated link (MITM protection).",
      value: 0x40
  },
  "WRITE_SIGNED": {
      description: "Allows writing the characteristic value with a signed write (without response).",
      value: 0x80
  },
  "WRITE_SIGNED_MITM": {
      description: "Allows writing the characteristic value with a signed write (without response) and authenticated link (MITM protection).",
      value: 0x100
  },

  // ======================
  // Descriptor Permissions
  // ======================
  "READ_DESCRIPTOR": {
      description: "Allows reading the descriptor value.",
      value: 0x01
  },
  "WRITE_DESCRIPTOR": {
      description: "Allows writing the descriptor value.",
      value: 0x02
  },
  "READ_WRITE_DESCRIPTOR": {
      description: "Allows both reading and writing the descriptor value.",
      value: 0x03
  },

  // ======================
  // Additional Permissions
  // ======================
  "NONE": {
      description: "No permissions granted.",
      value: 0x00
  },
  "ALL": {
      description: "All permissions granted.",
      value: 0xFFFFFFFF // 4294967295 (32)
  }
};