// native/embedder.c  — Win32 helper: no UI, no console
#include <windows.h>
#include <shellapi.h>   // CommandLineToArgvW
#include <stdlib.h>     // _wtoi, _wcstoui64

static HWND find_unity(LPCWSTR title) {
    return FindWindowW(L"UnityWndClass", title);
}

int WINAPI wWinMain(HINSTANCE hInst, HINSTANCE hPrev, PWSTR pCmdLine, int nCmdShow) {
    int argc = 0;
    LPWSTR *argv = CommandLineToArgvW(GetCommandLineW(), &argc);
    if (!argv || argc < 3) return 2;

    LPCWSTR mode  = argv[1];
    LPCWSTR title = argv[2];

    HWND unity = find_unity(title);
    if (!unity) return 1;

    if (lstrcmpiW(mode, L"embed") == 0) {
        if (argc < 6) return 2;
        ULONGLONG hostVal = _wcstoui64(argv[3], NULL, 10);
        int w = _wtoi(argv[4]);
        int h = _wtoi(argv[5]);
        HWND host = (HWND)(ULONG_PTR)hostVal;

        ShowWindow(unity, SW_HIDE);
        SetParent(unity, host);

        LONG_PTR style = GetWindowLongPtrW(unity, GWL_STYLE);
        style |= WS_CHILD | WS_VISIBLE;
        style &= ~(WS_POPUP | WS_CAPTION | WS_THICKFRAME | WS_MINIMIZE | WS_MAXIMIZE | WS_SYSMENU);
        SetWindowLongPtrW(unity, GWL_STYLE, style);

        SetWindowPos(unity, NULL, 0, 0, w, h, SWP_NOZORDER | SWP_SHOWWINDOW);
        ShowWindow(unity, SW_SHOW);
        return 0;
    } else if (lstrcmpiW(mode, L"resize") == 0) {
        if (argc < 5) return 2;
        int w = _wtoi(argv[3]);
        int h = _wtoi(argv[4]);
        MoveWindow(unity, 0, 0, w, h, TRUE);
        return 0;
    } else if (lstrcmpiW(mode, L"show") == 0) {
        ShowWindow(unity, SW_SHOW);
        return 0;
    } else if (lstrcmpiW(mode, L"hide") == 0) {
        ShowWindow(unity, SW_HIDE);
        return 0;
    }

    return 2;
}
