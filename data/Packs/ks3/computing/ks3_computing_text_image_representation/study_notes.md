# KS3 Computing — Study Pack
# Topic: Text & Image Representation
**Year 7–9 | Data Representation | UK National Curriculum**

---

## Overview

All computers ultimately store everything — letters, photographs, video clips — as binary numbers. To make this work, computers need agreed systems that map binary values to specific characters, colours, and pixels.

This pack covers the two most important areas of data representation beyond raw numbers: **text** (how characters are encoded) and **images** (how pictures are stored as grids of coloured dots). These ideas directly explain why files have different sizes and why some images look sharper than others.

By the end of this pack you will be able to:
- Explain how ASCII and Unicode encode text as binary numbers
- Read and use an ASCII table
- Describe how images are stored using pixels and colour depth
- Calculate the file size of an image from its dimensions and colour depth
- Explain the trade-off between quality and file size

---

## Section 1: Text Representation

### How Characters Are Stored

Computers only understand binary numbers. To store text, every character — letters, digits, punctuation, spaces — must be assigned a unique number. That number is then stored in binary. The agreed mapping between numbers and characters is called a **character set** (or character encoding).

### ASCII (American Standard Code for Information Interchange)

**ASCII** is the original character encoding standard, developed in the 1960s.

- Uses **7 bits** per character
- Represents **128 characters** in total (2⁷ = 128)
- Covers: uppercase letters (A–Z), lowercase letters (a–z), digits (0–9), punctuation marks, and **control characters** (non-printable codes like "new line" or "tab")

**Key ASCII values to memorise:**

| Character | ASCII Code (Denary) | ASCII Code (Binary) |
|-----------|---------------------|---------------------|
| A | 65 | 1000001 |
| B | 66 | 1000010 |
| C | 67 | 1000011 |
| Z | 90 | 1011010 |
| a | 97 | 1100001 |
| b | 98 | 1100010 |
| z | 122 | 1111010 |
| 0 | 48 | 0110000 |
| 1 | 49 | 0110001 |
| Space | 32 | 0100000 |

**Useful patterns to notice:**
- Uppercase letters start at 65. Each successive letter is +1: B=66, C=67 …
- Lowercase letters start at 97. The difference between uppercase and lowercase is always **32**: `a` = `A` + 32.
- Digit characters (not values) start at 48: `'0'` = 48, `'1'` = 49, `'9'` = 57.

#### Worked Example: Encoding "Cat" in ASCII

```
C → 67  → 01000011
a → 97  → 01100001
t → 116 → 01110100

"Cat" stored as: 01000011  01100001  01110100
(3 bytes / 24 bits total)
```

### Extended ASCII

- Uses **8 bits** per character
- Represents **256 characters** in total (2⁸ = 256)
- The first 128 characters are identical to standard ASCII
- The extra 128 characters include accented letters (é, ü, ñ), currency symbols, and some line-drawing characters
- Still limited to Western European languages

---

### Unicode

**Unicode** was developed to solve the major limitation of ASCII: it can only represent English and a few other Western characters. The world has thousands of different writing systems.

- Supports **over 143,000 characters** covering virtually every written language: Arabic, Chinese, Japanese, Hindi, Korean, emoji, and more
- The most common implementation is **UTF-8**:
  - Compatible with ASCII for the first 128 characters (same binary codes)
  - Uses **variable-length encoding**: common characters use 1 byte, less common characters use 2, 3, or 4 bytes
- Other Unicode forms: UTF-16 (commonly used internally by Windows), UTF-32

**Why Unicode was developed:**
1. **Globalisation** — the internet connects people worldwide who write in different scripts
2. **ASCII cannot represent** characters like 中, ع, or 日
3. A single universal standard prevents garbled text when sharing files between different systems
4. **Emoji** and special symbols require more than 128 code points

**Unicode vs ASCII comparison:**

