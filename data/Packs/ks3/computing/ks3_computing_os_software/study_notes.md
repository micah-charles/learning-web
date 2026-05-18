# KS3 Computing — Study Pack
# Topic: Operating Systems & Software
**Year 7–9 | Computer Systems | UK National Curriculum**

---

## Overview

A computer without software is just an expensive collection of electronic components. Software is what makes hardware useful. At the heart of every computer is the **operating system** — a sophisticated program that manages all the hardware and provides a foundation for all other software to run.

This pack explores what operating systems do, the difference between types of software, how users interact with computers, and the distinction between open source and proprietary software.

By the end of this pack you will be able to:
- Name and describe the five key functions of an operating system
- Explain what a device driver is and why it is needed
- Classify software as system software, application software, or utility software
- Compare GUI and CLI interfaces
- Compare open source and proprietary software

---

## Section 1: Operating Systems

### What is an Operating System?

An **Operating System (OS)** is a type of **system software** that acts as an intermediary between the user, application software, and the hardware. Without an OS, application programs would each need to be written to control hardware directly — a near-impossible task.

The OS provides:
1. A stable, consistent platform for other software to run on
2. Management of all hardware resources
3. An interface for the user to interact with the computer

### Common Operating Systems

| Operating System | Manufacturer | Used on |
|-----------------|-------------|---------|
| **Windows 11** | Microsoft | Desktop PCs, laptops |
| **macOS Ventura/Sonoma** | Apple | Mac computers |
| **Linux** (Ubuntu, Fedora) | Open source community | Servers, desktops, embedded |
| **Android** | Google (based on Linux) | Smartphones, tablets |
| **iOS** | Apple | iPhones, iPads |
| **Chrome OS** | Google | Chromebooks |

---

## Section 2: The Five Key Functions of an Operating System

### 1. Memory Management

The OS allocates portions of RAM to each running program and manages which program is using which part of memory.

- Ensures programs do not accidentally overwrite each other's data in RAM
- Allocates memory when a program starts and frees it when a program closes
- Manages **virtual memory** — using secondary storage as overflow RAM when physical RAM is full (though this is slow)

**Example:** When you open your web browser, the OS allocates a block of RAM to it. When you also open a music app, the OS allocates a separate block of RAM to that program, ensuring the two programs cannot interfere with each other.

### 2. Process Management

A **process** is a program that is currently being executed. The OS manages all running processes and their access to the CPU.

- **Schedules** CPU time between multiple processes (process scheduling)
- Allows **multitasking** — giving each process a small time slice on the CPU, switching rapidly to create the illusion that all programs run simultaneously
- Manages process states: running, waiting, ready
- Creates new processes when programs are launched, terminates them when programs are closed

**Example:** Even on a single-core CPU, your computer can appear to run a word processor, music app, and antivirus scan simultaneously — the OS is rapidly switching CPU time between all three processes.

### 3. File Management

The OS provides a system for organising, creating, reading, writing, and deleting files and folders on storage devices.

- Creates and maintains a **file system** (e.g. NTFS on Windows, APFS on macOS, ext4 on Linux)
- Organises files in a **hierarchical folder structure**
- Tracks where files are physically located on the storage device
- Controls access permissions (which users can read, write, or execute which files)

**Example:** When you save a document to "My Documents", the OS determines exactly which physical sectors of the HDD or SSD to write the data to, records the file's name and location in the file system, and makes it retrievable later by filename.

### 4. Device Management

Hardware devices (printers, keyboards, mice, USB drives) each have their own specific communication protocols. The OS communicates with hardware through specialised software called **device drivers**.

- Loads and manages **device drivers** for all connected hardware
- Provides a **hardware abstraction layer** — application programs do not need to know the specifics of each piece of hardware
- Manages input/output operations between programs and hardware devices

**Device driver:** A small piece of software that acts as a translator between the OS and a specific hardware device. Each device needs its own driver that understands how to communicate with it.

**Example:** When you plug in a new printer, the OS loads or downloads the appropriate **printer driver**. Your word processor then sends print instructions to the OS, which uses the driver to translate those instructions into the specific commands that printer understands — without your word processor needing to know anything about that particular printer model.

### 5. User Interface

The OS provides the interface through which users interact with the computer. There are two main types:

- **GUI (Graphical User Interface):** Visual windows, icons, menus, and a pointer (mouse cursor)
- **CLI (Command Line Interface):** Text-based; user types commands; OS responds with text

*(Full details of GUI and CLI are in Section 4)*

---

## Section 3: Types of Software

All software falls into three categories:

### System Software

Software that **manages and controls the hardware** and provides the platform for other software to operate. Users rarely interact with it directly.

