#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>

@interface AppDelegate : RCTAppDelegate

// SceneDelegate 에서 React Native 루트 뷰 생성 시 사용하는 실행 옵션
@property (nonatomic, strong, nullable) NSDictionary *launchOptions;

@end
