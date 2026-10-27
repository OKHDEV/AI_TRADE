package com.aiquant.autotrader;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.widget.EditText;
import android.text.InputType;
import android.webkit.JsPromptResult;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.List;
public class MainActivity extends Activity {
    private static final String CHANNEL_ID = "ai_quant_owner_approval_v6";
    private WebView webView;
    private int notifIdCounter = 1001;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#090D16"));
            window.setNavigationBarColor(Color.parseColor("#090D16"));
        }
        if (Build.VERSION.SDK_INT >= 24) {
            try {
                java.lang.reflect.Method m = android.os.StrictMode.class.getMethod("disableDeathOnFileUriExposure");
                m.invoke(null);
            } catch (Exception ignored) {}
        }
        createNotificationChannel();
        requestNotificationPermissionIfNeeded();
        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#0B1120"));
        setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setTextZoom(100);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("메리츠 AI 자동 주식")
                        .setMessage(message)
                        .setPositiveButton("확인", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.confirm();
                            }
                        })
                        .setCancelable(false)
                        .create()
                        .show();
                return true;
            }
            @Override
            public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("최종 승인 확인")
                        .setMessage(message)
                        .setPositiveButton("허락 (승인)", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.confirm();
                            }
                        })
                        .setNegativeButton("거절 (취소)", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.cancel();
                            }
                        })
                        .setCancelable(false)
                        .create()
                        .show();
                return true;
            }
            @Override
            public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, final JsPromptResult result) {
                final EditText input = new EditText(MainActivity.this);
                input.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_VARIATION_PASSWORD);
                input.setHint("보안 PIN 번호");
                if (defaultValue != null) {
                    input.setText(defaultValue);
                }
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("보안 PIN 인증")
                        .setMessage(message)
                        .setView(input)
                        .setPositiveButton("확인", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.confirm(input.getText().toString());
                            }
                        })
                        .setNegativeButton("취소", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.cancel();
                            }
                        })
                        .setCancelable(false)
                        .create()
                        .show();
                return true;
            }
        });
        // 새 APK 설치 감지 시 내부 캐시된 이전 index.html 자동 초기화
        try {
            android.content.pm.PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            android.content.SharedPreferences sp = getSharedPreferences("app_meta", MODE_PRIVATE);
            long savedTime = sp.getLong("pkg_update_time", 0);
            int savedVer = sp.getInt("pkg_ver_code", 0);
            if (pInfo.versionCode > savedVer || pInfo.lastUpdateTime > savedTime) {
                java.io.File cachedHtml = new java.io.File(getFilesDir(), "index.html");
                if (cachedHtml.exists()) {
                    cachedHtml.delete();
                }
                sp.edit()
                        .putLong("pkg_update_time", pInfo.lastUpdateTime)
                        .putInt("pkg_ver_code", pInfo.versionCode)
                        .apply();
            }
        } catch (Exception ignored) {}
        java.io.File localHtml = new java.io.File(getFilesDir(), "index.html");
        if (localHtml.exists() && localHtml.length() > 1000) {
            webView.loadUrl("file://" + localHtml.getAbsolutePath());
        } else {
            webView.loadUrl("file:///android_asset/index.html");
        }
    }
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "메리츠 AI 자동 주식 승인 알림",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("AI가 실전 주식을 매수/매도하기 전 고객님께 허락을 구하는 긴급 알림입니다.");
                channel.enableLights(true);
                channel.setLightColor(Color.RED);
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 500, 200, 500});
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                channel.setBypassDnd(true);
                Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                AudioAttributes aa = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                        .build();
                channel.setSound(soundUri, aa);
                nm.createNotificationChannel(channel);
            }
        }
    }
    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 101);
            }
        }
    }
    private void triggerVibration(long ms) {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(ms);
                }
            }
        } catch (Exception ignored) {
        }
    }
    public class AndroidBridge {
        @JavascriptInterface
        public void showToast(final String msg) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();
                }
            });
        }
        @JavascriptInterface
        public void sendOwnerNotification(final String title, final String message) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        if (Build.VERSION.SDK_INT >= 33) {
                            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 101);
                            }
                        }
                        triggerVibration(450);
                        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                        if (nm == null) return;
                        if (!nm.areNotificationsEnabled()) {
                            Toast.makeText(MainActivity.this, "⚠️ 스마트폰 설정에서 앱의 알림 권한을 켜주세요!", Toast.LENGTH_LONG).show();
                        }
                        Intent intent = new Intent(MainActivity.this, MainActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            flags |= PendingIntent.FLAG_IMMUTABLE;
                        }
                        PendingIntent pi = PendingIntent.getActivity(MainActivity.this, 0, intent, flags);
                        Notification.Builder builder;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            builder = new Notification.Builder(MainActivity.this, CHANNEL_ID);
                        } else {
                            builder = new Notification.Builder(MainActivity.this);
                        }
                        Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                        builder.setSmallIcon(R.drawable.ic_launcher)
                                .setContentTitle(title)
                                .setContentText(message)
                                .setStyle(new Notification.BigTextStyle().bigText(message))
                                .setPriority(Notification.PRIORITY_MAX)
                                .setDefaults(Notification.DEFAULT_ALL)
                                .setSound(soundUri)
                                .setVibrate(new long[]{0, 500, 200, 500})
                                .setAutoCancel(true)
                                .setContentIntent(pi);
                        nm.notify(notifIdCounter++, builder.build());
                        Toast.makeText(MainActivity.this, "🔔 스마트폰 상단에 알림이 울렸습니다! (상단바 확인)", Toast.LENGTH_SHORT).show();
                    } catch (Exception ignored) {
                    }
                }
            });
        }
        @JavascriptInterface
        public void copyToClipboard(final String label, final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        ClipboardManager cb = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                        if (cb != null) {
                            cb.setPrimaryClip(ClipData.newPlainText(label, text));
                            Toast.makeText(MainActivity.this, "클립보드 복사 완료: " + text, Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception ignored) {
                    }
                }
            });
        }
        @JavascriptInterface
        public void launchMeritzMts(final String stockCode) {
            launchMeritzMtsWithStock(stockCode, "");
        }
        @JavascriptInterface
        public void openStockTradeWindow(final String stockCode, final String stockName) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        final String pureCode = (stockCode != null && !stockCode.isEmpty()) ? stockCode.replace("A", "").trim() : "005930";
                        final String name = (stockName != null && !stockName.isEmpty()) ? stockName : pureCode;
                        Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://m.stock.naver.com/item/" + pureCode + "/trade"));
                        webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(webIntent);
                        Toast.makeText(MainActivity.this, "🌐 " + name + " (" + pureCode + ") 실시간 주식창 이동", Toast.LENGTH_SHORT).show();
                    } catch (Exception ignored) {}
                }
            });
        }
        @JavascriptInterface
        public void launchMeritzMtsWithStock(final String stockCode, final String stockName) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    final String pureCode = (stockCode != null && !stockCode.isEmpty()) ? stockCode.replace("A", "").trim() : "005930";
                    try {
                        final String formattedCode = "A" + pureCode;
                        final String name = (stockName != null && !stockName.isEmpty()) ? stockName : pureCode;
                        // 1. 클립보드에 종목코드 복사
                        ClipboardManager cb = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                        if (cb != null) {
                            cb.setPrimaryClip(ClipData.newPlainText("종목코드", pureCode));
                        }
                        PackageManager pm = getPackageManager();
                        String[] meritzPackages = new String[]{
                                "com.imeritz.smartmeritz",
                                "com.meritz.smart",
                                "com.meritz.meritzsmart",
                                "com.meritz.mts"
                        };
                        // 2. 딥링크 URI 스킴 후보군 (종목 상세/주문 화면 직결 시도)
                        String[] candidateUris = new String[]{
                                "smartmeritz://domestic/stock/" + pureCode,
                                "smartmeritz://domestic/order/" + pureCode,
                                "smartmeritz://stock?code=" + pureCode + "&iscd=" + formattedCode,
                                "smartmeritz://order?code=" + pureCode + "&iscd=" + formattedCode,
                                "smartmeritz://item/" + pureCode,
                                "smartmeritz://item?code=" + pureCode,
                                "smartmeritz://trade?code=" + pureCode,
                                "meritzmts://order?code=" + pureCode + "&iscd=" + formattedCode,
                                "meritzmts://stock?code=" + pureCode + "&iscd=" + formattedCode,
                                "meritzmts://item?code=" + pureCode,
                                "intent://stock?code=" + pureCode + "#Intent;scheme=smartmeritz;package=com.imeritz.smartmeritz;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end",
                                "intent://order?code=" + pureCode + "#Intent;scheme=smartmeritz;package=com.imeritz.smartmeritz;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end"
                        };
                        for (String pkg : meritzPackages) {
                            // 2-1) 딥링크 스킴으로 직접 종목 화면 열기 시도
                            for (String uriStr : candidateUris) {
                                try {
                                    Intent viewIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(uriStr));
                                    viewIntent.setPackage(pkg);
                                    viewIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    if (viewIntent.resolveActivity(pm) != null) {
                                        startActivity(viewIntent);
                                        Toast.makeText(MainActivity.this, "📱 " + name + "(" + pureCode + ") 메리츠 주식창 이동", Toast.LENGTH_SHORT).show();
                                        return;
                                    }
                                } catch (Exception ignored) {}
                            }
                            // 2-2) 패키지 런처 인텐트에 종목 파라미터(Extras) 주입하여 실행
                            Intent launchIntent = pm.getLaunchIntentForPackage(pkg);
                            if (launchIntent != null) {
                                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                launchIntent.putExtra("code", pureCode);
                                launchIntent.putExtra("stockCode", pureCode);
                                launchIntent.putExtra("stock_code", pureCode);
                                launchIntent.putExtra("itemCode", formattedCode);
                                launchIntent.putExtra("iscd", formattedCode);
                                launchIntent.putExtra("symbol", pureCode);
                                launchIntent.putExtra("stock_name", name);
                                launchIntent.putExtra("screenNo", "1000");
                                launchIntent.putExtra("screen_no", "1000");
                                launchIntent.putExtra("SEARCH_WORD", pureCode);
                                launchIntent.putExtra("query", pureCode);
                                startActivity(launchIntent);
                                Toast.makeText(MainActivity.this, "📱 " + name + " (" + pureCode + ") 메리츠 SMART 실행", Toast.LENGTH_SHORT).show();
                                return;
                            }
                        }
                        // 기기에 설치된 전체 런처 앱 중 'meritz' 또는 '메리츠'가 포함된 앱 자동 탐색
                        Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
                        mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);
                        List<ResolveInfo> apps = pm.queryIntentActivities(mainIntent, 0);
                        if (apps != null) {
                            for (ResolveInfo info : apps) {
                                if (info.activityInfo != null && info.activityInfo.packageName != null) {
                                    String pName = info.activityInfo.packageName.toLowerCase();
                                    String label = info.loadLabel(pm) != null ? info.loadLabel(pm).toString() : "";
                                    if (!pName.equals("com.aiquant.autotrader") && (pName.contains("meritz") || label.contains("메리츠"))) {
                                        Intent launch = pm.getLaunchIntentForPackage(info.activityInfo.packageName);
                                        if (launch != null) {
                                            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                            launch.putExtra("code", pureCode);
                                            launch.putExtra("stockCode", pureCode);
                                            launch.putExtra("iscd", formattedCode);
                                            startActivity(launch);
                                            Toast.makeText(MainActivity.this, label + " 앱 실행 (" + pureCode + ")", Toast.LENGTH_SHORT).show();
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                        // 미설치 시 실시간 주식 호가/주문창 직행
                        Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://m.stock.naver.com/item/" + pureCode + "/trade"));
                        webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(webIntent);
                        Toast.makeText(MainActivity.this, "🌐 " + name + " 실시간 주식창 이동", Toast.LENGTH_SHORT).show();
                    } catch (Exception e) {
                        try {
                            Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://m.stock.naver.com/item/" + pureCode + "/trade"));
                            webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(webIntent);
                        } catch (Exception ignored) {
                        }
                    }
                }
            });
        }
        private String sanitizeUrl(String rawUrl) {
            if (rawUrl == null) return "";
            String s = rawUrl.trim();
            // %25 이중 인코딩 복원 (%25EB -> %EB)
            while (s.contains("%25")) {
                s = s.replace("%25", "%");
            }
            // URL 내에 한글 등 127 초과 문자가 있을 때만 1회 인코딩 수행
            boolean hasNonAscii = false;
            for (int i = 0; i < s.length(); i++) {
                if (s.charAt(i) > 127) {
                    hasNonAscii = true;
                    break;
                }
            }
            if (hasNonAscii) {
                try {
                    URL u = new URL(s);
                    java.net.URI uriObj = new java.net.URI(u.getProtocol(), u.getUserInfo(), u.getHost(), u.getPort(), u.getPath(), u.getQuery(), u.getRef());
                    s = uriObj.toASCIIString();
                } catch (Exception ignored) {}
            }
            return s;
        }
        @JavascriptInterface
        public void openInBrowser(final String urlStr) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        if (urlStr == null || urlStr.trim().isEmpty()) return;
                        String clean = sanitizeUrl(urlStr);
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(clean));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "브라우저 열기 실패: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }
        @JavascriptInterface
        public void promptApkInstall() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (!getPackageManager().canRequestPackageInstalls()) {
                        Intent manage = new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                        manage.setData(Uri.parse("package:" + getPackageName()));
                        manage.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(manage);
                    }
                }
                Uri contentUri = Uri.parse("content://com.aiquant.autotrader.apkprovider/update.apk");
                Intent install = new Intent(Intent.ACTION_VIEW);
                install.setDataAndType(contentUri, "application/vnd.android.package-archive");
                install.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(install);
            } catch (Exception e) {
                try {
                    java.io.File file = new java.io.File(getCacheDir(), "update.apk");
                    Intent install = new Intent(Intent.ACTION_VIEW);
                    install.setDataAndType(Uri.fromFile(file), "application/vnd.android.package-archive");
                    install.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(install);
                } catch (Exception ignored) {}
            }
        }
        @JavascriptInterface
        public void reloadApp() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    java.io.File localHtml = new java.io.File(getFilesDir(), "index.html");
                    if (localHtml.exists()) {
                        webView.loadUrl("file://" + localHtml.getAbsolutePath());
                    } else {
                        webView.loadUrl("file:///android_asset/index.html");
                    }
                }
            });
        }
        @JavascriptInterface
        public void downloadAndApplyUpdate(final String downloadUrl) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    HttpURLConnection conn = null;
                    InputStream is = null;
                    FileOutputStream fos = null;
                    try {
                        String curUrl = (downloadUrl != null) ? downloadUrl.trim() : "";
                        if (curUrl.isEmpty()) {
                            throw new Exception("다운로드 URL이 비어있습니다.");
                        }
                        // 최초 URL만 sanitize 수행 (리다이렉트 S3 URL은 재인코딩 금지)
                        curUrl = sanitizeUrl(curUrl);
                        for (int redirect = 0; redirect < 7; redirect++) {
                            URL url = new URL(curUrl);
                            conn = (HttpURLConnection) url.openConnection();
                            conn.setRequestMethod("GET");
                            conn.setConnectTimeout(15000);
                            conn.setReadTimeout(30000);
                            conn.setInstanceFollowRedirects(true);
                            conn.setUseCaches(false);
                            conn.setDefaultUseCaches(false);
                            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) Meritz-AI-Stock-App/4.5");
                            conn.setRequestProperty("Accept", "*/*");
                            conn.setRequestProperty("Cache-Control", "no-cache, no-store, must-revalidate");
                            conn.setRequestProperty("Pragma", "no-cache");
                            conn.setRequestProperty("Expires", "0");

                            int code = conn.getResponseCode();
                            if (code == HttpURLConnection.HTTP_MOVED_PERM || code == HttpURLConnection.HTTP_MOVED_TEMP || code == 307 || code == 308) {
                                String loc = conn.getHeaderField("Location");
                                if (loc != null && !loc.trim().isEmpty()) {
                                    conn.disconnect();
                                    curUrl = loc.trim();
                                    continue;
                                }
                            }
                            if (code < 200 || code >= 300) {
                                throw new Exception("서버 응답 오류 (HTTP " + code + ")");
                            }
                            break;
                        }
                        final long totalBytes = (conn != null) ? conn.getContentLength() : -1;
                        if (conn != null) is = conn.getInputStream();
                        java.io.File tempApk = new java.io.File(getCacheDir(), "update.apk");
                        if (tempApk.exists()) tempApk.delete();
                        fos = new FileOutputStream(tempApk);
                        byte[] buf = new byte[16384];
                        long downloaded = 0;
                        int read;
                        long lastReport = 0;
                        if (is != null) {
                            while ((read = is.read(buf)) != -1) {
                                fos.write(buf, 0, read);
                                downloaded += read;
                                long now = System.currentTimeMillis();
                                if (now - lastReport > 60 || downloaded == totalBytes) {
                                    lastReport = now;
                                    final int pct = (totalBytes > 0) ? (int)((downloaded * 100) / totalBytes) : Math.min(95, (int)(downloaded / 20000));
                                    final long d = downloaded;
                                    final long t = totalBytes;
                                    runOnUiThread(new Runnable() {
                                        @Override
                                        public void run() {
                                            if (webView != null) {
                                                webView.evaluateJavascript("if (window.onUpdateDownloadProgress) window.onUpdateDownloadProgress(" + pct + ", " + d + ", " + t + ");", null);
                                            }
                                        }
                                    });
                                }
                            }
                            fos.flush();
                        }
                        if (fos != null) { fos.close(); fos = null; }
                        if (is != null) { is.close(); is = null; }

                        // 1. 최신 APK 압축에서 assets/index.html을 앱 내부 저장소로 추출 (무설치 즉각 반영)
                        boolean extracted = false;
                        try {
                            java.util.zip.ZipFile zip = new java.util.zip.ZipFile(tempApk);
                            java.util.zip.ZipEntry entry = zip.getEntry("assets/index.html");
                            if (entry != null) {
                                InputStream zis = zip.getInputStream(entry);
                                java.io.File localHtml = new java.io.File(getFilesDir(), "index.html");
                                FileOutputStream hfos = new FileOutputStream(localHtml);
                                byte[] hbuf = new byte[16384];
                                int hlen;
                                while ((hlen = zis.read(hbuf)) != -1) {
                                    hfos.write(hbuf, 0, hlen);
                                }
                                hfos.flush();
                                hfos.close();
                                zis.close();
                                extracted = true;
                            }
                            zip.close();
                        } catch (Exception ignored) {}

                        final boolean success = extracted;
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                if (webView != null) {
                                    webView.evaluateJavascript("if (window.onUpdateComplete) window.onUpdateComplete(" + success + ");", null);
                                }
                            }
                        });

                        // 2. 패키지 설치 창 호출 (웹뷰는 로딩 대기 화면에 유지)
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                promptApkInstall();
                            }
                        });
                    } catch (final Exception e) {
                        final String rawMsg = (e.getMessage() != null && !e.getMessage().trim().isEmpty()) ? e.getMessage() : "네트워크 오류";
                        final String safeMsg = rawMsg.replace("\\", "/").replace("'", " ").replace("\"", " ").replace("\n", " ").replace("\r", " ").trim();
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(MainActivity.this, "업데이트 다운로드 실패: " + safeMsg, Toast.LENGTH_SHORT).show();
                                if (webView != null) {
                                    webView.evaluateJavascript("if (window.onUpdateFailed) window.onUpdateFailed('" + safeMsg + "');", null);
                                }
                            }
                        });
                    } finally {
                        try { if (fos != null) fos.close(); } catch (Exception ignored) {}
                        try { if (is != null) is.close(); } catch (Exception ignored) {}
                        if (conn != null) conn.disconnect();
                    }
                }
            }).start();
        }
        @JavascriptInterface
        public void downloadAndInstallApk(final String downloadUrl, final String fileName) {
            downloadAndApplyUpdate(downloadUrl);
        }
        @JavascriptInterface
        public String httpGet(String urlStr) {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(urlStr);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setUseCaches(false);
                conn.setDefaultUseCaches(false);
                conn.setRequestProperty("Cache-Control", "no-cache, no-store, must-revalidate");
                conn.setRequestProperty("Pragma", "no-cache");
                if (urlStr.contains("github.com") || urlStr.contains("githubusercontent.com")) {
                    conn.setRequestProperty("User-Agent", "Ai-Trade-Marits-App/3.2");
                    conn.setRequestProperty("Accept", "application/vnd.github.v3+json");
                    conn.setConnectTimeout(6000);
                    conn.setReadTimeout(6000);
                } else {
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36");
                    conn.setRequestProperty("Referer", "https://m.stock.naver.com/");
                    conn.setConnectTimeout(2500);
                    conn.setReadTimeout(2500);
                }
                int code = conn.getResponseCode();
                if (code == 200) {
                    InputStream is = conn.getInputStream();
                    BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();
                    return sb.toString();
                }
            } catch (Exception ignored) {
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
            return "";
        }
        @JavascriptInterface
        public String httpPost(String urlStr, String jsonBody) {
            return httpRequestWithHeaders("POST", urlStr, "{}", jsonBody);
        }
        @JavascriptInterface
        public void recordInstalledCommit(final String sha, final long time) {
            try {
                getSharedPreferences("app_meta", MODE_PRIVATE)
                        .edit()
                        .putString("installed_commit_sha", sha != null ? sha.trim() : "")
                        .putLong("installed_commit_time", time)
                        .apply();
            } catch (Exception ignored) {}
        }
        // 현재 설치된 APK 파일 자체의 git blob SHA-1 (GitHub contents API의 sha와 동일 규격)
        @JavascriptInterface
        public String getInstalledApkBlobSha() {
            try {
                File f = new File(getPackageCodePath());
                java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-1");
                md.update(("blob " + f.length() + "\0").getBytes(StandardCharsets.UTF_8));
                java.io.FileInputStream fis = new java.io.FileInputStream(f);
                byte[] buf = new byte[65536];
                int n;
                while ((n = fis.read(buf)) > 0) md.update(buf, 0, n);
                fis.close();
                StringBuilder sb = new StringBuilder();
                for (byte b : md.digest()) sb.append(String.format("%02x", b));
                return sb.toString();
            } catch (Exception e) {
                return "";
            }
        }
        // GitHub 최신 main 커밋 SHA 획득: Atom 피드(레이트리밋 0%, 100% 실시간) + Git smart-http 이중화
        @JavascriptInterface
        public String getRemoteHeadSha(String repo) {
            HttpURLConnection conn = null;
            // 1. Primary: Atom 피드 (레이트리밋 없음, 40자리 최신 커밋 해시 100% 반환)
            try {
                URL atomUrl = new URL("https://github.com/" + repo + "/commits/main.atom?_cb=" + System.currentTimeMillis());
                conn = (HttpURLConnection) atomUrl.openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setUseCaches(false);
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Android; Mobile)");
                conn.setRequestProperty("Cache-Control", "no-cache");
                if (conn.getResponseCode() == 200) {
                    BufferedReader r = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    String line;
                    java.util.regex.Pattern p = java.util.regex.Pattern.compile("Commit/([0-9a-f]{40})");
                    while ((line = r.readLine()) != null) {
                        java.util.regex.Matcher m = p.matcher(line);
                        if (m.find()) {
                            r.close();
                            return m.group(1);
                        }
                    }
                    r.close();
                }
            } catch (Exception ignored) {
            } finally {
                if (conn != null) { conn.disconnect(); conn = null; }
            }
            // 2. Fallback: Git smart-http info/refs
            try {
                URL url = new URL("https://github.com/" + repo + ".git/info/refs?service=git-upload-pack&_cb=" + System.currentTimeMillis());
                conn = (HttpURLConnection) url.openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setUseCaches(false);
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setRequestProperty("User-Agent", "git/2.40.0");
                conn.setRequestProperty("Cache-Control", "no-cache");
                if (conn.getResponseCode() == 200) {
                    BufferedReader r = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    String line, head = "", main = "", master = "";
                    java.util.regex.Pattern p = java.util.regex.Pattern.compile("([0-9a-f]{40}) (HEAD|refs/heads/main|refs/heads/master)");
                    while ((line = r.readLine()) != null) {
                        java.util.regex.Matcher m = p.matcher(line);
                        while (m.find()) {
                            if (m.group(2).equals("HEAD")) head = m.group(1);
                            else if (m.group(2).endsWith("main")) main = m.group(1);
                            else master = m.group(1);
                        }
                    }
                    r.close();
                    String sha = !main.isEmpty() ? main : (!head.isEmpty() ? head : master);
                    if (!sha.isEmpty()) return sha;
                }
            } catch (Exception ignored) {
            } finally {
                if (conn != null) { conn.disconnect(); conn = null; }
            }
            return "";
        }
        // GitHub Atom 피드에서 1초 전 최신 커밋 정보(SHA, 일시, 메시지, 밀리초) 실시간 직접 파싱 (레이트리밋 0%)
        @JavascriptInterface
        public String getRemoteCommitInfo(String repo) {
            HttpURLConnection conn = null;
            try {
                URL atomUrl = new URL("https://github.com/" + repo + "/commits/main.atom?_cb=" + System.currentTimeMillis());
                conn = (HttpURLConnection) atomUrl.openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setUseCaches(false);
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Android; Mobile)");
                conn.setRequestProperty("Cache-Control", "no-cache, no-store, must-revalidate");
                conn.setRequestProperty("Pragma", "no-cache");
                int respCode = conn.getResponseCode();
                if (respCode == 301 || respCode == 302 || respCode == 307 || respCode == 308) {
                    String loc = conn.getHeaderField("Location");
                    if (loc != null && !loc.isEmpty()) {
                        conn.disconnect();
                        conn = (HttpURLConnection) new URL(loc).openConnection();
                        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Android; Mobile)");
                        respCode = conn.getResponseCode();
                    }
                }
                if (respCode == 200) {
                    BufferedReader r = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = r.readLine()) != null) {
                        sb.append(line).append("\n");
                    }
                    r.close();
                    String xml = sb.toString();
                    String sha = "";
                    java.util.regex.Matcher mSha = java.util.regex.Pattern.compile("Commit/([0-9a-f]{40})").matcher(xml);
                    if (mSha.find()) sha = mSha.group(1);
                    String dateStr = "";
                    java.util.regex.Matcher mDate = java.util.regex.Pattern.compile("<updated>([^<]+)</updated>").matcher(xml);
                    if (mDate.find()) dateStr = mDate.group(1);
                    String title = "";
                    java.util.regex.Matcher mTitle = java.util.regex.Pattern.compile("<title>([^<]+)</title>").matcher(xml);
                    if (mTitle.find()) {
                        if (mTitle.find()) {
                            title = mTitle.group(1).trim().replace('"', '\'').replace("\n", " ");
                        }
                    }
                    long timestamp = 0;
                    if (!dateStr.isEmpty()) {
                        try {
                            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US);
                            sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                            java.util.Date d = sdf.parse(dateStr);
                            if (d != null) timestamp = d.getTime();
                        } catch (Exception ignored) {}
                    }
                    if (!sha.isEmpty()) {
                        return "{\"sha\":\"" + sha + "\",\"date\":\"" + dateStr + "\",\"title\":\"" + title + "\",\"timestamp\":" + timestamp + "}";
                    }
                }
            } catch (Exception ignored) {
            } finally {
                if (conn != null) { conn.disconnect(); }
            }
            return "";
        }
        @JavascriptInterface
        public String getInstalledCommitSha() {
            try {
                return getSharedPreferences("app_meta", MODE_PRIVATE).getString("installed_commit_sha", "");
            } catch (Exception ignored) {
                return "";
            }
        }
        @JavascriptInterface
        public long getInstalledCommitTime() {
            try {
                return getSharedPreferences("app_meta", MODE_PRIVATE).getLong("installed_commit_time", 0);
            } catch (Exception ignored) {
                return 0;
            }
        }
        @JavascriptInterface
        public String httpRequestWithHeaders(String method, String urlStr, String headersJson, String bodyStr) {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(urlStr);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod(method != null ? method.toUpperCase() : "GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                conn.setUseCaches(false);
                conn.setDefaultUseCaches(false);
                conn.setRequestProperty("Cache-Control", "no-cache, no-store, must-revalidate");
                conn.setRequestProperty("Pragma", "no-cache");
                conn.setRequestProperty("User-Agent", "meritz-openapi-android/3.5");
                boolean hasContentType = false;
                if (headersJson != null && !headersJson.isEmpty()) {
                    JSONObject hObj = new JSONObject(headersJson);
                    Iterator<String> keys = hObj.keys();
                    while (keys.hasNext()) {
                        String k = keys.next();
                        if ("content-type".equalsIgnoreCase(k)) {
                            hasContentType = true;
                        }
                        conn.setRequestProperty(k, hObj.optString(k, ""));
                    }
                }
                if (!hasContentType) {
                    conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                }
                if ("POST".equalsIgnoreCase(method) && bodyStr != null && !bodyStr.isEmpty()) {
                    conn.setDoOutput(true);
                    byte[] bytes = bodyStr.getBytes(StandardCharsets.UTF_8);
                    OutputStream os = conn.getOutputStream();
                    os.write(bytes);
                    os.flush();
                    os.close();
                }
                int code = conn.getResponseCode();
                InputStream is = (code >= 200 && code < 300) ? conn.getInputStream() : conn.getErrorStream();
                if (is != null) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();
                    return sb.toString();
                }
            } catch (Exception e) {
                return "{\"rsp_cd\":\"-1\",\"rt_cd\":\"-1\",\"rsp_msg\":\"" + (e.getMessage() != null ? e.getMessage().replace("\"", "'") : "네트워크 오류") + "\"}";
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
            return "";
        }
    }
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
