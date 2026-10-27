# -*- coding: utf-8 -*-
"""
메리츠 AI 자동 주식 트레이더 - 통합 버전 업데이트 & 빌드 & 배포 자동화 스크립트

사용법:
  python update_version.py              # 패치 버전 자동 증가 (예: 4.5.0 -> 4.5.1) 후 빌드 및 배포
  python update_version.py 4.5.2        # 지정 버전으로 변경 후 빌드 및 배포
  python update_version.py --no-build   # 파일 버전 문자열만 일괄 갱신 (빌드/배포 제외)
"""

import os
import re
import sys
import shutil
import subprocess
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

WORK_DIR = os.path.dirname(os.path.abspath(__file__))
GIT_DIR = r"C:\Users\User\Desktop\Ai_Trade_Marits"
MAKENSIS_EXE = r"C:\Users\User\AppData\Local\nsis\nsis-3.10\makensis.exe"

def get_current_version():
    web_index = os.path.join(WORK_DIR, "web", "index.html")
    with open(web_index, "r", encoding="utf-8") as f:
        content = f.read()
    m = re.search(r'currentVersion:\s*"([^"]+)"', content)
    if m:
        return m.group(1).strip()
    return "4.5.0"

def bump_semver(ver_str):
    parts = ver_str.replace("v", "").split(".")
    while len(parts) < 3:
        parts.append("0")
    major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
    return f"{major}.{minor}.{patch + 1}"

