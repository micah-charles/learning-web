# KS3 Computing — Study Pack
# Topic: Hardware Components
**Year 7–9 | Computer Systems | UK National Curriculum**

---

## Overview

A computer is not a single device — it is a collection of hardware components working together. Understanding what each component does, how they relate to each other, and the difference between different storage types is fundamental to understanding how computers work.

This pack covers the major internal components (CPU, RAM, ROM, storage), peripheral devices (input, output, both), and the units used to measure data. These concepts underpin everything else in computer science.

By the end of this pack you will be able to:
- Name and describe the function of key internal hardware components
- Distinguish between primary and secondary storage
- Compare HDDs and SSDs
- Classify peripherals as input, output, or both
- Convert between data units (bytes, KB, MB, GB, TB)

---

## Section 1: Internal Hardware Components

### CPU — Central Processing Unit

The **CPU** is often called the "brain" of the computer. It is responsible for **executing instructions** — carrying out the operations that make programs run.

- Fetches instructions from RAM
- Decodes what each instruction means
- Executes the operation (arithmetic, logic, data movement)
- Performance is measured in **GHz** (billions of cycles per second)
- Modern CPUs have multiple **cores** (each core can execute independently)

### RAM — Random Access Memory

**RAM** is the computer's **working memory** — it holds the data and instructions for programs that are **currently running**.

| Property | Detail |
|----------|--------|
| **Type** | Primary storage |
| **Volatile** | Yes — contents are lost when power is switched off |
| **Speed** | Very fast (directly accessed by CPU) |
| **Capacity** | Typically 8 GB – 64 GB in modern computers |
| **Purpose** | Holds running programs, open files, and operating system |

**Why more RAM matters:** If RAM is full, the computer uses a slow area of the hard drive as "virtual memory", dramatically reducing speed.

### ROM — Read-Only Memory

**ROM** stores the **BIOS** (Basic Input/Output System) or firmware — the instructions the computer follows when it first switches on, before the operating system loads.

| Property | Detail |
|----------|--------|
| **Type** | Primary storage |
| **Volatile** | No — contents are **permanently retained** when power is off |
| **Speed** | Fast |
| **Written by** | Manufacturer only (read-only for the user) |
| **Purpose** | Boot instructions, hardware initialisation |

**Key distinction:** RAM loses its contents when switched off; ROM does not.

---

### Secondary Storage: HDD vs SSD

Secondary storage provides **permanent** (non-volatile) storage for the operating system, applications, and user files. It is slower than RAM but retains data permanently.

#### HDD — Hard Disk Drive

- Stores data on **magnetic spinning platters**
- A mechanical read/write **head** moves across the spinning disk to read or write data
- Has **moving mechanical parts** — can be damaged by drops or vibration
- **Slower** access than SSD (must wait for disk to spin to right position)
- **Cheaper per GB** — cost-effective for large storage
- Makes noise when operating

#### SSD — Solid State Drive

- Stores data in **NAND flash memory** chips (like a large USB flash drive)
- **No moving parts** — entirely electronic
- **Much faster** than HDD (no spinning wait time)
- **More expensive** per GB
- **More durable** — resistant to drops and vibration
- Silent operation
- Lighter and smaller

### HDD vs SSD Comparison Table

| Feature | HDD | SSD |
|---------|-----|-----|
| Storage technology | Magnetic spinning platters | Flash memory chips |
| Moving parts | Yes (motor, read/write head) | No |
| Speed | Slower (~100 MB/s typical) | Much faster (~500 MB/s+ typical) |
| Cost per GB | Cheaper | More expensive |
| Durability | Lower (vulnerable to drops) | Higher (no moving parts) |
| Noise | Audible spinning/clicking | Silent |
| Boot time | Slower | Very fast |
| Typical capacity | 1–20 TB common | 256 GB – 4 TB common |
| Best use | Large capacity storage | Operating system, fast programs |

---

### Other Storage Types

| Storage | Description |
|---------|-------------|
| **Optical drive** | Reads/writes CD, DVD, Blu-ray using a laser; portable; lower capacity |
| **USB flash drive** | Small portable flash memory device; convenient for file transfer |
| **SD/microSD card** | Flash memory card used in cameras, phones, tablets |
| **Cloud storage** | Files stored on remote servers accessed via internet (OneDrive, Google Drive) |

---

## Section 2: Primary vs Secondary Storage

| Feature | Primary Storage | Secondary Storage |
|---------|----------------|-------------------|
| Examples | RAM, ROM | HDD, SSD, optical disc, USB |
| Location | Inside/directly connected to CPU | Slower external or internal |
| Speed | Very fast | Slower than RAM |
| Volatile? | RAM: yes; ROM: no | No (non-volatile) |
| Holds... | Currently running programs/data | Permanently stored files and OS |
| Capacity | Smaller (GBs) | Larger (hundreds of GB to TBs) |

---

## Section 3: Peripheral Devices

A **peripheral** is any device connected to a computer to expand its capabilities. Peripherals are classified as input, output, or both.

### Input Devices — Send data INTO the computer

