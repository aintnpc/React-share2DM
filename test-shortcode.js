const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function shortcodeToId(shortcode) {
  let id = BigInt(0);
  for (const char of shortcode) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) return null;
    id = id * BigInt(64) + BigInt(index);
  }
  return id.toString();
}

function extractShortcode(input) {
  const reelMatch = input.match(/\/reel\/([A-Za-z0-9_-]+)/);
  if (reelMatch) return reelMatch[1];
  const postMatch = input.match(/\/p\/([A-Za-z0-9_-]+)/);
  if (postMatch) return postMatch[1];
  if (/^[A-Za-z0-9_-]+$/.test(input.trim())) return input.trim();
  return null;
}

async function verifyWithGraphApi(mediaId, accessToken) {
  const res = await fetch(
    `https://graph.instagram.com/v21.0/${mediaId}?fields=id,shortcode,media_type&access_token=${accessToken}`
  );
  return await res.json();
}

const input = process.argv[2];
const accessToken = process.argv[3];

if (!input) {
  console.log('사용법: node test-shortcode.js <URL 또는 shortcode> [access_token]');
  process.exit(1);
}

const shortcode = extractShortcode(input);
if (!shortcode) {
  console.log('shortcode 추출 실패:', input);
  process.exit(1);
}

const mediaId = shortcodeToId(shortcode);
console.log('shortcode :', shortcode);
console.log('media_id  :', mediaId);
console.log('→ webhook reel_video_id 와 비교하세요');

if (accessToken && mediaId) {
  verifyWithGraphApi(mediaId, accessToken).then(data => {
    console.log('\n--- Graph API 검증 ---');
    console.log(JSON.stringify(data, null, 2));
  });
}
