import { createAvatar } from '@dicebear/avatars';
import * as style from '@dicebear/avatars-identicon-sprites';

export const generateIdenticonAvatar = (name: string, size: number) => {
  return createAvatar(style, {
    seed: name, // Use the name as the seed
    size: size, // Size of the avatar
    radius: 50, // Make it circular
    scale: 80, // Scale of the Identicon
    backgroundColor: "transparent", // Transparent background
  });
};