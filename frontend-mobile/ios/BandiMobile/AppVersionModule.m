#import <React/RCTBridgeModule.h>

@interface AppVersionModule : NSObject <RCTBridgeModule>
@end

@implementation AppVersionModule

RCT_EXPORT_MODULE();

- (NSDictionary *)constantsToExport
{
  NSString *versionName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"] ?: @"";
  NSString *buildNumber = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"] ?: @"0";
  return @{
    @"versionName": versionName,
    @"versionCode": @([buildNumber integerValue])
  };
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
