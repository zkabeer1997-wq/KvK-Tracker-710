export const SIX_DIGIT_PIN_RE = /^\d{6}$/;

const BLOCKED_PINS = new Set([
  '000000', '111111', '123456', '222222', '333333', '444444',
  '555555', '654321', '666666', '777777', '888888', '999999',
]);

export function validatePinChange(currentPin, newPin, confirmPin) {
  if (!SIX_DIGIT_PIN_RE.test(String(currentPin || ''))) {
    return 'Current PIN must be exactly 6 digits.';
  }
  if (!SIX_DIGIT_PIN_RE.test(String(newPin || ''))) {
    return 'New PIN must be exactly 6 digits.';
  }
  if (newPin !== confirmPin) return 'New PINs do not match.';
  if (newPin === currentPin) return 'Choose a new PIN that is different from your current PIN.';
  if (BLOCKED_PINS.has(newPin)) return 'Choose a less predictable PIN.';
  return null;
}
