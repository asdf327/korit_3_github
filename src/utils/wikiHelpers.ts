// src/utils/wikiHelpers.ts

/**
 * 위키 HTML에서 불필요한 요소를 제거하는 함수
 * - 편집 링크
 * - 스타일 등 불필요한 요소 제거 가능
 */
export function cleanHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  // [편집] 링크 제거
  tmp.querySelectorAll('.mw-editsection, .mw-empty-elt').forEach(el => el.remove());

  // 기타: 클래스나 스타일 제거 가능 시 여기에 추가
  // tmp.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));

  return tmp.innerHTML;
}

/**
 * 내부 위키 링크를 절대 URL로 변환하고 새 창에서 열리도록 수정
 */
export function absolutizeLinks(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  tmp.querySelectorAll<HTMLAnchorElement>('a[href^="/wiki/"]').forEach(a => {
    const href = a.getAttribute('href');
    if (href) {
      a.href = `https://zh.wikisource.org${href}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });

  return tmp.innerHTML;
}
