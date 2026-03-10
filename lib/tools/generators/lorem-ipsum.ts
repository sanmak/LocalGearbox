/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Lorem Ipsum Generator
 * Generates placeholder text in paragraphs, sentences, or words
 * 100% client-side, no external API calls
 */

import { validateInput, TEXT_SIZE_LIMIT } from '../shared';

/**
 * Classic Lorem Ipsum opening phrase
 */
const LOREM_IPSUM_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

/**
 * Latin word list commonly used in Lorem Ipsum text generation.
 * Contains 220+ words drawn from the traditional Lorem Ipsum corpus.
 */
const WORD_LIST: string[] = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
  'at',
  'vero',
  'eos',
  'accusamus',
  'iusto',
  'odio',
  'dignissimos',
  'ducimus',
  'blanditiis',
  'praesentium',
  'voluptatum',
  'deleniti',
  'atque',
  'corrupti',
  'quos',
  'dolores',
  'quas',
  'molestias',
  'recusandae',
  'itaque',
  'earum',
  'rerum',
  'hic',
  'tenetur',
  'sapiente',
  'delectus',
  'aut',
  'reiciendis',
  'voluptatibus',
  'maiores',
  'alias',
  'perferendis',
  'doloribus',
  'asperiores',
  'repellat',
  'temporibus',
  'quibusdam',
  'officiis',
  'debitis',
  'necessitatibus',
  'saepe',
  'eveniet',
  'voluptates',
  'repudiandae',
  'recusandae',
  'libero',
  'tempore',
  'cum',
  'soluta',
  'nobis',
  'eligendi',
  'optio',
  'cumque',
  'nihil',
  'impedit',
  'quo',
  'minus',
  'quod',
  'maxime',
  'placeat',
  'facere',
  'possimus',
  'omnis',
  'voluptas',
  'assumenda',
  'repellendus',
  'autem',
  'vel',
  'eum',
  'fugit',
  'consequuntur',
  'magni',
  'nesciunt',
  'neque',
  'porro',
  'quisquam',
  'dolorem',
  'numquam',
  'eius',
  'modi',
  'tempora',
  'incidunt',
  'magnam',
  'aliquam',
  'quaerat',
  'inventore',
  'veritatis',
  'quasi',
  'architecto',
  'beatae',
  'vitae',
  'dicta',
  'explicabo',
  'nemo',
  'ipsam',
  'voluptatem',
  'quia',
  'consequatur',
  'perspiciatis',
  'unde',
  'totam',
  'rem',
  'aperiam',
  'eaque',
  'ipsa',
  'quae',
  'ab',
  'illo',
  'laudantium',
  'similique',
  'mollitia',
  'animi',
  'provident',
  'occaecati',
  'cupiditate',
  'excepturi',
  'accusantium',
  'doloremque',
  'pariatur',
  'harum',
  'quidem',
  'rerum',
  'facilis',
  'expedita',
  'distinctio',
  'nam',
  'suscipit',
  'laboriosam',
  'corporis',
  'commodi',
  'consequatur',
  'illum',
  'fuga',
  'ratione',
  'sententia',
  'praesent',
  'cras',
  'turpis',
  'nullam',
  'lacus',
  'porta',
  'ante',
  'primis',
  'faucibus',
  'orci',
  'luctus',
  'ultrices',
  'posuere',
  'cubilia',
  'curae',
  'mauris',
  'viverra',
  'diam',
  'vitae',
  'interdum',
  'tortor',
  'condimentum',
  'lacinia',
  'sapien',
  'cursus',
  'vestibulum',
  'elementum',
  'feugiat',
  'pellentesque',
  'habitant',
  'morbi',
  'tristique',
  'senectus',
  'netus',
  'malesuada',
  'fames',
  'turpis',
  'egestas',
  'maecenas',
  'pharetra',
  'convallis',
  'ornare',
  'semper',
  'auctor',
  'neque',
  'massa',
  'tincidunt',
  'nunc',
  'pulvinar',
  'mattis',
  'vivamus',
  'pretium',
  'ligula',
  'ullamcorper',
  'metus',
];

/**
 * Configuration for the lorem ipsum generator
 */
interface LoremIpsumConfig {
  mode: 'paragraphs' | 'sentences' | 'words';
  count: number;
  startWithLorem: boolean;
  includeHtml: boolean;
}

