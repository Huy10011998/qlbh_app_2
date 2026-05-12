const fs = require('fs');
const path = require('path');

const nodeBinary = process.execPath;

function patchFile(relativePath, transforms, label) {
  const targetFile = path.join(__dirname, '..', ...relativePath);
  if (!fs.existsSync(targetFile)) {
    return false;
  }

  const original = fs.readFileSync(targetFile, 'utf8');
  let updated = original;

  for (const [searchValue, replaceValue] of transforms) {
    updated = updated.replaceAll(searchValue, replaceValue);
  }

  if (updated === original) {
    return false;
  }

  fs.writeFileSync(targetFile, updated);
  console.log(`Applied ${label} Gradle compatibility patch.`);
  return true;
}

patchFile(
  ['node_modules', '@react-native-community', 'netinfo', 'android', 'build.gradle'],
  [
    [
      'def netInfoNodeBinary = "/Users/quochuy/.nvm/versions/node/v20.20.0/bin/node"',
      `project.ext.set("netInfoNodeBinary", "${nodeBinary}")`,
    ],
    [
      `  // Fallback to node resolver for custom directory structures like monorepos.
  def reactNativePackage = file(
          providers.exec {
              workingDir(rootDir)
              commandLine(netInfoNodeBinary, "--print", "require.resolve('react-native/package.json')")
          }.standardOutput.asText.get().trim()
  )`,
      `  // Fallback to node resolver for custom directory structures like monorepos.
  def nodeBinary = project.ext.get("netInfoNodeBinary")
  def reactNativePackage = file(
          providers.exec {
              workingDir(rootDir)
              commandLine(nodeBinary, "--print", "require.resolve('react-native/package.json')")
          }.standardOutput.asText.get().trim()
  )`,
    ],
    [
      `[netInfoNodeBinary, "--print", "require.resolve('react-native/package.json')"]`,
      `[project.ext.get("netInfoNodeBinary"), "--print", "require.resolve('react-native/package.json')"]`,
    ],
  ],
  'NetInfo',
);

patchFile(
  ['node_modules', 'react-native-gesture-handler', 'android', 'build.gradle'],
  [
    [
      `def resolveReactNativeDirectory() {`,
      `project.ext.set("rnghNodeBinary", "${nodeBinary}")\n\ndef resolveReactNativeDirectory() {`,
    ],
    [
      `    // Fallback to node resolver for custom directory structures like monorepos.
    def reactNativePackage = file(
        providers.exec {
            workingDir(rootDir)
            commandLine("node", "--print", "require.resolve('react-native/package.json')")
        }.standardOutput.asText.get().trim()
    )`,
      `    // Fallback to node resolver for custom directory structures like monorepos.
    def nodeBinary = project.ext.get("rnghNodeBinary")
    def reactNativePackage = file(
        providers.exec {
            workingDir(rootDir)
            commandLine(nodeBinary, "--print", "require.resolve('react-native/package.json')")
        }.standardOutput.asText.get().trim()
    )`,
    ],
  ],
  'Gesture Handler',
);

patchFile(
  ['node_modules', 'react-native-screens', 'android', 'build.gradle'],
  [
    [
      `def resolveReactNativeDirectory() {`,
      `project.ext.set("rnsNodeBinary", "${nodeBinary}")\n\ndef resolveReactNativeDirectory() {`,
    ],
    [
      `    // We're in non standard setup, e.g. monorepo - try to use node resolver to locate the react-native package.
    String maybeRnPackagePath = providers.exec {
        workingDir(rootDir)
        commandLine("node", "--print", "require.resolve('react-native/package.json')")
    }.standardOutput.asText.get().trim()`,
      `    // We're in non standard setup, e.g. monorepo - try to use node resolver to locate the react-native package.
    def nodeBinary = project.ext.get("rnsNodeBinary")
    String maybeRnPackagePath = providers.exec {
        workingDir(rootDir)
        commandLine(nodeBinary, "--print", "require.resolve('react-native/package.json')")
    }.standardOutput.asText.get().trim()`,
    ],
  ],
  'React Native Screens',
);

const vectorIconsImplFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-vector-icons',
  'android',
  'src',
  'main',
  'java',
  'com',
  'oblador',
  'vectoricons',
  'VectorIconsModuleImpl.java',
);

if (!fs.existsSync(vectorIconsImplFile)) {
  fs.writeFileSync(
    vectorIconsImplFile,
    `package com.oblador.vectoricons;

import com.facebook.react.bridge.ReactApplicationContext;

public final class VectorIconsModuleImpl {
    public static final String NAME = "RNVectorIcons";

    private VectorIconsModuleImpl() {
    }

    public static String getImageForFont(
            String fontFamily,
            String glyph,
            int fontSize,
            int color,
            ReactApplicationContext context
    ) {
        throw new UnsupportedOperationException(
                "react-native-vector-icons native image generation is unavailable in this build."
        );
    }
}
`,
  );
  console.log('Applied React Native Vector Icons compatibility patch.');
}
