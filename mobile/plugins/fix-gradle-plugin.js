const { withSettingsGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to fix a known compatibility issue between Gradle 9.0.0
 * and the foojay-resolver-convention plugin in early SDK 55 releases.
 */
module.exports = (config) => {
  return withSettingsGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = config.modResults.contents.replace(
        /id\("org\.gradle\.toolchains\.foojay-resolver-convention"\)\.version\("0\.5\.0"\)/g,
        'id("org.gradle.toolchains.foojay-resolver-convention").version("0.9.0")'
      );
    }
    return config;
  });
};