/**
 * Simple seeded pseudo-random number generator
 * Uses a linear congruential generator for deterministic-looking but varied output
 */
const createSeededRandom = (): (() => number) => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  let seed = array[0];
  return (): number => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
};

/**
 * Picks a random word from the word list
 */
const pickWord = (random: () => number): string => {
  const index = Math.floor(random() * WORD_LIST.length);
  return WORD_LIST[index];
};

/**
 * Capitalizes the first letter of a string
 */
const capitalize = (str: string): string => {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Generates a single sentence of random words
 */
const generateSentence = (random: () => number): string => {
  const wordCount = Math.floor(random() * 12) + 5; // 5-16 words per sentence
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(pickWord(random));
  }
  // Add commas for variety in longer sentences
  if (wordCount > 8) {
    const commaPos = Math.floor(random() * (wordCount - 4)) + 3;
    words[commaPos] = words[commaPos] + ',';
  }
  return capitalize(words.join(' ')) + '.';
};

/**
 * Generates a single paragraph of random sentences
 */
const generateParagraph = (random: () => number): string => {
  const sentenceCount = Math.floor(random() * 4) + 4; // 4-7 sentences per paragraph
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence(random));
  }
  return sentences.join(' ');
};

/**
 * Generates lorem ipsum text based on configuration
 */
const generateLoremIpsum = (config: LoremIpsumConfig): string => {
  const { mode, count, startWithLorem, includeHtml } = config;
  const random = createSeededRandom();

  if (mode === 'words') {
    const words: string[] = [];
    if (startWithLorem) {
      // Start with classic opening words
      const loremWords = LOREM_IPSUM_START.replace(/[.,]/g, '').toLowerCase().split(' ');
      const wordsToTake = Math.min(count, loremWords.length);
      words.push(...loremWords.slice(0, wordsToTake));
    }
    while (words.length < count) {
      words.push(pickWord(random));
    }
    const result = capitalize(words.slice(0, count).join(' '));
    return includeHtml ? `<p>${result}</p>` : result;
  }

  if (mode === 'sentences') {
    const sentences: string[] = [];
    if (startWithLorem) {
      sentences.push(LOREM_IPSUM_START);
    }
    while (sentences.length < count) {
      sentences.push(generateSentence(random));
    }
    const result = sentences.slice(0, count).join(' ');
    return includeHtml ? `<p>${result}</p>` : result;
  }

  // mode === 'paragraphs'
  const paragraphs: string[] = [];
  if (startWithLorem) {
    const firstParagraph = LOREM_IPSUM_START + ' ' + generateParagraph(random);
    paragraphs.push(firstParagraph);
  }
  while (paragraphs.length < count) {
    paragraphs.push(generateParagraph(random));
  }
  const finalParagraphs = paragraphs.slice(0, count);

  if (includeHtml) {
    return finalParagraphs.map((p) => `<p>${p}</p>`).join('\n\n');
  }
  return finalParagraphs.join('\n\n');
};

/**
 * Process function for the tool registry
 * Accepts JSON input with generation configuration
 */
export const generateLoremIpsumText = async (input: string): Promise<string> => {
  validateInput(input, TEXT_SIZE_LIMIT);

  let config: LoremIpsumConfig;

  try {
    const parsed = JSON.parse(input) as Record<string, unknown>;
    const mode = parsed.mode;
    const count = parsed.count;
    const startWithLorem = parsed.startWithLorem;
    const includeHtml = parsed.includeHtml;

    if (mode !== 'paragraphs' && mode !== 'sentences' && mode !== 'words') {
      throw new Error('Invalid mode. Must be "paragraphs", "sentences", or "words".');
    }

    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
      throw new Error('Count must be a positive integer.');
    }

    const maxCounts: Record<string, number> = {
      paragraphs: 100,
      sentences: 500,
      words: 5000,
    };

    if (count > maxCounts[mode]) {
      throw new Error(`Count exceeds maximum for ${mode} mode (max: ${maxCounts[mode]}).`);
    }

    config = {
      mode,
      count,
      startWithLorem: typeof startWithLorem === 'boolean' ? startWithLorem : true,
      includeHtml: typeof includeHtml === 'boolean' ? includeHtml : false,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON input. Expected configuration object.');
    }
    throw error;
  }

  return generateLoremIpsum(config);
};
