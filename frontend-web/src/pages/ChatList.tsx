import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaSearch, FaUserPlus } from 'react-icons/fa';

interface ChatRoom {
    roomNo: number;
    roomNm: string;
    newMsg: string;
    newMsgReadCnt: number;
    roomType: 'CLAN' | 'BAND';
    attachFilePath?: string | null;
    logoText?: string;
    logoColor?: string;
}



const ChatList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'chat' | 'friend'>('chat');

    useEffect(() => {
        const state = location.state as { tab: 'chat' | 'friend' } | undefined;
        if (state?.tab) {
            setActiveTab(state.tab);
        }
    }, [location.state]);
    const [chatList, setChatList] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

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

        if (activeTab === 'chat') {
            fetchChatList();
            fetchFriendList(); // Fetch friends for Personal Chat section
        } else {
            fetchFriendList();
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

    const handleFriendClick = async (friendUserId: string, friendName: string) => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const res = await fetch(`/api/chat/private/room-id?userId=${userId}&friendUserId=${friendUserId}`);
            if (res.ok) {
                const roomId = await res.json();
                navigate(`/main/chat/private/${roomId}`, { state: { friendName } });
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
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header Tabs */}
            <div className="flex border-b border-gray-200 relative">
                <button onClick={() => navigate(-1)} className="absolute left-4 top-4 text-[#003C48] z-10">
                    <FaChevronLeft size={22} />
                </button>
                <div className="flex w-full justify-center">
                    <button
                        className={`px-8 py-4 text-xl font-bold text-center relative ${activeTab === 'chat' ? 'text-[#003C48]' : 'text-gray-400'}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        채팅
                        {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003C48]"></div>}
                    </button>
                    <button
                        className={`px-8 py-4 text-xl font-bold text-center relative ${activeTab === 'friend' ? 'text-[#003C48]' : 'text-gray-400'}`}
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

            <div className="flex-1 overflow-y-auto bg-[#FAFAFA] pb-20">
                {activeTab === 'chat' && (
                    <div className="p-4 space-y-6">
                        {/* Group Chat Section - Both CLAN and BAND */}
                        <section>
                            <h2 className="text-[#003C48] text-lg font-bold mb-3">단체 채팅</h2>
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
                                                } else {
                                                    navigate(`/main/chat/room/${chat.roomNo}`, { state: { roomNm: chat.roomNm, roomType: chat.roomType, attachFilePath: chat.attachFilePath } });
                                                }
                                            }}
                                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 mr-4 ${!chat.attachFilePath ? (chat.roomType === 'CLAN' ? 'bg-black' : 'bg-indigo-500') : ''}`}>
                                                {chat.attachFilePath ? (
                                                    <img
                                                        src={chat.attachFilePath}
                                                        alt={chat.roomNm}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.parentElement!.classList.add(chat.roomType === 'CLAN' ? 'bg-black' : 'bg-indigo-500');
                                                            e.currentTarget.parentElement!.innerHTML = `<span class="text-white font-bold">${chat.roomNm ? chat.roomNm.substring(0, 1) : '?'}</span>`;
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-white font-bold">{chat.roomNm ? chat.roomNm.substring(0, 1) : '?'}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${chat.roomType === 'CLAN' ? 'bg-violet-100 text-violet-600' : 'bg-orange-100 text-orange-500'}`}>
                                                        {chat.roomType === 'CLAN' ? '🏰 클랜' : '🎸 합주'}
                                                    </span>
                                                    <h3 className="text-[#003C48] font-bold text-base leading-tight">{chat.roomNm}</h3>
                                                </div>
                                                <p className={`text-sm truncate ${chat.newMsgReadCnt > 0 ? 'text-gray-400' : 'text-gray-400'}`}>
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
                            <h2 className="text-[#003C48] text-lg font-bold mb-3">개인 채팅</h2>
                            <div className="space-y-3">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {friends.length > 0 ? (
                                        friends.map((friend, index) => (
                                            <div key={friend.userId} onClick={() => handleFriendClick(friend.userId, friend.userNm)} className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${index !== friends.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                                <div className="w-10 h-10 rounded-full border border-[#003C48] overflow-hidden flex items-center justify-center text-[#003C48] mr-3 bg-white">
                                                    {friend.profileUrl ? (
                                                        <img src={friend.profileUrl} alt={friend.userNm} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    )}
                                                </div>
                                                <span className="text-[#003C48] font-bold text-sm">{friend.userNm}</span>
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
                    <div className="p-4 space-y-6">
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
                                                        <img src={friend.profileUrl} alt={friend.userNm} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    )}
                                                </div>
                                                <span className="text-[#003C48] font-bold text-sm">{friend.userNm}</span>
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
                                {friends.length > 0 ? (
                                    friends.map((friend, index) => (
                                        <div key={friend.userId} onClick={() => handleFriendClick(friend.userId, friend.userNm)} className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${index !== friends.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                            <div className="w-10 h-10 rounded-full border border-[#003C48] overflow-hidden flex items-center justify-center text-[#003C48] mr-3 bg-white">
                                                {friend.profileUrl ? (
                                                    <img src={friend.profileUrl} alt={friend.userNm} className="w-full h-full object-cover" />
                                                ) : (
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                )}
                                            </div>
                                            <span className="text-[#003C48] font-bold text-sm">{friend.userNm}</span>
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
            </div>
        </div>
    );
};

export default ChatList;
