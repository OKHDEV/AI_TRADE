# -*- coding: utf-8 -*-
"""
메리츠 AI 주식 트레이더 - Windows 데스크톱 네이티브 GUI 실행 엔진 & 무인 자동 업데이트
"""
import os
import sys
import tempfile
import json
import urllib.request
import subprocess
import webbrowser
import threading
import time
import ctypes
from ctypes import wintypes
import webview

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def cleanup_desktop_setup_files():
    """
    바탕화면에 남아있는 Meritz-AI-Stock-Setup*.exe 또는 메리츠*Setup*.exe 설치 파일을 자동으로 감지하여 영구 삭제
    """
    try:
        desktop_candidates = []
        try:
            CSIDL_DESKTOP = 0
            buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
            ctypes.windll.shell32.SHGetFolderPathW(None, CSIDL_DESKTOP, None, 0, buf)
            if buf.value and os.path.isdir(buf.value):
                desktop_candidates.append(buf.value)
        except Exception:
            pass

        user_desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        if os.path.isdir(user_desktop) and user_desktop not in desktop_candidates:
            desktop_candidates.append(user_desktop)

        onedrive_desktop = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop")
        if os.path.isdir(onedrive_desktop) and onedrive_desktop not in desktop_candidates:
            desktop_candidates.append(onedrive_desktop)

        for d in desktop_candidates:
            try:
                for fname in os.listdir(d):
                    low = fname.lower()
                    if low.endswith(".exe") and ("setup" in low) and ("meritz" in low or "메리츠" in low):
                        full_path = os.path.join(d, fname)
                        try:
                            os.remove(full_path)
                            print(f"[CLEANUP] Deleted desktop setup file: {full_path}")
                        except Exception:
                            pass
            except Exception:
                pass
    except Exception:
        pass

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

    def cleanupDesktopSetups(self):
        cleanup_desktop_setup_files()
        return True

    def getLatestRelease(self, repo):
        try:
            req = urllib.request.Request(
                f"https://api.github.com/repos/{repo}/releases/latest",
                headers={
                    "User-Agent": "Ai-Trade-Marits-Desktop/4.5",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                tag = data.get("tag_name", "")
                assets = data.get("assets", [])

                exe_url = ""
                for a in assets:
                    name = a.get("name", "")
                    if name in ["Meritz-AI-Stock.exe", "메리츠_AI_주식.exe"]:
                        exe_url = a.get("browser_download_url")
                        break
                if not exe_url:
                    for a in assets:
                        name = a.get("name", "")
                        if name.endswith(".exe") and "setup" not in name.lower():
                            exe_url = a.get("browser_download_url")
                            break
                if not exe_url:
                    for a in assets:
                        if a.get("name", "").endswith(".exe"):
                            exe_url = a.get("browser_download_url")
                            break

                return json.dumps({
                    "tag": tag,
                    "name": data.get("name", ""),
                    "body": data.get("body", ""),
                    "downloadUrl": exe_url,
                    "publishedAt": data.get("published_at", "")
                })
        except Exception:
            return ""

    def getRemoteCommitInfo(self, repo):
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
        return ""

    def downloadAndInstallExe(self, download_url):
        try:
            temp_dir = tempfile.gettempdir()
            new_exe = os.path.join(temp_dir, "meritz_ai_stock_new.exe")
            req = urllib.request.Request(
                download_url,
                headers={"User-Agent": "Ai-Trade-Marits-Desktop/4.5"}
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                total_len = resp.getheader('content-length')
                total_size = int(total_len) if total_len else 0
                downloaded = 0
                block_size = 65536
                with open(new_exe, "wb") as f:
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

            if not os.path.isfile(new_exe) or os.path.getsize(new_exe) < 500000:
                return json.dumps({"ok": False, "msg": "다운로드된 파일 크기가 올바르지 않습니다."})

            cleanup_desktop_setup_files()

            target_exe = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(sys.argv[0])
            bat_path = os.path.join(temp_dir, "meritz_auto_restart.bat")
            bat_content = f"""@echo off
chcp 65001 > nul
timeout /t 1 /nobreak > nul
:retry
move /y "{new_exe}" "{target_exe}" > nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak > nul
    goto retry
)
start "" "{target_exe}"
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

def find_existing_meritz_window():
    try:
        user32 = ctypes.windll.user32
        WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
        found = []

        def enum_cb(hwnd, lparam):
            if user32.IsWindowVisible(hwnd):
                length = user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buff = ctypes.create_unicode_buffer(length + 1)
                    user32.GetWindowTextW(hwnd, buff, length + 1)
                    title = buff.value
                    if "메리츠" in title and "Visual Studio" not in title and "Command" not in title and "PowerShell" not in title:
                        found.append(hwnd)
            return True

        user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
        return found[0] if found else None
    except Exception:
        return None

def kill_orphan_meritz_processes():
    try:
        my_pid = os.getpid()
        for exe_name in ["메리츠_AI_주식.exe", "Meritz-AI-Stock.exe"]:
            try:
                cmd = f'tasklist /FI "IMAGENAME eq {exe_name}" /FO CSV /NH'
                out = subprocess.check_output(cmd, shell=True).decode('cp949', errors='ignore')
                for line in out.strip().splitlines():
                    parts = [p.strip(' "') for p in line.split(',')]
                    if len(parts) >= 2 and parts[1].isdigit():
                        other_pid = int(parts[1])
                        if other_pid != my_pid:
                            subprocess.run(f'taskkill /F /PID {other_pid}', shell=True, capture_output=True)
            except Exception:
                pass
    except Exception:
        pass

def enforce_single_instance():
    try:
        user32 = ctypes.windll.user32

        # 1. 실행 중인 '보이는(Visible)' 메리츠 창이 이미 있는지 확인
        hwnd = find_existing_meritz_window()
        if hwnd:
            # 창이 이미 존재하면 최소화 해제 및 최상위로 띄운 뒤 현재 중복 프로세스 종료
            user32.ShowWindow(hwnd, 9)  # SW_RESTORE
            user32.SetForegroundWindow(hwnd)
            sys.exit(0)

        # 2. 보이는 창이 없는데 백그라운드 좀비 프로세스가 남아있는 경우,
        # 유저가 창을 볼 수 없게 차단되는 버그를 방지하기 위해 유령 프로세스를 정리하고 정상 실행
        kill_orphan_meritz_processes()

    except Exception:
        pass

def main():
    enforce_single_instance()

    # 바탕화면 설치 파일 자동 정리 백그라운드 스레드 가동
    def auto_cleanup_worker():
        time.sleep(2)
        cleanup_desktop_setup_files()
        for _ in range(6):
            time.sleep(10)
            cleanup_desktop_setup_files()

    threading.Thread(target=auto_cleanup_worker, daemon=True).start()

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
        target_url = "https://okhdev.github.io/AI_TRADE/web/index.html?v=4.5.5"

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

    # 창을 닫았을 때 백그라운드에 프로세스가 남지 않도록 완벽히 프로세스 종료
    window.events.closed += lambda: os._exit(0)

    webview.start()

if __name__ == '__main__':
    main()