def update_web_index(new_ver, today_str):
    file_path = os.path.join(WORK_DIR, "web", "index.html")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. APP_VER
    content = re.sub(r'const APP_VER = "[^"]+";', f'const APP_VER = "{new_ver}";', content)

    # 2. APP_RELEASE_META
    content = re.sub(r'currentVersion:\s*"[^"]+"', f'currentVersion: "{new_ver}"', content)
    content = re.sub(r'buildDateStr:\s*"[^"]+"', f'buildDateStr: "{today_str} (v{new_ver})"', content)
    content = re.sub(r'defaultSetupName:\s*"[^"]+"', f'defaultSetupName: "Meritz-AI-Stock-Setup-v{new_ver}.exe"', content)
    content = re.sub(r'defaultApkName:\s*"[^"]+"', f'defaultApkName: "Meritz-AI-Stock-v{new_ver}.apk"', content)
    content = re.sub(r'defaultIpaName:\s*"[^"]+"', f'defaultIpaName: "Meritz-AI-Stock-v{new_ver}.ipa"', content)
    content = re.sub(r'// ✅ 이미 최신 버전\([^)]+\)임!', f'// ✅ 이미 최신 버전(v{new_ver})임!', content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    # Mirror to index_web.html, android_app/assets/index.html, ios/index.html
    mirrors = [
        os.path.join(WORK_DIR, "index_web.html"),
        os.path.join(WORK_DIR, "android_app", "assets", "index.html"),
        os.path.join(WORK_DIR, "ios", "index.html"),
    ]
    if os.path.exists(GIT_DIR):
        mirrors.extend([
            os.path.join(GIT_DIR, "web", "index.html"),
            os.path.join(GIT_DIR, "index_web.html"),
            os.path.join(GIT_DIR, "android_app", "assets", "index.html"),
            os.path.join(GIT_DIR, "ios", "index.html"),
        ])
    for m in mirrors:
        os.makedirs(os.path.dirname(m), exist_ok=True)
        shutil.copy2(file_path, m)
    print(f"  [OK] web/index.html and mirrors updated to v{new_ver}")

def update_landing_index(new_ver):
    file_path = os.path.join(WORK_DIR, "index.html")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Remove (v4.3.0) or any (v...) from the APK button
    content = re.sub(r'APK 다운로드\s*\(v[\d\.]+\)', 'APK 다운로드', content)

    # 2. Update hero meta badge to use id="latestBuildBadge"
    content = re.sub(
        r'<span[^>]*id=["\']latestBuildBadge["\'][^>]*>.*?</span>|<span[^>]*>📱 최신 정식 빌드[^<]*</span>',
        f'<span id="latestBuildBadge">📱 최신 정식 빌드 v{new_ver}</span>',
        content
    )

    # 3. Update all release download URLs to point to v{new_ver}
    content = re.sub(r'/releases/download/[^/]+/', f'/releases/download/v{new_ver}/', content)
    content = re.sub(r'Meritz-AI-Stock-Setup-v[\d\.]+\.exe', f'Meritz-AI-Stock-Setup-v{new_ver}.exe', content)
    content = re.sub(r'Meritz-AI-Stock-v[\d\.]+\.apk', f'Meritz-AI-Stock-v{new_ver}.apk', content)
    content = re.sub(r'Meritz-AI-Stock-v[\d\.]+\.ipa', f'Meritz-AI-Stock-v{new_ver}.ipa', content)

    # 4. Injected auto-sync script (if not present)
    auto_sync_snippet = r"""  <script>
    // 🌟 GitHub 최신 릴리즈 자동 감지 및 웹사이트 최신 버전/다운로드 링크 실시간 자동 갱신
    (function autoSyncLatestRelease() {
      var repo = "OKHDEV/AI_TRADE";
      fetch("https://api.github.com/repos/" + repo + "/releases/latest", { cache: "no-cache" })
        .then(function(res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (!data || !data.tag_name) return;
          var tag = data.tag_name.trim();
          var badge = document.getElementById("latestBuildBadge");
          if (badge) {
            badge.textContent = "📱 최신 정식 빌드 " + tag;
          }
          var downloadLinks = document.querySelectorAll('a[href*="/releases/download/"]');
          downloadLinks.forEach(function(a) {
            var href = a.getAttribute("href");
            if (!href) return;
            href = href.replace(/\/releases\/download\/[^/]+\//, "/releases/download/" + tag + "/");
            href = href.replace(/(Meritz-AI-Stock-(?:Setup-)?)(?:v\d+\.\d+\.\d+|\d+\.\d+\.\d+)(\.(?:exe|apk|ipa))/gi, "$1" + tag + "$2");
            a.setAttribute("href", href);
          });
          console.log("[VersionSync] GitHub 최신 릴리즈(" + tag + ") 웹사이트 자동 동기화 완료");
        })
        .catch(function(err) {
          console.warn("[VersionSync] 최신 버전 자동 조회 건너뜀:", err);
        });
    })();
  </script>
"""
    if "autoSyncLatestRelease" not in content:
        if "</body>" in content:
            content = content.replace("</body>", auto_sync_snippet + "\n</body>")
        else:
            content += "\n" + auto_sync_snippet

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    mirrors = [
        os.path.join(WORK_DIR, "website", "index.html"),
    ]
    if os.path.exists(GIT_DIR):
        mirrors.extend([
            os.path.join(GIT_DIR, "index.html"),
            os.path.join(GIT_DIR, "website", "index.html"),
        ])
    for m in mirrors:
        os.makedirs(os.path.dirname(m), exist_ok=True)
        shutil.copy2(file_path, m)
    print(f"  [OK] index.html and website/index.html updated (APK (v4.3.0) removed, latestBuildBadge & autoSync added)")

def update_installer_nsi(new_ver):
    file_path = os.path.join(WORK_DIR, "installer.nsi")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(r'!define PRODUCT_VERSION\s*"[^"]+"', f'!define PRODUCT_VERSION "{new_ver}"', content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    if os.path.exists(GIT_DIR):
        shutil.copy2(file_path, os.path.join(GIT_DIR, "installer.nsi"))
    print(f"  [OK] installer.nsi PRODUCT_VERSION updated to {new_ver}")

def update_android_manifest(new_ver):
    file_path = os.path.join(WORK_DIR, "android_app", "AndroidManifest.xml")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    parts = new_ver.replace("v", "").split(".")
    code = "".join(parts)
    if not code.isdigit():
        code = "451"

    content = re.sub(r'android:versionCode="[^"]+"', f'android:versionCode="{code}"', content)
    content = re.sub(r'android:versionName="[^"]+"', f'android:versionName="{new_ver}"', content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    if os.path.exists(GIT_DIR):
        dst = os.path.join(GIT_DIR, "android_app", "AndroidManifest.xml")
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(file_path, dst)
        src_java = os.path.join(WORK_DIR, "android_app", "src", "com", "aiquant", "autotrader", "MainActivity.java")
        dst_java = os.path.join(GIT_DIR, "android_app", "src", "com", "aiquant", "autotrader", "MainActivity.java")
        if os.path.exists(src_java):
            os.makedirs(os.path.dirname(dst_java), exist_ok=True)
            shutil.copy2(src_java, dst_java)
    print(f"  [OK] AndroidManifest.xml versionCode={code}, versionName={new_ver} (and MainActivity.java synced)")

def update_build_ipa(new_ver):
    file_path = os.path.join(WORK_DIR, "build_ipa.py")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(
        r'<key>CFBundleShortVersionString</key>\s*<string>[^<]+</string>',
        f'<key>CFBundleShortVersionString</key>\n    <string>{new_ver}</string>',
        content
    )
    content = re.sub(
        r'<key>CFBundleVersion</key>\s*<string>[^<]+</string>',
        f'<key>CFBundleVersion</key>\n    <string>{new_ver}</string>',
        content
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    if os.path.exists(GIT_DIR):
        shutil.copy2(file_path, os.path.join(GIT_DIR, "build_ipa.py"))
    print(f"  [OK] build_ipa.py updated to {new_ver}")

def update_desktop_runner(new_ver):
    file_path = os.path.join(WORK_DIR, "desktop_runner.py")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(r'index\.html\?v=[^"]+', f'index.html?v={new_ver}', content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    if os.path.exists(GIT_DIR):
        shutil.copy2(file_path, os.path.join(GIT_DIR, "desktop_runner.py"))
    print(f"  [OK] desktop_runner.py target_url updated to {new_ver}")

def run_builds(new_ver):
    print("\n🔨 [1/4] PyInstaller로 Windows 메리츠_AI_주식.exe 빌드 중...")
    spec_file = os.path.join(WORK_DIR, "메리츠_AI_주식.spec")
    subprocess.run([sys.executable, "-m", "PyInstaller", spec_file, "--noconfirm", "--clean"], cwd=WORK_DIR, check=True)

    print("\n📦 [2/4] NSIS로 Windows 설치 마법사(Setup.exe) 컴파일 중...")
    nsi_file = os.path.join(WORK_DIR, "installer.nsi")
    subprocess.run([MAKENSIS_EXE, nsi_file], cwd=WORK_DIR, check=True)

    print("\n🤖 [3/4] Android APK 빌드 및 서명 중...")
    subprocess.run([sys.executable, "build_apk.py"], cwd=WORK_DIR, check=True)

    print("\n🍎 [4/4] iOS IPA 패키징 중...")
    subprocess.run([sys.executable, "build_ipa.py"], cwd=WORK_DIR, check=True)

def sync_artifacts(new_ver):
    print("\n🚚 빌드 산출물 동기화 및 다운로드 폴더 배치 중...")
    src_exe = os.path.join(WORK_DIR, "dist", "메리츠_AI_주식.exe")
    src_setup = os.path.join(WORK_DIR, "dist", "메리츠_AI_주식_Setup.exe")
    src_apk = os.path.join(WORK_DIR, "메리츠_AI_주식.apk")
    src_ipa = os.path.join(WORK_DIR, "downloads", "메리츠_AI_주식.ipa")

    user_downloads = os.path.join(os.path.expanduser("~"), "Downloads")
    local_app_exe = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "메리츠_AI_주식", "메리츠_AI_주식.exe")

    targets = [
        # 주식 repo
        (src_exe, os.path.join(WORK_DIR, "downloads", "메리츠_AI_주식.exe")),
        (src_exe, os.path.join(WORK_DIR, "downloads", "Meritz-AI-Stock.exe")),
        (src_exe, os.path.join(WORK_DIR, "메리츠_AI_주식.exe")),

        (src_setup, os.path.join(WORK_DIR, "downloads", "메리츠_AI_주식_Setup.exe")),
        (src_setup, os.path.join(WORK_DIR, "downloads", f"Meritz-AI-Stock-Setup-v{new_ver}.exe")),
        (src_setup, os.path.join(WORK_DIR, "메리츠_AI_주식_Setup.exe")),
        (src_setup, os.path.join(user_downloads, f"Meritz-AI-Stock-Setup-v{new_ver}.exe")),

        (src_apk, os.path.join(WORK_DIR, "downloads", "메리츠_AI_주식.apk")),
        (src_apk, os.path.join(WORK_DIR, "downloads", f"Meritz-AI-Stock-v{new_ver}.apk")),

        (src_ipa, os.path.join(WORK_DIR, "downloads", f"Meritz-AI-Stock-v{new_ver}.ipa")),
    ]

    if os.path.exists(GIT_DIR):
        targets.extend([
            (src_exe, os.path.join(GIT_DIR, "downloads", "메리츠_AI_주식.exe")),
            (src_exe, os.path.join(GIT_DIR, "downloads", "Meritz-AI-Stock.exe")),
            (src_exe, os.path.join(GIT_DIR, "메리츠_AI_주식.exe")),

            (src_setup, os.path.join(GIT_DIR, "downloads", "메리츠_AI_주식_Setup.exe")),
            (src_setup, os.path.join(GIT_DIR, "downloads", f"Meritz-AI-Stock-Setup-v{new_ver}.exe")),
            (src_setup, os.path.join(GIT_DIR, "메리츠_AI_주식_Setup.exe")),

            (src_apk, os.path.join(GIT_DIR, "downloads", "메리츠_AI_주식.apk")),
            (src_apk, os.path.join(GIT_DIR, "downloads", f"Meritz-AI-Stock-v{new_ver}.apk")),
            (src_apk, os.path.join(GIT_DIR, "메리츠_AI_주식.apk")),

            (src_ipa, os.path.join(GIT_DIR, "downloads", "메리츠_AI_주식.ipa")),
            (src_ipa, os.path.join(GIT_DIR, "downloads", f"Meritz-AI-Stock-v{new_ver}.ipa")),
            (src_ipa, os.path.join(GIT_DIR, "메리츠_AI_주식.ipa")),
        ])

    for s, d in targets:
        if os.path.exists(s):
            os.makedirs(os.path.dirname(d), exist_ok=True)
            shutil.copy2(s, d)

    # 로컬 설치된 실행파일 안전 갱신
    if os.path.exists(local_app_exe):
        try:
            old = local_app_exe + ".old"
            if os.path.exists(old):
                try: os.remove(old)
                except: pass
            os.rename(local_app_exe, old)
            shutil.copy2(src_exe, local_app_exe)
            print("  [OK] Local installed EXE updated successfully")
        except Exception as e:
            print(f"  [WARN] Local app exe update: {e}")

def run_tests():
    print("\n🧪 자동화 테스트 검증 중...")
    res = subprocess.run(["node", "test_runner.js"], cwd=WORK_DIR, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode == 0:
        print("  [PASS] All 76 automated tests passed!")
    else:
        print("  [FAIL] Tests failed!")
        print(res.stderr or res.stdout)
        sys.exit(1)

def deploy_github(new_ver):
    if not os.path.exists(GIT_DIR):
        print("  [SKIP] Git repo directory not found.")
        return

    print(f"\n🚀 GitHub 릴리즈(v{new_ver}) 생성 및 바이너리 업로드 중...")
    tag = f"v{new_ver}"
    release_title = f"메리츠 AI 자동 주식 v{new_ver} 정식 릴리즈"
    release_notes = f"""## 메리츠 AI 자동 주식 트레이더 v{new_ver} 정식 배포

### 주요 업데이트
- 💰 [실전자산 안전 자동 갱신] 레이트 리밋(초당 요청제한) 방지 5초 쿨다운 보호막 탑재, 6초 주기 백그라운드 자동 동기화 및 홈(주문 승인 대기함) 진입 시 즉시 실시간 자산 갱신 지원
- 🔔 [주문 승인 연동] 고객님 주문 승인 대기함에서 종목명 클릭 시 차트·주문 탭으로 즉시 이동하여 차트 및 상세 분석 조회 기능 탑재
- 📈 [차트 종횡비 최적화] 스마트폰 화면이 길쭉(20:9, 21:9)해도 캔들이 위아래로 길쭉하게 늘어나는 왜곡 원천 차단 (최적 종횡비 680/446 완전 고정)
- 🔍 [모바일 가독성 대폭 향상] 캔들 두께 대폭 강화, 가격 축/라벨 볼드체 확대, 기본 1개월(22캔들) 시각화로 한눈에 쉽게 확인 가능
- ⬇️ [모바일 업데이트 안정화] 다운로드 중단/무한 멈춤 현상 원천 해결 (S3 리디렉트 인코딩 보정 및 자바스크립트 예외 회피)
- 🛡️ 메리츠증권 Open API 실시간 7중 안전 감시 체결 엔진
- 💻 Windows EXE 및 Setup 설치 마법사, Android APK, iOS IPA 전 플랫폼 동시 배포
"""

    assets = [
        os.path.join(GIT_DIR, "downloads", f"Meritz-AI-Stock-Setup-v{new_ver}.exe"),
        os.path.join(GIT_DIR, "downloads", "Meritz-AI-Stock.exe"),
        os.path.join(GIT_DIR, "downloads", f"Meritz-AI-Stock-v{new_ver}.apk"),
        os.path.join(GIT_DIR, "downloads", f"Meritz-AI-Stock-v{new_ver}.ipa"),
        os.path.join(GIT_DIR, "downloads", "메리츠_AI_주식_Setup.exe"),
        os.path.join(GIT_DIR, "downloads", "메리츠_AI_주식.exe"),
        os.path.join(GIT_DIR, "downloads", "메리츠_AI_주식.apk"),
        os.path.join(GIT_DIR, "downloads", "메리츠_AI_주식.ipa"),
    ]
    existing_assets = [a for a in assets if os.path.exists(a)]

    # Git add & commit & push
    print("  [GIT] Git add, commit, push 진행 중...")
    subprocess.run(["git", "add", "-A"], cwd=GIT_DIR, check=True)
    commit_msg = f"release(v{new_ver}): deploy Meritz AI Stock v{new_ver} across all platforms"
    subprocess.run(["git", "commit", "-m", commit_msg], cwd=GIT_DIR, capture_output=True)
    subprocess.run(["git", "push", "origin", "main"], cwd=GIT_DIR, check=True)

    # GitHub release check or create
    res = subprocess.run(["gh", "release", "view", tag], cwd=GIT_DIR, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode == 0:
        print(f"  [GH] Existing release {tag} found. Uploading assets with clobber...")
        cmd = ["gh", "release", "upload", tag, *existing_assets, "--clobber"]
        subprocess.run(cmd, cwd=GIT_DIR, check=True)
    else:
        print(f"  [GH] Creating new release {tag}...")
        cmd = ["gh", "release", "create", tag, *existing_assets, "--title", release_title, "--notes", release_notes, "--latest"]
        subprocess.run(cmd, cwd=GIT_DIR, check=True)
    print(f"  [SUCCESS] GitHub release {tag} successfully deployed!")

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    no_build = "--no-build" in sys.argv

    cur_ver = get_current_version()
    if args:
        new_ver = args[0].replace("v", "").strip()
    else:
        new_ver = bump_semver(cur_ver)

    today_str = datetime.now().strftime("%Y-%m-%d")

    print("=" * 60)
    print(f"  메리츠 AI 자동 주식 트레이더 버전 관리 시스템")
    print(f"  현재 버전: v{cur_ver}  ➔  새 버전: v{new_ver}")
    print(f"  배포 일자: {today_str}")
    print("=" * 60)

    print("\n📝 파일 버전 및 웹사이트 코드 자동 갱신 중...")
    update_web_index(new_ver, today_str)
    update_landing_index(new_ver)
    update_installer_nsi(new_ver)
    update_android_manifest(new_ver)
    update_build_ipa(new_ver)
    update_desktop_runner(new_ver)

    run_tests()

    if not no_build:
        run_builds(new_ver)
        sync_artifacts(new_ver)
        deploy_github(new_ver)
        print("\n" + "=" * 60)
        print(f"🎉 v{new_ver} 전 플랫폼 빌드 & 배포 & 웹사이트 자동화가 성공적으로 완료되었습니다!")
        print("=" * 60)
    else:
        print("\n[INFO] --no-build 옵션으로 인해 빌드 및 배포를 건너뛰었습니다.")

if __name__ == "__main__":
    main()
