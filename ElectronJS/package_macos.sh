#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
STAGE_DIR="$REPO_ROOT/.temp_to_pub/EasySpider_MacOS"

if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "This script must run on macOS." >&2
    exit 1
fi

HOST_ARCH="$(uname -m)"
case "$HOST_ARCH" in
    arm64) ELECTRON_ARCH=arm64 ;;
    x86_64) ELECTRON_ARCH=x64 ;;
    *) echo "Unsupported macOS architecture: $HOST_ARCH" >&2; exit 1 ;;
esac

(cd "$REPO_ROOT/Extension/manifest_v3" && node package.js)
rm -rf "$SCRIPT_DIR/out" "$STAGE_DIR/EasySpider.app"
(cd "$SCRIPT_DIR" && npm run make -- --platform=darwin --arch="$ELECTRON_ARCH")

ZIP_PATH="$(find "$SCRIPT_DIR/out/make/zip/darwin/$ELECTRON_ARCH" -type f -name '*.zip' -print -quit 2>/dev/null || true)"
if [[ -z "$ZIP_PATH" || ! -f "$ZIP_PATH" ]]; then
    echo "Electron Forge did not produce a macOS $ELECTRON_ARCH zip." >&2
    exit 1
fi
mkdir -p "$STAGE_DIR"
unzip -q "$ZIP_PATH" -d "$STAGE_DIR"

APP_PATH="$STAGE_DIR/EasySpider.app"
APP_RESOURCES="$APP_PATH/Contents/Resources/app"
if [[ ! -d "$APP_PATH" ]]; then
    echo "Packaged application was not found at $APP_PATH" >&2
    exit 1
fi

rm -f "$APP_RESOURCES/vs_BuildTools.exe" "$APP_RESOURCES/VS_BuildTools.exe"
rm -rf "$APP_RESOURCES/chrome_win32" "$APP_RESOURCES/chrome_win64" \
    "$APP_RESOURCES/chrome_linux64" \
    "$APP_RESOURCES/chromedrivers" "$APP_RESOURCES/Data" \
    "$APP_RESOURCES/.idea" "$APP_RESOURCES/tasks" \
    "$APP_RESOURCES/execution_instances" "$APP_RESOURCES/user_data" \
    "$APP_RESOURCES/TempUserDataFolder"

rm -rf "$STAGE_DIR/Code" "$STAGE_DIR/Sample Tasks" "$STAGE_DIR/Data" \
    "$STAGE_DIR/execution_instances" "$STAGE_DIR/user_data" \
    "$STAGE_DIR/TempUserDataFolder"
rm -f "$STAGE_DIR/config.json" "$STAGE_DIR/mysql_config.json"
mkdir -p "$STAGE_DIR/Code" "$STAGE_DIR/Sample Tasks" "$STAGE_DIR/Data" \
    "$STAGE_DIR/execution_instances"
cp "$SCRIPT_DIR/execute_macos.sh" "$STAGE_DIR/execute_macos.sh"
cp "$REPO_ROOT/ExecuteStage"/*.py "$STAGE_DIR/Code/"
cp "$REPO_ROOT/ExecuteStage/requirements.txt" "$STAGE_DIR/Code/"
cp "$REPO_ROOT/ExecuteStage/Readme.md" "$STAGE_DIR/Code/"
cp "$REPO_ROOT/ExecuteStage/myCode.py" "$STAGE_DIR/"
cp -R "$REPO_ROOT/ExecuteStage/undetected_chromedriver_ES" "$STAGE_DIR/Code/"
cp -R "$REPO_ROOT/ExecuteStage/.vscode" "$STAGE_DIR/Code/"

while IFS= read -r -d '' task; do
    relative="${task#tasks/}"
    destination="$STAGE_DIR/Sample Tasks/$relative"
    mkdir -p "$(dirname -- "$destination")"
    cp "$SCRIPT_DIR/$task" "$destination"
done < <(git -c safe.directory='*' -C "$SCRIPT_DIR" ls-files -z -- tasks)

find "$STAGE_DIR" -type d -name __pycache__ -prune -exec rm -rf {} +
find "$STAGE_DIR" -type d -name .pytest_cache -prune -exec rm -rf {} +
chmod 755 "$STAGE_DIR/first_time_run.sh" "$STAGE_DIR/execute_macos.sh" 2>/dev/null || true
chmod 755 "$STAGE_DIR/easyspider_executestage" "$STAGE_DIR/easyspider_executestage_full" 2>/dev/null || true

# Keep copies inside the signed app as well as in the portable release folder.
# Gatekeeper may App-Translocate the .app when a user approves it in Privacy &
# Security; an external sibling executable would then no longer be reachable
# at the path shown by the translocated process.  Electron launches these
# bundled copies with the stable userData directory as their working directory.
for executor in easyspider_executestage easyspider_executestage_full; do
    if [[ ! -f "$STAGE_DIR/$executor" ]]; then
        echo "Missing macOS execution stage: $STAGE_DIR/$executor" >&2
        exit 1
    fi
    cp "$STAGE_DIR/$executor" "$APP_RESOURCES/$executor"
    chmod 755 "$APP_RESOURCES/$executor"
done

# Sign only after all files have been copied/deleted. Set CODESIGN_IDENTITY to
# a Developer ID identity for a distributable build; the default '-' is ad hoc.
CODESIGN_IDENTITY="${CODESIGN_IDENTITY:--}"
sign_path() {
    local path="$1"
    if [[ "$CODESIGN_IDENTITY" == "-" ]]; then
        codesign --force --deep --sign - "$path"
    else
        codesign --force --deep --options runtime --timestamp --sign "$CODESIGN_IDENTITY" "$path"
    fi
}
sign_path "$STAGE_DIR/easyspider_executestage"
sign_path "$STAGE_DIR/easyspider_executestage_full"
sign_path "$APP_RESOURCES/easyspider_executestage"
sign_path "$APP_RESOURCES/easyspider_executestage_full"
sign_path "$APP_PATH"
codesign --verify --deep --strict "$APP_PATH"
echo "macOS $HOST_ARCH application staged at $STAGE_DIR"
