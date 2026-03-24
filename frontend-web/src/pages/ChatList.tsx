import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaSearch, FaUserPlus } from 'react-icons/fa';
import DefaultProfile from '../components/common/DefaultProfile';
import ProfileEditModal from '../components/profile/ProfileEditModal';

interface ChatRoom {
    roomNo: number;
    roomNm: string;
    newMsg: string;
    newMsgReadCnt: number;
    roomType: 'GROUP' | 'CLAN' | 'BAND';
    attachFilePath?: string | null;
    logoText?: string;
    logoColor?: string;
}



const ChatList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'chat' | 'friend' | 'group_chat'>('chat');

    useEffect(() => {
        const state = location.state as { tab: 'chat' | 'friend' } | undefined;
        if (state?.tab) {
            setActiveTab(state.tab);
        }
    }, [location.state]);
    const [chatList, setChatList] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [eligibleMembers, setEligibleMembers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
    const [groupSearchText, setGroupSearchText] = useState('');
    const [groupRoomNm, setGroupRoomNm] = useState('');
    const [myProfileUrl, setMyProfileUrl] = useState<string | undefined>(undefined);

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const [newFriends, setNewFriends] = useState<any[]>([]);

    interface Friend {
        userId: string;
        userNm: string;
        userNickNm: string;
        profileUrl?: string;
        unreadCount?: number;
    }
    const [friends, setFriends] = useState<Friend[]>([]);



    useEffect(() => {
        const fetchChatList = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.error("User ID not found");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/chat/list?userId=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetched Chat List:", data);
                    setChatList(data);
                } else {
                    console.error("Failed to fetch chat list");
                }
            } catch (error) {
                console.error("Error fetching chat list:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchFriendList = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            try {
                // Fetch New Friends (Requests)
                const newRes = await fetch(`/api/friends/new?userId=${userId}`);
                if (newRes.ok) {
                    const newData = await newRes.json();
                    setNewFriends(newData);
                }

                // Fetch Friends (Accepted)
                const listRes = await fetch(`/api/friends/list?userId=${userId}`);
                if (listRes.ok) {
                    const listData = await listRes.json();
                    setFriends(listData);
                }
            } catch (error) {
                console.error("Error fetching friend list:", error);
            }
        };

        const fetchEligibleMembers = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) return;
            try {
                const res = await fetch(`/api/group-chat/members?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setEligibleMembers(data);
                }
            } catch (error) {
                console.error("Error fetching eligible members", error);
            }
        };

        const fetchMyProfile = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) return;
            try {
                const res = await fetch(`/api/user/profile/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.profileImageUrl) {
                        setMyProfileUrl(data.profileImageUrl);
                    }
                }
            } catch (error) {
                console.error("Error fetching my profile", error);
            }
        };

        if (activeTab === 'chat') {
            fetchChatList();
            fetchFriendList(); // Fetch friends for Personal Chat section
            fetchMyProfile();
        } else if (activeTab === 'friend') {
            fetchFriendList();
            setLoading(false);
        } else if (activeTab === 'group_chat') {
            fetchEligibleMembers();
            setLoading(false);
        }
    }, [activeTab]);

    const handleAccept = async (friendUserId: string) => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const response = await fetch('/api/friends/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, friendUserId }),
            });

            if (response.ok) {
                // Refresh lists
                const newRes = await fetch(`/api/friends/new?userId=${userId}`);
                if (newRes.ok) setNewFriends(await newRes.json());

                const listRes = await fetch(`/api/friends/list?userId=${userId}`);
                if (listRes.ok) setFriends(await listRes.json());
            } else {
                alert("친구 수락에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error accepting friend:", error);
            alert("오류가 발생했습니다.");
        }
    };

    const handleReject = async (friendUserId: string) => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const response = await fetch('/api/friends/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, friendUserId }),
            });

            if (response.ok) {
                // Refresh list only (request removed)
                const newRes = await fetch(`/api/friends/new?userId=${userId}`);
                if (newRes.ok) setNewFriends(await newRes.json());
            } else {
                alert("친구 거절에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error rejecting friend:", error);
            alert("오류가 발생했습니다.");
        }
    };

    const handleFriendClick = async (friendUserId: string, friendNickname: string, friendProfileUrl?: string) => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const res = await fetch(`/api/chat/private/room-id?userId=${userId}&friendUserId=${friendUserId}`);
            if (res.ok) {
                const roomId = await res.json();
                navigate(`/main/chat/private/${roomId}`, { state: { friendNickname, friendProfileUrl } });
            } else {
                console.error("Failed to get chat room ID");
                alert("채팅방 정보를 불러오지 못했습니다.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("오류가 발생했습니다.");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-130.5px)] bg-white font-['Pretendard'] overflow-hidden" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header Tabs */}
            <div className="flex border-b border-gray-200 relative">
                <button onClick={() => navigate(-1)} className="absolute left-4 top-4 text-[#003C48] z-10">
                    <FaChevronLeft size={22} />
                </button>
                <div className="flex w-full justify-center">
                    <button
                        className={`px-6 py-4 text-base font-bold text-center relative ${activeTab === 'chat' ? 'text-[#003C48]' : 'text-gray-400'}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        채팅
                        {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003C48]"></div>}
                    </button>
                    <button
                        className={`px-6 py-4 text-base font-bold text-center relative ${activeTab === 'group_chat' ? 'text-[#003C48]' : 'text-gray-400'}`}
                        onClick={() => {
                            setActiveTab('group_chat');
                            setSelectedMembers([]);
                            setGroupRoomNm('');
                            setGroupSearchText('');
                        }}
                    >
                        그룹채팅
                        {activeTab === 'group_chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003C48]"></div>}
                    </button>
                    <button
                        className={`px-6 py-4 text-base font-bold text-center relative ${activeTab === 'friend' ? 'text-[#003C48]' : 'text-gray-400'}`}
                        onClick={() => setActiveTab('friend')}
                    >
                        친구
                        {newFriends.length > 0 && (
                            <span className="absolute top-3 right-4 bg-[#00BDF8] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {newFriends.length}
                            </span>
                        )}
                        {activeTab === 'friend' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003C48]"></div>}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-hidden">
                {activeTab === 'chat' && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                        {/* Group Chat Section - Both CLAN and BAND */}
                        <section>
                            <h2 className="body-section-title mb-3">단체 채팅</h2>
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="text-center text-gray-400 py-4">로딩 중...</div>
                                ) : chatList.length > 0 ? (
                                    chatList.map((chat) => (
                                        <div
                                            key={`${chat.roomType}-${chat.roomNo}`}
                                            onClick={() => {
                                                if (chat.roomType === 'BAND') {
                                                    navigate(`/main/jam/chat/${chat.roomNo}`, { state: { roomNm: chat.roomNm, roomType: chat.roomType, attachFilePath: chat.attachFilePath } });
                                                } else if (chat.roomType === 'GROUP') {
                                                    navigate(`/main/chat/group/${chat.roomNo}`, { state: { roomNm: chat.roomNm, roomType: chat.roomType } });
                                                } else {
                                                    navigate(`/main/chat/room/${chat.roomNo}`, { state: { roomNm: chat.roomNm, roomType: chat.roomType, attachFilePath: chat.attachFilePath } });
                                                }
                                            }}
                                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <div 
                                                className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 mr-4 bg-gray-100 hover:scale-105 transition-transform"
                                                onClick={(e) => {
                                                    if (chat.roomType === 'GROUP') {
                                                        e.stopPropagation();
                                                        const userId = localStorage.getItem('userId');
                                                        if (userId) {
                                                            setSelectedUserId(userId);
                                                            setIsProfileModalOpen(true);
                                                        }
                                                    }
                                                }}
                                            >
                                                {chat.roomType === 'GROUP' ? (
                                                    myProfileUrl ? (
                                                        <img src={myProfileUrl} alt="My Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src="/images/default_profile.png" alt="Default Profile" className="w-full h-full object-cover opacity-60" />
                                                    )
                                                ) : chat.attachFilePath ? (
                                                    <img
                                                        src={chat.attachFilePath}
                                                        alt={chat.roomNm}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            const fallback = e.currentTarget.parentElement?.querySelector('.unlinked-fallback');
                                                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                                        }}
                                                    />
                                                ) : (
                                                    <DefaultProfile type={chat.roomType === 'CLAN' ? 'clan' : 'jam'} iconSize={16} />
                                                )}
                                                {chat.attachFilePath && (
                                                    <div className="unlinked-fallback w-full h-full" style={{ display: 'none' }}>
                                                        <DefaultProfile type={chat.roomType === 'CLAN' ? 'clan' : 'jam'} iconSize={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5 min-w-0">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-gray-100 text-gray-500">
                                                        {chat.roomType === 'GROUP' ? '그룹' : chat.roomType === 'CLAN' ? '클랜' : '합주'}
                                                    </span>
                                                    <h3 className="body-board-post-title !m-0 leading-tight truncate min-w-0">{chat.roomNm}</h3>
                                                </div>
                                                <p className="text-xs truncate text-gray-400">
                                                    {chat.newMsg || "대화 내용이 없습니다."}
                                                </p>
                                            </div>
                                            {chat.newMsgReadCnt > 0 && (
                                                <div className="ml-2 bg-[#00BDF8] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                                    {chat.newMsgReadCnt}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 py-4">참여 중인 채팅방이 없습니다.</div>
                                )}
                            </div>
                        </section>

                        {/* Personal Chat Section - Placeholder for now as query was only for Group */}
                        <section>
                            <h2 className="body-section-title mb-3">개인 채팅</h2>
                            <div className="space-y-3">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {friends.length > 0 ? (
                                        friends.map((friend, index) => (
                                            <div key={friend.userId} onClick={() => handleFriendClick(friend.userId, friend.userNickNm, friend.profileUrl)} className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${index !== friends.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                                <div
                                                    className="w-10 h-10 rounded-full border border-[#003C48] overflow-hidden flex items-center justify-center text-[#003C48] mr-3 bg-white hover:scale-105 transition-transform"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedUserId(friend.userId);
                                                        setIsProfileModalOpen(true);
                                                    }}
                                                >
                                                    {friend.profileUrl ? (
                                                        <img src={friend.profileUrl} alt={friend.userNickNm} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    )}
                                                </div>
                                                <span className="text-[#003C48] font-bold text-sm">{friend.userNickNm}</span>
                                                {(friend.unreadCount || 0) > 0 && (
                                                    <div className="ml-auto bg-[#00BDF8] text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                                        {friend.unreadCount! > 99 ? '99+' : friend.unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-400 py-4 text-sm">참여 가능한 개인 채팅이 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'friend' && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                        {/* Search Bar */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00BDF8]" />
                                <input
                                    type="text"
                                    placeholder="친구 검색"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#00BDF8] focus:outline-none focus:ring-1 focus:ring-[#00BDF8] text-sm"
                                />
                            </div>
                            <button
                                onClick={() => navigate('/main/chat/friend/add')}
                                className="w-10 h-10 rounded-full border border-[#00BDF8] flex items-center justify-center text-[#00BDF8]"
                            >
                                <FaUserPlus size={18} />
                            </button>
                        </div>

                        {/* New Friends */}
                        <section>
                            <h2 className="text-gray-500 text-sm font-medium mb-2">새로운 친구</h2>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-2">
                                {newFriends.length > 0 ? (
                                    newFriends.map((friend) => (
                                        <div key={friend.userId} className="flex items-center justify-between p-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full border border-[#003C48] overflow-hidden flex items-center justify-center text-[#003C48] bg-white">
                                                    {friend.profileUrl ? (
                                                        <img src={friend.profileUrl} alt={friend.userNickNm} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    )}
                                                </div>
                                                <span className="text-[#003C48] font-bold text-sm">{friend.userNickNm}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReject(friend.userId)}
                                                    className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full font-medium"
                                                >
                                                    거절
                                                </button>
                                                <button
                                                    onClick={() => handleAccept(friend.userId)}
                                                    className="bg-[#00BDF8] text-white text-xs px-3 py-1.5 rounded-full font-medium"
                                                >
                                                    수락
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 py-4 text-sm">새로운 친구 요청이 없습니다.</div>
                                )}
                            </div>
                        </section>

                        {/* Friend List */}
                        <section className="relative">
                            <h2 className="text-gray-500 text-sm font-medium mb-2">친구 목록</h2>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {friends.filter(f => (f.userNickNm || '').toLowerCase().includes(searchText.toLowerCase())).length > 0 ? (
                                    friends
                                        .filter(f => (f.userNickNm || '').toLowerCase().includes(searchText.toLowerCase()))
                                        .map((friend, index, arr) => (
                                        <div key={friend.userId} onClick={() => handleFriendClick(friend.userId, friend.userNickNm, friend.profileUrl)} className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${index !== arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                            <div
                                                className="w-10 h-10 rounded-full border border-[#003C48] overflow-hidden flex items-center justify-center text-[#003C48] mr-3 bg-white hover:scale-105 transition-transform"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedUserId(friend.userId);
                                                    setIsProfileModalOpen(true);
                                                }}
                                            >
                                                {friend.profileUrl ? (
                                                    <img src={friend.profileUrl} alt={friend.userNickNm} className="w-full h-full object-cover" />
                                                ) : (
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                )}
                                            </div>
                                            <span className="text-[#003C48] font-bold text-sm">{friend.userNickNm}</span>
                                            {(friend.unreadCount || 0) > 0 && (
                                                <div className="ml-auto bg-[#00BDF8] text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                                    {friend.unreadCount! > 99 ? '99+' : friend.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 py-8 text-sm">등록된 친구가 없습니다.</div>
                                )}
                            </div>
                            {/* Alphabet Index (Visual Only) */}
                            <div className="absolute right-0 top-8 bottom-0 flex flex-col items-center justify-center text-[10px] text-gray-300 font-medium space-y-1 pr-1 select-none pointer-events-none">
                                <span>ㄱ</span>
                                <span>ㄴ</span>
                                <span>ㄷ</span>
                                <span>ㄹ</span>
                                <span>.</span>
                                <span>.</span>
                                <span>.</span>
                                <span>|</span>
                                <span>m</span>
                                <span>n</span>
                                <span>o</span>
                                <span>p</span>
                                <span>q</span>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'group_chat' && (
                    <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAFA]">
                        {/* 상단 1: 선택된 회원, 채팅방 이름, 생성 버튼 (고정) */}
                        <div className="bg-white border-b border-gray-200 p-4 shrink-0 shadow-sm z-10">
                            <h2 className="text-xs font-bold text-gray-500 mb-2">선택된 회원 ({selectedMembers.length})</h2>
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                                {selectedMembers.map(member => (
                                    <div key={member.userId} className="relative shrink-0 flex flex-col items-center w-12">
                                        <div 
                                            className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-50 mb-1 hover:scale-105 transition-transform cursor-pointer"
                                            onClick={() => {
                                                setSelectedUserId(member.userId);
                                                setIsProfileModalOpen(true);
                                            }}
                                        >
                                            {member.profileUrl ? (
                                                <img src={member.profileUrl} alt={member.userNickNm} className="w-full h-full object-cover" />
                                            ) : (
                                                <FaUserPlus className="text-gray-300" />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-600 truncate w-full text-center">{member.userNickNm}</span>
                                        <button
                                            onClick={() => setSelectedMembers(prev => prev.filter(m => m.userId !== member.userId))}
                                            className="absolute -top-1 right-0 w-4 h-4 bg-red-400 rounded-full flex items-center justify-center text-white shadow-sm"
                                        >
                                            <span className="text-[10px] font-bold leading-none -mt-0.5">×</span>
                                        </button>
                                    </div>
                                ))}
                                {selectedMembers.length === 0 && (
                                    <div className="text-[10px] text-gray-400 italic py-3 w-full text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        아래 목록에서 채팅하실 회원을 추가해주세요.
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    placeholder="그룹 채팅방 이름 입력 (필수)"
                                    value={groupRoomNm}
                                    onChange={(e) => setGroupRoomNm(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00BDF8] text-sm bg-gray-50 focus:bg-white transition-colors"
                                />

                                <button
                                    onClick={async () => {
                                        if (!groupRoomNm.trim()) return alert("그룹 채팅방 이름을 입력해주세요.");
                                        if (selectedMembers.length === 0) return alert("추가된 회원이 없습니다.");
                                        const userId = localStorage.getItem('userId');
                                        if (!userId) return;

                                        try {
                                            const res = await fetch(`/api/group-chat/room?userId=${userId}`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    roomNm: groupRoomNm,
                                                    userIds: selectedMembers.map(m => m.userId)
                                                })
                                            });
                                            if (res.ok) {
                                                // const roomNo = await res.json();
                                                setActiveTab('chat');
                                                setSelectedMembers([]);
                                                setGroupRoomNm('');
                                            } else {
                                                alert("채팅방 생성에 실패했습니다.");
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            alert("오류가 발생했습니다.");
                                        }
                                    }}
                                    className={`w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 shadow-sm ${groupRoomNm.trim() && selectedMembers.length > 0 ? 'bg-[#00BDF8] hover:bg-[#009bc9] hover:shadow-md active:scale-[0.98]' : 'bg-gray-300 cursor-not-allowed'}`}
                                    disabled={!groupRoomNm.trim() || selectedMembers.length === 0}
                                >
                                    그룹 채팅방 만들기
                                </button>
                            </div>
                        </div>

                        {/* 상단 2: 회원 선택 타이틀 및 검색바 (고정) */}
                        <div className="p-4 pb-2 bg-[#FAFAFA] shrink-0 z-10">
                            <h2 className="body-section-title mb-3">회원 선택</h2>
                            <div className="relative shrink-0">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00BDF8]" />
                                <input
                                    type="text"
                                    placeholder="친구, 클랜원, 합주원 검색"
                                    value={groupSearchText}
                                    onChange={(e) => setGroupSearchText(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#00BDF8] text-sm bg-white"
                                />
                            </div>
                        </div>

                        {/* 하단: 회원 리스트 (스크롤) */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="px-4 pb-24">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {eligibleMembers.filter(m => (m.userNickNm || '').toLowerCase().includes((groupSearchText || '').toLowerCase()) && !selectedMembers.find(s => s.userId === m.userId)).length > 0 ? (
                                        eligibleMembers
                                            .filter(m => (m.userNickNm || '').toLowerCase().includes((groupSearchText || '').toLowerCase()) && !selectedMembers.find(s => s.userId === m.userId))
                                            .map((member, index, arr) => (
                                                <div key={member.userId} className={`flex items-center justify-between p-3 ${index !== arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedUserId(member.userId);
                                                                setIsProfileModalOpen(true);
                                                            }}
                                                        >
                                                            {member.profileUrl ? (
                                                                <img src={member.profileUrl} alt={member.userNickNm} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <FaUserPlus className="text-gray-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[#003C48] font-bold text-sm">{member.userNickNm}</span>
                                                            <span className="text-[10px] text-gray-500">{member.memberType === 'FRIEND' ? '친구' : member.memberType === 'CLAN' ? '클랜원' : '합주원'}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedMembers(prev => [...prev, member])}
                                                        className="bg-[#00BDF8]/10 text-[#00BDF8] font-bold text-xs px-4 py-1.5 rounded-full hover:bg-[#00BDF8]/20 transition-colors"
                                                    >
                                                        추가
                                                    </button>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="p-10 text-center text-gray-400 text-sm flex flex-col items-center justify-center">
                                            <div className="mb-2">검색 결과가 없거나</div>
                                            <div>모든 회원을 선택하셨습니다.</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Profile Modal */}
            {selectedUserId && (
                <ProfileEditModal
                    isOpen={isProfileModalOpen}
                    onClose={() => {
                        setIsProfileModalOpen(false);
                        setSelectedUserId(null);
                    }}
                    userId={selectedUserId}
                    onProfileUpdate={() => {
                        // Refresh friend list if bio/nickname changed (though read-only for others)
                        // This will mostly be used if the user looks at their own profile in some context
                    }}
                    isReadOnly={selectedUserId !== localStorage.getItem('userId')}
                />
            )}
        </div>
    );
};

export default ChatList;
