jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn().mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    }),
  },
}));

jest.mock("react-native-keychain", () => ({
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: "BIOMETRY_CURRENT_SET",
    BIOMETRY_ANY_OR_DEVICE_PASSCODE: "BIOMETRY_ANY_OR_DEVICE_PASSCODE",
  },
  ACCESSIBLE: {
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: "WHEN_PASSCODE_SET_THIS_DEVICE_ONLY",
  },
  getGenericPassword: jest.fn().mockResolvedValue(false),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  setGenericPassword: jest.fn().mockResolvedValue(true),
}));

jest.mock("react-native-biometrics", () =>
  jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn().mockResolvedValue({ available: false }),
    simplePrompt: jest.fn().mockResolvedValue({ success: false }),
  })),
);

jest.mock("@react-native-firebase/messaging", () => {
  const messaging = () => ({
    getToken: jest.fn().mockResolvedValue("test-fcm-token"),
    onMessage: jest.fn(() => jest.fn()),
    requestPermission: jest.fn().mockResolvedValue(1),
    setBackgroundMessageHandler: jest.fn(),
    hasPermission: jest.fn().mockResolvedValue(1),
  });

  messaging.AuthorizationStatus = {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };

  return messaging;
});

jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue(undefined),
    displayNotification: jest.fn().mockResolvedValue(undefined),
    getDisplayedNotifications: jest.fn().mockResolvedValue([]),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    getNotificationSettings: jest.fn().mockResolvedValue({
      authorizationStatus: 1,
    }),
    onBackgroundEvent: jest.fn(),
    onForegroundEvent: jest.fn(() => jest.fn()),
    openNotificationSettings: jest.fn().mockResolvedValue(undefined),
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    setBadgeCount: jest.fn().mockResolvedValue(undefined),
  },
  AndroidImportance: {
    NONE: 0,
    LOW: 2,
    DEFAULT: 3,
    HIGH: 4,
  },
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
  EventType: {
    APP_BLOCKED: 1,
    DISMISSED: 2,
    PRESS: 3,
  },
}));

jest.mock("react-native-linear-gradient", () => "LinearGradient");
jest.mock("react-native-date-picker", () => "DatePicker");
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