| Type | Examples |
|------|---------|
| Operating system | Windows 11, macOS, Linux, Android |
| Device drivers | Printer driver, graphics card driver, audio driver |
| Utility software | (see below — a sub-category) |

### Application Software

Software designed to help users **perform specific tasks**. Applications run on top of the OS and use its services.

| Category | Examples |
|----------|---------|
| Word processing | Microsoft Word, Google Docs, LibreOffice Writer |
| Web browsing | Google Chrome, Firefox, Safari |
| Entertainment | Spotify, Netflix app, YouTube |
| Education | Khan Academy app, Duolingo |
| Games | Minecraft, FIFA |
| Productivity | Microsoft Excel, Google Sheets |
| Communication | WhatsApp, Outlook, Zoom |

### Utility Software

A sub-category of **system software** that performs **maintenance, optimisation, and security** tasks on the computer. Utility software keeps the system running smoothly.

| Utility type | Examples | Purpose |
|-------------|---------|---------|
| Antivirus / security | Norton, Windows Defender, Malwarebytes | Detect and remove malware |
| Disk defragmenter | Windows Defrag, Defraggler | Reorganises fragmented files on HDD for faster access |
| Backup software | Time Machine (Mac), File History (Windows) | Creates copies of files to prevent data loss |
| Compression tool | WinZip, 7-Zip | Compress and archive files |
| Disk cleaner | CCleaner, Disk Cleanup | Removes temporary files to free storage space |
| Firewall | Windows Firewall, ZoneAlarm | Monitors network traffic; blocks unauthorised access |

**Classification challenge:** Is antivirus application software or system software?
- It is **utility software** (a type of system software) because its purpose is to maintain and protect the system, not to help the user with a specific task like writing a document or browsing the web.

---

### Software Classification Table

| Software | Type | Reason |
|----------|------|--------|
| Windows 11 | System (OS) | Manages hardware and provides platform for other software |
| Microsoft Word | Application | Helps users create and edit documents |
| Google Chrome | Application | Helps users browse the internet |
| Antivirus | Utility (System) | Protects system from malware; maintenance task |
| Disk Defragmenter | Utility (System) | Optimises storage organisation; maintenance task |
| Windows Device Driver | System | Allows OS to communicate with specific hardware |
| Spotify | Application | Music streaming for entertainment |
| Backup software | Utility (System) | Maintains copies of data to prevent loss |

---

## Section 4: User Interfaces

### GUI — Graphical User Interface

A **GUI** uses visual elements: windows, icons, menus, and a pointer (WIMP). Users interact primarily with a mouse or touchscreen.

**Characteristics of GUI:**

| Feature | Detail |
|---------|--------|
| Interaction method | Mouse clicks, drag-and-drop, touchscreen gestures |
| Visual elements | Windows, icons, toolbars, dialogue boxes, menus |
| Learning curve | Low — intuitive; beginners can use it quickly |
| Resource usage | Higher — requires graphics processing; uses more RAM |
| Error risk | Lower — you can see what you're clicking |
| Speed for experts | Slower — must navigate through menus |
| Examples | Windows 11, macOS, Android, iOS |

### CLI — Command Line Interface

A **CLI** requires users to type precise text commands. The OS reads each command, executes it, and returns a text response.

**Characteristics of CLI:**

| Feature | Detail |
|---------|--------|
| Interaction method | Typing text commands |
| Visual elements | Text only; no graphics |
| Learning curve | High — must memorise commands and syntax |
| Resource usage | Very low — no graphics required |
| Error risk | Higher — a typo in a command can have unintended effects |
| Speed for experts | Faster — commands can be chained and scripted |
| Examples | Terminal (macOS/Linux), Command Prompt (Windows), PowerShell |

### GUI vs CLI Comparison Table

| Feature | GUI | CLI |
|---------|-----|-----|
| Ease of use | Easy for beginners | Difficult without training |
| Speed for experts | Slower (menu navigation) | Faster (direct commands) |
| Resource usage | High (graphics) | Very low |
| Error risk | Low | Higher (exact syntax needed) |
| Automation/scripting | Limited | Excellent (shell scripts) |
| Remote server use | Not ideal | Ideal (low bandwidth) |
| Typical users | General public | IT professionals, developers, server admins |
| Example action | Click File → Save | Type `cp document.txt backup/` |

---

## Section 5: Open Source vs Proprietary Software

### Open Source Software

- The **source code** is freely available to view, modify, and redistribute
- Usually free of charge (though not always)
- Developed and maintained by a community of volunteers or organisations
- Transparency: anyone can inspect the code for security flaws
- Customisable: businesses can modify it to suit their needs

**Examples:** Linux, LibreOffice, Firefox, VLC Media Player, GIMP, Python (language), MySQL

