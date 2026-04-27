import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import FindIdPage from './pages/FindIdPage';
import FindPasswordPage from './pages/FindPasswordPage';
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
import JamChatRoom from './pages/JamChatRoom';
import PrivateChatRoom from './pages/PrivateChatRoom';
import GroupChatRoom from './pages/GroupChatRoom';
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
import MyJamList from './pages/MyJamList';
import MyProfile from './pages/MyProfile';
import MyScrapList from './pages/MyScrapList';
import MyPostList from './pages/MyPostList';
import JamScheduleCapture from './pages/JamScheduleCapture';
import JamVoteDetail from './pages/JamVoteDetail';
import JamVoteStatus from './pages/JamVoteStatus';
import JamVoteList from './pages/JamVoteList';
import CustomerCenterPage from './pages/CustomerCenterPage';
import AdminPage from './pages/AdminPage';
import AdminBannerPage from './pages/AdminBannerPage';
import AdminClanApprovalPage from './pages/AdminClanApprovalPage';
import AdminQaPage from './pages/AdminQaPage';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminNoticeManagement from './pages/AdminNoticeManagement';
import AdminReportBlockPage from './pages/AdminReportBlockPage';
import AdminJamManagement from './pages/AdminJamManagement';
import GatheringManagement from './pages/GatheringManagement';
import GatheringMatchResult from './pages/GatheringMatchResult';
import { requestPermission, onMessageListener, saveTokenToServer } from './utils/pushNotification';
import './App.css';
import PushToast from './components/common/PushToast';
import PageTracker from './components/common/PageTracker';
import SnsPostCreate from './pages/sns/SnsPostCreate';
import SnsShortsCreate from './pages/sns/SnsShortsCreate';
import SnsShortsFeed from './pages/sns/SnsShortsFeed';
import SnsPostFeed from './pages/sns/SnsPostFeed';
import SnsUnifiedFeed from './pages/sns/SnsUnifiedFeed';
import SnsExplore from './pages/sns/SnsExplore';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

declare global {
  interface Window {
    receiveFcmToken?: (token: string) => void;
    __pendingFcmToken?: string;
  }
}

