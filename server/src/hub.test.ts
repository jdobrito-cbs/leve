import { describe, expect, test } from 'vitest';
import { parseHubContent } from './hub.js';

describe('parseHubContent', () => {
  test('JSON puro', () => {
    const r = parseHubContent('{"foods":[{"name":"arroz branco cozido","portionGrams":150,"confidence":0.9}]}');
    expect(r.foods[0].name).toBe('arroz branco cozido');
    expect(r.foods[0].portionGrams).toBe(150);
  });

  test('JSON com cercas de markdown e texto ao redor', () => {
    const r = parseHubContent('Claro! ```json\n{"foods":[{"name":"feijão","portionGrams":null,"confidence":0.7}]}\n``` fim');
    expect(r.foods[0].name).toBe('feijão');
    expect(r.foods[0].portionGrams).toBeNull();
  });

  test('valores fora de faixa caem em defaults; sem JSON lança', () => {
    const r = parseHubContent('{"foods":[{"name":"pão","portionGrams":-5,"confidence":7}]}');
    expect(r.foods[0].portionGrams).toBeNull();
    expect(r.foods[0].confidence).toBe(0.5);
    expect(() => parseHubContent('não consegui analisar')).toThrow();
  });
});
