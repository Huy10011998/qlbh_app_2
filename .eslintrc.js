module.exports = {
  root: true,
  extends: "@react-native",
  rules: {
    "react-native/no-inline-styles": "off",
    "react/no-unstable-nested-components": "off",
  },
  overrides: [
    {
      files: ["jest.setup.js", "__mocks__/**/*.js"],
      env: {
        jest: true,
        node: true,
      },
    },
  ],
};
