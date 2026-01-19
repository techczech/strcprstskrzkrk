import { Difficulty, TwisterContent, SoundGuideContent } from './types';

export const INITIAL_TWISTERS: TwisterContent[] = [
  {
    id: '1',
    text: 'Strč prst skrz krk',
    translation: 'Stick a finger through the throat',
    meaning: 'The most famous Czech tongue twister, completely without vowels.',
    difficulty: Difficulty.Medium,
    ipa: 'str̩tʃ pr̩st skr̩s kr̩k',
    breakdown: ['krk', 'skrz krk', 'prst skrz krk', 'Strč prst skrz krk'],
    tips: 'There are no vowels! The "r" acts as the syllabic core. Roll your R strongly.',
    audioSrc: 'audio/strcprstskrzkrk.mp3'
  },
  {
    id: '2',
    text: 'Třistatřicet tři stříbrných stříkaček stříkalo přes třistatřicet tři stříbrných střech',
    translation: '333 silver fire hoses squirted over 333 silver roofs',
    meaning: 'A classic drill for the difficult "ř" sound.',
    difficulty: Difficulty.Hard,
    ipa: 'tr̝̊ɪstatr̝̊ɪt͡sɛt tr̝̊ɪ str̝̊iːbr̩niːx str̝̊iːkat͡ʃɛk str̝̊iːkalo pr̝̊ɛs...',
    breakdown: [
      'střech',
      'stříbrných střech',
      'tři stříbrných střech',
      'stříkaček stříkalo přes...',
      'Třistatřicet tři stříbrných...'
    ],
    tips: 'Focus on the "ř" sound. It is like a trilled "r" mixed with a "zh" sound.',
    audioSrc: 'audio/tristatricetstrikacek.mp3'
  },
  {
    id: '3',
    text: 'Šel pštros s pštrosicí a pštrosáčaty',
    translation: 'An ostrich went with a female ostrich and baby ostriches',
    meaning: 'Practice for the "š" (sh) and "č" (ch) sounds.',
    difficulty: Difficulty.Easy,
    ipa: 'ʃɛl pʃtros s‿pʃtrosɪt͡siː a pʃtrosaːt͡ʃatɪ',
    breakdown: ['pštrosáčaty', 'a pštrosáčaty', 's pštrosicí a...', 'pštros s pštrosicí...', 'Šel pštros...'],
    tips: 'Watch out for the "pšt" cluster. It sounds like "psht" in one go.',
    audioSrc: 'audio/selprstros.mp3'
  },
  {
    id: '4',
    text: 'Vlky plky',
    translation: 'Wolf chatter',
    meaning: 'Very short, practice the "l" when it functions as a vowel.',
    difficulty: Difficulty.Easy,
    ipa: 'vl̩kɪ pl̩kɪ',
    breakdown: ['plky', 'Vlky plky'],
    tips: 'L acts as the vowel here, similar to the syllabic R. Keep it short.',
    audioSrc: 'audio/vlkyplky.mp3'
  },
  {
    id: '5',
    text: 'Kmotře Petře, nepřepepřete mi toho vepře',
    translation: 'Godfather Peter, do not over-pepper that pork for me',
    meaning: 'A rhyming challenge focusing on "ř" when it follows "p"and "t".',
    difficulty: Difficulty.Medium,
    ipa: 'kmotr̝̊ɛ pɛtr̝̊ɛ nɛpr̝̊ɛpɛpr̝̊ɛtɛ mɪ toɦo vɛpr̝̊ɛ',
    breakdown: ['vepře', 'toho vepře', 'mi toho vepře', 'nepřepepřete mi...', 'Petře, nepřepepřete...', 'Kmotře Petře...'],
    tips: 'Many "ř" sounds following P and T. Be careful not to spit!',
    audioSrc: 'audio/kmotrepetre.mp3'
  },
  {
    id: '6',
    text: 'Na cvičišti čtyři svišti piští',
    translation: 'Four marmots are squeaking on the drill field',
    meaning: 'Excellent for sibilants (s, š, c, č).',
    difficulty: Difficulty.Hard,
    ipa: 'na t͡svɪt͡ʃɪʃtʲɪ t͡ʃtɪr̝ɪ svɪʃtʲɪ pɪʃtʲiː',
    breakdown: ['piští', 'svišti piští', 'čtyři svišti piští', 'Na cvičišti čtyři...'],
    tips: 'A tongue workout for sibilants. Distinguish clearly between S, Š, C, and Č.',
    audioSrc: 'audio/nacvicisti.mp3'
  },
  {
    id: '7',
    text: 'Nenaolejuje-li je Julie, naolejuji je já',
    translation: 'If Julie doesn\'t oil them, I will oil them',
    meaning: 'A chaotic mix of vowels and "j" and "l".',
    difficulty: Difficulty.Insane,
    ipa: 'nɛnaolɛjujɛlɪ jɛ julɪjɛ naolɛjujɪ jɛ jaː',
    breakdown: ['já', 'je já', 'naolejuji je já', 'Julie, naolejuji...', '-li je Julie...', 'Nenaolejuje-li...'],
    tips: 'Flow between vowels and "l/j" smoothly. Do not stop the airflow.',
    audioSrc: 'audio/nenaolejulie.mp3'
  }
];

export const DIFFICULT_SOUNDS: SoundGuideContent[] = [
  {
    sound: 'Ř / ř',
    ipa: 'r̝',
    description: 'The infamous Czech sound. A trilled R raised to the roof of the mouth, creating a buzz.',
    example: 'Dvořák, Tři'
  },
  {
    sound: 'Š / š',
    ipa: 'ʃ',
    description: 'Voiceless postalveolar fricative. Like "sh" in "shoe".',
    example: 'Škoda, Šest'
  },
  {
    sound: 'Č / č',
    ipa: 't͡ʃ',
    description: 'Voiceless postalveolar affricate. Like "ch" in "chat".',
    example: 'Český, Čaj'
  },
  {
    sound: 'Ž / ž',
    ipa: 'ʒ',
    description: 'Voiced postalveolar fricative. Like "s" in "pleasure" or "j" in French "bonjour".',
    example: 'Život, Žena'
  },
  {
    sound: 'Ch',
    ipa: 'x',
    description: 'Voiceless velar fricative. Like "ch" in "loch" or German "Bach".',
    example: 'Chléb, Praha'
  },
  {
    sound: 'C',
    ipa: 't͡s',
    description: 'Voiceless alveolar affricate. Like "ts" in "cats".',
    example: 'Cukr, Co'
  },
  {
    sound: 'Ň / ň',
    ipa: 'ɲ',
    description: 'Palatal nasal. Like "ni" in "onion" or Spanish "ñ".',
    example: 'Kůň, Měňavka'
  }
];