const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 변환할 해상도 지정 (iPhone 6.5형 표준 규격)
const TARGET_WIDTH = 1284;
const TARGET_HEIGHT = 2778;

// 찾을 파일명 후보군 (확장자 유연하게 지원)
const baseNames = ['screenshot1', 'screenshot2', 'screenshot3'];
const extensions = ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'];

async function resizeScreenshots() {
    console.log('\n📸 스크린샷 크기 변환 시작...');
    
    let foundAny = false;
    
    for (const baseName of baseNames) {
        let inputFile = null;
        let extFound = null;
        
        // 사용 가능한 이미지 포맷 탐색
        for (const ext of extensions) {
            const fileName = `${baseName}${ext}`;
            if (fs.existsSync(path.join(__dirname, fileName))) {
                inputFile = fileName;
                extFound = ext;
                break;
            }
        }
        
        if (inputFile) {
            foundAny = true;
            const inputPath = path.join(__dirname, inputFile);
            // 아웃풋 파일은 무조건 png 형식으로 저장
            const outputPath = path.join(__dirname, `ios-${baseName}.png`);
            
            try {
                await sharp(inputPath)
                    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
                        fit: 'cover', // 비율을 유지하며 꽉 채움 (세로 비율이 다를 경우 일부 잘릴 수 있음)
                        position: 'center'
                    })
                    .png()
                    .toFile(outputPath);
                console.log(`  ✅ 변환 성공: ${inputFile} ➔ ios-${baseName}.png (${TARGET_WIDTH}x${TARGET_HEIGHT})`);
            } catch (err) {
                console.error(`  ❌ 변환 실패 (${inputFile}):`, err.message);
            }
        } else {
            console.log(`  ℹ️ 파일 없음: ${baseName} (screenshot1.png 또는 jpg 파일이 존재하지 않습니다)`);
        }
    }
    
    if (!foundAny) {
        console.log('\n❌ 변환할 이미지를 찾지 못했습니다.');
        console.log('   프로젝트 폴더 D:\\Project\\bandi 에 이미지 파일 3개를 넣고');
        console.log('   이름을 각각 [screenshot1, screenshot2, screenshot3] 로 설정해 주세요. (확장자는 png, jpg 등 가능)\n');
    } else {
        console.log('\n🎉 변환 작업이 완료되었습니다! 생성된 ios-*.png 파일들을 스토어에 업로드하시면 됩니다.\n');
    }
}

resizeScreenshots();
