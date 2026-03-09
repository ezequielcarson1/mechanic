const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin that patches ios/Podfile to make @react-native-firebase/auth
 * work as a static framework.  Survives `expo prebuild --clean` (EAS builds).
 *
 * Adds:
 *   - use_modular_headers!  (after use_frameworks!)
 *   - CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES  (in post_install)
 */
const withFirebasePodfile = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      // 1. Add $RNFirebaseAsStaticFramework = true before prepare_react_native_project! if not present
      if (!podfile.includes('$RNFirebaseAsStaticFramework')) {
        podfile = podfile.replace(
          'prepare_react_native_project!',
          '# Required for @react-native-firebase to build as static framework\n$RNFirebaseAsStaticFramework = true\n\nprepare_react_native_project!'
        );
      }

      // 2. Add use_modular_headers! after the first use_frameworks! line if not already present
      if (!podfile.includes('use_modular_headers!')) {
        podfile = podfile.replace(
          /(\s+use_frameworks!.*?\n)/,
          '$1  use_modular_headers!\n'
        );
      }

      // 2. Add CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES in post_install if not present
      if (!podfile.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        podfile = podfile.replace(
          /([ \t]*react_native_post_install\([\s\S]*?\)\s*\n)/,
          '$1\n    installer.pods_project.targets.each do |target|\n      target.build_configurations.each do |config|\n        config.build_settings[\'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES\'] = \'YES\'\n      end\n    end\n'
        );
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};

module.exports = withFirebasePodfile;
