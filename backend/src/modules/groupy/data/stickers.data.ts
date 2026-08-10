// Static, bundled sticker pack for Groupy. Versioned in code — there is no
// management UI and no DB model for this; sending a sticker only stores its id.
//
// Decision: kept in the BACKEND because the backend must validate `stickerId`
// before accepting a sticker message. The actual image assets live under
// `frontend/public/stickers/` (served by the frontend) and `assetPath` is the
// public URL the client renders.

export interface GroupySticker {
  id: string;
  label: string;
  assetPath: string;
}

export const GROUPY_STICKERS: GroupySticker[] = [
  { id: 's1', label: 'Thumbs Up', assetPath: '/stickers/s1-thumbs-up.png' },
  { id: 's2', label: 'Clap', assetPath: '/stickers/s2-clap.png' },
  { id: 's3', label: 'Laughing', assetPath: '/stickers/s3-laugh.png' },
  { id: 's4', label: 'Heart Eyes', assetPath: '/stickers/s4-heart-eyes.png' },
  { id: 's5', label: 'Wow', assetPath: '/stickers/s5-wow.png' },
  { id: 's6', label: 'Thinking', assetPath: '/stickers/s6-thinking.png' },
  { id: 's7', label: 'Great Job', assetPath: '/stickers/s7-great-job.png' },
  { id: 's8', label: 'Good Question', assetPath: '/stickers/s8-good-question.png' },
  { id: 's9', label: 'Rocket', assetPath: '/stickers/s9-rocket.png' },
  { id: 's10', label: 'Coffee', assetPath: '/stickers/s10-coffee.png' },
];

export function getGroupyStickerById(id: string): GroupySticker | undefined {
  return GROUPY_STICKERS.find((s) => s.id === id);
}