| Feature | ASCII | Unicode (UTF-8) |
|---------|-------|-----------------|
| Bits per character | 7 | 8–32 (variable) |
| Characters supported | 128 | 143,000+ |
| Languages | English only | All major world scripts |
| Backwards compatible? | N/A | Yes (first 128 codes identical) |
| Example use | Old terminals, simple text | Modern web pages, all OS |

---

## Section 2: Image Representation

### Pixels

A digital image is made up of a grid of tiny coloured squares called **pixels** (short for *picture elements*). A pixel is the **smallest addressable unit** of a digital image — it cannot be divided further while remaining a meaningful image element.

When you zoom into a digital photograph far enough, you see individual coloured squares: those are pixels.

**Resolution** describes the number of pixels in an image:
- Usually expressed as **width × height**: e.g. 1920 × 1080 (Full HD)
- A 1920 × 1080 image contains 1920 × 1080 = **2,073,600 pixels** (about 2 megapixels)
- More pixels → **higher resolution** → more detail → sharper image

### Colour Depth (Bit Depth)

**Colour depth** is the number of **bits used to represent the colour of a single pixel**.

The number of possible colours = **2^(colour depth)**

| Colour Depth | Bits per Pixel | Number of Colours | Usage |
|--------------|---------------|-------------------|-------|
| 1-bit | 1 | 2 colours (black & white only) | QR codes, simple icons |
| 4-bit | 4 | 16 colours | Early PC graphics |
| 8-bit | 8 | 256 colours | Simple graphics, GIF images |
| 16-bit | 16 | 65,536 colours | Basic digital photography |
| 24-bit | 24 | 16,777,216 (~16.7 million) | **True colour** — photographs |
| 32-bit | 32 | 16,777,216 + transparency | Web graphics with alpha channel |

**True Colour (24-bit)** uses **3 channels**: Red, Green, Blue — each with **8 bits** (0–255 per channel).
- 8 bits red × 8 bits green × 8 bits blue = 24 bits per pixel
- This gives 256 × 256 × 256 = **16,777,216 different colours**

### Calculating Image File Size

The **uncompressed** file size of an image can be calculated with this formula:

```
File size (bits) = Width (pixels) × Height (pixels) × Colour depth (bits per pixel)

File size (bytes) = File size (bits) ÷ 8
```

#### Worked Example: 100 × 200 Image with 8-bit Colour

```
Width   = 100 pixels
Height  = 200 pixels
Colour depth = 8 bits per pixel

File size (bits)  = 100 × 200 × 8
                  = 20,000 × 8
                  = 160,000 bits

File size (bytes) = 160,000 ÷ 8
                  = 20,000 bytes

File size (KB)    = 20,000 ÷ 1,024
                  ≈ 19.5 KB
```

**Answer: approximately 19.5 KB**

#### Worked Example: 800 × 600 True Colour (24-bit) Image

```
File size (bits)  = 800 × 600 × 24
                  = 480,000 × 24
                  = 11,520,000 bits

File size (bytes) = 11,520,000 ÷ 8
                  = 1,440,000 bytes

File size (MB)    = 1,440,000 ÷ 1,024 ÷ 1,024
                  ≈ 1.37 MB
```

---

### Quality vs File Size Trade-offs

| Factor | Increasing it... | Effect on quality | Effect on file size |
|--------|-----------------|-------------------|---------------------|
| Resolution | More pixels | Better detail, sharper | **Larger** |
| Colour depth | More bits per pixel | More colours, more realistic | **Larger** |

**Key principle:** Higher quality always means **more data** and therefore **larger files**. In practice, compression (see the compression pack) is used to reduce file sizes.

---

## Key Vocabulary

