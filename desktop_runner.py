# -*- coding: utf-8 -*-
"""
메리츠 AI 주식 트레이더 - Windows 데스크톱 네이티브 GUI 실행 엔진 & 자동 업데이트 브릿지
"""
import os
import sys
import tempfile
import json
import urllib.request
import subprocess
import webbrowser
import shutil
import webview

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

class DesktopApi:
    def __init__(self, window=None):
        self._window = window

    def set_window(self, w):
        self._window = w

    def isDesktop(self):
        return True

    def getAppInfo(self):
        target_exe = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(sys.argv[0])
        return json.dumps({
            "isDesktop": True,
            "isFrozen": getattr(sys, 'frozen', False),
            "exePath": target_exe
        })

    def getRemoteCommitInfo(self, repo):
        # 1) GitHub API
        try:
            req = urllib.request.Request(
                f"https://api.github.com/repos/{repo}/commits?per_page=1",
                headers={
                    "User-Agent": "Ai-Trade-Marits-Desktop/4.5",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                if isinstance(data, list) and len(data) > 0:
                    c = data[0]
                    return json.dumps({
                        "sha": c.get("sha", ""),
                        "title": c.get("commit", {}).get("message", "").split("\n")[0],
                        "date": c.get("commit", {}).get("committer", {}).get("date", "")
                    })
        except Exception:
            pass

        # 2) GitHub Commits Atom Feed Fallback
        try:
            req = urllib.request.Request(
                f"https://github.com/{repo}/commits/main.atom",
                headers={"User-Agent": "Ai-Trade-Marits-Desktop/4.5"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                content = response.read().decode('utf-8')
                m_sha = re.search(r'Commit/([0-9a-f]{40})', content, re.I)
                m_date = re.search(r'<updated>([^<]+)</updated>', content)
                m_title = re.search(r'<title>([^<]+)</title>', content)
                return json.dumps({
                    "sha": m_sha.group(1) if m_sha else "",
                    "title": m_title.group(1) if m_title else "최신 업데이트",
                    "date": m_date.group(1) if m_date else ""
                })
        except Exception:
            return ""

    def downloadAndInstallExe(self, download_url):
        """
        Windows 최신 Setup 설치 파일을 다운로드하여 실행 (기존 설치 앱을 임의로 덮어쓰지 않고 안전하게 Setup 마법사 구동)
        """
        try:
            temp_dir = tempfile.gettempdir()
            setup_installer = os.path.join(temp_dir, "메리츠_AI_주식_Setup.exe")
            req = urllib.request.Request(
                download_url,
                headers={"User-Agent": "Ai-Trade-Marits-Desktop/4.5"}
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                total_len = resp.getheader('content-length')
                total_size = int(total_len) if total_len else 0
                downloaded = 0
                block_size = 65536
                with open(setup_installer, "wb") as f:
                    while True:
                        chunk = resp.read(block_size)
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0 and self._window:
                            pct = int((downloaded / total_size) * 100)
                            try:
                                self._window.evaluate_js(f"if(window.onUpdateDownloadProgress) window.onUpdateDownloadProgress({pct}, {downloaded}, {total_size});")
                            except Exception:
                                pass

            if not os.path.isfile(setup_installer) or os.path.getsize(setup_installer) < 500000:
                return json.dumps({"ok": False, "msg": "다운로드된 설치 파일 크기가 올바르지 않습니다."})

            bat_path = os.path.join(temp_dir, "meritz_update_restart.bat")
            bat_content = f"""@echo off
chcp 65001 > nul
timeout /t 1 /nobreak > nul
start "" "{setup_installer}"
del "%~f0"
"""
            with open(bat_path, "w", encoding="cp949") as f:
                f.write(bat_content)

            DETACHED_PROCESS = 0x00000008
            CREATE_NO_WINDOW = 0x08000000
            subprocess.Popen(
                ["cmd.exe", "/c", bat_path],
                creationflags=DETACHED_PROCESS | CREATE_NO_WINDOW,
                close_fds=True
            )
            os._exit(0)
            return json.dumps({"ok": True})
        except Exception as e:
            return json.dumps({"ok": False, "msg": str(e)})

    def openInBrowser(self, url):
        webbrowser.open(url)
        return True

    def httpGet(self, url):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Ai-Trade-Marits-Desktop/4.5"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.read().decode('utf-8', errors='ignore')
        except Exception:
            return ""

def main():
    base_dir = get_base_dir()
    candidates = [
        os.path.join(base_dir, "assets", "index.html"),
        os.path.join(base_dir, "web", "index.html"),
        os.path.join(base_dir, "android_app", "assets", "index.html"),
        os.path.join(base_dir, "index.html")
    ]
    html_file = None
    for c in candidates:
        if os.path.isfile(c):
            html_file = c
            break

    target_url = None
    if html_file and os.path.isfile(html_file):
        target_url = "file:///" + os.path.abspath(html_file).replace("\\", "/")
    else:
        target_url = "https://okhdev.github.io/AI_TRADE/web/index.html?v=4.5.0"

    # WebView2 사용자 데이터 디렉터리 설정 (독립 격리)
    data_dir = os.path.join(tempfile.gettempdir(), "meritz_ai_stock_wv2")
    os.makedirs(data_dir, exist_ok=True)

    api = DesktopApi()
    window = webview.create_window(
        title="메리츠 AI 자동 주식 트레이더",
        url=target_url,
        js_api=api,
        width=480,
        height=940,
        resizable=True,
        min_size=(380, 600)
    )
    api.set_window(window)
    webview.start()

if __name__ == '__main__':
    main()
