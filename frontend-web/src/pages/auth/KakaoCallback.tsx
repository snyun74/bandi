import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CommonModal from '../../components/common/CommonModal';

const KakaoCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Processing login...');
    const loginCalled = React.useRef(false);

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        message: '',
        onConfirm: () => { },
    });

    const showModal = (message: string, callback?: () => void) => {
        setModal({
            isOpen: true,
            message,
            onConfirm: () => {
                setModal(prev => ({ ...prev, isOpen: false }));
                if (callback) callback();
            },
        });
    };

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            if (loginCalled.current) return;
            loginCalled.current = true;

            handleKakaoLogin(code);
        } else {
            console.error('No authorization code found');
            setStatus('Login failed: No code provided.');
            // Allow time for UI to render before redirecting if needed, or just show modal
        }
    }, [searchParams]);

    const handleKakaoLogin = async (code: string) => {
        try {
            console.log('Sending Kakao code to backend:', code);
            const response = await fetch('/api/auth/kakao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('Login Success! Redirecting...');
                if (data.userId) {
                    localStorage.setItem('userId', data.userId);
                }
                navigate('/main');
            } else {
                setStatus(`Login Failed: ${data.message || 'Unknown error'}`);
                showModal(`Kakao Login Failed: ${data.message || 'Unknown error'}`, () => {
                    navigate('/');
                });
            }
        } catch (error) {
            console.error('Kakao Login Error:', error);
            setStatus('An error occurred during login.');
            showModal('An error occurred during login verification.', () => {
                navigate('/');
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <CommonModal
                isOpen={modal.isOpen}
                type="alert"
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />
            <div className="text-center p-8 bg-white rounded-lg shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-800">{status}</h2>
            </div>
        </div>
    );
};

export default KakaoCallback;