| Device | What it inputs |
|--------|---------------|
| Keyboard | Text and commands |
| Mouse | Pointer position and click events |
| Microphone | Audio/sound |
| Webcam | Video and still images |
| Scanner | Images of physical documents |
| Barcode reader | Product codes |
| Touchscreen (input function) | Touch gestures |
| Joystick / Gamepad | Game controls |

### Output Devices — Send data OUT of the computer

| Device | What it outputs |
|--------|----------------|
| Monitor / Screen | Visual display |
| Printer | Printed documents/images |
| Speakers | Audio |
| Projector | Large visual display |
| Headphones | Audio (personal) |

### Input AND Output Devices

| Device | Input | Output |
|--------|-------|--------|
| Touchscreen | Touch gestures | Display |
| Headset (with microphone) | Voice/microphone | Audio |
| Network interface card | Data received from network | Data sent to network |

---

## Section 4: The Motherboard and GPU

### Motherboard

The **motherboard** is the main circuit board of a computer. It:
- Physically connects and allows communication between all components
- Contains the CPU socket, RAM slots, expansion slots
- Provides connections for storage (SATA ports, M.2 slots)
- Contains the BIOS chip (ROM)
- Routes data between components using **buses** (electrical pathways)

### GPU — Graphics Processing Unit

The **GPU** is specialised hardware for processing graphics:
- Designed for **parallel processing** — performing thousands of simple calculations simultaneously
- Renders images, video, and 3D graphics for the display
- Also used in machine learning and scientific computing (massively parallel tasks)
- Modern computers may have integrated GPU (built into CPU) or dedicated GPU (separate card)

---

## Section 5: Data Units

Data is measured in units based on powers of 2:

| Unit | Abbreviation | Size |
|------|-------------|------|
| Bit | b | Single 0 or 1 |
| Byte | B | 8 bits |
| Kilobyte | KB | 1,024 bytes |
| Megabyte | MB | 1,024 KB = 1,048,576 bytes |
| Gigabyte | GB | 1,024 MB |
| Terabyte | TB | 1,024 GB |
| Petabyte | PB | 1,024 TB |

**Memory tip:** Each unit is **1,024 times** the previous (not 1,000 — computers work in base 2).

### Conversion Examples

```
How many bytes in 2 KB?
2 × 1,024 = 2,048 bytes

How many MB in 5 GB?
5 × 1,024 = 5,120 MB

How many bytes in 1 MB?
1,024 × 1,024 = 1,048,576 bytes
```

---

