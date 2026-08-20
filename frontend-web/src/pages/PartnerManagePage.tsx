import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaPlus, FaTrash, FaTimes, FaCamera } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface Attachment {
    attachNo: number;
    filePath: string;
    fileName: string;
}

interface StudioDto {
    studioNo: number;
    partnerNo: number;
    studioNm: string;
    address: string;
    zipcode: string;
    bigo: string;
    attachments: Attachment[];
    studioTypeCd: string;
}

interface RoomDto {
    roomNo: number;
    studioNo: number;
    roomNm: string;
    hourBaseUprice: number;
    capacityCnt: number;
    equipmentInfo: string;
    attachments: Attachment[];
}

const PartnerManagePage: React.FC = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const [partner, setPartner] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'studio' | 'room' | 'price' | 'approve'>('studio');

    // UI Feedback Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

    // Confirm Dialog state
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

    const showConfirmModal = (title: string, msg: string, action: () => void) => {
        setConfirmTitle(title);
        setConfirmMessage(msg);
        setConfirmAction(() => action);
        setConfirmModalOpen(true);
    };


    // Reject Dialog state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedResvNo, setSelectedResvNo] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // --- State Lists ---
    const [studios, setStudios] = useState<StudioDto[]>([]);
    const [selectedStudioNo, setSelectedStudioNo] = useState<number | null>(null);
    const [rooms, setRooms] = useState<RoomDto[]>([]);
    const [selectedRoomNo, setSelectedRoomNo] = useState<number | null>(null);
    const [prices, setPrices] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);

    // --- Studio Form & Edit States ---
    const [editingStudioNo, setEditingStudioNo] = useState<number | null>(null);
    const [studioNm, setStudioNm] = useState('');
    const [studioTypeCd, setStudioTypeCd] = useState<'S' | 'H'>('S');
    const [zipcode, setZipcode] = useState('');
    const [address, setAddress] = useState('');
    const [addressDetail, setAddressDetail] = useState('');
    const [bigo, setBigo] = useState('');
    const [studioExistingImages, setStudioExistingImages] = useState<Attachment[]>([]);
    const [studioNewImages, setStudioNewImages] = useState<File[]>([]);
    const [studioNewPreviewUrls, setStudioNewPreviewUrls] = useState<string[]>([]);
    const [studioDeleteAttachNos, setStudioDeleteAttachNos] = useState<number[]>([]);

    // --- Room Form & Edit States ---
    const [editingRoomNo, setEditingRoomNo] = useState<number | null>(null);
    const [roomNm, setRoomNm] = useState('');
    const [hourBaseUprice, setHourBaseUprice] = useState<number | null>(null);
    const [capacityCnt, setCapacityCnt] = useState<number | null>(null);
    const [hourBasePriceInput, setHourBasePriceInput] = useState(''); // 콤마 포맷 표시용
    const [capacityCntInput, setCapacityCntInput] = useState(''); // 인원수 표시용
    const [equipmentInfo, setEquipmentInfo] = useState('');
    const [roomExistingImages, setRoomExistingImages] = useState<Attachment[]>([]);
    const [roomNewImages, setRoomNewImages] = useState<File[]>([]);
    const [roomNewPreviewUrls, setRoomNewPreviewUrls] = useState<string[]>([]);
    const [roomDeleteAttachNos, setRoomDeleteAttachNos] = useState<number[]>([]);

    // --- Price Form States ---
    const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null);
    const [dayOfWeek, setDayOfWeek] = useState<number>(1);
    const [sttTime, setSttTime] = useState('0900');
    const [endTime, setEndTime] = useState('2200');
    const [timeUprice, setTimeUprice] = useState(10000);
    const [sttTimeInput, setSttTimeInput] = useState('09:00');
    const [endTimeInput, setEndTimeInput] = useState('22:00');
    const [timeUpriceInput, setTimeUpriceInput] = useState('10,000');

    const parseAndFormatTime = (raw: string): { formatted: string; hhmm: string; isValid: boolean; errorMsg?: string } => {
        const clean = raw.replace(/[^0-9]/g, '');
        if (!clean) {
            return { formatted: '', hhmm: '', isValid: false, errorMsg: '시간을 입력해 주세요.' };
        }

        let hh = 0;
        let mm = 0;

        if (clean.length === 1 || clean.length === 2) {
            hh = parseInt(clean, 10);
            mm = 0;
        } else if (clean.length === 3) {
            hh = parseInt(clean.substring(0, 1), 10);
            mm = parseInt(clean.substring(1), 10);
        } else {
            hh = parseInt(clean.substring(0, 2), 10);
            mm = parseInt(clean.substring(2, 4), 10);
        }

        if (isNaN(hh) || isNaN(mm)) {
            return { formatted: '', hhmm: '', isValid: false, errorMsg: '유효한 숫자를 입력해 주세요.' };
        }

        if (hh < 0 || hh > 24) {
            return { formatted: '', hhmm: '', isValid: false, errorMsg: '시간은 00:00 ~ 24:00 사이여야 합니다.' };
        }

        if (hh === 24 && mm > 0) {
            return { formatted: '', hhmm: '', isValid: false, errorMsg: '24시는 24:00만 가능합니다.' };
        }

        if (mm < 0 || mm > 59) {
            return { formatted: '', hhmm: '', isValid: false, errorMsg: '분 단위는 00 ~ 59분 사이여야 합니다.' };
        }

        const hhStr = hh.toString().padStart(2, '0');
        const mmStr = mm.toString().padStart(2, '0');

        return {
            formatted: `${hhStr}:${mmStr}`,
            hhmm: `${hhStr}${mmStr}`,
            isValid: true
        };
    };




    const showModal = (msg: string, callback?: () => void) => {
        setModalMessage(msg);
        setModalCallback(() => callback || null);
        setModalOpen(true);
    };

    // Daum 우편번호 검색 모달 상태
    const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
    const postcodeContainerRef = React.useRef<HTMLDivElement>(null);

    // Daum 우편번호 스크립트 동적 로드 및 임베드 실행
    const handleAddressSearch = () => {
        setIsPostcodeOpen(true);
    };

    useEffect(() => {
        if (!isPostcodeOpen || !postcodeContainerRef.current) return;

        const renderPostcode = () => {
            if (!(window as any).daum?.Postcode) {
                showModal('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
                setIsPostcodeOpen(false);
                return;
            }

            // 기존 내용 초기화
            if (postcodeContainerRef.current) {
                postcodeContainerRef.current.innerHTML = '';
            }

            new (window as any).daum.Postcode({
                oncomplete: (data: any) => {
                    const fullAddress = data.roadAddress || data.jibunAddress;
                    setZipcode(data.zonecode);
                    setAddress(fullAddress);
                    setAddressDetail('');
                    setIsPostcodeOpen(false);
                },
                width: '100%',
                height: '100%',
                theme: {
                    bgColor: '#003C48',
                    searchBgColor: '#00BDF8',
                    contentBgColor: '#ffffff',
                    pageBgColor: '#f8f9fa',
                    textColor: '#333333',
                    queryTextColor: '#003C48',
                }
            }).embed(postcodeContainerRef.current);
        };

        if (!(window as any).daum?.Postcode) {
            const script = document.createElement('script');
            script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
            script.async = true;
            script.onload = () => renderPostcode();
            document.head.appendChild(script);
        } else {
            renderPostcode();
        }
    }, [isPostcodeOpen]);

    const loadPartnerStatus = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/partner/status?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.partnerStatCd === 'A') {
                    setPartner(data);
                    loadStudios(data.partnerNo);
                    loadReservations(data.partnerNo);
                } else {
                    showModal("권한이 없거나 승인 대기 상태입니다.", () => navigate('/main/profile'));
                }
            } else {
                showModal("파트너 정보 조회에 실패했습니다.", () => navigate('/main/profile'));
            }
        } catch (error) {
            console.error("Load partner status error:", error);
            showModal("네트워크 오류 발생", () => navigate('/main/profile'));
        }
    };

    useEffect(() => {
        loadPartnerStatus();
    }, [userId]);

    const loadStudios = async (pNo: number) => {
        try {
            const res = await fetch(`/api/partner/studios-with-images?partnerNo=${pNo}`);
            if (res.ok) {
                const data = await res.json();
                setStudios(data);
                if (data.length > 0 && !selectedStudioNo) {
                    setSelectedStudioNo(data[0].studioNo);
                }
            }
        } catch (e) {
            console.error("Load studios failed", e);
        }
    };

    const resetStudioForm = () => {
        setEditingStudioNo(null);
        setStudioNm('');
        setStudioTypeCd('S');
        setZipcode('');
        setAddress('');
        setAddressDetail('');
        setBigo('');
        setStudioExistingImages([]);
        setStudioNewImages([]);
        setStudioNewPreviewUrls([]);
        setStudioDeleteAttachNos([]);
    };

    const selectStudioForEdit = (studio: StudioDto) => {
        setEditingStudioNo(studio.studioNo);
        setStudioNm(studio.studioNm);
        setStudioTypeCd((studio.studioTypeCd === 'H' ? 'H' : 'S') as 'S' | 'H');
        setZipcode(studio.zipcode || '');
        setAddress(studio.address || '');
        setAddressDetail('');
        setBigo(studio.bigo || '');
        setStudioExistingImages(studio.attachments || []);
        setStudioNewImages([]);
        setStudioNewPreviewUrls([]);
        setStudioDeleteAttachNos([]);
    };

    const handleDeleteStudio = (studioNo: number, studioNmVal: string, e: React.MouseEvent) => {
        e.stopPropagation();
        showConfirmModal(
            "지점 삭제 확인",
            `'${studioNmVal}' 지점을 삭제하시겠습니까?`,
            async () => {
                setConfirmModalOpen(false);
                try {
                    const res = await fetch(`/api/partner/studios/${studioNo}`, { method: 'DELETE' });
                    if (res.ok) {
                        showModal("지점이 삭제되었습니다.");
                        if (editingStudioNo === studioNo) resetStudioForm();
                        if (selectedStudioNo === studioNo) setSelectedStudioNo(null);
                        if (partner) loadStudios(partner.partnerNo);
                    } else if (res.status === 409) {
                        const data = await res.json();
                        showModal(data.message || "하위 데이터가 존재하여 삭제할 수 없습니다.");
                    } else {
                        showModal("지점 삭제에 실패했습니다.");
                    }
                } catch (err) {
                    console.error("Delete studio error", err);
                    showModal("지점 삭제 중 오류가 발생했습니다.");
                }
            }
        );
    };


    const handleStudioImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files);
        const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));

        setStudioNewImages(prev => [...prev, ...filesArray]);
        setStudioNewPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const removeStudioExistingImage = (attachNo: number) => {
        setStudioExistingImages(prev => prev.filter(img => img.attachNo !== attachNo));
        setStudioDeleteAttachNos(prev => [...prev, attachNo]);
    };

    const removeStudioNewImage = (index: number) => {
        setStudioNewImages(prev => prev.filter((_, i) => i !== index));
        setStudioNewPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveStudio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partner || !studioNm) return;

        try {
            const formData = new FormData();
            if (editingStudioNo) {
                formData.append('studioNo', editingStudioNo.toString());
            }
            formData.append('partnerNo', partner.partnerNo.toString());
            formData.append('studioNm', studioNm);
            formData.append('zipcode', zipcode);
            formData.append('address', addressDetail ? `${address} ${addressDetail}`.trim() : address);
            formData.append('bigo', bigo);
            formData.append('studioTypeCd', studioTypeCd);
            formData.append('userId', userId || '');

            studioNewImages.forEach(file => {
                formData.append('files', file);
            });

            studioDeleteAttachNos.forEach(delNo => {
                formData.append('deleteAttachNos', delNo.toString());
            });

            const res = await fetch('/api/partner/studios-with-images', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                showModal(editingStudioNo ? '지점 정보가 수정되었습니다.' : '지점이 등록되었습니다.');
                resetStudioForm();
                loadStudios(partner.partnerNo);
            } else {
                showModal('지점 저장 중 오류가 발생했습니다.');
            }
        } catch (e) {
            console.error('Save studio failed', e);
            showModal('지점 저장 실패');
        }
    };

    const loadRooms = async (sNo: number) => {
        try {
            const res = await fetch(`/api/partner/rooms-with-images?studioNo=${sNo}`);
            if (res.ok) {
                const data: RoomDto[] = await res.json();
                setRooms(data);
                if (data.length > 0) {
                    const exists = data.some(r => r.roomNo === selectedRoomNo);
                    if (!exists) {
                        setSelectedRoomNo(data[0].roomNo);
                    }
                } else {
                    setSelectedRoomNo(null);
                    setPrices([]);
                }
            }
        } catch (e) {
            console.error("Load rooms failed", e);
        }
    };

    useEffect(() => {
        if (selectedStudioNo) {
            loadRooms(selectedStudioNo);
        }
    }, [selectedStudioNo]);

    const resetRoomForm = () => {
        setEditingRoomNo(null);
        setRoomNm('');
        setHourBaseUprice(null);
        setCapacityCnt(null);
        setHourBasePriceInput('');
        setCapacityCntInput('');
        setEquipmentInfo('');
        setRoomExistingImages([]);
        setRoomNewImages([]);
        setRoomNewPreviewUrls([]);
        setRoomDeleteAttachNos([]);
    };

    const selectRoomForEdit = (room: RoomDto) => {
        setEditingRoomNo(room.roomNo);
        setRoomNm(room.roomNm);
        setHourBaseUprice(room.hourBaseUprice);
        setHourBasePriceInput(room.hourBaseUprice ? room.hourBaseUprice.toLocaleString('ko-KR') : '');
        setCapacityCnt(room.capacityCnt);
        setCapacityCntInput(room.capacityCnt ? room.capacityCnt.toString() : '');
        setEquipmentInfo(room.equipmentInfo || '');
        setRoomExistingImages(room.attachments || []);
        setRoomNewImages([]);
        setRoomNewPreviewUrls([]);
        setRoomDeleteAttachNos([]);
    };

    const handleDeleteRoom = (roomNo: number, roomNmVal: string, e: React.MouseEvent) => {
        e.stopPropagation();
        showConfirmModal(
            "룸 삭제 확인",
            `'${roomNmVal}' 룸을 삭제하시겠습니까?`,
            async () => {
                setConfirmModalOpen(false);
                try {
                    const res = await fetch(`/api/partner/rooms/${roomNo}`, { method: 'DELETE' });
                    if (res.ok) {
                        showModal("룸이 삭제되었습니다.");
                        if (editingRoomNo === roomNo) resetRoomForm();
                        if (selectedRoomNo === roomNo) setSelectedRoomNo(null);
                        if (selectedStudioNo) loadRooms(selectedStudioNo);
                    } else if (res.status === 409) {
                        const data = await res.json();
                        showModal(data.message || "하위 데이터가 존재하여 삭제할 수 없습니다.");
                    } else {
                        showModal("룸 삭제에 실패했습니다.");
                    }
                } catch (err) {
                    console.error("Delete room error", err);
                    showModal("룸 삭제 중 오류가 발생했습니다.");
                }
            }
        );
    };


    // 금액 입력 핸들러 - 숫자만 허용, 콤마 자동 추가
    const handleHourBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        if (raw === '') {
            setHourBasePriceInput('');
            setHourBaseUprice(null);
        } else {
            const num = parseInt(raw, 10);
            setHourBaseUprice(num);
            setHourBasePriceInput(num.toLocaleString('ko-KR'));
        }
    };

    // 인원 입력 핸들러
    const handleCapacityCntChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        if (raw === '') {
            setCapacityCntInput('');
            setCapacityCnt(null);
        } else {
            const num = parseInt(raw, 10);
            setCapacityCnt(num);
            setCapacityCntInput(raw);
        }
    };

    const handleRoomImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files);
        const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));

        setRoomNewImages(prev => [...prev, ...filesArray]);
        setRoomNewPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const removeRoomExistingImage = (attachNo: number) => {
        setRoomExistingImages(prev => prev.filter(img => img.attachNo !== attachNo));
        setRoomDeleteAttachNos(prev => [...prev, attachNo]);
    };

    const removeRoomNewImage = (index: number) => {
        setRoomNewImages(prev => prev.filter((_, i) => i !== index));
        setRoomNewPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudioNo || !roomNm) {
            showModal("지점 선택 및 룸 명칭을 입력해주세요.");
            return;
        }
        if (hourBaseUprice === null || hourBaseUprice <= 0) {
            showModal("시간당 기본 요금을 입력해주세요.");
            return;
        }
        if (capacityCnt === null || capacityCnt <= 0) {
            showModal("수용 인원을 입력해주세요.");
            return;
        }

        try {
            const formData = new FormData();
            if (editingRoomNo) {
                formData.append('roomNo', editingRoomNo.toString());
            }
            formData.append('studioNo', selectedStudioNo.toString());
            formData.append('roomNm', roomNm);
            formData.append('hourBaseUprice', (hourBaseUprice ?? 0).toString());
            formData.append('capacityCnt', (capacityCnt ?? 0).toString());
            formData.append('equipmentInfo', equipmentInfo);
            formData.append('userId', userId || '');

            roomNewImages.forEach(file => {
                formData.append('files', file);
            });

            roomDeleteAttachNos.forEach(delNo => {
                formData.append('deleteAttachNos', delNo.toString());
            });

            const res = await fetch('/api/partner/rooms-with-images', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                showModal(editingRoomNo ? "룸 정보가 수정되었습니다." : "룸이 성공적으로 등록되었습니다.");
                resetRoomForm();
                loadRooms(selectedStudioNo);
            } else {
                showModal("룸 저장 실패");
            }
        } catch (e) {
            console.error("Save room failed", e);
            showModal("룸 저장 중 오류가 발생했습니다.");
        }
    };

    const loadPrices = async (rNo: number) => {
        try {
            const res = await fetch(`/api/partner/room-prices?roomNo=${rNo}`);
            if (res.ok) {
                const data = await res.json();
                setPrices(data);
            }
        } catch (e) {
            console.error("Load prices failed", e);
        }
    };

    const handleTimeUpriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        if (raw === '') {
            setTimeUpriceInput('');
            setTimeUprice(0);
        } else {
            const num = parseInt(raw, 10);
            setTimeUprice(num);
            setTimeUpriceInput(num.toLocaleString('ko-KR'));
        }
    };

    const handleSttTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        setSttTimeInput(e.target.value);
    };


    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndTimeInput(e.target.value);
    };

    const handleSttTimeBlur = () => {
        if (!sttTimeInput) return;
        const res = parseAndFormatTime(sttTimeInput);
        if (res.isValid) {
            setSttTimeInput(res.formatted);
            setSttTime(res.hhmm);
        }
    };

    const handleEndTimeBlur = () => {
        if (!endTimeInput) return;
        const res = parseAndFormatTime(endTimeInput);
        if (res.isValid) {
            setEndTimeInput(res.formatted);
            setEndTime(res.hhmm);
        }
    };

    useEffect(() => {
        if (selectedRoomNo) {
            loadPrices(selectedRoomNo);
            const currentRoom = rooms.find(r => r.roomNo === selectedRoomNo);
            if (currentRoom && currentRoom.hourBaseUprice) {
                setTimeUprice(currentRoom.hourBaseUprice);
                setTimeUpriceInput(currentRoom.hourBaseUprice.toLocaleString('ko-KR'));
            } else {
                setTimeUprice(10000);
                setTimeUpriceInput('10,000');
            }
        } else {
            setPrices([]);
        }
        setSttTime('0900');
        setSttTimeInput('09:00');
        setEndTime('2200');
        setEndTimeInput('22:00');
        setEditingPriceIndex(null);
    }, [selectedRoomNo, rooms]);

    const validateAndGetTimePair = (): { sttTime: string; endTime: string } | null => {
        const sttRes = parseAndFormatTime(sttTimeInput);
        if (!sttRes.isValid) {
            showModal(`시작시간 오류: ${sttRes.errorMsg}`);
            return null;
        }
        const endRes = parseAndFormatTime(endTimeInput);
        if (!endRes.isValid) {
            showModal(`종료시간 오류: ${endRes.errorMsg}`);
            return null;
        }

        const sNum = parseInt(sttRes.hhmm, 10);
        const eNum = parseInt(endRes.hhmm, 10);

        if (sNum >= eNum) {
            showModal("시작 시간은 종료 시간보다 이전이어야 합니다.");
            return null;
        }

        setSttTimeInput(sttRes.formatted);
        setEndTimeInput(endRes.formatted);
        setSttTime(sttRes.hhmm);
        setEndTime(endRes.hhmm);

        return {
            sttTime: sttRes.hhmm,
            endTime: endRes.hhmm
        };
    };

    const handleAddPrice = () => {
        if (!selectedRoomNo) return;
        const timePair = validateAndGetTimePair();
        if (!timePair) return;

        const newPrice = {
            dayOfWeek,
            sttTime: timePair.sttTime,
            endTime: timePair.endTime,
            timeUprice
        };
        setPrices([...prices, newPrice]);
    };

    const handleUpdatePrice = () => {
        if (editingPriceIndex === null) return;
        const timePair = validateAndGetTimePair();
        if (!timePair) return;

        const updated = [...prices];
        updated[editingPriceIndex] = {
            dayOfWeek,
            sttTime: timePair.sttTime,
            endTime: timePair.endTime,
            timeUprice
        };
        setPrices(updated);
        setEditingPriceIndex(null);
    };

    const handleCancelPriceEdit = () => {
        setEditingPriceIndex(null);
        const currentRoom = rooms.find(r => r.roomNo === selectedRoomNo);
        if (currentRoom && currentRoom.hourBaseUprice) {
            setTimeUprice(currentRoom.hourBaseUprice);
            setTimeUpriceInput(currentRoom.hourBaseUprice.toLocaleString('ko-KR'));
        } else {
            setTimeUprice(10000);
            setTimeUpriceInput('10,000');
        }
        setSttTime('0900');
        setSttTimeInput('09:00');
        setEndTime('2200');
        setEndTimeInput('22:00');
    };

    const handleRemovePrice = (index: number) => {
        if (editingPriceIndex === index) {
            setEditingPriceIndex(null);
        }
        setPrices(prices.filter((_, i) => i !== index));
    };

    const selectPriceForEdit = (price: any, index: number) => {
        setEditingPriceIndex(index);
        setDayOfWeek(price.dayOfWeek);

        const rawStt = price.sttTime ? price.sttTime.replace(/[^0-9]/g, '') : '0900';
        const rawEnd = price.endTime ? price.endTime.replace(/[^0-9]/g, '') : '2200';
        setSttTime(rawStt);
        setEndTime(rawEnd);

        const sttRes = parseAndFormatTime(rawStt);
        const endRes = parseAndFormatTime(rawEnd);
        setSttTimeInput(sttRes.isValid ? sttRes.formatted : '09:00');
        setEndTimeInput(endRes.isValid ? endRes.formatted : '22:00');

        const uprice = price.timeUprice ?? 0;
        setTimeUprice(uprice);
        setTimeUpriceInput(uprice ? uprice.toLocaleString('ko-KR') : '');
    };



    const handleSavePrices = async () => {
        if (!selectedRoomNo) {
            showModal("룸을 선택해주세요.");
            return;
        }

        try {
            const res = await fetch(`/api/partner/room-prices?roomNo=${selectedRoomNo}&userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prices)
            });

            if (res.ok) {
                showModal("단가 설정이 저장되었습니다.");
                setEditingPriceIndex(null);
                loadPrices(selectedRoomNo);
            } else {
                showModal("단가 저장 실패");
            }
        } catch (e) {
            console.error("Save prices failed", e);
        }
    };


    const loadReservations = async (pNo: number) => {
        try {
            const res = await fetch(`/api/partner/reservations?partnerNo=${pNo}`);
            if (res.ok) {
                const data = await res.json();
                setReservations(data);
            }
        } catch (e) {
            console.error("Load reservations failed", e);
        }
    };

    const handleReservationAction = async (resvNo: number, status: 'APR' | 'REJ', bigoText: string = '') => {
        try {
            const res = await fetch(`/api/partner/reservations/${resvNo}/status?status=${status}&userId=${userId}&rejectBigo=${encodeURIComponent(bigoText)}`, {
                method: 'PUT'
            });
            if (res.ok) {
                showModal(status === 'APR' ? "승인 처리되었습니다." : "반려 처리되었습니다.");
                if (partner) {
                    loadReservations(partner.partnerNo);
                }
            } else {
                showModal("처리 중 오류가 발생했습니다.");
            }
        } catch (e) {
            console.error("Update reservation error", e);
        }
    };

    const getDayName = (dayCode: number) => {
        const days = ["월", "화", "수", "목", "금", "토", "일"];
        return days[dayCode - 1] || "";
    };

    const formatTime = (timeStr: string) => {
        if (timeStr.length !== 4) return timeStr;
        return `${timeStr.substring(0, 2)}:${timeStr.substring(2)}`;
    };

    const formatPhone = (phone?: string) => {
        if (!phone) return '';
        const clean = phone.replace(/[^0-9]/g, '');
        if (clean.length === 11) {
            return clean.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
        if (clean.length === 10) {
            if (clean.startsWith('02')) {
                return clean.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
            }
            return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        }
        if (clean.length === 9 && clean.startsWith('02')) {
            return clean.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
        }
        if (clean.length === 8) {
            return clean.replace(/(\d{4})(\d{4})/, '$1-$2');
        }
        return phone;
    };

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-[100]">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/main/profile')} className="text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <FaChevronLeft size={20} />
                    </button>
                    <h1 className="text-[14px] font-bold text-[#003C48]">{partner ? `${partner.bizNm} 관리` : '합주실 관리'}</h1>
                </div>
            </div>

            <div className="flex bg-white px-2 py-1.5 border-b border-gray-100 flex-shrink-0">
                {(['studio', 'room', 'price', 'approve'] as const).map((tab) => {
                    const label = tab === 'studio' ? '지점' : tab === 'room' ? '룸' : tab === 'price' ? '단가' : '승인';
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${isActive ? 'bg-[#003C48] text-white shadow-sm' : 'text-gray-400'}`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-20">
                {activeTab === 'studio' && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xs font-bold text-[#003C48]">
                                    {editingStudioNo ? `지점 수정 (${studioNm})` : '지점 등록'}
                                </h2>
                                {editingStudioNo && (
                                    <button
                                        type="button"
                                        onClick={resetStudioForm}
                                        className="text-[11px] font-bold text-[#00BDF8] hover:underline"
                                    >
                                        + 새 지점 등록
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleSaveStudio} className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    value={studioNm}
                                    onChange={(e) => setStudioNm(e.target.value)}
                                    placeholder="지점명 (예: 강남역점)"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                    required
                                />
                                {/* 지점 유형 선택 (연습실 / 공연장) */}
                                <div className="flex items-center gap-3 px-1">
                                    <span className="text-[11px] font-bold text-gray-600 shrink-0">지점유형</span>
                                    <div className="flex gap-3">
                                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer border transition-all text-xs font-bold ${
                                            studioTypeCd === 'S'
                                                ? 'bg-[#00BDF8] text-white border-[#00BDF8]'
                                                : 'bg-gray-50 text-gray-400 border-gray-100'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="studioTypeCd"
                                                value="S"
                                                checked={studioTypeCd === 'S'}
                                                onChange={() => setStudioTypeCd('S')}
                                                className="hidden"
                                            />
                                            🎸 연습실
                                        </label>
                                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer border transition-all text-xs font-bold ${
                                            studioTypeCd === 'H'
                                                ? 'bg-[#003C48] text-white border-[#003C48]'
                                                : 'bg-gray-50 text-gray-400 border-gray-100'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="studioTypeCd"
                                                value="H"
                                                checked={studioTypeCd === 'H'}
                                                onChange={() => setStudioTypeCd('H')}
                                                className="hidden"
                                            />
                                            🎤 공연장
                                        </label>
                                    </div>
                                </div>
                                {/* 주소 검색 */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="text"
                                            value={zipcode}
                                            readOnly
                                            placeholder="우편번호"
                                            className="w-24 sm:w-28 shrink-0 px-2.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 text-center cursor-default font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddressSearch}
                                            className="flex-1 py-2.5 px-3 bg-[#00BDF8] text-white text-xs font-bold rounded-xl hover:bg-[#009fd4] active:scale-95 transition-all text-center truncate shadow-xs"
                                        >
                                            🔍 주소 검색
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={address}
                                        readOnly
                                        placeholder="기본 주소"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 cursor-default"
                                    />
                                    {address && (
                                        <input
                                            type="text"
                                            value={addressDetail}
                                            onChange={(e) => setAddressDetail(e.target.value)}
                                            placeholder="상세주소 입력 (동/호수 등)"
                                            className="w-full px-4 py-2.5 bg-white border border-[#00BDF8]/40 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] transition-colors"
                                        />
                                    )}
                                </div>
                                <textarea
                                    value={bigo}
                                    onChange={(e) => setBigo(e.target.value)}
                                    placeholder="설명 및 편의시설"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs h-20 resize-none"
                                />

                                {/* 게시물 형태 이미지 첨부 영역 */}
                                <div className="flex flex-col gap-2 mt-1">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center justify-between">
                                        <span>지점 이미지 (게시글 형태 다중 이미지)</span>
                                        <span className="text-[10px] text-gray-400 font-normal">
                                            {studioExistingImages.length + studioNewImages.length}개 선택됨
                                        </span>
                                    </label>
                                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                                        <label
                                            htmlFor="studio-image-input"
                                            className="w-16 h-16 shrink-0 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#00BDF8] hover:bg-[#00BDF8]/5 transition-all"
                                        >
                                            <FaCamera className="text-gray-400 text-sm mb-1" />
                                            <span className="text-[9px] font-bold text-gray-500">사진 추가</span>
                                            <input
                                                id="studio-image-input"
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleStudioImageSelect}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* 기존 등록된 이미지 목록 */}
                                        {studioExistingImages.map(img => (
                                            <div key={img.attachNo} className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-gray-200 group">
                                                <img src={img.filePath} alt="지점 이미지" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeStudioExistingImage(img.attachNo)}
                                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                                                >
                                                    <FaTimes size={9} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* 새로 업로드할 이미지 목록 */}
                                        {studioNewPreviewUrls.map((url, idx) => (
                                            <div key={idx} className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-[#00BDF8] group">
                                                <img src={url} alt="새 이미지 미리보기" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeStudioNewImage(idx)}
                                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                                                >
                                                    <FaTimes size={9} />
                                                </button>
                                                <span className="absolute bottom-1 left-1 bg-[#00BDF8] text-white text-[8px] px-1 rounded font-bold">NEW</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="bg-[#003C48] text-white py-2.5 rounded-xl font-bold text-xs mt-2">
                                    {editingStudioNo ? '지점 정보 수정' : '지점 등록'}
                                </button>
                            </form>
                        </div>
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <h2 className="text-xs font-bold text-[#003C48] mb-1">등록 지점 목록</h2>
                            <p className="text-[10px] text-gray-400 mb-3">지점 항목을 클릭하면 수정 모드로 변환됩니다.</p>
                            {studios.map(s => (
                                <div
                                    key={s.studioNo}
                                    onClick={() => selectStudioForEdit(s)}
                                    className={`border rounded-xl p-3 bg-gray-50/50 mb-2 cursor-pointer transition-all hover:border-[#00BDF8] ${editingStudioNo === s.studioNo ? 'border-[#00BDF8] bg-[#00BDF8]/5 shadow-sm' : 'border-gray-100'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#003C48] flex items-center gap-1.5">
                                            {s.studioNm}
                                            {editingStudioNo === s.studioNo && (
                                                <span className="bg-[#00BDF8] text-white text-[9px] px-1.5 py-0.5 rounded-full font-normal">수정중</span>
                                            )}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {s.attachments && s.attachments.length > 0 && (
                                                <span className="text-[10px] text-[#00BDF8] font-bold">🖼️ {s.attachments.length}장</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteStudio(s.studioNo, s.studioNm, e)}
                                                className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                                title="지점 삭제"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">{s.address}</p>
                                    {s.attachments && s.attachments.length > 0 && (
                                        <div className="flex gap-1 mt-2 overflow-x-auto">
                                            {s.attachments.map(att => (
                                                <img key={att.attachNo} src={att.filePath} alt="지점 이미지" className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'room' && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xs font-bold text-[#003C48]">
                                    {editingRoomNo ? `룸 수정 (${roomNm})` : '룸 등록'}
                                </h2>
                                {editingRoomNo && (
                                    <button
                                        type="button"
                                        onClick={resetRoomForm}
                                        className="text-[11px] font-bold text-[#00BDF8] hover:underline"
                                    >
                                        + 새 룸 등록
                                    </button>
                                )}
                            </div>
                            <select
                                value={selectedStudioNo || ''}
                                onChange={(e) => setSelectedStudioNo(Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs mb-3"
                            >
                                {studios.map(s => (
                                    <option key={s.studioNo} value={s.studioNo}>{s.studioNm}</option>
                                ))}
                            </select>
                            <form onSubmit={handleSaveRoom} className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    value={roomNm}
                                    onChange={(e) => setRoomNm(e.target.value)}
                                    placeholder="룸 명칭 (예: Room A)"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                    required
                                />
                                {/* 시간당 기본 요금 */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                                        시간당 기본 요금
                                        <span className="text-red-500 text-[10px]">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={hourBasePriceInput}
                                            onChange={handleHourBasePriceChange}
                                            placeholder="예: 30,000"
                                            required
                                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400">원</span>
                                    </div>
                                    {hourBaseUprice !== null && (
                                        <p className="text-[10px] text-[#00BDF8] font-semibold pl-1">
                                            {hourBaseUprice.toLocaleString('ko-KR')}원
                                        </p>
                                    )}
                                </div>

                                {/* 수용 인원 */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                                        수용 인원
                                        <span className="text-red-500 text-[10px]">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={capacityCntInput}
                                            onChange={handleCapacityCntChange}
                                            placeholder="예: 6"
                                            required
                                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400">명</span>
                                    </div>
                                </div>
                                <textarea
                                    value={equipmentInfo}
                                    onChange={(e) => setEquipmentInfo(e.target.value)}
                                    placeholder="보유 장비 정보"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs h-20 resize-none"
                                />

                                {/* 게시물 형태 룸 이미지 첨부 영역 */}
                                <div className="flex flex-col gap-2 mt-1">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center justify-between">
                                        <span>룸 이미지 (게시글 형태 다중 이미지)</span>
                                        <span className="text-[10px] text-gray-400 font-normal">
                                            {roomExistingImages.length + roomNewImages.length}개 선택됨
                                        </span>
                                    </label>
                                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                                        <label
                                            htmlFor="room-image-input"
                                            className="w-16 h-16 shrink-0 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#00BDF8] hover:bg-[#00BDF8]/5 transition-all"
                                        >
                                            <FaCamera className="text-gray-400 text-sm mb-1" />
                                            <span className="text-[9px] font-bold text-gray-500">사진 추가</span>
                                            <input
                                                id="room-image-input"
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleRoomImageSelect}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* 기존 등록된 이미지 목록 */}
                                        {roomExistingImages.map(img => (
                                            <div key={img.attachNo} className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-gray-200 group">
                                                <img src={img.filePath} alt="룸 이미지" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoomExistingImage(img.attachNo)}
                                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                                                >
                                                    <FaTimes size={9} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* 새로 업로드할 이미지 목록 */}
                                        {roomNewPreviewUrls.map((url, idx) => (
                                            <div key={idx} className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-[#00BDF8] group">
                                                <img src={url} alt="새 룸 이미지 미리보기" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoomNewImage(idx)}
                                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                                                >
                                                    <FaTimes size={9} />
                                                </button>
                                                <span className="absolute bottom-1 left-1 bg-[#00BDF8] text-white text-[8px] px-1 rounded font-bold">NEW</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="bg-[#003C48] text-white py-2.5 rounded-xl font-bold text-xs mt-2">
                                    {editingRoomNo ? '룸 정보 수정' : '룸 등록'}
                                </button>
                            </form>
                        </div>
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <h2 className="text-xs font-bold text-[#003C48] mb-1">등록 룸 목록</h2>
                            <p className="text-[10px] text-gray-400 mb-3">룸 항목을 클릭하면 수정 모드로 변환됩니다.</p>
                            {rooms.map(r => (
                                <div
                                    key={r.roomNo}
                                    onClick={() => selectRoomForEdit(r)}
                                    className={`border rounded-xl p-3 bg-gray-50/50 mb-2 cursor-pointer transition-all hover:border-[#00BDF8] ${editingRoomNo === r.roomNo ? 'border-[#00BDF8] bg-[#00BDF8]/5 shadow-sm' : 'border-gray-100'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#003C48] flex items-center gap-1.5">
                                            {r.roomNm}
                                            {editingRoomNo === r.roomNo && (
                                                <span className="bg-[#00BDF8] text-white text-[9px] px-1.5 py-0.5 rounded-full font-normal">수정중</span>
                                            )}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {r.attachments && r.attachments.length > 0 && (
                                                <span className="text-[10px] text-[#00BDF8] font-bold">🖼️ {r.attachments.length}장</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteRoom(r.roomNo, r.roomNm, e)}
                                                className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                                title="룸 삭제"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">{r.hourBaseUprice.toLocaleString()}원/시간 | {r.capacityCnt}명 수용</p>
                                    {r.attachments && r.attachments.length > 0 && (
                                        <div className="flex gap-1 mt-2 overflow-x-auto">
                                            {r.attachments.map(att => (
                                                <img key={att.attachNo} src={att.filePath} alt="룸 이미지" className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'price' && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <h2 className="text-xs font-bold text-[#003C48] mb-3">단가 설정</h2>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <select
                                    value={selectedStudioNo || ''}
                                    onChange={(e) => setSelectedStudioNo(Number(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                >
                                    {studios.map(s => (
                                        <option key={s.studioNo} value={s.studioNo}>{s.studioNm}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedRoomNo || ''}
                                    onChange={(e) => setSelectedRoomNo(Number(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                >
                                    {rooms.map(r => (
                                        <option key={r.roomNo} value={r.roomNo}>{r.roomNm}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedRoomNo && (
                                <div className="flex flex-col gap-3 pt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={dayOfWeek}
                                            onChange={(e) => setDayOfWeek(Number(e.target.value))}
                                            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                        >
                                            <option value={1}>월요일</option>
                                            <option value={2}>화요일</option>
                                            <option value={3}>수요일</option>
                                            <option value={4}>목요일</option>
                                            <option value={5}>금요일</option>
                                            <option value={6}>토요일</option>
                                            <option value={7}>일요일</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={timeUpriceInput}
                                            onChange={handleTimeUpriceChange}
                                            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-right"
                                            placeholder="시간당 단가 (원)"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={sttTimeInput}
                                            onChange={handleSttTimeChange}
                                            onBlur={handleSttTimeBlur}
                                            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-center"
                                            placeholder="시작시간 (예: 09:00)"
                                            maxLength={5}
                                        />
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={endTimeInput}
                                            onChange={handleEndTimeChange}
                                            onBlur={handleEndTimeBlur}
                                            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-center"
                                            placeholder="종료시간 (예: 22:00)"
                                            maxLength={5}
                                        />
                                    </div>

                                    {editingPriceIndex !== null ? (
                                        <div className="flex gap-2">
                                            <button onClick={handleUpdatePrice} className="flex-1 bg-[#00BDF8] text-white py-2 rounded-xl text-xs font-bold">단가 수정 완료</button>
                                            <button onClick={handleCancelPriceEdit} className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-xs font-bold">취소</button>
                                        </div>
                                    ) : (
                                        <button onClick={handleAddPrice} className="bg-[#00BDF8] text-white py-2 rounded-xl text-xs font-bold">+ 단가 목록 추가</button>
                                    )}
                                </div>
                            )}
                        </div>
                        {selectedRoomNo && (
                            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <h2 className="text-xs font-bold text-[#003C48]">단가 목록</h2>
                                    <button onClick={handleSavePrices} className="bg-[#003C48] text-white px-3 py-1.5 rounded-xl text-xs font-bold">전체 저장</button>
                                </div>
                                <p className="text-[10px] text-gray-400 mb-3">단가 항목을 클릭하면 위 폼에 해당 정보가 세팅됩니다.</p>
                                {prices.map((p, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => selectPriceForEdit(p, idx)}
                                        className={`flex justify-between items-center p-2.5 border rounded-xl text-xs mb-2 cursor-pointer transition-all ${editingPriceIndex === idx ? 'border-[#00BDF8] bg-[#00BDF8]/10 font-bold shadow-sm' : 'border-gray-100 bg-gray-50/50 hover:border-[#00BDF8]'}`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {getDayName(p.dayOfWeek)}요일: {formatTime(p.sttTime)} ~ {formatTime(p.endTime)} ({p.timeUprice.toLocaleString()}원)
                                            {editingPriceIndex === idx && (
                                                <span className="bg-[#00BDF8] text-white text-[9px] px-1.5 py-0.5 rounded-full font-normal">수정중</span>
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleRemovePrice(idx); }}
                                            className="text-red-400 hover:text-red-600 p-1"
                                            title="단가 삭제"
                                        >
                                            <FaTrash size={12}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'approve' && (
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xs font-bold text-[#003C48]">합주실 예약 요청 / 승인 목록</h2>
                            <span className="text-[10px] text-gray-400">최근 31일 ~ 미래</span>
                        </div>

                        {reservations.length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-8">예약 요청 내역이 없습니다.</p>
                        ) : (
                            reservations.map((resv) => {
                                const isReq = resv.resvStatFg === 'REQ';
                                const isApr = resv.resvStatFg === 'APR';

                                return (
                                    <div
                                        key={resv.resvNo}
                                        className={`border rounded-2xl p-4 mb-3 flex flex-col gap-2.5 transition-all ${
                                            isReq
                                                ? 'border-[#00BDF8] bg-[#00BDF8]/5 shadow-sm'
                                                : 'border-gray-100 bg-gray-50/50'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-[#003C48]">
                                                    {resv.studioNm} · {resv.roomNm}
                                                </span>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                        isReq
                                                            ? 'bg-amber-100 text-amber-700 font-extrabold animate-pulse'
                                                            : isApr
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-600'
                                                    }`}
                                                >
                                                    {isReq ? '● 승인 대기' : isApr ? '승인 완료' : '반려'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-gray-400">
                                                    신청자: <span className="text-gray-700 font-medium">{resv.userNickNm || resv.userNm}</span> ({resv.userId})
                                                </span>
                                                {resv.phoneNo && (
                                                    <span className="text-gray-600 font-medium tracking-tight">
                                                        {formatPhone(resv.phoneNo)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gray-100 my-0.5" />

                                        <div className="flex flex-col gap-1 text-[11px] text-gray-600">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">합주 일자</span>
                                                <span className="font-semibold text-gray-800">
                                                    {resv.useDate.substring(0, 4)}-{resv.useDate.substring(4, 6)}-{resv.useDate.substring(6, 8)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">합주 시간</span>
                                                <span className="font-medium text-gray-800">
                                                    {formatTime(resv.sttTime)} ~ {formatTime(resv.endTime)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">결제/이용 금액</span>
                                                <span className="font-bold text-[#003C48]">
                                                    {resv.paymentAmt ? resv.paymentAmt.toLocaleString() : (resv.resvTotAmt ? resv.resvTotAmt.toLocaleString() : '0')}원
                                                </span>
                                            </div>
                                            {resv.resvRejectBigo && (
                                                <div className="mt-1 p-2 bg-red-50/70 rounded-xl text-[10px] text-red-500">
                                                    <span className="font-bold">반려 사유: </span>{resv.resvRejectBigo}
                                                </div>
                                            )}
                                        </div>

                                        {isReq && (
                                            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => handleReservationAction(resv.resvNo, 'APR')}
                                                    className="flex-1 bg-[#003C48] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#002d36] transition-all shadow-sm"
                                                >
                                                    승인하기
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedResvNo(resv.resvNo);
                                                        setRejectReason('');
                                                        setRejectModalOpen(true);
                                                    }}
                                                    className="flex-1 bg-red-50 text-red-500 py-2.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100"
                                                >
                                                    반려하기
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            <CommonModal isOpen={modalOpen} type="alert" message={modalMessage} onConfirm={() => { setModalOpen(false); if (modalCallback) { modalCallback(); setModalCallback(null); } }} />

            <CommonModal
                isOpen={confirmModalOpen}
                type="confirm"
                variant="danger"
                title={confirmTitle}
                message={confirmMessage}
                onConfirm={() => {
                    if (confirmAction) confirmAction();
                }}
                onCancel={() => setConfirmModalOpen(false)}
            />


            {rejectModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-gray-100 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-[#003C48]">거절 사유 입력</h3>
                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="거절 사유를 입력하세요." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs h-24 resize-none" />
                        <div className="flex gap-2">
                            <button onClick={() => { if (selectedResvNo) { handleReservationAction(selectedResvNo, 'REJ', rejectReason); setRejectModalOpen(false); } }} className="flex-1 bg-[#FF6B6B] text-white py-2 rounded-xl text-xs font-bold">반려</button>
                            <button onClick={() => setRejectModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 py-2 rounded-xl text-xs font-bold">취소</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Daum 우편번호 검색 인앱 레이어 모달 (모바일/PC 완벽 호환) */}
            {isPostcodeOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col border border-gray-100">
                        <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100 bg-white">
                            <h3 className="text-sm font-bold text-[#003C48] flex items-center gap-2">
                                <span>🔍</span> 주소 검색
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsPostcodeOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <div
                            ref={postcodeContainerRef}
                            className="w-full h-[450px] sm:h-[500px] overflow-hidden"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerManagePage;
