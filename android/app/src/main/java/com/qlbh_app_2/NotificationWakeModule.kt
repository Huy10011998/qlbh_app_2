package com.qlbh_app_2

import android.content.Intent
import android.os.PowerManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NotificationWakeModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NotificationWakeModule"

  @ReactMethod
  fun wakeScreen() {
    val powerManager = reactContext.getSystemService(PowerManager::class.java) ?: return

    @Suppress("DEPRECATION")
    val wakeLock = powerManager.newWakeLock(
      PowerManager.SCREEN_BRIGHT_WAKE_LOCK or
        PowerManager.ACQUIRE_CAUSES_WAKEUP or
        PowerManager.ON_AFTER_RELEASE,
      "qlbh_app_2:NotificationWakeModule",
    )

    wakeLock.acquire(4000)

    val intent = Intent(reactContext, WakeLockActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
      addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS)
    }

    try {
      reactContext.startActivity(intent)
    } catch (_: Exception) {
      // Some Android builds block background activity starts; the wake lock above is the fallback.
    }
  }
}
