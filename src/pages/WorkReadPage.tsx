// src/pages/WorkReadPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { CircularProgress, Container } from '@mui/material';
import { cleanHtml, absolutizeLinks } from '../utils/wikiHelpers';

interface ParseRes { parse: { text: string } }

const WorkReadPage: React.FC = () => {
  const { key } = useParams<{ key: string }>(); // pageid or title
  const [html, setHtml] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!key) { setErr('잘못된 값'); return; }

    (async () => {
      try {
        const isNumber = /^\d+$/.test(key);
        const param = isNumber
          ? `pageid=${key}`
          : `page=${encodeURIComponent(key)}`;

        const url =
          `https://zh.wikisource.org/w/api.php?action=parse&${param}` +
          `&prop=text&format=json&formatversion=2&redirects=1&origin=*`;

        const res: ParseRes = await fetch(url).then(r => r.json());
        if (res.parse?.text) setHtml(res.parse.text);
        else throw new Error('본문을 찾을 수 없습니다');
      } catch (e) {
        console.error(e);
        setErr((e as Error).message);
      }
    })();
  }, [key]);

  const safeHtml = useMemo(
    () => absolutizeLinks(DOMPurify.sanitize(cleanHtml(html))),
    [html]
  );

  if (!html && !err) return <CircularProgress />;
  if (err) return <div>{err}</div>;

  return (
    <>
      <Container sx={{ py: 4 }} className="WorkReadPage"> 
        <article dangerouslySetInnerHTML={{ __html: safeHtml }} />
      </Container>
    </>
  );
};

export default WorkReadPage;