/** Curated from https://www.youtube.com/@VolkaEnglish/videos on 2026-10-25. */
export const VOLKA_CHANNEL = {
  name: 'Volka English',
  handle: '@VolkaEnglish',
  url: 'https://www.youtube.com/@VolkaEnglish',
  avatarUrl:
    'https://yt3.googleusercontent.com/1VNunCWJS2XjOpJBb0d1Zpqo29Wz29xDdfIa2vdMXfTZpk2Agf5pa6kDoHsIef6fte10B1sIKw=s160-c-k-c0x00ffffff-no-rj',
};

export const VOLKA_VIDEOS = [
  {
    id: 'H5qcIEH1iVs',
    title: "I'll Talk About My Day. You Practice Your English",
    duration: 1426,
    publishedAt: '2026-10-23',
  },
  {
    id: 'lxoMNDsktlY',
    title: 'A Day in China | English Listening Practice',
    duration: 1422,
    publishedAt: '2026-10-20',
  },
  {
    id: 'mgfBmnD04Q8',
    title: 'LEARN ENGLISH by Listening to Slow, Natural Conversations',
    duration: 1249,
    publishedAt: '2026-10-18',
  },
  {
    id: 'LTVk3yUb5Mg',
    title: 'The Easiest Way to Learn English? My Real Daily Routine | POV Vlog',
    duration: 1115,
    publishedAt: '2026-10-16',
  },
  {
    id: 'ErP_AKE3riY',
    title: 'How to Introduce Yourself in English Naturally | ENGLISH 101',
    duration: 822,
    publishedAt: '2026-10-13',
  },
];

export type VolkaVideo = (typeof VOLKA_VIDEOS)[number];
