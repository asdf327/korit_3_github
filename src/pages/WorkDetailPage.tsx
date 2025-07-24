// src/pages/WorkDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Box, Tooltip } from '@mui/material'; 
import Header from '../components/Header';
import DOMPurify, { Config } from 'dompurify';

/* ---------- 타입 ---------- */
interface SubPage {
  id: string;
  title: string;
}
interface AllPagesItem {
  pageid: number;
  title: string;
  // [key: string]: unknown; // 불필요한 속성은 주석 처리 또는 제거
}
interface AllPagesRes {
  query: { allpages: AllPagesItem[] };
  continue?: { apcontinue: string };
}

/* ---------- 필터 규칙 ---------- */
const ALLOWED_TITLES = new Set<string>([]); // 특정 제목만 허용하는 경우 사용 (현재는 비어있음)
const HIDE_PATTERNS: RegExp[] = [
  /收錄於《列朝詩集》丁集第十二/, // 특정 문구 포함된 제목 숨김
  /^歸舟重得達公船$/, // 특정 정확한 제목 숨김
];
const shouldHide = (t: string) => HIDE_PATTERNS.some((re: RegExp) => re.test(t));

/* ---------- HTML 유틸 ---------- */
const extractPoem = (html: string) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  // 0. 제목 단락 (【】로 시작하는 첫 번째 p 태그)
  let titleHtml = '';
  const parserOutputDiv = tmp.querySelector('.mw-parser-output');
  const titlePara = parserOutputDiv?.querySelector('p:first-child');

  if (titlePara && titlePara.textContent?.trim().startsWith('【')) {
    titleHtml = titlePara.outerHTML;
    titlePara.remove();
  }

  // 1. 모든 <div class="poem"> 보존
  let poemHtml = '';
  tmp.querySelectorAll('div.poem').forEach(div => {
    poemHtml += div.outerHTML;
    div.remove();
  });

  // 2. 본문 처리
  if (!parserOutputDiv) return titleHtml + poemHtml || html;
  const cleaned = parserOutputDiv.cloneNode(true) as HTMLElement;

  cleaned.querySelectorAll(
    '.printfooter, .catlinks, .reflist, table.metadata, div.mw-references-columns,' +
    ' ul.gallery, .dablink, #toc, table.infobox, .mw-indicator, .mw-hidden-catlinks, ' +
    '.template-notice, #footer-info, #footer-places, .licenses, ' +
    '.mw-parser-output > div.mw-references-wrap, .mw-parser-output > div.noprint, ' +
    'div.mw-footer-container, div.mw-page-info, ' +
    'div.poem-nav, div.wiki-page-nav, ' +
    'table.ws-header, table.wikitable, div.licenseContainer, meta[property="mw:PageProp/toc"], ' +
    '#siteSub, #contentSub, .mw-jump, .firstHeading, .site-header, .mw-normal-catlinks, ' +
    '#mw-head, #mw-panel, #p-cactions, #footer, .toccolours, .noprint, .printonly, ' +
    '.visualClear, .mw-page-title-main, .mw-cite-backlink, .mw-references '
  ).forEach(el => el.remove());

  cleaned.querySelectorAll('img').forEach(img => {
    if (
      img.src.includes('Public_domain.svg') ||
      img.alt.includes('Public domain') ||
      img.alt === '자유 라이선스' ||
      img.className.includes('mw-file-element') ||
      img.parentElement?.className.includes('floatright') ||
      img.parentElement?.className.includes('floatleft')
    ) {
      img.remove();
    }
  });

  cleaned.querySelectorAll('hr').forEach(hr => hr.remove());
  cleaned.querySelectorAll('div.plainlinks, div.licensetpl_wrapper, div.licence, div.licence-box, .mw-file-description, .mw-file-metadata').forEach(div => div.remove());

  cleaned.querySelectorAll('table, th, td, p, div, span, ul, ol, li, a, strong, em, b, i').forEach(el => {
    const htmlElement = el as HTMLElement;
    htmlElement.removeAttribute('height');
    htmlElement.removeAttribute('width');
    htmlElement.removeAttribute('style');
  });

  cleaned.querySelectorAll('div:empty, p:empty, span:empty, a:empty, li:empty, dd:empty, ul:empty, ol:empty, table:empty, tbody:empty, thead:empty, tr:empty').forEach(emptyEl => {
    emptyEl.remove();
  });

  // ✅ 1. 상단 '目錄' 등 제거
  const firstElements = cleaned.querySelectorAll('p, div');
  firstElements.forEach(el => {
    const text = el.textContent?.trim();
    if (text?.startsWith('目錄') || text?.startsWith('全書始') || text?.startsWith('紫簫記')) {
      el.remove();
    }
  });

  // ✅ 2. '返回頁首', '下一齣▶' 등 제거
  cleaned.querySelectorAll('a, p, div, span').forEach(el => {
    const text = el.textContent?.trim();
    if (!text) return;
  
    const removableTexts = ['返回頁首', '下一齣▶', '上一齣◀', '全書始'];
  
    // 완전 일치 또는 포함 여부 확인
    if (removableTexts.some(t => text.includes(t))) {
      // 자식이 없는 경우에만 제거 (중요 콘텐츠 날리는 것 방지)
      if (el.children.length === 0) {
        el.remove();
      }
    }
  });

  // ✅ 3. 저작권 문구 이후 제거
  const licenseText = '本作品在全世界都属于公有领域';
  const licenseNode = Array.from(cleaned.querySelectorAll('*')).find(el => el.textContent?.includes(licenseText));
  if (licenseNode && licenseNode.parentElement) {
    let next = licenseNode.nextSibling;
    while (next) {
      const temp = next.nextSibling;
      next.parentNode?.removeChild(next);
      next = temp;
    }
    licenseNode.remove();
  }

  // ✅ 4. whitespace만 있는 빈 요소 제거
  cleaned.querySelectorAll('p, div, span').forEach(el => {
    if (el.textContent?.trim() === '' && el.children.length === 0) {
      el.remove();
    }
  });

  return titleHtml + poemHtml + cleaned.innerHTML;
};

