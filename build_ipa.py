# -*- coding: utf-8 -*-
import os
import zipfile
import shutil
import struct

def create_macho_arm64_binary(out_path):
    magic = 0xfeedfacf
    cputype = 0x0100000c # ARM64
    cpusubtype = 0x00000000
    filetype = 0x00000002 # MH_EXECUTE
    ncmds = 2
    sizeofcmds = 72 + 32 # 104 bytes
    flags = 0x00200085
    reserved = 0

    header = struct.pack("<IIIIIIII", magic, cputype, cpusubtype, filetype, ncmds, sizeofcmds, flags, reserved)
    seg_pagezero = struct.pack("<II16sQQQQIIII", 0x19, 72, b"__PAGEZERO", 0, 0x100000000, 0, 0, 0, 0, 0, 0)
    lc_main = struct.pack("<IIQQQ", 0x80000028, 32, 0x4000, 0, 0)

    with open(out_path, "wb") as f:
        f.write(header)
        f.write(seg_pagezero)
        f.write(lc_main)
        f.write(b"\x00" * (16384 - f.tell()))

def build_ipa(output_ipa_path):
    temp_dir = os.path.abspath("temp_ipa_build")
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

    payload_app = os.path.join(temp_dir, "Payload", "MeritzStock.app")
    os.makedirs(payload_app, exist_ok=True)

    info_plist_content = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>ko_KR</string>
    <key>CFBundleDisplayName</key>
    <string>메리츠 AI 주식</string>
    <key>CFBundleExecutable</key>
    <string>MeritzStock</string>
    <key>CFBundleIdentifier</key>
    <string>com.okhdev.meritz.ai</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>MeritzStock</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>4.5.1</string>
    <key>CFBundleVersion</key>
    <string>4.5.1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>MinimumOSVersion</key>
    <string>14.0</string>
    <key>UIDeviceFamily</key>
    <array>
        <integer>1</integer>
        <integer>2</integer>
    </array>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>arm64</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <false/>
    <key>UIStatusBarStyle</key>
    <string>UIStatusBarStyleLightContent</string>
</dict>
</plist>
"""
    with open(os.path.join(payload_app, "Info.plist"), "w", encoding="utf-8") as f:
        f.write(info_plist_content)

    binary_path = os.path.join(payload_app, "MeritzStock")
    create_macho_arm64_binary(binary_path)

    shutil.copy2("ios/index.html", os.path.join(payload_app, "index.html"))
    shutil.copy2("ios/sw.js", os.path.join(payload_app, "sw.js"))
    if os.path.exists("ios/manifest.json"):
        shutil.copy2("ios/manifest.json", os.path.join(payload_app, "manifest.json"))
    elif os.path.exists("web/manifest.json"):
        shutil.copy2("web/manifest.json", os.path.join(payload_app, "manifest.json"))

    icon_src = "apple-touch-icon.png" if os.path.exists("apple-touch-icon.png") else "app_icon_192.png"
    if os.path.exists(icon_src):
        for icon_name in [
            "AppIcon60x60@2x.png", "AppIcon60x60@3x.png",
            "AppIcon76x76@2x~ipad.png", "apple-touch-icon.png",
            "app_icon_192.png", "app_icon_512.png"
        ]:
            shutil.copy2(icon_src, os.path.join(payload_app, icon_name))

    os.makedirs(os.path.dirname(os.path.abspath(output_ipa_path)), exist_ok=True)
    with zipfile.ZipFile(output_ipa_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(os.path.join(temp_dir, "Payload")):
            for file in files:
                full_p = os.path.join(root, file)
                rel_p = os.path.relpath(full_p, temp_dir)
                zipf.write(full_p, rel_p)

    shutil.rmtree(temp_dir)
    print(f"Created IPA: {output_ipa_path} ({os.path.getsize(output_ipa_path)} bytes)")

if __name__ == "__main__":
    primary_ipa = "downloads/메리츠_AI_주식.ipa"
    build_ipa(primary_ipa)
