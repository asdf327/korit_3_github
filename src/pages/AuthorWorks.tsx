// src/pages/AuthorWorks.tsx
import React, { useEffect, useState } from 'react';
import { Container, Typography } from '@mui/material';
import Header from '../components/Header';
import { Link } from 'react-router-dom';

interface WorkItem {
  id?: string;
  title: string;
}
interface GroupedWorks {
  group: string;
  items: WorkItem[];
}

const AUTHOR_PAGE = 'Author:湯顯祖';

const AuthorWorks: React.FC = () => {
  const [groups, setGroups] = useState<GroupedWorks[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthorWorks = async () => {
      try {
        const url =
          `https://zh.wikisource.org/w/api.php` +
          `?action=parse&page=${encodeURIComponent(AUTHOR_PAGE)}` +
          `&prop=wikitext` +
          `&format=json&formatversion=2&origin=*`;

        const res = await fetch(url).then(r => r.json());

        const wt: string = res.parse.wikitext;
        if (!wt) throw new Error('wikitext가 비어 있습니다.');

        const lines = wt.split('\n');
        const temp: Record<string, WorkItem[]> = {};
        let current = '';

        lines.forEach(line => {
          const header = line.match(/^==\s*(.+?)\s*==/); // == 그룹 제목 ==
          if (header) {
            current = header[1].trim();
            temp[current] = [];
            return;
          }
          // * [[문서 제목]] 또는 * [[문서 제목|표시될 제목]] 패턴
          const item = line.match(/^\*\s*\[\[([^\]|#]+)(?:#[^\]]*)?(?:\|([^\]]+))?\]\]/);
          if (item && current) {
            const title = item[2] || item[1]; // 표시될 제목이 있으면 그것을 사용, 없으면 문서 제목 사용
            temp[current].push({ title });
          }
        });

        const result: GroupedWorks[] = Object.entries(temp).map(([g, items]) => ({
          group: g,
          items,
        }));
        setGroups(result);
      } catch (e) {
        console.error(e);
        setErr('작품 목록을 가져오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorWorks();
  }, []); // 의존성 배열을 비워 한 번만 실행되도록 함

  if (loading) return <>로딩 중...</>;
  if (err) return <>{err}</>;

  return (
    <>
      <Header />
      <Container sx={{ py: 4 }}>
        <h1>탕현조 작품 목록</h1> {/* h1 태그는 index.css의 h1 스타일을 따름 */}
        {groups.map(({ group, items }) => (
          <section key={group} style={{ marginBottom: '1.5rem' }}>
            <Typography variant="h5" gutterBottom>{group}</Typography>
            <ul>
              {items.map(({ title }) => (
                <li key={title}>
                  <Link to={`/works/detail/${encodeURIComponent(title)}`}>{title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>
    </>
  );
};

export default AuthorWorks;