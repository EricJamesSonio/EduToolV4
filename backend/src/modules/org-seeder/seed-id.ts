import { v5 as uuidv5 } from 'uuid';

const SEED_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

export function seedId(...parts: string[]): string {
  return uuidv5(parts.join(':'), SEED_NAMESPACE);
}
