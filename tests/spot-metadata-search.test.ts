import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Spot, SpotContent } from '../src/types/index.ts';
import { PlanDraft } from '../src/components/modals/editor/types.ts';

describe('Spot Metadata (Title, Description, Location, Hashtags) & Search Protocol', () => {
  const sampleSpots: Spot[] = [
    {
      id: 'sp_test_1',
      ownerId: 'usr_1',
      creatorName: 'Aria_Wanderer',
      slug: 'aria-wanderer-4819',
      tier: 'big_pop',
      title: 'Sunset in Paris',
      description: 'Romantic evening stroll along the Seine River watching the city lights.',
      location: 'Paris, France',
      tags: ['#travel', '#photography', '#europe', '#sunset'],
      x: 100,
      y: 100,
      width: 170,
      height: 210,
      rotation: 0,
      shape: 'polaroid',
      background: '#FFFFFF',
      content: {
        title: 'Sunset in Paris',
        description: 'Romantic evening stroll along the Seine River watching the city lights.',
        location: 'Paris, France',
        tags: ['#travel', '#photography', '#europe', '#sunset'],
        headline: 'City of Love',
        text: 'Unforgettable moments in Paris',
        textColor: '#FFFFFF',
        fontFamily: 'Caveat',
        fontSize: 22,
        alignment: 'center',
        stickers: [],
        frameStyle: 'tape',
      },
      createdAt: '2026-11-24T10:00:00.000Z',
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 420,
      sharesCount: 15,
    },
    {
      id: 'sp_test_2',
      ownerId: 'usr_2',
      creatorName: 'Rohan_Art',
      slug: 'rohan-art-1923',
      tier: 'mini_pop',
      title: 'Cyberpunk Neon Vibe',
      description: 'Abstract digital sketch exploring geometric neon patterns in Mumbai.',
      location: 'Mumbai, India',
      tags: ['#art', '#neon', '#cyberpunk', '#digitalart'],
      x: 300,
      y: 300,
      width: 170,
      height: 170,
      rotation: 2,
      shape: 'sticky',
      background: '#FEF08A',
      content: {
        title: 'Cyberpunk Neon Vibe',
        description: 'Abstract digital sketch exploring geometric neon patterns in Mumbai.',
        location: 'Mumbai, India',
        tags: ['#art', '#neon', '#cyberpunk', '#digitalart'],
        headline: 'Future World',
        text: 'Keep on creating',
        textColor: '#1E293B',
        fontFamily: 'Poppins',
        fontSize: 20,
        alignment: 'center',
        stickers: [],
        frameStyle: 'pin',
      },
      createdAt: '2026-11-24T11:00:00.000Z',
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 180,
      sharesCount: 8,
    },
    {
      id: 'sp_test_3',
      ownerId: 'usr_3',
      creatorName: 'Minimalist',
      slug: 'minimalist-9901',
      tier: 'mini_pop',
      // Everything optional: no title, description, location, or tags provided
      x: 500,
      y: 500,
      width: 170,
      height: 170,
      rotation: 0,
      shape: 'sticky',
      background: '#FEF08A',
      content: {
        headline: 'Keep it simple',
        textColor: '#1E293B',
        fontFamily: 'Inter',
        fontSize: 18,
        alignment: 'center',
        stickers: [],
        frameStyle: 'tape',
      },
      createdAt: '2026-11-24T12:00:00.000Z',
      status: 'published',
      moderationStatus: 'approved',
      viewsCount: 50,
      sharesCount: 2,
    },
  ];

  // Search filter simulator matching server/api.ts search implementation
  const searchFilter = (spots: Spot[], q: string) => {
    if (!q || !q.trim()) return spots;
    const cleanQ = q.trim().toLowerCase();
    const strippedQ = cleanQ.startsWith('#') ? cleanQ.slice(1) : cleanQ;

    return spots.filter((s) => {
      const title = (s.title || s.content?.title || '').toLowerCase();
      const description = (s.description || s.content?.description || '').toLowerCase();
      const location = (s.location || s.content?.location || '').toLowerCase();
      const headline = (s.content?.headline || '').toLowerCase();
      const text = (s.content?.text || '').toLowerCase();
      const creator = (s.creatorName || '').toLowerCase();
      const id = s.id.toLowerCase();
      const slug = (s.slug || '').toLowerCase();
      const tags = [
        ...(s.tags || []),
        ...(s.content?.tags || []),
      ].map((t) => t.toLowerCase()).join(' ');

      return (
        id.includes(cleanQ) ||
        creator.includes(cleanQ) ||
        slug.includes(cleanQ) ||
        title.includes(cleanQ) ||
        (strippedQ && title.includes(strippedQ)) ||
        description.includes(cleanQ) ||
        (strippedQ && description.includes(strippedQ)) ||
        location.includes(cleanQ) ||
        (strippedQ && location.includes(strippedQ)) ||
        headline.includes(cleanQ) ||
        (strippedQ && headline.includes(strippedQ)) ||
        text.includes(cleanQ) ||
        tags.includes(cleanQ) ||
        (strippedQ && tags.includes(strippedQ))
      );
    });
  };

  test('Search by Title finds matching spot', () => {
    const results = searchFilter(sampleSpots, 'Sunset in Paris');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'sp_test_1');

    const partial = searchFilter(sampleSpots, 'cyberpunk');
    assert.equal(partial.length, 1);
    assert.equal(partial[0].id, 'sp_test_2');
  });

  test('Search by Location matches city and country names', () => {
    const parisResults = searchFilter(sampleSpots, 'Paris');
    assert.equal(parisResults.length, 1);
    assert.equal(parisResults[0].location, 'Paris, France');

    const mumbaiResults = searchFilter(sampleSpots, 'Mumbai');
    assert.equal(mumbaiResults.length, 1);
    assert.equal(mumbaiResults[0].location, 'Mumbai, India');
  });

  test('Search by Hashtags works with and without leading hash symbol', () => {
    // With hash
    const withHash = searchFilter(sampleSpots, '#photography');
    assert.equal(withHash.length, 1);
    assert.equal(withHash[0].id, 'sp_test_1');

    // Without hash
    const withoutHash = searchFilter(sampleSpots, 'photography');
    assert.equal(withoutHash.length, 1);
    assert.equal(withoutHash[0].id, 'sp_test_1');

    const artSearch = searchFilter(sampleSpots, '#art');
    assert.equal(artSearch.length, 1);
    assert.equal(artSearch[0].id, 'sp_test_2');
  });

  test('Search by Description narrative finds relevant pop', () => {
    const seineResults = searchFilter(sampleSpots, 'Seine River');
    assert.equal(seineResults.length, 1);
    assert.equal(seineResults[0].id, 'sp_test_1');

    const geometricResults = searchFilter(sampleSpots, 'geometric neon');
    assert.equal(geometricResults.length, 1);
    assert.equal(geometricResults[0].id, 'sp_test_2');
  });

  test('Everything is optional: spots without metadata function properly and match by headline', () => {
    const results = searchFilter(sampleSpots, 'Keep it simple');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'sp_test_3');
    assert.equal(results[0].title, undefined);
    assert.equal(results[0].location, undefined);
    assert.equal(results[0].description, undefined);
  });
});
