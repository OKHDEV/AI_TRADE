Unicode true

!define PRODUCT_NAME "메리츠 AI 자동 주식"
!define PRODUCT_SHORT_NAME "메리츠_AI_주식"
!define PRODUCT_VERSION "4.5.1"
!define PRODUCT_PUBLISHER "오경한 (OKHDEV)"
!define PRODUCT_WEB_SITE "https://okhdev.github.io/AI_TRADE/"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\메리츠_AI_주식.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_SHORT_NAME}"
!define PRODUCT_EXE "메리츠_AI_주식.exe"

; MultiUser 설정 (모든 사용자 vs 전용 설치 지원)
!define MULTIUSER_EXECUTIONLEVEL Highest
!define MULTIUSER_MUI
!define MULTIUSER_INSTALLMODE_COMMANDLINE
!define MULTIUSER_INSTALLMODE_DEFAULT_CURRENTUSER
!define MULTIUSER_INSTALLMODE_INSTDIR "${PRODUCT_SHORT_NAME}"
!define MULTIUSER_INSTALLMODE_INSTDIR_REGKEY "${PRODUCT_DIR_REGKEY}"

; 다중 사용자 페이지 한국어 텍스트 정의
!define MULTIUSER_TEXT_INSTALLMODE_TITLE "설치 옵션 선택"
!define MULTIUSER_TEXT_INSTALLMODE_SUBTITLE "이 프로그램의 사용자는 누구인가요?"
!define MULTIUSER_INNERTEXT_INSTALLMODE_TOP "이 프로그램을 모든 사용자가 사용할 수 있도록 할 것인지 아니면 자신만 사용할 수 있도록 할 것인지 선택하십시오."
!define MULTIUSER_INNERTEXT_INSTALLMODE_ALLUSERS "이 컴퓨터를 사용하는 모든 사람(모든 사용자)"
!define MULTIUSER_INNERTEXT_INSTALLMODE_CURRENTUSER "전용 (User)"

!include "MultiUser.nsh"
!include "MUI2.nsh"
!include "LogicLib.nsh"

; 일반 정보
Name "${PRODUCT_NAME}"
OutFile "dist\메리츠_AI_주식_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\${PRODUCT_SHORT_NAME}"
InstallDirRegKey HKCU "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

; 아이콘 설정
!define MUI_ICON "app_icon.ico"
!define MUI_UNICON "app_icon.ico"

; 인터페이스 설정
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "${PRODUCT_NAME} 실행하기"

; 페이지 설정
!insertmacro MULTIUSER_PAGE_INSTALLMODE
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; 언인스톨 페이지
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; 언어 설정
!insertmacro MUI_LANGUAGE "Korean"

; =========================================================================
; 초기화 함수
; =========================================================================
Function .onInit
  !insertmacro MULTIUSER_INIT
FunctionEnd

Function .onInstSuccess
  ; 설치 완료 후 바탕화면 또는 다운로드 폴더에 있던 설치 파일(Setup.exe) 자동 영구 삭제
  ExecShell "" "cmd.exe" '/c timeout /t 2 > nul & del /f /q "$EXEPATH"' SW_HIDE
FunctionEnd

Function un.onInit
  !insertmacro MULTIUSER_UNINIT
FunctionEnd

; =========================================================================
; 설치 섹션
; =========================================================================
Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on

  ; 메인 실행 파일 및 아이콘 복사
  File "dist\메리츠_AI_주식.exe"
  File "app_icon.ico"

  ; 바로가기 생성 (현재 설치 모드에 맞게 데스크톱 및 시작 메뉴)
  SetShellVarContext current
  ${If} $MultiUser.InstallMode == "AllUsers"
    SetShellVarContext all
  ${EndIf}

  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_EXE}" "" "$INSTDIR\app_icon.ico" 0
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME} 제거.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_EXE}" "" "$INSTDIR\app_icon.ico" 0

  ; 언인스톨러 생성
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; 레지스트리 등록 (제어판 프로그램 추가/제거 및 앱 및 기능)
  WriteRegStr SHCTX "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\${PRODUCT_EXE}"
  WriteRegStr SHCTX "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr SHCTX "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr SHCTX "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\${PRODUCT_EXE},0"
  WriteRegStr SHCTX "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr SHCTX "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr SHCTX "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegDWORD SHCTX "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD SHCTX "${PRODUCT_UNINST_KEY}" "NoRepair" 1
SectionEnd

; =========================================================================
; 제거(언인스톨) 섹션
; =========================================================================
Section Uninstall
  SetShellVarContext current
  ${If} $MultiUser.InstallMode == "AllUsers"
    SetShellVarContext all
  ${EndIf}

  ; 바로가기 삭제
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME} 제거.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"

  ; 설치 파일 삭제
  Delete "$INSTDIR\${PRODUCT_EXE}"
  Delete "$INSTDIR\app_icon.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"

  ; 레지스트리 삭제
  DeleteRegKey SHCTX "${PRODUCT_UNINST_KEY}"
  DeleteRegKey SHCTX "${PRODUCT_DIR_REGKEY}"
SectionEnd
