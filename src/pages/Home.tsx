import React, { useEffect, useState } from 'react';
import { Container, Box, Tabs, Tab, Typography, CircularProgress, Button } from '@mui/material';
import Header from '../components/Header';
import AuthorIntroduction from '../components/AuthorIntroduction';
import authorPhoto from '../assets/湯顯祖.jpg';
import { motion } from 'framer-motion';
import wikiData from '../data/translated_wiki.json';

interface Section {
  title: string;
  original: string;
  translated: string;
}

const WikiSectionTabs: React.FC<{ sections: Section[] }> = ({ sections }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [showTranslated, setShowTranslated] = useState(false); // 번역 보기 여부

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const toggleLanguage = () => {
    setShowTranslated((prev) => !prev);
  };

  const section = sections[tabIndex];

  return (
    <Box sx={{ mt: 6 }}>
      <Tabs value={tabIndex} onChange={handleChange} variant="scrollable" scrollButtons="auto">
        {sections.map((section, index) => (
          <Tab key={index} label={section.title} />
        ))}
      </Tabs>

      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Button variant="outlined" onClick={toggleLanguage}>
          {showTranslated ? '원문 보기' : '번역 보기'}
        </Button>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography
          component="div"
          sx={{
            fontFamily: showTranslated ? 'Noto Serif KR' : 'Noto Serif SC',
            lineHeight: 1.8,
          }}
          dangerouslySetInnerHTML={{
            __html: showTranslated ? section.translated : section.original,
          }}
        />
      </Box>
    </Box>
  );
};

const Home: React.FC = () => {
  const author = {
    name: '탕현조',
    bio: '탕현조는 중국 문학을 대표하는 작가로, 그의 작품은 인간 내면의 감정을 섬세하게 표현하였다.',
    photoUrl: authorPhoto,
  };

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // JSON에서 바로 데이터 설정
    setSections(wikiData);
    setLoading(false);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
      <Header />
      <Container sx={{ pt: 8 }}>
        <h1>{author.name}</h1>
        <AuthorIntroduction {...author} />
        {loading ? (
          <Box textAlign="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
          <WikiSectionTabs sections={sections} />
        )}
      </Container>
    </motion.div>
  );
};

export default Home;