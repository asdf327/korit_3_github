import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import AuthorWorks from './pages/AuthorWorks';
import WorkDetailPage from './pages/WorkDetailPage';
import WorkReadPage from './pages/WorkReadPage';
import WorkSubPage from './pages/WorkSubPage';
import './index.css'; // 여기에 추가


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/works/detail/:title/page/:pageId/:subTitle" element={<WorkSubPage />} />
      <Route path="/works/detail/:title" element={<WorkDetailPage />} />
      <Route path="/works/read/:key" element={<WorkReadPage />} />
      <Route path="/works" element={<AuthorWorks />} />
      </Routes>
    </Router>
  );
};

export default App;