## System Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│                     INPUT DEVICES                      │
│           (Keyboard, Mouse, Microphone, etc.)          │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│                   MOTHERBOARD                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │                    CPU                          │  │
│  │   [Control Unit] [ALU] [Cache] [Registers]     │  │
│  └──────────────────┬──────────────────────────────┘  │
│                     │ buses                            │
│  ┌──────────────┐   │   ┌──────────────────────────┐  │
│  │     RAM      │◄──┼──►│         GPU              │  │
│  │ (primary,    │   │   │ (graphics processing)    │  │
│  │  volatile)   │   │   └──────────────────────────┘  │
│  └──────────────┘   │                                  │
│  ┌──────────────┐   │   ┌──────────────────────────┐  │
│  │     ROM      │◄──┘   │    SECONDARY STORAGE     │  │
│  │ (BIOS chip)  │       │    HDD / SSD / Optical   │  │
│  └──────────────┘       └──────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│                    OUTPUT DEVICES                      │
│              (Monitor, Printer, Speakers)              │
└────────────────────────────────────────────────────────┘
```

---

## Key Vocabulary

| Term | Definition |
|------|-----------|
| **CPU** | Central Processing Unit; the component that executes program instructions |
| **RAM** | Random Access Memory; fast, volatile primary storage for currently running programs |
| **ROM** | Read-Only Memory; non-volatile primary storage containing permanent boot instructions |
| **Volatile** | Memory that loses its contents when power is removed |
| **Non-volatile** | Memory that retains its contents without power |
| **HDD** | Hard Disk Drive; secondary storage using magnetic spinning platters |
| **SSD** | Solid State Drive; secondary storage using flash memory chips; no moving parts |
| **Motherboard** | Main circuit board connecting all computer components |
| **GPU** | Graphics Processing Unit; specialised processor for rendering graphics |
| **Primary storage** | Fast storage directly accessed by the CPU (RAM and ROM) |
| **Secondary storage** | Permanent but slower storage for files and OS (HDD, SSD, USB) |
| **Peripheral** | Any device connected to a computer as input, output, or both |
| **BIOS** | Basic Input/Output System; firmware stored in ROM; runs when computer boots |
| **Bus** | Electrical pathway on the motherboard that carries data between components |

---

## Common Misconceptions

| Misconception | Correction |
|---------------|-----------|
| "RAM and ROM are the same thing" | RAM is volatile (data lost when off) and holds running programs. ROM is non-volatile and stores permanent boot instructions. They serve entirely different purposes. |
| "More RAM makes storage faster" | RAM and storage are different. More RAM allows more programs to run simultaneously without using slow virtual memory. It does not make HDD/SSD faster. |
| "SSDs have moving parts like HDDs" | SSDs have NO moving parts — they use flash memory chips. This makes them faster, quieter, and more durable. |
| "The CPU stores programs" | The CPU **executes** programs. Programs are **stored** in secondary storage (HDD/SSD) and loaded into RAM when run. |
| "Deleting a file frees up RAM" | Deleting a file removes it from secondary storage (HDD/SSD). This does not affect RAM at all. Closing a running program frees RAM. |
| "8 GB RAM means 8 billion bytes" | 8 GB = 8 × 1,024 × 1,024 × 1,024 = 8,589,934,592 bytes. Computer units are powers of 2, not powers of 10. |

---

## Exam-Style Questions

### Q1 [1 mark]
State **one** difference between RAM and ROM.

### Q2 [2 marks]
Explain why RAM is described as **volatile**. In your answer, state what happens to the contents of RAM when a computer is switched off.

### Q3 [4 marks]
Compare a **Hard Disk Drive (HDD)** with a **Solid State Drive (SSD)**. Your answer should refer to at least four different features.

### Q4 [2 marks]
A student says: "My computer has 8 GB of RAM, so it can store 8 GB of files permanently."

Identify **two** errors in the student's statement and explain each one.

### Q5 [4 marks]
For each of the following devices, state whether it is an **input**, **output**, or **input/output** device, and briefly explain its purpose:

(a) Scanner
(b) Printer
(c) Touchscreen
(d) Speakers

### Multiple Choice Question
Which of the following correctly describes **ROM**?

- A) Fast, volatile memory that holds currently running programs
- B) Permanent, non-volatile memory that holds the BIOS and loses data when switched off
- C) Permanent, non-volatile memory that holds the BIOS and retains data when switched off
- D) Secondary storage used for long-term file storage

*(Answer: C)*

### Fill in the Blank
"An SSD is faster than an HDD because it uses __________ memory and has __________ moving parts. As a result, it is also more __________ than an HDD."

*(Answers: flash; no; durable)*

---

## Model Answers

### Q1 Model Answer
Any one of:
- RAM is volatile; ROM is non-volatile.
- RAM can be written to by the CPU; ROM can only be read.
- RAM holds currently running programs; ROM holds BIOS/boot instructions.
- RAM loses data when power is removed; ROM retains data permanently.

### Q2 Model Answer
RAM is described as volatile because it requires a continuous power supply to maintain its contents. When the computer is switched off, the electrical charge sustaining the data is lost, and all data stored in RAM is permanently erased. This is why any unsaved work is lost in a power cut — it was stored in RAM, not secondary storage.

### Q3 Model Answer

| Feature | HDD | SSD |
|---------|-----|-----|
| Technology | Magnetic spinning platters | Flash memory chips |
| Moving parts | Yes | No |
| Speed | Slower | Much faster |
| Cost per GB | Cheaper | More expensive |
| Durability | Lower (drops can damage head) | Higher (resistant to drops) |
| Noise | Audible | Silent |

SSDs are preferred for performance-critical uses (operating system, applications) while HDDs are preferred for large, cost-effective storage.

### Q4 Model Answer
Error 1: RAM is **volatile** — it does not store files permanently. When the computer is switched off, all data in RAM is lost. Files are permanently stored in secondary storage (HDD or SSD), not RAM.

Error 2: RAM holds **currently running programs and data**, not saved files. Having 8 GB of RAM means the computer can run more programs simultaneously without slowing down — it does not give 8 GB of file storage space.

### Q5 Model Answer
(a) **Scanner — Input device.** A scanner converts a physical paper document or photograph into a digital image file that is sent into the computer.

(b) **Printer — Output device.** A printer receives digital data from the computer and produces a physical (paper) copy of documents or images.

(c) **Touchscreen — Input/Output device.** The screen displays visual output from the computer, while the touch-sensitive surface detects the user's finger touches and sends that positional data as input.

(d) **Speakers — Output device.** Speakers receive digital audio data from the computer and convert it into sound waves that the user can hear.

---

## Revision Checklist

- [ ] I can name the function of the CPU (executes instructions)
- [ ] I can explain what RAM is and why it is volatile
- [ ] I can explain what ROM is and why it is non-volatile
- [ ] I can state what BIOS/firmware is and where it is stored (ROM)
- [ ] I can describe HDD technology (magnetic spinning platters, moving parts)
- [ ] I can describe SSD technology (flash memory, no moving parts)
- [ ] I can compare HDD and SSD across at least four features (speed, cost, durability, moving parts, noise)
- [ ] I know the difference between primary storage (RAM, ROM) and secondary storage (HDD, SSD)
- [ ] I can name the motherboard and explain its role (connects all components via buses)
- [ ] I can describe what a GPU does (parallel processing for graphics)
- [ ] I can classify input, output, and input/output peripheral devices with examples
- [ ] I know the data unit hierarchy: bit → byte → KB → MB → GB → TB
- [ ] I know each unit is 1,024 times the previous (not 1,000)
- [ ] I can identify and correct common misconceptions about RAM, ROM, HDD, and SSD
