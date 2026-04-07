const fs = require('fs');
let data = fs.readFileSync('d:/Project/bandi/frontend-web/src/pages/MyProfile.tsx', 'utf8');

// Find start and end exactly.
const startIndex = data.indexOf('{/* Compact Stats */}');
const endIndexStr = '        {/* Logout Confirmation Modal */}';
const endIndex = data.indexOf(endIndexStr);

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = \{/* Compact Stats */}
                    <div className="flex flex-col gap-1 items-end bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100/50">
                        <div className="flex items-center gap-2 justify-end w-full">
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">매너점수</span>
                            <span className="text-gray-500 font-bold text-xs min-w-[35px] text-right">{profile?.mannerScore !== undefined ? \\\\점\\\ : '0점'}</span>
                        </div>
                        <div className="w-12 h-[1px] bg-gray-200/30 my-0.5"></div>
                        <div className="flex items-center gap-2 justify-end w-full">
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">분위기메이커</span>
                            <span className="text-gray-500 font-bold text-xs min-w-[35px] text-right">{profile?.moodMakerCount !== undefined ? \\\\회\\\ : '0회'}</span>
                        </div>
                    </div>
                </div>

                {/* Post Grid (Instagram Style) */}
                <div className="px-0.5 py-0.5">
                    <div className="grid grid-cols-3 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                            <div
                                key={i}
                                className="aspect-[4/5] bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex flex-col items-center justify-center text-gray-300 relative group cursor-pointer hover:brightness-95 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-40 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[10px] opacity-40">게시물 \</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Buttons - Moved to Bottom */}
                <div className="px-4 py-6 mt-4 flex gap-2">
                    <button className="flex-1 bg-gray-100 text-gray-800 font-bold py-3 rounded-xl text-[14px] hover:bg-gray-200 transition-colors active:scale-[0.98]">
                        게시물 만들기
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-800 font-bold py-3 rounded-xl text-[14px] hover:bg-gray-200 transition-colors active:scale-[0.98]">
                        쇼츠 만들기
                    </button>
                </div>
            </div>

\;
    const result = data.substring(0, startIndex) + newBlock + data.substring(endIndex);
    fs.writeFileSync('d:/Project/bandi/frontend-web/src/pages/MyProfile.tsx', result, 'utf8');
    console.log('Fixed MyProfile.tsx successfully');
} else {
    console.log('Could not find start or end index.');
}
