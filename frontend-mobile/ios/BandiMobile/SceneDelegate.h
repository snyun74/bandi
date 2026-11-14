#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

// iOS 27 SDK부터 UIScene 생명주기 채택이 필수이므로,
// React Native 루트 뷰를 담는 UIWindow 생성을 SceneDelegate에서 담당한다.
@interface SceneDelegate : UIResponder <UIWindowSceneDelegate>

@property (nonatomic, strong, nullable) UIWindow *window;

@end

NS_ASSUME_NONNULL_END