### Proprietary Software

- The **source code is kept secret** — owned by the developing company
- Usually requires payment (purchase or subscription)
- Developed and maintained by paid employees of the company
- Professional support is available
- Less flexibility — you cannot modify the software

**Examples:** Microsoft Windows, Microsoft Office, macOS, Adobe Photoshop, most commercial games

### Open Source vs Proprietary Comparison Table

| Feature | Open Source | Proprietary |
|---------|------------|-------------|
| Source code | Freely available | Secret (closed) |
| Cost | Usually free | Often costs money (purchase or subscription) |
| Customisable? | Yes — can be modified | No — cannot be modified by users |
| Support | Community forums, documentation | Professional company support |
| Security transparency | High — code inspected by many | Lower — must trust the company |
| Reliability | Varies — depends on community | Often high — tested professionally |
| Examples | Linux, LibreOffice, Firefox | Windows, Microsoft Office, Adobe Photoshop |
| Who uses it? | Developers, servers, budget-conscious users | Businesses needing support, general consumers |

---

## System Layers Diagram

```
┌─────────────────────────────────────────────────────────┐
│                       USER                              │
│            (interacts via GUI or CLI)                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│               APPLICATION SOFTWARE                      │
│        (Word, Chrome, Games, Spotify, etc.)             │
│                                                         │
│    Applications make requests to the OS for services    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              OPERATING SYSTEM                           │
│   Memory Mgmt | Process Mgmt | File Mgmt               │
│   Device Mgmt | User Interface                         │
│                                                         │
│    The OS translates app requests into hardware actions │
│    via device drivers                                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    HARDWARE                             │
│      CPU | RAM | HDD/SSD | GPU | Keyboard | Screen      │
└─────────────────────────────────────────────────────────┘

Each layer only communicates with the layer directly above/below it.
Applications do not need to know hardware details — the OS handles this.
```

---

## Key Vocabulary

| Term | Definition |
|------|-----------|
| **Operating System (OS)** | System software that manages hardware and provides a platform for other software |
| **System software** | Software that manages and controls hardware (includes OS, drivers, utilities) |
| **Application software** | Software that helps users perform specific tasks (word processing, browsing, games) |
| **Utility software** | System software that performs maintenance and optimisation tasks (antivirus, backup, defrag) |
| **Device driver** | Software that allows the OS to communicate with a specific hardware device |
| **Process** | A program that is currently being executed by the CPU |
| **Multitasking** | Running multiple processes apparently simultaneously by rapidly switching CPU time |
| **File system** | The method the OS uses to organise and store files on a storage device (e.g. NTFS, APFS) |
| **GUI** | Graphical User Interface — visual windows, icons, menus, and a pointer |
| **CLI** | Command Line Interface — text-based; user types commands; OS responds in text |
| **WIMP** | Windows, Icons, Menus, Pointer — the four elements of a GUI |
| **Open source** | Software whose source code is publicly available to view, modify, and redistribute |
| **Proprietary** | Software whose source code is kept secret; owned and controlled by a company |
| **Hardware abstraction** | The OS hiding hardware complexity from application programs via drivers |

---

## Common Misconceptions

| Misconception | Correction |
|---------------|-----------|
| "The OS is just the desktop wallpaper and icons" | The OS is the entire software foundation of the computer — managing memory, processes, files, and devices. The desktop is only the **user interface** part of the OS. |
| "Application software controls the hardware" | Application software makes requests to the **OS**, which controls the hardware through drivers. Applications have no direct hardware access — the OS mediates everything. |
| "CLI is outdated and no one uses it" | CLI is widely used by IT professionals, system administrators, developers, and for server management. Most web servers run Linux with no GUI at all — they are managed entirely via CLI. |
| "Open source software is always free" | Open source means the **source code is publicly available**, not necessarily that it is free of charge. Some open source software has commercial licences. However, most popular open source software is free to use. |
| "Utility software is the same as application software" | Utility software is a type of **system software** designed to maintain and optimise the computer system itself. Application software helps users complete personal tasks like writing or browsing. |
| "The OS manages only one program at a time" | Modern OSes support **multitasking** — running many programs apparently simultaneously through process scheduling, rapidly switching CPU time between processes. |

---

## Exam-Style Questions

### Q1 [1 mark]
State **one** function of an operating system.

### Q2 [2 marks]
Explain what a **device driver** is and why it is needed.

### Q3 [4 marks]
Compare a **GUI** with a **CLI**. Your answer should discuss ease of use, resource requirements, and suitability for different types of users.

### Q4 [3 marks]
Classify each of the following as **application software**, **utility software**, or **system software (OS/driver)**. For each, give a reason for your classification.

