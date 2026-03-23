import { RouteProp, NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// =====================================================
// COMMON TYPES
// =====================================================

export type PropertyClass = {
  isTuDongTang?: boolean;
  propertyTuDongTang?: string;
  formatTuDongTang?: string;
  prentTuDongTang?: string;
  prefix?: string;
};

// chỉnh mode thành optional
export type OptionalParams = {
  propertyReference?: string;
  nameClass?: string;
  nameClassRoot?: string;
  id?: string;
  field?: any;
  name?: string;
  idRoot?: string;
  logID?: number;
  id_previous?: string;
  item?: Record<string, any>;
  mode?: string;
  activeTab?: string;
  titleHeader?: string;
  propertyClass?: PropertyClass;
};

export type HomeTabParamList = {
  AssetRelatedList: {
    idRoot: string;
    nameClass: string;
    propertyReference: string;
    nameClassRoot?: string;
    titleHeader?: string;
  };

  AssetList: {
    nameClass?: string;
    titleHeader?: string;
    idRoot?: string;
    propertyReference?: string;
    isBuildTree?: boolean;
  };
};

// =====================================================
// ROOT STACK PARAM LIST
// =====================================================
export type RootStackParamList = {
  /** ================= AUTH ================= */
  Login: undefined;

  /** ================= ROOT ================= */
  Tabs: undefined;
  Home: undefined;
  HomeTab: NavigatorScreenParams<HomeTabParamList>;
  /** ================= SETTINGS ================= */
  Settings: undefined;
  Profile: undefined;

  /** ================= ASSET ================= */
  Asset: undefined;
  Camera: undefined;
  CameraList: {
    iD_Camera: number;
    iD_Camera_MoTa: string;
    iD_Camera_Ma: string;
  };
  CameraListGrid: undefined;

  AssetList: {
    nameClass?: string;
    titleHeader?: string;
    idRoot?: string;
    propertyReference?: string;
    isBuildTree?: boolean;
  };
};

// =====================================================
// GENERIC NAVIGATION HELPERS
// =====================================================
export type StackNavigation<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

export type StackRoute<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

// =====================================================
// SCREEN-SPECIFIC TYPES
// =====================================================
export type HomeNavigationProp = StackNavigation<"Home">;
