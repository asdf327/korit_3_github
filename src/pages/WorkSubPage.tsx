// src/pages/WorkSubPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Header from '../components/Header';
import { Container } from '@mui/material';

const WorkSubPage: React.FC = () => {
  // pageId와 subTitle을 모두 받도록 변경
  const { pageId, subTitle } = useParams<{ pageId: string; subTitle: string }>();
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // pageId가 없으면 오류 처리
    if (!pageId) {
      setError('❌ 잘못된 페이지 ID입니다.');
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      try {
        // pageId를 사용하여 API 호출
        const url = `https://zh.wikisource.org/w/api.php?action=parse&pageid=${encodeURIComponent(
          pageId
        )}&prop=text&format=json&formatversion=2&redirects=1&origin=*`;
    
        const res = await fetch(url).then(r => r.json());
    
        if (res.error) {
          throw new Error(`❌ 위키소스 API 오류: ${res.error.info || '알 수 없는 오류'}`);
        }
    
        const text = res?.parse?.text;
    
        if (!text) {
          throw new Error('본문 없음 또는 파싱 실패');
        }
    
        const tmp = document.createElement('div');
        tmp.innerHTML = text;
        const body = tmp.querySelector('.mw-parser-output')?.innerHTML || text;
    
        const purifyCfg = {
          ALLOWED_TAGS: [
            'p', 'br', 'div', 'span', 'b', 'i', 'u', 'em', 'strong', 'sup', 'sub',
            'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'hr',
            'table', 'thead', 'tbody', 'tr', 'td', 'th'
          ],
          ALLOWED_ATTR: ['class'],
          ADD_ATTR: ['class'],
        };
        setHtml(DOMPurify.sanitize(body, purifyCfg));
    
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('본문을 불러오는 데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [pageId]); 

  if (loading) return <>로딩 중...</>;
  if (error) return <>{error}</>;

  return (
    <>
      <Header />
      <Container sx={{ py: 4 }}>
        <h1>{decodeURIComponent(subTitle || '제목 없음')}</h1> 
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Container>
    </>
  );
};

export default WorkSubPage;