/**
 * 모든 위키 링크를 평문(텍스트)으로 변환합니다.
 * 더 이상 외부 링크로 연결되지 않습니다.
 */
async function stripAllWikiLinks(html: string): Promise<string> {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  const anchors = Array.from(
    tmp.querySelectorAll<HTMLAnchorElement>('a[href^="/wiki/"]')
  );

  anchors.forEach(a => {
    const span = document.createElement('span');
    span.textContent = a.textContent;
    a.replaceWith(span);
  });

  return tmp.innerHTML;
}

/* ---------- 위키 API ---------- */
async function fetchAllSubPages(prefix: string): Promise<SubPage[]> {
  const items: SubPage[] = [];
  let cont = '';
  do {
    const url =
      `https://zh.wikisource.org/w/api.php?action=query&list=allpages&apnamespace=0` +
      `&apprefix=${encodeURIComponent(prefix)}&aplimit=max` +
      (cont ? `&apcontinue=${encodeURIComponent(cont)}` : '') +
      `&format=json&origin=*`;
    const res: AllPagesRes = await fetch(url).then(r => r.json());
    items.push(
      ...res.query.allpages.map(p => ({
        id: p.pageid.toString(),
        title: p.title.replace(prefix, ''),
      }))
    );
    cont = res.continue?.apcontinue ?? '';
  } while (cont);
  return items;
}

async function scrapeLinksAsSubs(html: string): Promise<SubPage[]> {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  const anchorTitles = Array.from(
    tmp.querySelectorAll<HTMLAnchorElement>(
      '.mw-parser-output > ul > li > a[href^="/wiki/"]'
    )
  )
    .map(a =>
      decodeURIComponent(a.getAttribute('href')!.replace('/wiki/', ''))
    )
    .filter(t => !t.includes(':'));

  if (!anchorTitles.length) return [];

  const titlesParam = anchorTitles.map(encodeURIComponent).join('|');
  const url =
    `https://zh.wikisource.org/w/api.php?action=query&titles=${titlesParam}` +
    `&format=json&origin=*`;
  const res = await fetch(url).then(r => r.json());

  const pages: SubPage[] = Object.values(
    res.query.pages as Record<string, AllPagesItem>
  ).map(p => ({
    id: p.pageid.toString(),
    title: p.title,
  }));

  return pages.filter(
    (p, i, arr) =>
      arr.findIndex(x => x.id === p.id) === i && !shouldHide(p.title)
  );
}

/* ---------- DOMPurify 옵션 ---------- */
const purifyCfg: Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'div', 'span', 'b', 'i', 'u', 'em', 'strong', 'sup', 'sub',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', // 제목 태그 허용
    'blockquote', 'pre', 'code', 'hr', // 블록 인용, pre, 코드, hr 태그 허용
    'table', 'thead', 'tbody', 'tr', 'td', 'th', // 테이블 태그 허용
    'a', // 링크 태그 허용 (단, stripAllWikiLinks에서 span으로 변환하므로 실제로는 사용 안될 수 있음)
  ],
  // 허용할 HTML 속성 목록 (클래스 속성은 CSS를 위해 필요)
  ALLOWED_ATTR: ['class', 'id'], // 'id' 속성도 허용하여 위키 내부 링크 (목차 등)의 대상이 될 수 있도록
};

