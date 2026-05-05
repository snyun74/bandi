import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaBookmark, FaPen, FaBars, FaTimes } from 'react-icons/fa';
import { BsPersonCircle, BsChatSquare, BsDoorOpen, BsThreeDotsVertical } from 'react-icons/bs';
import CommonModal from '../components/common/CommonModal';
import ProfileEditModal from '../components/profile/ProfileEditModal';

interface UserSkillDto {
    sessionTypeCd: string;
    sessionTypeNm: string;
    score: number;
}

interface UserProfileDto {
    userId: string;
    userNm: string;
    userNickNm: string;
    email: string;
    profileImageUrl: string | null;
    mannerScore?: number;
    moodMakerCount?: number;
    adminYn?: string;
    skills: UserSkillDto[];
}

const MyProfile: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfileDto | null>(null);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [isPublicTypeModalOpen, setIsPublicTypeModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'POST' | 'SHORTS', id: number | string } | null>(null);
    const [publicTypes, setPublicTypes] = useState<{ commDtlCd: string; commDtlNm: string }[]>([]);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchCommonCodes = async () => {
            try {
                const res = await fetch('/api/auth/common/codes/BD007');
                if (res.ok) {
                    const data = await res.json();
                    setPublicTypes(data.filter((pt: any) => pt.commDtlNm !== '친구'));
                }
            } catch (err) {
                console.error("공통코드 BD007 조회 실패", err);
            }
        };
        fetchCommonCodes();
    }, []);

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setIsAlertModalOpen(true);
    };

    // 목록 상태 관리
    const [combinedItems, setCombinedItems] = useState<any[]>([]);
    const [postsPage, setPostsPage] = useState(0);
    const [shortsPage, setShortsPage] = useState(0);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [hasMoreShorts, setHasMoreShorts] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: any) => {
        if (isLoading || observer.current) observer.current?.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                if (hasMorePosts || hasMoreShorts) {
                    if (hasMorePosts) setPostsPage(prev => prev + 1);
                    if (hasMoreShorts) setShortsPage(prev => prev + 1);
                }
            }
        }, { threshold: 0.1 });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMorePosts, hasMoreShorts]);

    const fetchAllData = async (pPage: number, sPage: number, isInitial: boolean = false) => {
        if (!userId || isLoading) return;
        setIsLoading(true);

        try {
            const [postsRes, shortsRes] = await Promise.all([
                hasMorePosts || isInitial ? fetch(`/api/sns/posts/user/${userId}?page=${pPage}&size=15`) : Promise.resolve(null),
                hasMoreShorts || isInitial ? fetch(`/api/sns/shorts/user/${userId}?page=${sPage}&size=15`) : Promise.resolve(null)
            ]);

            let newPosts: any[] = [];
            let newShorts: any[] = [];

            if (postsRes && postsRes.ok) {
                const data = await postsRes.json();
                newPosts = data.content.map((p: any) => ({ ...p, type: 'POST' }));
                setHasMorePosts(!data.last);
            }
            if (shortsRes && shortsRes.ok) {
                const data = await shortsRes.json();
                newShorts = data.content.map((s: any) => ({ ...s, type: 'SHORTS' }));
                setHasMoreShorts(!data.last);
            }

            const merged = [...(isInitial ? [] : combinedItems), ...newPosts, ...newShorts];
            // insDtime 역순 정렬 (YYYYMMDDHHMMSS)
            merged.sort((a, b) => (b.insDtime || '').localeCompare(a.insDtime || ''));

            setCombinedItems(merged);
        } catch (e) {
            console.error("데이터 조회 실패", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            setPostsPage(0);
            setShortsPage(0);
            setHasMorePosts(true);
            setHasMoreShorts(true);
            fetchAllData(0, 0, true);
        }
    }, [userId]);

    useEffect(() => {
        if (userId && (postsPage > 0 || shortsPage > 0)) {
            fetchAllData(postsPage, shortsPage);
        }
    }, [postsPage, shortsPage]);

    const fetchProfile = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`/api/user/profile/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogoutClick = () => {
        setIsMenuOpen(false);
        setIsLogoutModalOpen(true);
    };

    const handleLogoutConfirm = () => {
        localStorage.clear();
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    const handleDeleteClick = (e: React.MouseEvent, type: 'POST' | 'SHORTS', id: number | string) => {
        e.stopPropagation();
        setItemToDelete({ type, id });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete || !userId) return;

        try {
            const url = itemToDelete.type === 'POST' 
                ? `/api/sns/posts/${itemToDelete.id}?userId=${userId}`
                : `/api/sns/shorts/${itemToDelete.id}?userId=${userId}`;
            
            const response = await fetch(url, { method: 'DELETE' });
            
            if (response.ok) {
                setCombinedItems(prev => prev.filter(item => {
                    if (itemToDelete.type === 'POST') {
                        return !(item.type === 'POST' && item.postId === itemToDelete.id);
                    } else {
                        return !(item.type === 'SHORTS' && item.shortsNo === itemToDelete.id);
                    }
                }));
                showAlert("삭제되었습니다.");
            } else {
                showAlert("삭제에 실패했습니다.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            showAlert("오류가 발생했습니다.");
        } finally {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handlePublicTypeChange = async (typeCd: string) => {
        if (!itemToDelete || !userId) return;
        try {
            const url = itemToDelete.type === 'POST' 
                ? `/api/sns/posts/${itemToDelete.id}/public-type?userId=${userId}&publicTypeCd=${typeCd}`
                : `/api/sns/shorts/${itemToDelete.id}/public-type?userId=${userId}&publicTypeCd=${typeCd}`;
            
            const response = await fetch(url, { method: 'PATCH' });
            if (response.ok) {
                // 목록에서 해당 아이템의 publicTypeCd 업데이트
                setCombinedItems(prev => prev.map(item => {
                    if (item.type === itemToDelete.type && (item.postId === itemToDelete.id || item.shortsNo === itemToDelete.id)) {
                        return { ...item, publicTypeCd: typeCd };
                    }
                    return item;
                }));
                showAlert("공개 설정이 변경되었습니다.");
            } else {
                showAlert("공개 설정 변경에 실패했습니다.");
            }
        } catch (error) {
            console.error("Update public type error:", error);
            showAlert("오류가 발생했습니다.");
        } finally {
            setIsPublicTypeModalOpen(false);
            setItemToDelete(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-[100] border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <FaChevronLeft size={20} />
                    </button>
                    <h1 className="text-[14px] font-bold text-[#003C48]">프로필</h1>
                </div>
                <div className="flex items-center gap-2 relative">
                    {profile?.adminYn === 'Y' && (
                        <button
                            onClick={() => navigate('/main/admin')}
                            className="bg-[#003C48] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-[#002B36] transition-colors"
                        >
                            ADMIN
                        </button>
                    )}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaBars size={20} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                            <button
                                onClick={() => { setIsMenuOpen(false); showAlert("작업 진행중입니다."); }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <BsDoorOpen className="text-gray-400" size={16} />
                                <span>개인 연습실</span>
                            </button>
                            <button
                                onClick={() => { setIsMenuOpen(false); navigate('/main/customer-center'); }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <BsChatSquare className="text-gray-400" size={16} />
                                <span>고객센터</span>
                            </button>
                            <div className="mx-3 h-[1px] bg-gray-50"></div>
                            <button
                                onClick={() => { setIsMenuOpen(false); navigate('/main/profile/scraps'); }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <FaBookmark className="text-gray-400" />
                                <span>스크랩</span>
                            </button>
                            <button
                                onClick={() => { setIsMenuOpen(false); navigate('/main/profile/posts'); }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <FaPen className="text-gray-400" size={14} />
                                <span>내가 쓴 글</span>
                            </button>
                            <div className="mx-3 h-[1px] bg-gray-100"></div>
                            <button
                                onClick={handleLogoutClick}
                                className="w-full px-4 py-3 text-left text-sm text-[#FF6B6B] font-medium hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>로그아웃</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden bg-white">
                {/* Profile Info */}
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            onClick={() => setIsEditModalOpen(true)}
                            className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-200 transition-all active:scale-95 relative group"
                        >
                            {profile?.profileImageUrl ? (
                                <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <img src="/images/default_profile.png" alt="Default Profile" className="w-full h-full object-cover opacity-50" />
                            )}
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <FaPen className="text-white drop-shadow-md" size={14} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-end gap-1">
                                <h2 className="text-[#003C48] font-bold text-[14px] leading-tight">
                                    {profile?.userNickNm || profile?.userNm || '사용자'} 님
                                </h2>
                            </div>
                            <p className="text-gray-400 text-xs mt-1">{profile?.email || '이메일 없음'}</p>
                        </div>
                    </div>

                    {/* Compact Stats */}
                    <div className="flex flex-col gap-1 items-end bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100/50 shadow-sm">
                        <div className="flex items-center gap-2 justify-end w-full">
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">매너점수</span>
                            <span className="text-gray-500 font-bold text-xs min-w-[35px] text-right">{profile?.mannerScore !== undefined ? `${profile.mannerScore}점` : '0점'}</span>
                        </div>
                        <div className="w-full h-[1px] bg-gray-200/50 my-0.5"></div>
                        <div className="flex items-center gap-2 justify-end w-full">
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">분위기메이커</span>
                            <span className="text-gray-500 font-bold text-xs min-w-[35px] text-right">{profile?.moodMakerCount !== undefined ? `${profile.moodMakerCount}회` : '0회'}</span>
                        </div>
                    </div>
                </div>

                {/* Create Buttons (Split) */}
                <div className="px-4 py-3 bg-white flex-shrink-0 z-10 border-b border-gray-50 pb-4 flex gap-2">
                    <button
                        onClick={() => navigate('/main/profile/shorts/create')}
                        className="flex-1 bg-[#F8F9FA] text-[#003C48] font-bold py-2.5 rounded-xl text-[13px] border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        <span className="text-base">🎬</span>
                        <span>쇼츠 만들기</span>
                    </button>
                    <button
                        onClick={() => navigate('/main/profile/post/create')}
                        className="flex-1 bg-[#F8F9FA] text-[#003C48] font-bold py-2.5 rounded-xl text-[13px] border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        <span className="text-base">📸</span>
                        <span>게시물 만들기</span>
                    </button>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto px-0.5 py-0.5 pb-20 nice-scroll">
                    <div className="grid grid-cols-3 gap-1">
                        {combinedItems.map((item, index) => {
                            const isLast = index === combinedItems.length - 1;
                            const isShorts = item.type === 'SHORTS';
                            
                            return (
                                <div
                                    key={isShorts ? `shorts-${item.shortsNo}` : `post-${item.postId}`}
                                    ref={isLast ? lastElementRef : null}
                                    className="aspect-[4/5] bg-gray-50 rounded-md overflow-hidden relative group cursor-pointer"
                                    onClick={() => {
                                        navigate(`/main/profile/feed/${userId}`, { 
                                            state: { 
                                                initialShortsNo: isShorts ? item.shortsNo : undefined,
                                                initialPostId: !isShorts ? item.postId : undefined
                                            } 
                                        });
                                    }}
                                >
                                    {isShorts ? (
                                        <>
                                            {item.videoPath ? (
                                                <video 
                                                    src={`${item.videoPath}#t=0.1`} 
                                                    className="w-full h-full object-cover" 
                                                    muted 
                                                    playsInline 
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                                    <span className="text-[20px]">🎬</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {item.thumbnailPath ? (
                                                <img src={item.thumbnailPath} alt="post" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gray-100">
                                                    <span className="text-[10px] text-gray-500 line-clamp-3">{item.contentPreview}</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Action Menu Button (Glassmorphism Style) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setItemToDelete({ type: item.type as any, id: isShorts ? item.shortsNo : item.postId });
                                            setIsActionMenuOpen(true);
                                        }}
                                        className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center z-[30] bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md border border-white/20 shadow-sm active:scale-90 transition-all"
                                    >
                                        <BsThreeDotsVertical size={16} className="drop-shadow-sm" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <CommonModal
                isOpen={isDeleteModalOpen}
                type="confirm"
                variant="danger"
                message={itemToDelete?.type === 'SHORTS' ? "쇼츠를 삭제하시겠습니까?" : "게시물을 삭제하시겠습니까?"}
                onConfirm={handleDeleteConfirm}
                onCancel={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
            />

            {/* Instagram-style Action Menu (Bottom Sheet) */}
            {isActionMenuOpen && (
                <div className="fixed inset-0 z-[10000] flex items-end justify-center">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                        onClick={() => setIsActionMenuOpen(false)}
                    />
                    {/* Menu Content */}
                    <div className="relative w-full max-w-md bg-white rounded-t-[24px] pb-[calc(20px+var(--safe-bottom))] animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-2xl">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
                        <div className="flex flex-col py-2">
                            <button
                                onClick={() => {
                                    setIsActionMenuOpen(false);
                                    setIsPublicTypeModalOpen(true);
                                }}
                                className="w-full py-4 text-gray-800 font-bold text-[16px] active:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>공개여부 설정</span>
                            </button>
                            <div className="mx-4 h-[1px] bg-gray-100" />
                            <button
                                onClick={() => {
                                    setIsActionMenuOpen(false);
                                    setIsDeleteModalOpen(true);
                                }}
                                className="w-full py-4 text-[#FF3B30] font-bold text-[16px] active:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>삭제</span>
                            </button>
                            <div className="mx-4 h-[1px] bg-gray-100" />
                            <button
                                onClick={() => setIsActionMenuOpen(false)}
                                className="w-full py-4 text-gray-800 font-medium text-[16px] active:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Public Type Modal (Bottom Sheet) */}
            {isPublicTypeModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-end justify-center">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                        onClick={() => {
                            setIsPublicTypeModalOpen(false);
                            setItemToDelete(null);
                        }}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-t-[24px] pb-[calc(20px+var(--safe-bottom))] animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-2xl">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
                        <div className="px-4 py-3 text-center border-b border-gray-100">
                            <h3 className="text-[16px] font-bold text-gray-800">공개여부 설정</h3>
                        </div>
                        <div className="flex flex-col py-2">
                            {publicTypes.map(pt => {
                                const currentItem = itemToDelete ? combinedItems.find(item => item.type === itemToDelete.type && (item.postId === itemToDelete.id || item.shortsNo === itemToDelete.id)) : null;
                                const isSelected = currentItem?.publicTypeCd === pt.commDtlCd;
                                return (
                                    <button
                                        key={pt.commDtlCd}
                                        onClick={() => handlePublicTypeChange(pt.commDtlCd)}
                                        className={`w-full py-4 text-[15px] transition-colors flex items-center justify-center gap-2 ${isSelected ? 'text-[#003C48] font-bold bg-gray-50' : 'text-gray-800 font-medium active:bg-gray-50'}`}
                                    >
                                        <span>{pt.commDtlNm}</span>
                                        {isSelected && <span className="text-[#003C48]">✓</span>}
                                    </button>
                                );
                            })}
                            <div className="mx-4 h-[1px] bg-gray-100 my-2" />
                            <button
                                onClick={() => {
                                    setIsPublicTypeModalOpen(false);
                                    setItemToDelete(null);
                                }}
                                className="w-full py-3 text-gray-500 font-medium text-[15px] active:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            <CommonModal
                isOpen={isLogoutModalOpen}
                type="confirm"
                message="로그아웃 하시겠습니까?"
                onConfirm={handleLogoutConfirm}
                onCancel={() => setIsLogoutModalOpen(false)}
            />

            {/* Profile Edit Modal */}
            {userId && (
                <ProfileEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    userId={userId}
                    onProfileUpdate={fetchProfile}
                />
            )}

            {/* General Alert Modal */}
            <CommonModal
                isOpen={isAlertModalOpen}
                type="alert"
                message={alertMessage}
                onConfirm={() => setIsAlertModalOpen(false)}
            />
        </div>
    );
};

export default MyProfile;
