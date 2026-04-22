import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import ReactNativeBiometrics from "react-native-biometrics";
import * as Keychain from "react-native-keychain";
import { useAuth } from "../../context/AuthContext";
import { loginApi } from "../../services/auth/AuthApi";
import IsLoading from "../../components/ui/IconLoading";
// import { getPermission } from "../../services/Index";
// import { setPermissions } from "../../store/PermissionSlice";
import {
  hardResetApi,
  sendFCMActiveStatus,
  setRefreshInApi,
  setStoredUserId,
  setTokenInApi,
} from "../../services/data/CallApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useAppDispatch } from "../../store/Hooks";
import LinearGradient from "react-native-linear-gradient";

export default function LoginScreen() {
  const { setToken, setRefreshToken, setIosAuthenticated, token } = useAuth();

  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoginDisabled, setIsLoginDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const rnBiometrics = useRef(new ReactNativeBiometrics()).current;

  // const dispatch = useAppDispatch();

  // Enable / Disable Login button
  useEffect(() => {
    setIsLoginDisabled(!(userName.trim() && userPassword.trim()));
  }, [userName, userPassword]);

  // Reset trạng thái loading khi quay lại màn Login
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // LOGIN THƯỜNG
  const handlePressLogin = async () => {
    if (isLoading) return;

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      hardResetApi(); // reset CallApi state before login
      const res = await loginApi(userName, userPassword);

      if (res?.data?.accessToken) {
        const loginResponseData = res.data as any;

        await setToken(loginResponseData.accessToken);
        await setRefreshToken(loginResponseData.refreshToken ?? null);

        setTokenInApi(loginResponseData.accessToken);
        setRefreshInApi(loginResponseData.refreshToken ?? null);

        const loginUserId =
          loginResponseData?.iD_User ??
          loginResponseData?.ID_User ??
          loginResponseData?.userId ??
          loginResponseData?.id ??
          null;

        await setStoredUserId(
          typeof loginUserId === "string" ? Number(loginUserId) : loginUserId,
        );

        await sendFCMActiveStatus(true, loginUserId ?? null);

        // Lưu lại login thường (không phải FaceID)
        await Keychain.setGenericPassword(userName, userPassword, {
          service: "auth-login",
          accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        });

        // Lấy quyền
        // const permissionRes = await getPermission();
        // dispatch(setPermissions(permissionRes.data));

        if (Platform.OS === "ios") {
          setIosAuthenticated(true);
        }
      }
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 401) {
        Alert.alert(
          "Đăng nhập thất bại",
          message || "Sai tài khoản hoặc mật khẩu.",
        );
      } else if (!err.response) {
        Alert.alert(
          "Lỗi kết nối",
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.",
        );
      } else {
        Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFaceIDRunning = useRef(false);

  // LOGIN BẰNG FACEID (chỉ dùng Keychain prompt)
  const handleFaceIDLogin = async () => {
    if (isFaceIDRunning.current) return;
    isFaceIDRunning.current = true;

    try {
      // Check sensor (không trigger prompt)
      const { available } = await rnBiometrics.isSensorAvailable();
      if (!available) {
        Alert.alert("FaceID", "Thiết bị không hỗ trợ FaceID.");
        return;
      }

      // Check user có bật FaceID trong Settings chưa
      const enabled = await AsyncStorage.getItem("faceid-enabled");
      if (enabled !== "1") {
        Alert.alert(
          "FaceID",
          "Bạn chưa bật đăng nhập bằng FaceID trong Cài đặt. Vui lòng đăng nhập bằng tài khoản và mật khẩu, sau đó vào Cài đặt để bật tính năng này.",
        );
        return;
      }

      // Get credentials → iOS sẽ auto prompt FaceID
      const credentials = await Keychain.getGenericPassword({
        service: "auth-login",
        authenticationPrompt: {
          title: "Xác thực",
          subtitle: "Sử dụng FaceID để đăng nhập",
          description: "Đăng nhập bằng FaceID",
          cancel: "Huỷ",
        },
      });

      if (!credentials) {
        Alert.alert("FaceID", "Không tìm thấy thông tin đăng nhập FaceID.");
        return;
      }

      setIsLoading(true);

      hardResetApi();

      const response = await loginApi(
        credentials.username,
        credentials.password,
      );

      if (response?.data?.accessToken) {
        const loginResponseData = response.data as any;

        await setToken(loginResponseData.accessToken);
        await setRefreshToken(loginResponseData.refreshToken ?? null);

        setTokenInApi(loginResponseData.accessToken);
        setRefreshInApi(loginResponseData.refreshToken ?? null);

        const loginUserId =
          loginResponseData?.iD_User ??
          loginResponseData?.ID_User ??
          loginResponseData?.userId ??
          loginResponseData?.id ??
          null;

        await setStoredUserId(
          typeof loginUserId === "string" ? Number(loginUserId) : loginUserId,
        );

        await sendFCMActiveStatus(true, loginUserId ?? null);

        // const permissionRes = await getPermission();
        // dispatch(setPermissions(permissionRes.data));

        setIosAuthenticated(true);
      } else {
        Alert.alert("Đăng nhập thất bại", "Sai tài khoản hoặc mật khẩu.");
      }
    } catch (err: any) {
      // iOS: user cancel FaceID → err.code = -128
      if (err?.code !== "-128") {
        Alert.alert("Lỗi", "Không thể đăng nhập bằng FaceID.");
      }
    } finally {
      setIsLoading(false);
      isFaceIDRunning.current = false; // luôn reset → bấm lần 2 OK
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={["#0F4D3A", "#1B5E20"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            <View style={styles.card}>
              <View style={styles.top}>
                <Image
                  source={require("../../assets/images/logo-ecohost.jpg")}
                  style={styles.logo}
                />
              </View>

              <View style={styles.bottom}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Tài khoản"
                    placeholderTextColor="#888"
                    value={userName}
                    onChangeText={setUserName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!isPasswordVisible}
                    placeholder="Mật khẩu"
                    placeholderTextColor="#888"
                    value={userPassword}
                    onChangeText={setUserPassword}
                  />

                  <TouchableOpacity
                    style={styles.iconEyeContainer}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <Image
                      source={
                        isPasswordVisible
                          ? require("../../assets/images/iconEye-hide.png")
                          : require("../../assets/images/iconEye-view.png")
                      }
                      style={styles.iconEye}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.btn, isLoginDisabled && styles.disabledBtn]}
                    disabled={isLoginDisabled || isLoading}
                    onPress={handlePressLogin}
                  >
                    <Text style={styles.btnText}>Đăng nhập</Text>
                  </TouchableOpacity>

                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      style={styles.faceID}
                      onPress={handleFaceIDLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <IsLoading size="large" color="#FF3333" />
                      ) : (
                        <Image
                          source={require("../../assets/images/faceid-icon2.png")}
                          style={styles.faceIDIcon}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,

    // shadow iOS
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    // shadow Android
    elevation: 5,
  },

  logo: { resizeMode: "contain", width: 300, height: 150 },

  top: {
    alignItems: "center",
    marginBottom: 20,
  },

  bottom: {
    width: "100%",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 50,
    elevation: 2,
  },

  textInput: { flex: 1, fontSize: 15, color: "#333" },
  iconEyeContainer: { padding: 6 },
  iconEye: { width: 22, height: 22 },

  btn: {
    flex: 1,
    height: 55,
    borderRadius: 12,
    backgroundColor: "#0F4D3A",
    justifyContent: "center",
    alignItems: "center",
  },

  disabledBtn: { backgroundColor: "#ccc" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  faceID: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },

  faceIDIcon: { width: 34, height: 34 },

  row: { flexDirection: "row", alignItems: "center", marginTop: 24 },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,

    // shadow iOS
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    // shadow Android
    elevation: 5,
  },
});