| Term | Definition |
|------|-----------|
| **Character set** | A defined mapping between numbers and characters that a system can represent |
| **ASCII** | American Standard Code for Information Interchange; 7-bit encoding of 128 characters |
| **Extended ASCII** | 8-bit extension of ASCII; 256 characters including accented letters |
| **Unicode** | Universal character encoding standard supporting 143,000+ characters from all world scripts |
| **UTF-8** | The most common Unicode encoding; variable length (1–4 bytes per character); backwards compatible with ASCII |
| **Pixel** | The smallest single coloured unit in a digital image; picture element |
| **Resolution** | The number of pixels in an image, expressed as width × height |
| **Colour depth** | The number of bits used to represent the colour of one pixel |
| **True colour** | 24-bit colour depth: 8 bits each for Red, Green, Blue — 16.7 million colours |
| **Bit depth** | Another term for colour depth |
| **File size** | Total amount of storage space required; calculated from dimensions and colour depth |
| **Control characters** | Non-printable ASCII codes that perform actions (e.g. newline, tab, carriage return) |

---

## Common Misconceptions

| Misconception | Correction |
|---------------|-----------|
| "ASCII and Unicode are the same thing" | ASCII supports only 128 characters (English + basic punctuation). Unicode supports 143,000+ characters from all world scripts. They are different standards, though UTF-8 is backwards-compatible with ASCII. |
| "More pixels always means better quality" | More pixels means more resolution and detail, but colour depth also affects quality. A high-resolution image with 1-bit colour depth would be black-and-white only. |
| "File size is measured in bits" | File size is almost always expressed in **bytes** (or KB, MB). The bits formula must be divided by 8 to get bytes. |
| "ASCII can only store letters" | ASCII stores uppercase and lowercase letters, digits 0–9, punctuation, spaces, and control characters like newline. It cannot store non-English characters. |
| "Colour depth is the same as resolution" | They are completely different. Resolution = number of pixels. Colour depth = bits per pixel (number of colours possible). An image can have high resolution but low colour depth, or vice versa. |
| "Unicode uses more memory than ASCII for all text" | UTF-8 uses the same 1 byte per character as ASCII for the first 128 characters. Only non-ASCII characters require more bytes. |

---

## Diagrams & Code Examples

### ASCII Character Grid (excerpt)

```
Code  Character    Code  Character    Code  Character
────  ─────────    ────  ─────────    ────  ─────────
 32   (space)       65   A             97   a
 48   0             66   B             98   b
 49   1             67   C             99   c
 50   2             90   Z            122   z
```

### 4×4 Pixel Grid — Simple Black and White Image

Imagine a simple 4×4 image where B = Black (1) and W = White (0):

```
Pixel grid (visual):        Binary representation:
┌───┬───┬───┬───┐           Row 1:  0  1  1  0
│ W │ B │ B │ W │           Row 2:  1  0  0  1
├───┼───┼───┼───┤           Row 3:  1  0  0  1
│ B │ W │ W │ B │           Row 4:  0  1  1  0
├───┼───┼───┼───┤
│ B │ W │ W │ B │
├───┼───┼───┼───┤
│ W │ B │ B │ W │
└───┴───┴───┴───┘

File size: 4 × 4 × 1 bit = 16 bits = 2 bytes
(This diamond/ring pattern uses 1-bit colour depth)
```

### True Colour Pixel Breakdown

```
One 24-bit pixel:

[ Red: 8 bits ][ Green: 8 bits ][ Blue: 8 bits ]
  1111 0000      0101 0111        0011 0011

  R = 240        G = 87           B = 51

This represents a specific shade of warm orange.
```

### File Size Comparison Table

| Image | Width | Height | Colour Depth | File Size |
|-------|-------|--------|-------------|-----------|
| Tiny B&W icon | 16 | 16 | 1-bit | 32 bytes |
| Small 8-bit | 100 | 200 | 8-bit | ~19.5 KB |
| Medium 24-bit photo | 800 | 600 | 24-bit | ~1.37 MB |
| Full HD photo | 1920 | 1080 | 24-bit | ~5.93 MB |

---

## Exam-Style Questions

### Q1 [1 mark]
What is the ASCII code (in denary) for the uppercase letter **A**?

