import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import KakaoCallback from './pages/auth/KakaoCallback';
import SignupPage from './pages/SignupPage';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import FreeJam from './pages/FreeJam';
import Board from './pages/Board';
import Clan from './pages/Clan';
import ClanCreatePage from './pages/ClanCreatePage';
import MyClan from './pages/MyClan';
import ClanDetail from './pages/ClanDetail';
import ClanCalendar from './pages/ClanCalendar';
import ClanIntro from './pages/ClanIntro';
import Membersador from './pages/Membersador';
import ClanMemberStatus from './pages/ClanMemberStatus';
import VoteDetail from './pages/VoteDetail';
import VoteStatus from './pages/VoteStatus';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import PrivateChatRoom from './pages/PrivateChatRoom';
import FriendAdd from './pages/FriendAdd';
import ClanNoticeList from './pages/ClanNoticeList';
import ClanNoticeCreate from './pages/ClanNoticeCreate';
import ClanNoticeDetail from './pages/ClanNoticeDetail';
import ClanBoardList from './pages/ClanBoardList';
import ClanJamList from './pages/ClanJamList';
import ClanJamDetail from './pages/ClanJamDetail';
import ClanJamCreate from './pages/ClanJamCreate';
import ClanBoardPostList from './pages/ClanBoardPostList';
import ClanBoardPostCreate from './pages/ClanBoardPostCreate';
import ClanBoardPostDetail from './pages/ClanBoardPostDetail';
import VoteList from './pages/VoteList';
import BoardList from './pages/BoardList';
import BoardWrite from './pages/BoardWrite';
import BoardDetail from './pages/BoardDetail';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallback />} />

        {/* Main Layout Routes */}
        <Route path="/main" element={<MainLayout />}>
          <Route index element={<HomePage />} /> {/* Default to Home */}
          <Route path="home" element={<HomePage />} />
          <Route path="freejam" element={<FreeJam />} />
          <Route path="board" element={<Board />} />
          <Route path="clan" element={<Clan />} />
          <Route path="clan/create" element={<ClanCreatePage />} />
          <Route path="clan/my" element={<MyClan />} />
          <Route path="clan/detail/:id" element={<ClanDetail />} />
          <Route path="clan/members/:clanId" element={<ClanMemberStatus />} />
          <Route path="clan/intro/:id" element={<ClanIntro />} />
          <Route path="clan/notice/:clanId" element={<ClanNoticeList />} />
          <Route path="chat/list" element={<ChatList />} />
          <Route path="chat/room/:roomNo" element={<ChatRoom />} />
          <Route path="chat/private/:roomNo" element={<PrivateChatRoom />} />
          <Route path="chat/friend/add" element={<FriendAdd />} />
          <Route path="clan/notice/:clanId/create" element={<ClanNoticeCreate />} />
          <Route path="clan/notice/:clanId/detail/:noticeId" element={<ClanNoticeDetail />} />
          <Route path="clan/calendar/:clanId" element={<ClanCalendar />} />
          <Route path="clan/board/:clanId" element={<ClanBoardList />} />
          <Route path="clan/board/:clanId" element={<ClanBoardList />} />
          <Route path="clan/jam/:clanId" element={<ClanJamList />} />
          <Route path="jam" element={<ClanJamList />} />
          <Route path="jam/create" element={<ClanJamCreate />} />
          <Route path="clan/jam/room/:jamId" element={<ClanJamDetail />} />
          <Route path="clan/jam/:clanId/create" element={<ClanJamCreate />} />
          <Route path="clan/board/:clanId/:boardTypeNo" element={<ClanBoardPostList />} />
          <Route path="clan/board/:clanId/:boardTypeNo/create" element={<ClanBoardPostCreate />} />
          <Route path="clan/board/:clanId/:boardTypeNo/post/:boardNo" element={<ClanBoardPostDetail />} />
          <Route path="vote/status/:voteId" element={<VoteStatus />} />
          <Route path="vote/list/:roomNo" element={<VoteList />} />
          <Route path="vote/:voteId" element={<VoteDetail />} />
          <Route path="membersador" element={<Membersador />} />

          <Route path="board/list/:boardTypeFg" element={<BoardList />} />
          <Route path="board/write/:boardTypeFg" element={<BoardWrite />} />
          <Route path="board/detail/:boardNo" element={<BoardDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