(a) Antivirus program
(b) Google Chrome (web browser)
(c) Windows 11
(d) Disk defragmenter

### Q5 [6 marks]
A computer system is running a video editing application, playing music in the background, and performing a scheduled antivirus scan simultaneously. Describe **four** functions the operating system is performing to manage this scenario. For each function, explain specifically what the OS is doing in this context.

### Multiple Choice Question
Which of the following best describes **open source** software?

- A) Software that is always completely free of charge
- B) Software whose source code is freely available to view, modify, and redistribute
- C) Software developed only by large technology companies
- D) Software with no copyright protection

*(Answer: B)*

### Fill in the Blank
"A __________ is software that allows the operating system to communicate with a specific hardware device. Without it, the OS would not know how to send data to or receive data from that device. For example, a __________ allows a computer to print documents by translating OS commands into instructions the physical device understands."

*(Answers: device driver; printer driver)*

---

## Model Answers

### Q1 Model Answer
Any one of: memory management, process management, file management, device management, providing a user interface.

### Q2 Model Answer
A **device driver** is a small piece of software that acts as a translator between the operating system and a specific hardware device. It is needed because different hardware devices (e.g. different printer models) each use their own specific communication protocols. The OS cannot know in advance how to communicate with every possible hardware device, so each device comes with a driver that tells the OS exactly how to send commands to and receive data from that particular device.

### Q3 Model Answer
A **GUI** uses visual elements — windows, icons, menus, and a pointer — allowing users to interact with a mouse or touchscreen. It has a low learning curve because users can see options and click on them rather than memorising commands. However, GUIs use more system resources (RAM and graphics processing) and can be slower for expert users who must navigate through multiple menus.

A **CLI** requires users to type precise text commands. It uses very few system resources (no graphics needed) and is much faster for expert users who know the commands — they can chain commands and write scripts to automate repetitive tasks. However, it has a steep learning curve and a single typing error can cause unintended results.

For general consumers and beginners, a GUI is more appropriate. For IT professionals, system administrators, and server management (where resources are limited and speed matters), a CLI is often preferred.

### Q4 Model Answer
(a) **Antivirus** — **Utility software** (system software). Its purpose is to protect and maintain the computer system by detecting and removing malware, not to help the user complete a personal task.

(b) **Google Chrome** — **Application software**. It is used by the user to perform a specific task (browsing the internet). It runs on top of the operating system.

(c) **Windows 11** — **System software (Operating System)**. It manages all hardware resources, provides the platform for other software, and provides the user interface. It is not used for a specific user task.

(d) **Disk defragmenter** — **Utility software** (system software). Its purpose is to reorganise fragmented files on a hard drive to optimise storage performance — a system maintenance task.

### Q5 Model Answer

**1. Process Management:** The OS is scheduling CPU time between three simultaneous processes: the video editor, the music player, and the antivirus scan. On a multi-core CPU, it may assign different processes to different cores. On a single core, it rapidly switches between processes in time slices, ensuring all three make progress.

**2. Memory Management:** The OS has allocated separate blocks of RAM to each running program — the video editor, the music app, and the antivirus. It ensures these memory regions do not overlap, preventing the programs from interfering with each other's data. It also frees RAM when processes end.

**3. File Management:** The video editor is reading video files from storage. The antivirus is scanning files on the HDD/SSD. The OS manages all these read/write requests to the file system, ensuring files are correctly located and accessed, and mediating between multiple processes accessing storage.

**4. Device Management:** The OS is using device drivers to manage output — sending the video editing interface to the monitor via the graphics card driver, and sending audio from the music app to the speakers via the audio driver — while simultaneously managing the antivirus's requests to scan storage.

---

## Revision Checklist

- [ ] I can define what an operating system is (system software managing hardware, providing platform)
- [ ] I can name and describe all five OS functions: memory management, process management, file management, device management, user interface
- [ ] I can explain what a device driver is and why it is needed
- [ ] I can distinguish between system software, application software, and utility software
- [ ] I can give at least two examples of each type of software
- [ ] I can classify given examples of software into the correct category with justification
- [ ] I can describe key features of a GUI (windows, icons, menus, pointer / WIMP)
- [ ] I can describe key features of a CLI (text commands, no graphics)
- [ ] I can compare GUI and CLI for ease of use, resources, speed for experts, and automation
- [ ] I can explain what open source software means (source code publicly available)
- [ ] I can explain what proprietary software means (source code is closed/secret)
- [ ] I can compare open source and proprietary software across cost, customisability, and support
- [ ] I can give examples of open source software (Linux, LibreOffice, Firefox)
- [ ] I can give examples of proprietary software (Windows, Microsoft Office, Photoshop)
- [ ] I can identify and correct common misconceptions about operating systems and software types
