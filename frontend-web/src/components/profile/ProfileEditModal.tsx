import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaCamera } from 'react-icons/fa';
import { BsPersonCircle } from 'react-icons/bs';
import CommonModal from '../common/CommonModal';

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
    skills: UserSkillDto[];
}

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onProfileUpdate: () => void; // Callback to refresh parent
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, userId, onProfileUpdate }) => {
    const [profile, setProfile] = useState<UserProfileDto | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [skills, setSkills] = useState<UserSkillDto[]>([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);

    const showAlert = (message: string, callback?: () => void) => {
        setAlertMessage(message);
        setAlertCallback(() => callback || null);
        setIsAlertOpen(true);
    };

    const handleAlertConfirm = () => {
        setIsAlertOpen(false);
        if (alertCallback) {
            alertCallback();
        }
    };

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`/api/user/profile/${userId}`);
            if (response.ok) {
                const data: UserProfileDto = await response.json();
                setProfile(data);
                setNickname(data.userNickNm || '');
                setEmail(data.email || '');
                setSkills(data.skills || []);
                setPreviewImage(data.profileImageUrl);
                setSelectedFile(null);
            } else {
                console.error("Failed to fetch profile");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSkillChange = (sessionTypeCd: string, newScore: number) => {
        setSkills(prevSkills =>
            prevSkills.map(skill =>
                skill.sessionTypeCd === sessionTypeCd
                    ? { ...skill, score: newScore }
                    : skill
            )
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const formData = new FormData();

            const updateDto = {
                userId: userId,
                userNickNm: nickname,
                email: email,
                skills: skills
            };

            // Append JSON data as a Blob with application/json type
            const jsonBlob = new Blob([JSON.stringify(updateDto)], { type: "application/json" });
            formData.append("data", jsonBlob);

            if (selectedFile) {
                formData.append("file", selectedFile);
            }

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                showAlert("프로필이 저장되었습니다.", () => {
                    onProfileUpdate();
                    onClose();
                });
            } else {
                const errorText = await response.text();
                showAlert(`저장 실패: ${errorText}`);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            showAlert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50" style={{ fontFamily: '"Jua", sans-serif' }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-[#003C48]">프로필 편집</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {/* Profile Image */}
                    <div className="flex justify-center mb-8">
                        <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 flex items-center justify-center shadow-inner group-hover:border-indigo-50 transition-colors">
                                {previewImage ? (
                                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <BsPersonCircle className="w-full h-full text-gray-300" />
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 bg-white p-2.5 rounded-full shadow-lg border border-gray-100 group-hover:scale-110 transition-transform">
                                <FaCamera className="text-[#00BDF8] text-lg" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-5 mb-8">
                        <div>
                            <label className="block text-[#003C48] font-bold mb-2 text-sm">닉네임</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-700 outline-none focus:ring-2 focus:ring-[#00BDF8]/50 focus:bg-white transition-all border border-transparent focus:border-[#00BDF8]"
                                placeholder="닉네임을 입력하세요"
                            />
                        </div>
                        <div>
                            <label className="block text-[#003C48] font-bold mb-2 text-sm">이메일</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-700 outline-none focus:ring-2 focus:ring-[#00BDF8]/50 focus:bg-white transition-all border border-transparent focus:border-[#00BDF8]"
                                placeholder="이메일을 입력하세요"
                            />
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                        <h3 className="text-[#003C48] font-bold text-sm mb-1">세션별 실력 (자가평가)</h3>
                        <div className="space-y-4">
                            {skills.map((skill) => (
                                <div key={skill.sessionTypeCd} className="flex items-center gap-3">
                                    <span className="w-20 font-bold text-gray-600 text-sm truncate">{skill.sessionTypeNm}</span>
                                    <div className="flex-1 flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={skill.score}
                                            onChange={(e) => handleSkillChange(skill.sessionTypeCd, parseInt(e.target.value))}
                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00BDF8]"
                                        />
                                        <span className="text-[#00BDF8] font-bold w-4 text-center">{skill.score}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-[#00BDF8] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#00BDF8]/30 hover:bg-[#009bc9] hover:shadow-[#009bc9]/30 hover:-translate-y-0.5 transition-all disabled:bg-gray-300 disabled:shadow-none disabled:translate-y-0"
                    >
                        {loading ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </div>

            <CommonModal
                isOpen={isAlertOpen}
                type="alert"
                message={alertMessage}
                onConfirm={handleAlertConfirm}
            />
        </div>
    );
};

export default ProfileEditModal;
