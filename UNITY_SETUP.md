# Unity Runtime Setup

The Electron shell can embed a standalone Windows build of the Unity
experience. Follow these steps to make sure the renderer can discover and
attach to the Unity window correctly.

## 1. Drop in your Unity build

1. Create the directory `runtime/win/UnityPlayer/` in the repository root if it
   does not already exist.
2. Copy the **contents** of your Unity build output (the `.exe`, the
   `*_Data/` directory, and any DLLs) into that folder. When running from
   source, the app reads from this path. In a packaged build the same layout is
   reproduced inside `resources/app.asar.unpacked/runtime/win/UnityPlayer/`.

Your folder should look similar to:

```
runtime/
└── win/
    └── UnityPlayer/
        ├── MazedRuntime.exe
        ├── MazedRuntime_Data/
        ├── UnityPlayer.dll
        └── ...
```

> **Tip:** A development build is not required. Any standalone Windows player
> works as long as the executable and its data folder stay together in this
> directory.

## 2. Describe the executable and window title

Create a `unity.config.json` file in `runtime/win/UnityPlayer/` with at least
these properties:

```json
{
  "exe": "MazedRuntime.exe",
  "title": "Mazed Runtime",
  "args": []
}
```

- `exe` – file name of the Unity executable. If omitted, the app tries to pick
  the first `.exe` it finds, which might be incorrect if multiple executables
  are present.
- `title` – window caption shown by the Unity player. The native embedder
  searches for a window whose class is `UnityWndClass` and whose title matches
  this string. Development builds append ` (Development Build)` automatically,
  so the app now probes both the release and development captions even if you
  only provide the base title.
- `args` – optional array of additional command line arguments passed when the
  player launches.

You can also declare a `titles` array if you need to provide multiple explicit
caption variants:

```json
{
  "exe": "MazedRuntime.exe",
  "titles": ["Mazed Runtime", "Mazed Runtime QA"],
  "args": []
}
```

All listed titles (plus their development-build counterparts) are tried in
order until one succeeds.

You can confirm the title by running the Unity executable on its own and
reading the text in the window’s title bar. Copy that value into the config.

## 3. Launch the app

With the runtime directory populated and the config in place, start the
Electron app (`npm run dev` for development). When the Formless layer requests a
Unity mount, the helper process looks for the configured window title up to ten
 times before giving up. If everything is configured correctly the red failure
message disappears and the Unity view embeds in the UI.

If you still see the error, double-check:

- the Unity process is running (`Task Manager` shows your executable);
- the window title in Task Manager matches `title` in `unity.config.json`;
- the runtime files live in `runtime/win/UnityPlayer/` (case-sensitive on
  non-Windows filesystems);
- the executable has not been renamed by SmartScreen or another tool.

These three pieces—the runtime folder, the config file, and the correct window
caption—allow the embedder to locate and attach to the Unity window reliably.
