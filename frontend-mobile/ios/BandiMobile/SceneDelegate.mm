#import "SceneDelegate.h"

#import "AppDelegate.h"
#import <React/RCTUtils.h>

@implementation SceneDelegate

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  if (![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }
  UIWindowScene *windowScene = (UIWindowScene *)scene;
  AppDelegate *appDelegate = (AppDelegate *)UIApplication.sharedApplication.delegate;

  // 기존 RCTAppDelegate.loadReactNativeWindow 의 처리를 Scene 기준으로 옮김
  // (UIScreen.mainScreen.bounds 기반 window 는 Scene 생명주기에서 화면에 표시되지 않음)
  UIView *rootView = [appDelegate.rootViewFactory viewWithModuleName:appDelegate.moduleName
                                                   initialProperties:appDelegate.initialProps
                                                       launchOptions:appDelegate.launchOptions];
  UIViewController *rootViewController = [appDelegate createRootViewController];
  [appDelegate setRootView:rootView toRootViewController:rootViewController];

  self.window = [[UIWindow alloc] initWithWindowScene:windowScene];
  self.window.rootViewController = rootViewController;

  // AppDelegate.window 를 참조하는 라이브러리(키보드, 모달 등) 호환을 위해 동일 window 를 공유
  appDelegate.window = self.window;

  [self.window makeKeyAndVisible];
}

// 회전·창 크기 변경 시 React Native 레이아웃 갱신 알림 (RCTAppDelegate 동작과 동일하게 유지)
- (void)windowScene:(UIWindowScene *)windowScene
    didUpdateCoordinateSpace:(id<UICoordinateSpace>)previousCoordinateSpace
        interfaceOrientation:(UIInterfaceOrientation)previousInterfaceOrientation
             traitCollection:(UITraitCollection *)previousTraitCollection
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTWindowFrameDidChangeNotification object:self];
}

@end
