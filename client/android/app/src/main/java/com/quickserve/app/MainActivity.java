package com.quickserve.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        // Configure Navigation Bar Color and Native Divider Border (Android 9+ / API 28+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getWindow().setNavigationBarColor(0xFFFFFFFF);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                getWindow().setNavigationBarDividerColor(0xFFCBD5E1); // Clean slate-300 divider border
            }
        }

        // Apply Navigation Bar Bottom Insets as Padding to Root Content View
        // Physically guarantees WebView content ends above the 3-button bar with clean separation
        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, insets) -> {
                Insets navBars = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
                v.setPadding(0, 0, 0, navBars.bottom);
                return insets;
            });
        }

        // Native Hardware Back Button Dispatcher for 3-Button Navigation
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().post(() -> {
                        getBridge().getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('hardwareBackButton'));", null
                        );
                    });
                }
            }
        });
    }
}