### Q2 [1 mark]
A 4-bit colour depth image can display how many different colours? Show your working.

### Q3 [3 marks]
An image is 100 pixels wide and 200 pixels tall. It uses a colour depth of 8 bits per pixel. Calculate the file size of this image in **bytes**. Show all working.

### Q4 [3 marks]
Explain why Unicode was developed to replace ASCII. Your answer should include reference to at least two limitations of ASCII.

### Q5 [4 marks]
Two images have the following properties:

- **Image A:** 400 × 300 pixels, 8-bit colour depth
- **Image B:** 200 × 150 pixels, 24-bit colour depth

Calculate the file size of each image in bytes. State which image has the larger file size and explain why the result might be surprising.

### Multiple Choice Question
Which of the following statements about ASCII is **correct**?

- A) ASCII uses 8 bits and supports 256 characters
- B) ASCII uses 7 bits and supports 128 characters, including letters, digits, and control characters
- C) ASCII supports characters from all world languages
- D) ASCII and Unicode are different names for the same standard

*(Answer: B)*

### Fill in the Blank
"The number of colours that can be represented at a given colour depth is calculated using the formula __________. At 24-bit colour depth, this gives approximately __________ million different colours."

*(Answers: 2^colour depth; 16.7)*

---

## Model Answers

### Q1 Model Answer
65

### Q2 Model Answer
Number of colours = 2^colour depth = 2⁴ = **16 colours**

### Q3 Model Answer
```
File size (bits) = Width × Height × Colour depth
                 = 100 × 200 × 8
                 = 160,000 bits

File size (bytes) = 160,000 ÷ 8
                  = 20,000 bytes
```

### Q4 Model Answer
Unicode was developed to replace ASCII because:

1. **ASCII only supports 128 characters**, which is enough for English but not for languages such as Chinese, Arabic, Japanese, or Hindi that use completely different writing systems and thousands of different characters.
2. **ASCII only covers Western characters** — it has no way to represent accented letters like é or ü from European languages, let alone entirely different scripts.
3. **Globalisation of the internet** meant that documents, web pages, and software needed to be shared between people in different countries. Without a universal standard, text sent from one country would appear as garbled symbols on a computer in another country.

Unicode provides a single universal standard with over 143,000 characters, ensuring text displays correctly on any device worldwide.

### Q5 Model Answer
```
Image A: 400 × 300 × 8 = 960,000 bits ÷ 8 = 120,000 bytes
Image B: 200 × 150 × 24 = 720,000 bits ÷ 8 = 90,000 bytes

Image A has the larger file size (120,000 bytes vs 90,000 bytes).
```

This might be surprising because Image A has a higher resolution (more pixels). However, Image B's much greater colour depth (24-bit vs 8-bit) is not enough to overcome Image A's significantly larger number of pixels (120,000 vs 30,000 pixels). Both dimensions and colour depth together determine file size.

---

## Revision Checklist

- [ ] I can explain why characters need to be converted to binary numbers for storage
- [ ] I know that ASCII uses 7 bits and represents 128 characters
- [ ] I can recall the ASCII codes for A (65), a (97), and 0 (48)
- [ ] I can explain the difference between ASCII and Unicode
- [ ] I can give at least two reasons why Unicode was developed
- [ ] I know that UTF-8 is the most common Unicode encoding
- [ ] I can define "pixel" as the smallest unit of a digital image
- [ ] I can define "resolution" as the number of pixels (width × height)
- [ ] I can define "colour depth" as the number of bits per pixel
- [ ] I can use the formula 2^n to calculate the number of colours from a colour depth
- [ ] I know that 24-bit true colour = 8 bits each for R, G, B = ~16.7 million colours
- [ ] I can calculate image file size using: width × height × colour depth ÷ 8 = bytes
- [ ] I can explain the trade-off between quality (resolution/colour depth) and file size
- [ ] I can identify and correct common misconceptions about ASCII, Unicode, and image representation
