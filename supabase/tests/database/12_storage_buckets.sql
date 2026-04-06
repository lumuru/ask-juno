BEGIN;
SELECT plan(6);

SELECT is(
  (SELECT id FROM storage.buckets WHERE id = 'scan-photos'),
  'scan-photos',
  'scan-photos bucket exists'
);

SELECT is(
  (SELECT id FROM storage.buckets WHERE id = 'wardrobe-photos'),
  'wardrobe-photos',
  'wardrobe-photos bucket exists'
);

SELECT is(
  (SELECT id FROM storage.buckets WHERE id = 'share-cards'),
  'share-cards',
  'share-cards bucket exists'
);

SELECT is(
  (SELECT public FROM storage.buckets WHERE id = 'scan-photos'),
  false,
  'scan-photos is private'
);

SELECT is(
  (SELECT public FROM storage.buckets WHERE id = 'wardrobe-photos'),
  false,
  'wardrobe-photos is private'
);

SELECT is(
  (SELECT public FROM storage.buckets WHERE id = 'share-cards'),
  false,
  'share-cards is private'
);

SELECT * FROM finish();
ROLLBACK;