function App() {
  const [pushNotification, setPushNotification] = useState<{ title: string; body: string; link?: string; logNo?: string } | null>(null);

  useEffect(() => {
    // 1. Web Push Permission (Existing)
    requestPermission();

    // 2. Native Bridge Setup (For App Push & Messages)
    window.receiveFcmToken = (token: string) => {
      console.log('FCM Token received from Native Bridge:', token);
      saveTokenToServer(token, 'APP');
    };

    // Native App으로부터 직접 알림 데이터를 전달받는 함수
    (window as any).receiveNativeMessage = (payloadJson: string) => {
      try {
        const payload = JSON.parse(payloadJson);
        console.log('Native message received via bridge:', payload);
        
        if (payload.notification) {
          setPushNotification({
            title: payload.notification.title,
            body: payload.notification.body,
            link: payload.data?.click_action || payload.data?.link,
            logNo: payload.data?.logNo
          });
        }
      } catch (e) {
        console.error('Failed to parse native message:', e);
      }
    };

    // Check if there was a pending token from before the bridge was ready
    if (window.__pendingFcmToken) {
      console.log('Processing pending FCM token from Native Bridge');
      window.receiveFcmToken(window.__pendingFcmToken);
      delete window.__pendingFcmToken;
    }

    // 3. Foreground Message Listener (Web Environment)
    const unsubscribe = onMessageListener((payload: any) => {
      console.log('Foreground message received:', payload);
      if (payload.notification) {
        setPushNotification({
          title: payload.notification.title,
          body: payload.notification.body,
          link: payload.data?.click_action || payload.data?.link,
          logNo: payload.data?.logNo
        });
      }
    });

    // 4. 로그인 보강 로직: userId가 생길 때 펜딩 토큰 재확인
    const checkTimer = setInterval(() => {
      const currentUserId = localStorage.getItem('userId');
      const pending = (window as any).__pendingSaveToken;
      if (currentUserId && pending) {
        console.log('Detected userId after login, processing pending token...');
        saveTokenToServer(pending.token, pending.deviceType);
        delete (window as any).__pendingSaveToken;
      }
    }, 2000); // 2초마다 체크

    return () => {
      if (unsubscribe) {
        if (typeof unsubscribe === 'function') unsubscribe();
      }
      clearInterval(checkTimer);
      delete window.receiveFcmToken;
      delete (window as any).receiveNativeMessage;
    };
  }, []);

  return (
    <>
      <BrowserRouter>
        <PageTracker />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/find-id" element={<FindIdPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />

          {/* Main Layout Routes */}
          <Route path="/main" element={<MainLayout />}>
            <Route index element={<HomePage />} /> {/* Default to Home */}
            <Route path="home" element={<HomePage />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin/banners" element={<AdminBannerPage />} />
            <Route path="admin/clans" element={<AdminClanApprovalPage />} />
            <Route path="admin/qa" element={<AdminQaPage />} />
            <Route path="admin/users" element={<AdminUserManagement />} />
            <Route path="admin/notices" element={<AdminNoticeManagement />} />
            <Route path="admin/report-block" element={<AdminReportBlockPage />} />
            <Route path="admin/jams" element={<AdminJamManagement />} />
            <Route path="profile/scraps" element={<MyScrapList />} />
            <Route path="profile/posts" element={<MyPostList />} />
            <Route path="profile/post/create" element={<SnsPostCreate />} />
            <Route path="profile/shorts/create" element={<SnsShortsCreate />} />
            <Route path="customer-center" element={<CustomerCenterPage />} />
            <Route path="freejam" element={<FreeJam />} />
            <Route path="explore" element={<SnsExplore />} />
            <Route path="board" element={<Board />} />
            <Route path="clan" element={<Clan />} />
            <Route path="clan/create" element={<ClanCreatePage />} />
            <Route path="clan/my" element={<MyClan />} />
            <Route path="clan/detail/:id" element={<ClanDetail />} />
            <Route path="clan/members/:clanId" element={<ClanMemberStatus />} />
            <Route path="clan/intro/:id" element={<ClanIntro />} />
            <Route path="clan/notice/:clanId" element={<ClanNoticeList />} />
            <Route path="clan/gathering/management/:clanId" element={<GatheringManagement />} />
            <Route path="clan/gathering/match-results/:gatherNo" element={<GatheringMatchResult />} />
            <Route path="chat/list" element={<ChatList />} />
            <Route path="chat/room/:roomNo" element={<ChatRoom />} />
            <Route path="jam/chat/:roomNo" element={<JamChatRoom />} />
            <Route path="chat/private/:roomNo" element={<PrivateChatRoom />} />
            <Route path="chat/group/:roomNo" element={<GroupChatRoom />} />
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
            <Route path="jam/room/:jamId" element={<ClanJamDetail />} />
            <Route path="jam/my" element={<MyJamList />} />
            <Route path="clan/jam/:clanId/create" element={<ClanJamCreate />} />
            <Route path="clan/board/:clanId/:boardTypeNo" element={<ClanBoardPostList />} />
            <Route path="clan/board/:clanId/:boardTypeNo/create" element={<ClanBoardPostCreate />} />
            <Route path="clan/board/:clanId/:boardTypeNo/post/:boardNo" element={<ClanBoardPostDetail />} />
            <Route path="vote/status/:voteId" element={<VoteStatus />} />
            <Route path="vote/list/:roomNo" element={<VoteList />} />
            <Route path="vote/:voteId" element={<VoteDetail />} />
            <Route path="jam/vote/status/:voteId" element={<JamVoteStatus />} />
            <Route path="jam/vote/list/:roomNo" element={<JamVoteList />} />
            <Route path="jam/vote/:voteId" element={<JamVoteDetail />} />
            <Route path="jam/vote/status/:voteId" element={<JamVoteStatus />} />
            <Route path="jam/vote/list/:roomNo" element={<JamVoteList />} />
            <Route path="jam/vote/:voteId" element={<JamVoteDetail />} />
            <Route path="membersador" element={<Membersador />} />

            <Route path="board/list/:boardTypeFg" element={<BoardList />} />
            <Route path="board/write/:boardTypeFg" element={<BoardWrite />} />
            <Route path="board/detail/:boardNo" element={<BoardDetail />} />
            <Route path="jam/schedule/:jamId" element={<JamScheduleCapture />} />
          </Route>

          {/* Full Screen Feeds (Outside MainLayout to hide Header/Footer) */}
          <Route path="/main/profile/shorts/feed/:userId" element={<SnsShortsFeed />} />
          <Route path="/main/profile/post/feed/:userId" element={<SnsPostFeed />} />
          <Route path="/main/profile/feed/:userId" element={<SnsUnifiedFeed />} />
        </Routes>
      </BrowserRouter>

      {/* Push Notification Toast */}
      {pushNotification && (
        <PushToast
          title={pushNotification.title}
          body={pushNotification.body}
          link={pushNotification.link}
          logNo={pushNotification.logNo}
          onClose={() => setPushNotification(null)}
        />
      )}
    </>
  );
}

export default App;
