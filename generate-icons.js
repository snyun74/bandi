/**
 * 아이콘 자동 생성 스크립트
 * 원본 이미지 하나로 PWA + 안드로이드 + iOS 앱에 필요한 모든 아이콘을 생성합니다.
 *
 * 사용법:
 *   1. node generate-icons.js  (기본: ./icon-source.png 사용)
 *   2. node generate-icons.js ./my-image.png  (파일명 직접 지정)
 *
 * 필요 패키지: sharp
 *   설치: npm install sharp (루트 디렉토리 또는 모바일/웹 디렉토리에서)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// ──────────────────────────────────────────────
// 원본 이미지 경로 (인자로 받거나 기본값 사용)
// ──────────────────────────────────────────────
const SOURCE_IMAGE = process.argv[2] || path.join(__dirname, 'icon-source.png');

if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error(`\n❌ 원본 이미지를 찾을 수 없습니다: ${SOURCE_IMAGE}`);
    console.error('   현재 디렉토리에 icon-source.png 를 넣어두거나,');
    console.error('   node generate-icons.js <이미지경로> 로 경로를 지정하세요.\n');
    process.exit(1);
}

// ──────────────────────────────────────────────
// 출력 경로 설정
// ──────────────────────────────────────────────
const PWA_PUBLIC_DIR = path.join(__dirname, 'frontend-web', 'public');
const ANDROID_RES_DIR = path.join(__dirname, 'frontend-mobile', 'android', 'app', 'src', 'main', 'res');
const IOS_APPICON_DIR = path.join(__dirname, 'frontend-mobile', 'ios', 'BandiMobile', 'Images.xcassets', 'AppIcon.appiconset');

// ──────────────────────────────────────────────
// 아이콘 사양 설정
// ──────────────────────────────────────────────

// 1. PWA 아이콘 사양
const PWA_ICONS = [
    { size: 192, filename: 'pwa-192x192.png' },
    { size: 512, filename: 'pwa-512x512.png' },
];

// 2. 안드로이드 아이콘 사양 (mipmap 폴더별)
const ANDROID_ICONS = [
    { folder: 'mipmap-mdpi', size: 48 },
    { folder: 'mipmap-hdpi', size: 72 },
    { folder: 'mipmap-xhdpi', size: 96 },
    { folder: 'mipmap-xxhdpi', size: 144 },
    { folder: 'mipmap-xxxhdpi', size: 192 },
];

// 3. iOS 아이콘 사양 (AppIcon.appiconset용)
const IOS_ICONS = [
    { size: 40, filename: 'icon-20@2x.png', sizeStr: '20x20', scale: '2x', idiom: 'iphone' },
    { size: 60, filename: 'icon-20@3x.png', sizeStr: '20x20', scale: '3x', idiom: 'iphone' },
    { size: 58, filename: 'icon-29@2x.png', sizeStr: '29x29', scale: '2x', idiom: 'iphone' },
    { size: 87, filename: 'icon-29@3x.png', sizeStr: '29x29', scale: '3x', idiom: 'iphone' },
    { size: 80, filename: 'icon-40@2x.png', sizeStr: '40x40', scale: '2x', idiom: 'iphone' },
    { size: 120, filename: 'icon-40@3x.png', sizeStr: '40x40', scale: '3x', idiom: 'iphone' },
    { size: 120, filename: 'icon-60@2x.png', sizeStr: '60x60', scale: '2x', idiom: 'iphone' },
    { size: 180, filename: 'icon-60@3x.png', sizeStr: '60x60', scale: '3x', idiom: 'iphone' },
    { size: 1024, filename: 'icon-1024.png', sizeStr: '1024x1024', scale: '1x', idiom: 'ios-marketing' },
];

// ──────────────────────────────────────────────
// 유틸: 디렉토리 없으면 생성
// ──────────────────────────────────────────────
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// ──────────────────────────────────────────────
// 아이콘 생성 함수
// ──────────────────────────────────────────────
async function generateIcon(size, outputPath) {
    await sharp(SOURCE_IMAGE)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .png()
        .toFile(outputPath);
    console.log(`  ✅ ${path.relative(__dirname, outputPath)} (${size}x${size})`);
}

// ──────────────────────────────────────────────
// iOS Contents.json 파일 생성 함수
// ──────────────────────────────────────────────
function generateIosContentsJson() {
    const contents = {
        images: IOS_ICONS.map(icon => ({
            idiom: icon.idiom,
            scale: icon.scale,
            size: icon.sizeStr,
            filename: icon.filename
        })),
        info: {
            author: 'xcode',
            version: 1
        }
    };
    
    const outputPath = path.join(IOS_APPICON_DIR, 'Contents.json');
    fs.writeFileSync(outputPath, JSON.stringify(contents, null, 2), 'utf8');
    console.log(`  ✅ iOS AppIcon Contents.json 생성 완료!`);
}

// ──────────────────────────────────────────────
// 메인 실행
// ──────────────────────────────────────────────
async function main() {
    console.log(`\n🚀 아이콘 생성 시작`);
    console.log(`   원본 이미지: ${SOURCE_IMAGE}\n`);

    // 1. PWA 아이콘 생성
    console.log('📱 [PWA] 아이콘 생성 중...');
    ensureDir(PWA_PUBLIC_DIR);
    for (const icon of PWA_ICONS) {
        const outputPath = path.join(PWA_PUBLIC_DIR, icon.filename);
        await generateIcon(icon.size, outputPath);
    }

    // 2. 안드로이드 아이콘 생성
    console.log('\n🤖 [Android] 아이콘 생성 중...');
    for (const icon of ANDROID_ICONS) {
        const folderPath = path.join(ANDROID_RES_DIR, icon.folder);
        ensureDir(folderPath);

        // 일반 아이콘
        await generateIcon(icon.size, path.join(folderPath, 'ic_launcher.png'));
        // 원형 아이콘 (동일 이미지 사용)
        await generateIcon(icon.size, path.join(folderPath, 'ic_launcher_round.png'));
    }

    // 3. iOS 아이콘 생성
    console.log('\n🍎 [iOS] 아이콘 생성 중...');
    ensureDir(IOS_APPICON_DIR);
    for (const icon of IOS_ICONS) {
        const outputPath = path.join(IOS_APPICON_DIR, icon.filename);
        await generateIcon(icon.size, outputPath);
    }
    // Contents.json 업데이트
    generateIosContentsJson();

    console.log('\n🎉 모든 아이콘 생성 완료!\n');
    console.log('📋 다음 단계:');
    console.log('   [PWA]     frontend-web 빌드 후 배포');
    console.log('   [Android] 안드로이드 앱 다시 빌드 후 배포');
    console.log('   [iOS]     Xcode에서 아카이브 빌드 후 배포\n');
}

main().catch((err) => {
    console.error('\n❌ 오류 발생:', err.message);
    process.exit(1);
});
