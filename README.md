# Dual Camera Stop Motion Studio

Dual Camera Stop Motion Studio is a browser-based stop motion animation and multi-camera capture application that allows creators to capture synchronized frames from two cameras, use onion skin overlays, import reference images, and save files directly to local folders.

Perfect for stop motion animation, product photography, miniature photography, toy photography, stereoscopic imaging, and frame-by-frame production workflows.

---

## ✨ Features

* 📷 Dual camera support
* 🎞 Frame-by-frame image capture
* 🧅 Onion skin overlay
* 🗂 Save directly to local folders
* 🖼 Source reference image support
* ⌨️ Spacebar capture shortcut
* 📚 Capture timeline preview
* ⚡ Fast local-first architecture
* 💾 Browser-based file management
* 🎯 Frame numbering and automatic naming

---

## Preview Workflow

1. Select left and right cameras.
2. Choose output folders.
3. Import source/reference frames.
4. Position your subject.
5. Press **Space** to capture.
6. Images are automatically saved.
7. Onion skin overlay helps align the next frame.
8. Continue until the sequence is complete.

---

## Tech Stack

| Technology             | Purpose                  |
| ---------------------- | ------------------------ |
| React                  | UI                       |
| TypeScript             | Type Safety              |
| TanStack Router        | Routing                  |
| Zustand                | State Management         |
| Tailwind CSS           | Styling                  |
| Indexdb                | Local Database Storage   |
| File System Access API | Direct Folder Access     |
| react-hotkeys-hook     | Keyboard Shortcuts       |
| Vite                   | Development & Build Tool |

---

## Core Features

### Dual Camera Capture

Connect two USB cameras and capture synchronized frames from both sources.

Supported use cases:

* Stop motion production
* Product photography
* Multi-angle capture
* Stereoscopic imaging
* Motion analysis

---

### Onion Skin Overlay

Overlay the previously captured frame on top of the live camera feed.

Benefits:

* Consistent frame alignment
* Smooth animation movement
* Reduced positioning errors
* Faster production workflow

---

### Local Folder Saving

Images are saved directly to user-selected folders using the browser's File System Access API.

Example output:

```text
0001_L.jpg
0001_R.jpg

0002_L.jpg
0002_R.jpg

0003_L.jpg
0003_R.jpg
```

No uploads. No cloud storage. Everything remains local.

---

### Source Reference Frames

Import a sequence of reference images and display them alongside live camera feeds.

Useful for:

* Animation tracing
* Recreating existing motion
* Product assembly instructions
* Educational demonstrations

---

### Timeline Preview

Review previously captured frames without leaving the capture screen.

Features:

* Instant thumbnail preview
* Frame history
* Capture verification
* Quick progress overview

---

### Keyboard Shortcuts

| Shortcut | Action        |
| -------- | ------------- |
| Space    | Capture Frame |

Designed for hands-free operation during shooting sessions.

---


## Browser Requirements

This application relies on:

* File System Access API
* MediaDevices API
* Webcam permissions

Recommended browsers:

* Google Chrome
* Microsoft Edge

Safari and Firefox currently have limited support for direct folder access.

---

## Vision

Dual Camera Stop Motion Studio aims to provide a lightweight, local-first alternative to expensive stop-motion software by combining modern web technologies with direct camera and filesystem access.

Built for creators who need speed, simplicity, and complete control over their capture workflow.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Author

**Kundan Bhosale**

- GitHub: https://github.com/kundanbhosale
- Website: https://www.kbstack.com

## Contributing

Contributions are welcome.

If you'd like to improve the project:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

Bug reports, feature requests, and discussions are encouraged.

## Reporting Issues

Found a bug or have a feature request?

Please open an issue and include:

- Browser version
- Operating system
- Camera hardware used
- Steps to reproduce
- Screenshots if applicable


![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-Latest-purple)