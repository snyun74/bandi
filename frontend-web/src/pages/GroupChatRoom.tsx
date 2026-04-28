import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaPaperPlane, FaPlus, FaTimes, FaPaperclip, FaFileAlt } from 'react-icons/fa';
import DefaultProfile from '../components/common/DefaultProfile';
import SectionTitle from '../components/common/SectionTitle';
import CommonModal from '../components/common/CommonModal';
import { validateFileSize } from '../utils/fileUtils';

interface ChatMessage {
    cnMsgNo: number;
    cnNo: number;
    sndUserId: string;
    userNickNm: string;
    msg: string;
    msgTypeCd: string;
    sndDtime: string;
    userProfileUrl?: string;
    isMyMessage: boolean;
    myMessage?: boolean;
    unreadCount?: number;
    parentMsgNo?: number;
    parentMsgContent?: string;
    parentMsgUserNickNm?: string;
    attachNo?: number;
    attachFilePath?: string;
    attachFileName?: string;
}

const GroupChatRoom: React.FC = () => {
    const { roomNo } = useParams<{ roomNo: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingOld, setIsFetchingOld] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Modals
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Members Popup
    const [isMembersPopupOpen, setIsMembersPopupOpen] = useState(false);
    const [chatMembers, setChatMembers] = useState<any[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const latestMsgNoRef = useRef<number>(0);
    const isInitialLoadDone = useRef<boolean>(false);

    const [currentRoomName, setCurrentRoomName] = useState("그룹 채팅방");
    const [currentRoomProfile, setCurrentRoomProfile] = useState<string | undefined>(undefined);
    const [myProfileUrl, setMyProfileUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        const roomInfo = location.state as { roomNm: string; roomType: string; attachFilePath?: string } | undefined;
        if (roomInfo) {
            setCurrentRoomName(roomInfo.roomNm);
            setCurrentRoomProfile(roomInfo.attachFilePath);
        } else if (roomNo) {
            fetch(`/api/chat/${roomNo}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("Failed to fetch room info");
                })
                .then(data => {
                    setCurrentRoomName(data.roomNm);
                    setCurrentRoomProfile(data.attachFilePath);
                })
                .catch(err => {
                    console.error("Failed to fetch room info:", err);
                    setCurrentRoomName("알 수 없는 채팅방");
                });
        }

        // Fetch current user's profile for the header
        const userId = localStorage.getItem('userId');
        if (userId) {
            fetch(`/api/user/profile/${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.profileImageUrl) {
                        setMyProfileUrl(data.profileImageUrl);
                    }
                })
                .catch(err => console.error("Failed to fetch user profile:", err));
        }
    }, [location.state, roomNo]);

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
    };

    const fetchMessages = useCallback(async (lastMsgNo?: number) => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const url = lastMsgNo
                ? `/api/chat/${roomNo}/messages?userId=${userId}&lastMsgNo=${lastMsgNo}&roomType=GROUP`
                : `/api/chat/${roomNo}/messages?userId=${userId}&roomType=GROUP`;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.length < 30) setHasMore(false);

                const processedData = data.map((item: any) => ({
                    ...item,
                    isMyMessage: item.sndUserId === userId || (item.isMyMessage !== undefined ? item.isMyMessage : item.myMessage)
                }));

                const chronologized = processedData.reverse();

                if (lastMsgNo) {
                    setMessages(prev => [...chronologized, ...prev]);
                    setIsFetchingOld(false);
                } else {
                    setMessages(chronologized);
                    if (chronologized.length > 0) {
                        latestMsgNoRef.current = chronologized[chronologized.length - 1].cnMsgNo;
                    }
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
                }
            } else {
                console.error("Failed to fetch messages");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
            isInitialLoadDone.current = true;
        }
    }, [roomNo]);

    const fetchNewMessages = useCallback(async () => {
        const userId = localStorage.getItem('userId');
        if (!userId || !isInitialLoadDone.current) return;

        try {
            const url = `/api/chat/${roomNo}/messages?userId=${userId}&afterMsgNo=${latestMsgNoRef.current}&roomType=GROUP`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    const processedData = data.map((item: any) => ({
                        ...item,
                        isMyMessage: item.sndUserId === userId || item.isMyMessage
                    })).reverse();

                    setMessages(prev => {
                        const newOnly = processedData.filter(
                            newMsg => !prev.some(oldMsg => oldMsg.cnMsgNo === newMsg.cnMsgNo)
                        );
                        return [...prev, ...newOnly];
                    });
                    
                    if (processedData.length > 0) {
                        latestMsgNoRef.current = processedData[processedData.length - 1].cnMsgNo;
                        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, [roomNo]);

    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/group-chat/room/${roomNo}/members`);
            if (res.ok) {
                const data = await res.json();
                setChatMembers(data);
                setIsMembersPopupOpen(true);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
            showAlert("참여자를 불러오는데 실패했습니다.");
        }
    };

    const handleLeaveRoom = () => {
        setConfirmMessage("정말로 이 그룹 채팅방에서 나가시겠습니까?");
        setIsConfirmOpen(true);
    };

    const executeLeaveRoom = async () => {
        setIsConfirmOpen(false);
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const res = await fetch(`/api/group-chat/room/${roomNo}/leave?userId=${userId}`, {
                method: 'POST'
            });
            if (res.ok) {
                navigate('/main/chat/list');
            } else {
                showAlert("채팅방 나가기에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error leaving room:", error);
            showAlert("오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        setMessages([]);
        setLoading(true);
        setHasMore(true);
        latestMsgNoRef.current = 0;
        isInitialLoadDone.current = false;
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchNewMessages();
        }, 3000);
        return () => clearInterval(interval);
    }, [fetchNewMessages]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const userId = localStorage.getItem('userId');
            if (!userId || !isInitialLoadDone.current) return;
            try {
                const response = await fetch(`/api/chat/${roomNo}/messages?userId=${userId}&roomType=GROUP`);
                if (response.ok) {
                    const data = await response.json();
                    setMessages(prev => prev.map(msg => {
                        const updated = data.find((d: any) => d.cnMsgNo === msg.cnMsgNo);
                        return updated !== undefined ? { ...msg, unreadCount: updated.unreadCount } : msg;
                    }));
                }
            } catch { }
        }, 10000);
        return () => clearInterval(interval);
    }, [roomNo]);

    useEffect(() => {
        if (!isFetchingOld && messagesContainerRef.current && prevScrollHeightRef.current > 0) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
            prevScrollHeightRef.current = 0;
        }
    }, [messages, isFetchingOld]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    }, [inputText]);

    const handleScroll = () => {
        if (messagesContainerRef.current && messagesContainerRef.current.scrollTop < 50 && hasMore && !loading && !isFetchingOld && messages.length > 0) {
            setIsFetchingOld(true);
            prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
            fetchMessages(messages[0].cnMsgNo);
        }
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr || timeStr.length !== 14) return "";
        const hour = parseInt(timeStr.substring(8, 10));
        const minute = timeStr.substring(10, 12);
        return `${hour}:${minute}`;
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
        setIsMenuOpen(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파일 사이즈 체크
        const validation = validateFileSize(file);
        if (!validation.isValid) {
            showAlert(validation.message);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        try {
            const uploadRes = await fetch('/api/chat/upload', { method: 'POST', body: formData });
            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

                const msgRes = await fetch('/api/chat/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cnNo: Number(roomNo),
                        sndUserId: userId,
                        msg: isImage ? '사진을 보냈습니다.' : '파일을 보냈습니다.',
                        msgTypeCd: isImage ? 'IMAGE' : 'FILE',
                        attachNo: uploadData.attachNo,
                        roomType: 'GROUP'
                    })
                });

                if (msgRes.ok) {
                    const newMessage = await msgRes.json();
                    const processedMessage = {
                        ...newMessage,
                        isMyMessage: true,
                        attachFilePath: newMessage.attachFilePath || uploadData.filePath,
                        attachFileName: newMessage.attachFileName || uploadData.fileName
                    };
                    setMessages(prev => [...prev, processedMessage]);
                    latestMsgNoRef.current = newMessage.cnMsgNo;
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            } else {
                showAlert("파일 업로드에 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
            showAlert("오류가 발생했습니다.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = inputText.trim();
        if (!messageText || isSending) return;

        const userId = localStorage.getItem('userId');
        if (!userId) return;

        // 1. 임시 데이터 생성 (Optimistic UI)
        const tempId = -Date.now();
        const currentDateTime = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
        
        const tempMessage: ChatMessage = {
            cnMsgNo: tempId,
            cnNo: Number(roomNo),
            sndUserId: userId,
            userNickNm: '나', // 실제 전송 시의 유저명은 서버에서 받아오지만 일단 '나'로 표시
            msg: messageText,
            msgTypeCd: 'TEXT',
            sndDtime: currentDateTime,
            isMyMessage: true,
            unreadCount: 0,
            parentMsgNo: replyTo?.cnMsgNo,
            parentMsgContent: replyTo?.msg,
            parentMsgUserNickNm: replyTo?.userNickNm
        };

        // UI 즉시 업데이트
        setMessages(prev => [...prev, tempMessage]);
        setInputText("");
        setReplyTo(null);
        setIsSending(true);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        try {
            const res = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cnNo: Number(roomNo),
                    sndUserId: userId,
                    msg: messageText,
                    msgTypeCd: 'TEXT',
                    parentMsgNo: tempMessage.parentMsgNo,
                    roomType: 'GROUP'
                })
            });

            if (res.ok) {
                const newMessage = await res.json();
                const processedMessage = { ...newMessage, isMyMessage: true };
                
                // 2. 임시 메시지를 서버 결과로 교체
                setMessages(prev => prev.map(msg => msg.cnMsgNo === tempId ? processedMessage : msg));
                latestMsgNoRef.current = newMessage.cnMsgNo;
            } else {
                throw new Error("전송 실패");
            }
        } catch (error) {
            console.error(error);
            // 3. 실패 시 메시지 제거 및 알림
            setMessages(prev => prev.filter(msg => msg.cnMsgNo !== tempId));
            showAlert("메시지 전송에 실패했습니다.");
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // User requested Enter to create a new line, not send.
    };

    return (
        <div className="fixed top-[calc(var(--header-height)+var(--safe-top))] bottom-[calc(var(--nav-offset)+var(--safe-bottom))] left-0 right-0 z-40 flex flex-col bg-[#f2f4f5] font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex-none flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center flex-1 min-w-0">
                    <button onClick={() => navigate(-1)} className="mr-3 text-[#052c42]">
                        <FaChevronLeft size={22} />
                    </button>
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border border-gray-200 flex items-center justify-center flex-shrink-0 bg-gray-100">
                        {myProfileUrl ? (
                            <img src={myProfileUrl} alt="My Profile" className="w-full h-full object-cover" />
                        ) : (
                            <DefaultProfile type="user" iconSize={16} />
                        )}
                    </div>
                    <div className="flex-1 truncate cursor-pointer hover:opacity-80 transition-opacity" onClick={fetchMembers}>
                        <SectionTitle as="h1" className="!mt-0 !mb-0">{currentRoomName}</SectionTitle>
                    </div>
                </div>
            </div>

            {/* Message List */}
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 pb-[80px]">
                {isFetchingOld && <div className="text-center py-2 text-xs text-gray-400">불러오는 중...</div>}
                {loading && messages.length === 0 ? (
                    <div className="text-center mt-10 text-gray-400">로딩 중...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center mt-10 text-gray-400">대화 내용이 없습니다.</div>
                ) : (
                    messages.map((msg, index) => {
                        const showProfile = !msg.isMyMessage && (index === 0 || messages[index - 1].sndUserId !== msg.sndUserId);
                        return (
                            <div key={msg.cnMsgNo} className={`flex w-full ${msg.isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                {!msg.isMyMessage && (
                                    <div className="mr-2 flex-shrink-0 w-10 flex flex-col items-center">
                                        {showProfile ? (
                                            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                                                {msg.userProfileUrl ? (
                                                    <img src={msg.userProfileUrl} alt={msg.userNickNm} className="w-full h-full object-cover" />
                                                ) : (
                                                    <DefaultProfile type="user" iconSize={16} />
                                                )}
                                            </div>
                                        ) : <div className="w-10"></div>}
                                    </div>
                                )}
                                <div className={`max-w-[70%] flex flex-col ${msg.isMyMessage ? 'items-end' : 'items-start'}`}>
                                    {!msg.isMyMessage && showProfile && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.userNickNm}</span>}
                                    <div className="flex items-end gap-1">
                                        {msg.isMyMessage && (
                                            <div className="flex flex-col items-end min-w-[30px]">
                                                {(msg.unreadCount || 0) > 0 && <span className="text-[#00BDF8] text-[10px] font-bold mb-0.5">{msg.unreadCount}</span>}
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatTime(msg.sndDtime)}</span>
                                            </div>
                                        )}
                                        <div
                                            onClick={() => setReplyTo(msg)}
                                            className={`text-sm leading-relaxed shadow-sm break-words relative cursor-pointer ${msg.msgTypeCd === 'IMAGE' && msg.attachFilePath
                                                ? 'rounded-[12px] overflow-hidden p-0 shadow-md'
                                                : msg.isMyMessage
                                                    ? 'px-4 py-2 bg-[#00BDF8] text-white rounded-[20px] rounded-tr-none border-0 shadow-md'
                                                    : 'px-4 py-2 bg-white text-[#003C48] rounded-[20px] rounded-tl-none border border-gray-100 shadow-sm'
                                                }`}
                                        >
                                            {msg.parentMsgNo && (
                                                <div className={`mb-1.5 px-2 py-1 rounded border-l-2 text-xs opacity-90 ${msg.isMyMessage ? 'border-white/50 bg-white/10' : 'border-gray-300 bg-gray-50'}`}>
                                                    <div className="font-bold mb-0.5 opacity-80">{msg.parentMsgUserNickNm || '알 수 없음'}</div>
                                                    <div className="truncate text-[10px] opacity-70">{msg.parentMsgContent || '메시지가 삭제되었습니다.'}</div>
                                                </div>
                                            )}
                                            {msg.msgTypeCd === 'IMAGE' && msg.attachFilePath ? (
                                                <img src={msg.attachFilePath} alt="Attached" className="max-w-full max-h-[200px] block cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(msg.attachFilePath, '_blank'); }} />
                                            ) : msg.msgTypeCd === 'FILE' && msg.attachFilePath ? (
                                                <div className="flex items-center gap-2 mt-1 bg-gray-100 p-2 rounded-lg">
                                                    <div className="bg-white p-2 rounded-full text-indigo-500"><FaFileAlt /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs truncate font-bold text-gray-700">{msg.attachFileName || "첨부파일"}</div>
                                                        <a href={msg.attachFilePath} download target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] text-blue-500 hover:underline">다운로드</a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="whitespace-pre-wrap">{msg.msg}</div>
                                            )}
                                        </div>
                                        {!msg.isMyMessage && (
                                            <div className="flex flex-col items-start min-w-[30px]">
                                                {(msg.unreadCount || 0) > 0 && <span className="text-[#00BDF8] text-[10px] font-bold mb-0.5">{msg.unreadCount}</span>}
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatTime(msg.sndDtime)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {
                replyTo && (
                    <div className="absolute bottom-[calc(var(--nav-offset)+var(--safe-bottom))] left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex justify-between items-center z-30 shadow-sm animate-slide-up">
                        <div className="text-sm text-gray-600 truncate mr-4">
                            <span className="font-bold text-[#00BDF8] mr-1">@{replyTo.userNickNm}</span>
                            에게 답장: <span className="text-gray-400">{replyTo.msg}</span>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={16} /></button>
                    </div>
                )
            }

            {
                isMenuOpen && (
                    <div className="absolute bottom-[calc(var(--nav-offset)+10px+var(--safe-bottom))] left-4 bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 py-3 z-50 animate-fade-in flex flex-col min-w-[140px]">
                        <button onClick={handleFileSelect} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 text-[#003C48] text-sm font-medium transition-colors text-left">
                            <FaPaperclip className="text-lg text-[#003C48]" /> <span>파일 업로드</span>
                        </button>
                    </div>
                )
            }

            {
                isMembersPopupOpen && (
                    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" style={{ fontFamily: '"Pretendard", sans-serif', backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setIsMembersPopupOpen(false)}>
                        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <h3 className="text-[14px] font-bold text-gray-900">참여자 목록 ({chatMembers.length})</h3>
                                <button onClick={() => setIsMembersPopupOpen(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
                            </div>
                            <div className="overflow-y-auto p-2">
                                {chatMembers.map((member) => (
                                    <div key={member.userId} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                                {member.profileUrl ? (
                                                    <img src={member.profileUrl} alt={member.userNickNm} className="w-full h-full object-cover" />
                                                ) : (
                                                    <DefaultProfile type="user" iconSize={16} />
                                                )}
                                            </div>
                                            <span className="text-[#003C48] font-bold text-[14px]">{member.userNickNm} {member.userId === localStorage.getItem('userId') && <span className="text-[10px] text-gray-400 font-normal ml-1">(나)</span>}</span>
                                        </div>
                                        {member.userId === localStorage.getItem('userId') && (
                                            <button onClick={handleLeaveRoom} className="bg-red-50 text-red-500 hover:bg-red-100 text-xs px-3 py-1.5 rounded-full font-bold transition-colors shadow-sm">
                                                나가기
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <form onSubmit={handleSendMessage} className="absolute bottom-0 left-0 right-0 bg-white px-4 py-3 border-t border-gray-200 flex items-end gap-3 z-40">
                <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} className={`text-gray-400 hover:text-gray-600 mb-2 transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`}>
                    <FaPlus size={24} />
                </button>
                <div className="flex-1 bg-gray-100 rounded-[20px] px-4 py-2 flex items-center min-h-[40px]">
                    <textarea ref={textareaRef} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="메세지 입력" className="bg-transparent w-full focus:outline-none text-sm placeholder-gray-400 resize-none overflow-hidden" rows={1} style={{ minHeight: '24px', maxHeight: '100px' }} />
                </div>
                <button type="submit" disabled={isSending} className={`mb-2 transition-colors ${isSending ? 'text-gray-300' : 'text-[#003C48]'}`}>
                    <FaPaperPlane size={20} />
                </button>
            </form>

            <CommonModal isOpen={isAlertOpen} type="alert" message={alertMessage} onConfirm={() => setIsAlertOpen(false)} />
            <CommonModal isOpen={isConfirmOpen} type="confirm" message={confirmMessage} onConfirm={executeLeaveRoom} onCancel={() => setIsConfirmOpen(false)} />
        </div >
    );
};

export default GroupChatRoom;
