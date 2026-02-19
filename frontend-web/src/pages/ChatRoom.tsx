import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaPaperPlane, FaPlus, FaTimes, FaPaperclip, FaInbox, FaDollarSign, FaFileAlt } from 'react-icons/fa';
import VoteCreationModal from '../components/VoteCreationModal';
import CommonModal from '../components/common/CommonModal';

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
    voteNo?: number;
}

const ChatRoom: React.FC = () => {
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
    const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [currentRoomName, setCurrentRoomName] = useState("Chat Room");
    const [currentRoomType, setCurrentRoomType] = useState("");
    const [currentRoomProfile, setCurrentRoomProfile] = useState<string | undefined>(undefined);

    useEffect(() => {
        const roomInfo = location.state as { roomNm: string; roomType: string; attachFilePath?: string } | undefined;
        if (roomInfo) {
            if (roomInfo.roomType === 'BAND') {
                navigate(`/main/jam/chat/${roomNo}`, { state: roomInfo, replace: true });
                return;
            }
            setCurrentRoomName(roomInfo.roomNm);
            setCurrentRoomType(roomInfo.roomType);
            setCurrentRoomProfile(roomInfo.attachFilePath);
        } else if (roomNo) {
            fetch(`/api/chat/${roomNo}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("Failed to fetch room info");
                })
                .then(data => {
                    if (data.roomType === 'BAND') {
                        navigate(`/main/jam/chat/${roomNo}`, { state: data, replace: true });
                        return;
                    }
                    setCurrentRoomName(data.roomNm);
                    setCurrentRoomType(data.roomType);
                    setCurrentRoomProfile(data.attachFilePath);
                })
                .catch(err => {
                    console.error("Failed to fetch room info:", err);
                    setCurrentRoomName("Unknown Room");
                });
        }
    }, [location.state, roomNo, navigate]);

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
    };

    const fetchMessages = useCallback(async (lastMsgNo?: number) => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const url = lastMsgNo
                ? `/api/chat/${roomNo}/messages?userId=${userId}&lastMsgNo=${lastMsgNo}&roomType=${currentRoomType || 'CLAN'}`
                : `/api/chat/${roomNo}/messages?userId=${userId}&roomType=${currentRoomType || 'CLAN'}`;

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
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
                }
            } else {
                console.error("Failed to fetch messages");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, [roomNo]);

    useEffect(() => {
        setMessages([]);
        setLoading(true);
        setHasMore(true);
        fetchMessages();
    }, [fetchMessages]);

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

        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        try {
            const uploadRes = await fetch('/api/chat/upload', { method: 'POST', body: formData });
            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                const isImage = file.type.startsWith('image/');

                const msgRes = await fetch('/api/chat/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cnNo: Number(roomNo),
                        sndUserId: userId,
                        msg: isImage ? '사진을 보냈습니다.' : '파일을 보냈습니다.',
                        msgTypeCd: isImage ? 'IMAGE' : 'FILE',
                        attachNo: uploadData.attachNo,
                        roomType: currentRoomType || 'CLAN'
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
        if (!inputText.trim()) return;

        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const res = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cnNo: Number(roomNo),
                    sndUserId: userId,
                    msg: inputText,
                    msgTypeCd: 'TEXT',
                    parentMsgNo: replyTo?.cnMsgNo,
                    roomType: currentRoomType || 'CLAN'
                })
            });

            if (res.ok) {
                const newMessage = await res.json();
                const processedMessage = { ...newMessage, isMyMessage: true };
                setMessages(prev => [...prev, processedMessage]);
                setInputText("");
                setReplyTo(null);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // User requested Enter to create a new line, not send.
    };

    return (
        <div className="fixed top-[50px] bottom-[60px] left-0 right-0 z-40 flex flex-col bg-[#f2f4f5] font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex-none flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-3 text-[#003C48]">
                        <FaChevronLeft size={22} />
                    </button>
                    <div className={`w-8 h-8 rounded-full overflow-hidden mr-2 border border-gray-200 flex items-center justify-center flex-shrink-0 ${!currentRoomProfile ? (currentRoomType === 'CLAN' ? 'bg-black' : 'bg-indigo-500') : 'bg-gray-100'}`}>
                        {currentRoomProfile ? (
                            <img src={currentRoomProfile} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-xs">{currentRoomName.substring(0, 1)}</span>
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-[#003C48]">{currentRoomName}</h1>
                </div>
                {/* Vote Button - Only for CLAN chat */}
                {currentRoomType === 'CLAN' && (
                    <button
                        onClick={() => navigate(`/main/vote/list/${roomNo}`)}
                        className="bg-[#00BDF8] text-white px-3 py-1 rounded-full text-sm font-bold shadow-md"
                    >
                        투표하기
                    </button>
                )}
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
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold">
                                                        {msg.userNickNm ? msg.userNickNm.substring(0, 1) : '?'}
                                                    </div>
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
                                            className={`px-4 py-2 text-sm leading-relaxed shadow-sm break-words relative cursor-pointer ${msg.isMyMessage
                                                ? 'bg-[#00BDF8] text-white rounded-[20px] rounded-tr-none border-0 shadow-md'
                                                : 'bg-white text-[#003C48] rounded-[20px] rounded-tl-none border border-gray-100 shadow-sm'
                                                }`}
                                        >
                                            {msg.parentMsgNo && (
                                                <div className={`mb-1.5 px-2 py-1 rounded border-l-2 text-xs opacity-90 ${msg.isMyMessage ? 'border-white/50 bg-white/10' : 'border-gray-300 bg-gray-50'}`}>
                                                    <div className="font-bold mb-0.5 opacity-80">{msg.parentMsgUserNickNm || '알 수 없음'}</div>
                                                    <div className="truncate text-[10px] opacity-70">{msg.parentMsgContent || '메시지가 삭제되었습니다.'}</div>
                                                </div>
                                            )}
                                            {msg.msgTypeCd === 'IMAGE' && msg.attachFilePath ? (
                                                <div className="mt-1">
                                                    <img src={msg.attachFilePath} alt="Attached" className="max-w-full rounded-lg cursor-pointer max-h-[200px]" onClick={(e) => { e.stopPropagation(); window.open(msg.attachFilePath, '_blank'); }} />
                                                </div>
                                            ) : msg.msgTypeCd === 'FILE' && msg.attachFilePath ? (
                                                <div className="flex items-center gap-2 mt-1 bg-gray-100 p-2 rounded-lg">
                                                    <div className="bg-white p-2 rounded-full text-indigo-500"><FaFileAlt /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs truncate font-bold text-gray-700">{msg.attachFileName || "첨부파일"}</div>
                                                        <a href={msg.attachFilePath} download target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] text-blue-500 hover:underline">다운로드</a>
                                                    </div>
                                                </div>
                                            ) : msg.msgTypeCd === 'VOTE' ? (
                                                <div className="min-w-[200px]">
                                                    <div className={`font-bold mb-2 text-lg border-b pb-1 ${msg.isMyMessage ? 'border-white/20' : 'border-gray-200'}`}>투표</div>
                                                    <div className={`mb-3 font-medium text-sm text-center py-2 rounded ${msg.isMyMessage ? 'bg-white/10' : 'bg-gray-100'}`}>{msg.msg.replace('투표가 생성되었습니다: ', '')}</div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const voteId = msg.voteNo || msg.attachNo || 0;
                                                            navigate(`/main/vote/${voteId}`);
                                                        }}
                                                        className={`w-full py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2
                                                            ${msg.isMyMessage
                                                                ? 'bg-white text-[#00BDF8] hover:bg-gray-50'
                                                                : 'bg-[#00BDF8] text-white hover:bg-[#009bc9]'
                                                            }`}
                                                    >
                                                        <FaInbox /> 투표하기
                                                    </button>
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

            {replyTo && (
                <div className="absolute bottom-[60px] left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex justify-between items-center z-30 shadow-sm animate-slide-up">
                    <div className="text-sm text-gray-600 truncate mr-4">
                        <span className="font-bold text-[#00BDF8] mr-1">@{replyTo.userNickNm}</span>
                        에게 답장: <span className="text-gray-400">{replyTo.msg}</span>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={16} /></button>
                </div>
            )}

            {isMenuOpen && (
                <div className="absolute bottom-[70px] left-4 bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 py-3 z-50 animate-fade-in flex flex-col min-w-[140px]">
                    <button onClick={handleFileSelect} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 text-[#003C48] text-sm font-medium transition-colors text-left">
                        <FaPaperclip className="text-lg text-[#003C48]" /> <span>파일 업로드</span>
                    </button>
                    {/* Vote Create Button - Only for CLAN chat */}
                    {currentRoomType === 'CLAN' && (
                        <button onClick={() => { setIsMenuOpen(false); setIsVoteModalOpen(true); }} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 text-[#003C48] text-sm font-medium transition-colors text-left">
                            <FaInbox className="text-lg text-[#003C48]" /> <span>투표 올리기</span>
                        </button>
                    )}
                    <button className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 text-[#003C48] text-sm font-medium transition-colors text-left">
                        <FaDollarSign className="text-lg text-[#003C48]" /> <span>정산하기</span>
                    </button>
                </div>
            )}

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <form onSubmit={handleSendMessage} className="absolute bottom-0 left-0 right-0 bg-white px-4 py-3 border-t border-gray-200 flex items-end gap-3 z-40">
                <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} className={`text-gray-400 hover:text-gray-600 mb-2 transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`}>
                    <FaPlus size={24} />
                </button>
                <div className="flex-1 bg-gray-100 rounded-[20px] px-4 py-2 flex items-center min-h-[40px]">
                    <textarea ref={textareaRef} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="메세지 입력" className="bg-transparent w-full focus:outline-none text-sm placeholder-gray-400 resize-none overflow-hidden" rows={1} style={{ minHeight: '24px', maxHeight: '100px' }} />
                </div>
                <button type="submit" className="text-[#003C48] mb-2"><FaPaperPlane size={20} /></button>
            </form>

            <CommonModal isOpen={isAlertOpen} type="alert" message={alertMessage} onConfirm={() => setIsAlertOpen(false)} />

            {isVoteModalOpen && (
                <VoteCreationModal
                    onClose={() => setIsVoteModalOpen(false)}
                    onSubmit={async (voteData) => {
                        const userId = localStorage.getItem('userId');
                        if (!userId) return;
                        try {
                            const res = await fetch('/api/vote/create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...voteData, roomId: roomNo, userId: userId })
                            });
                            if (res.ok) {
                                setIsVoteModalOpen(false);
                                fetchMessages();
                            } else {
                                showAlert("투표 생성에 실패했습니다.");
                            }
                        } catch (error) {
                            console.error(error);
                            showAlert("오류가 발생했습니다.");
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ChatRoom;