/* ============================================================= */
const WorkDetailPage: React.FC = () => {
  const { title: raw } = useParams<{ title: string }>();
  const title = raw ? decodeURIComponent(raw) : '';

  const [subs, setSubs] = useState<SubPage[]>([]);
  const [bodyHtml, setBodyHtml] = useState('');
  const [safeBody, setSafeBody] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* bodyHtml → 모든 위키 링크 정리 → sanitize → safeBody */
  useEffect(() => {
    if (!bodyHtml) return;
    (async () => {
      const cleaned = await stripAllWikiLinks(bodyHtml);
      let sanitized = DOMPurify.sanitize(cleaned, purifyCfg);

      // 테이블에 'wiki-table' 클래스 추가
      sanitized = sanitized.replace(/<table/g, '<table class="wiki-table"');

      setSafeBody(sanitized); // 스타일 태그 없이 직접 HTML 설정
    })();
  }, [bodyHtml]);


  /* 초기 로딩 */
  useEffect(() => {
    if (!title) {
      setErr('잘못된 제목입니다.');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const metaUrl =
          `https://zh.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(
            title,
          )}&prop=text&format=json&formatversion=2&redirects=1&origin=*`;
        const metaRes = await fetch(metaUrl).then(r => r.json());
        if (metaRes.error?.code === 'missingtitle') {
          throw new Error(`❌ 위키소스에 문서 「${title}」가 존재하지 않습니다.`);
        }

        const parse = metaRes.parse;
        const prefix = `${parse.title}/`;

        let subsRaw = await fetchAllSubPages(prefix);
        if (!subsRaw.length) subsRaw = await scrapeLinksAsSubs(parse.text);

        const visible = subsRaw.filter(p => !shouldHide(p.title.trim()));
        const filtered = ALLOWED_TITLES.size
          ? visible.filter(p => ALLOWED_TITLES.has(p.title.trim()))
          : visible;
        setSubs(filtered);

        // 하위 페이지가 있을 경우, 첫 번째 하위 페이지를 로드
        if (filtered.length) {
            setBodyHtml(''); // 하위 페이지가 있을 경우, 본문은 비워둡니다.
        } else {
            // 하위 페이지가 없을 경우, 현재 문서의 본문을 로드
            if (parse.text?.trim()) {
                setBodyHtml(extractPoem(parse.text));
            } else {
                // wikitext가 필요할 경우 fallback
                const wtRes = await fetch(
                    `https://zh.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(
                        parse.title,
                    )}&prop=wikitext&format=json&formatversion=2&origin=*`
                ).then(r => r.json());
                setBodyHtml(`<pre>${wtRes.parse?.wikitext || '내용 없음'}</pre>`);
            }
        }
      } catch (e) {
        console.error(e);
        setErr((e as Error).message || '작품 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [title]); // title이 변경될 때마다 useEffect 실행

  if (loading) return <>로딩 중…</>;
  if (err) return <>{err}</>;

  return (
    <>
      {/* <style> 태그는 제거되었습니다. 스타일은 index.css에서 관리됩니다. */}
      <Header />
      <Container sx={{ py: 4 }}>
        <h1>{title}</h1> {/* 작품의 제목을 표시 */}

        {subs.length > 0 && (
          <>
            <h2>목차</h2>
            <ul>
              {subs.map((s, idx) => {
                const cleanedTitle = s.title.replace(
                  /^(第)?[\d一二三四五六七八九十百千萬億兆壹貳參肆伍陸柒捌玖拾佰仟萬億兆０-９]+\s*[.．、章回節篇]?\s*/,
                  '',
                ).trim();

                return (
                  <li key={s.id}>
                    <Tooltip title={s.title}>
                      {/* Link 컴포넌트에 직접 sx prop 대신 index.css의 a 태그 스타일을 활용 */}
                      <Link
                        to={`/works/detail/${encodeURIComponent(title)}/page/${encodeURIComponent(s.id)}/${encodeURIComponent(s.title)}`}
                      >
                        <span>{idx + 1}. {cleanedTitle}</span>
                      </Link>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* 하위 페이지가 없을 때만 본문 내용을 표시 */}
        {subs.length === 0 && safeBody && (
          <Box // div 대신 Material-UI의 Box 컴포넌트 사용
            className="work-detail-content"
            sx={{
              marginTop: '1.5rem',
              padding: '1rem',
              fontSize: '16px',
              wordBreak: 'break-word',
              backgroundColor: '#fffaf0',
              border: '1px solid #d7ccc8',
              borderRadius: '6px',
              lineHeight: 1.6,
              fontFamily: `'Noto Serif KR', 'Nanum Myeongjo', serif`,
              overflowX: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: safeBody }}
          />
        )}
      </Container>
    </>
  );
};

export default WorkDetailPage;