# KS3 Computing — Study Pack
# Topic: Data Compression
**Year 7–9 | Data Representation | UK National Curriculum**

---

## Overview

Modern files can be enormous. A single uncompressed 4K video frame can be over 24 MB. Storing and transmitting such files without compression would be impractical — it would fill storage devices rapidly and take forever to send over the internet.

**Compression** is the process of encoding data so that it takes up **less space** than the original. Understanding the two fundamentally different types of compression — and knowing when to use each — is an essential computing skill.

By the end of this pack you will be able to:
- Explain why compression is needed
- Distinguish between lossy and lossless compression with examples
- Perform and reverse Run-Length Encoding (RLE)
- Calculate bytes saved through RLE
- Evaluate which type of compression is appropriate for different file types

---

## Section 1: Why Compress Data?

Two primary reasons drive compression:

1. **Storage:** Files take up less space on a hard drive, SSD, or cloud storage. This allows more files to be stored and reduces cost.
2. **Transmission:** Smaller files travel faster across networks. This is critical for streaming video, downloading apps, sending email attachments, and loading web pages.

**Example comparison:**
- An uncompressed audio track (WAV) for a 4-minute song: approximately **40 MB**
- The same song as an MP3 file: approximately **4 MB**
- The same song as a compressed lossless file (FLAC): approximately **20 MB**

The trade-off is between **file size**, **quality**, and **whether the original can be perfectly recovered**.

---

## Section 2: Lossy Compression

### Definition

**Lossy compression** permanently **removes some data** from the file. Once data is removed, it **cannot be recovered** — the original file cannot be restored exactly.

The key design principle is that the removed data is data that humans are unlikely to notice missing. For example, an MP3 removes audio frequencies that the human ear is least sensitive to.

### Characteristics

- Results in **significantly smaller files** than lossless
- The decompressed file is **not identical** to the original
- Each time a lossy file is re-saved, **more quality is lost** (generation loss)
- The **quality of loss** is controlled by a "quality setting" or bitrate: lower quality = smaller file

### Common Lossy Formats

| Format | File Type | Notes |
|--------|----------|-------|
| JPEG (.jpg) | Images | Reduces image quality; best for photographs |
| MP3 (.mp3) | Audio | Removes inaudible frequencies; most common audio format |
| MP4 (.mp4) / H.264 | Video | Heavily compressed video; used for streaming |
| AAC (.aac) | Audio | Better quality than MP3 at same file size; used by Apple |
| OGG (.ogg) | Audio | Open-source alternative to MP3 |

### When Lossy is Appropriate

- Photographs shared on social media (slight quality loss imperceptible)
- Music or podcast streaming
- Video streaming services
- Any situation where perfect restoration is not required

---

## Section 3: Lossless Compression

### Definition

**Lossless compression** reduces file size while **preserving every single bit** of the original data. When the file is decompressed, it is **perfectly identical** to the original.

### Characteristics

- Files can be **fully restored** to original
- Smaller file size savings than lossy (typically 40–60% reduction vs 90%+ for lossy)
- Essential wherever data integrity is critical

### Common Lossless Formats

| Format | File Type | Notes |
|--------|----------|-------|
| ZIP (.zip) | Any file | General-purpose archive; lossless |
| PNG (.png) | Images | Lossless image; used for screenshots, logos, icons |
| GIF (.gif) | Images | Lossless, but limited to 256 colours |
| FLAC (.flac) | Audio | Lossless audio; audiophile quality |
| RAW | Images | Uncompressed or losslessly compressed camera data |

### When Lossless is Essential

- **Text files and documents:** Even one changed character completely changes meaning. "£100" vs "£10" could be catastrophic.
- **Programs and executables:** Changing a single bit in a program can cause it to crash or behave unpredictably.
- **Medical images:** X-rays and scans must be exactly reproduced for diagnosis.
- **Archiving important data:** When you need to guarantee the file can be perfectly restored.

**Why lossy CANNOT be used for text or programs:**
If a JPEG-style algorithm compressed a text file, it might change "important deadline: 15th" to "important deadline: 25th" and you would never know. For programs, a single bit change could make an instruction execute incorrectly, causing security vulnerabilities or crashes.

---

## Section 4: Run-Length Encoding (RLE)

### What is RLE?

**Run-Length Encoding** is a simple **lossless** compression algorithm. It works by identifying **runs** — consecutive repetitions of the same value — and replacing them with a **count** followed by the **value**.

RLE is particularly effective for:
- Simple images with large areas of one colour (e.g. logos, pixel art, icons)
- Black-and-white images (fax machines historically used RLE)

RLE is **not effective** for complex photographs where adjacent pixels are usually different colours.

### Encoding with RLE

**Rule:** Replace a run of repeated values with `count + value`.

#### Worked Example 1: Encode `AAAABBBCC`

```
Original:   A A A A B B B C C
            └───┘   └───┘ └─┘
            4 × A   3 × B  2 × C

Encoded:    4A 3B 2C

Original length:  9 characters = 9 bytes
Encoded length:   3 groups × 2 characters each = 6 bytes
Bytes saved:      9 - 6 = 3 bytes
```

#### Worked Example 2: Encode `WWWWBBBBWW`

```
Original:   W W W W B B B B W W
            └─────┘ └─────┘ └─┘
            4 × W   4 × B   2 × W

Encoded:    4W 4B 2W

Original length:  10 bytes
Encoded length:   6 bytes
Bytes saved:      4 bytes
Compression ratio: 6/10 = 60% of original size
```

#### Worked Example 3: Binary image row

```
Original pixel row:  0 0 0 0 0 1 1 0 0 0
Encoded:             5,0  2,1  3,0

(5 zeros, then 2 ones, then 3 zeros)
```

---

### Decoding RLE

**Rule:** Expand each `count + value` pair back to the repeated value.

#### Worked Example: Decode `3W 2B 1W`

```
3W → W W W
2B → B B
1W → W

Decoded: W W W B B W  →  "WWWBBW"
```

#### Worked Example: Decode `2R 3G 1B 4R`

```
2R → R R
3G → G G G
1B → B
4R → R R R R

Decoded: R R G G G B R R R R  →  "RRGGGBRRRR"
```

---

### When RLE Saves Space (and When it Doesn't)

| Data type | RLE effective? | Reason |
|-----------|---------------|--------|
| Image with large solid colour areas | Yes | Long runs → big savings |
| Complex photograph | No | Every pixel different → encoded data could be LARGER than original |
| Black-and-white text scan | Yes | Large white areas compressed well |
| Random data | No | Each value different; no runs to compress |

**Key insight:** If data has no repeated values, RLE can actually make the file **larger** (because you're storing count numbers too). For example: `ABCDE` encoded as `1A1B1C1D1E` is 10 characters — longer than the original 5!

---

## Lossy vs Lossless Comparison Table

| Feature | Lossy | Lossless |
|---------|-------|----------|
| Data loss | Yes — some data permanently removed | No — all original data preserved |
| Can restore original? | No | Yes |
| File size reduction | Very large (often 80–95%) | Moderate (often 40–60%) |
| Typical image format | JPEG | PNG, GIF |
| Typical audio format | MP3, AAC | FLAC, WAV (uncompressed) |
| Typical general format | — | ZIP |
| Suitable for programs? | Never | Yes |
| Suitable for text? | Never | Yes |
| Suitable for photos (sharing)? | Yes | Yes (but larger) |
| Suitable for medical images? | Never | Yes |

---

## Key Vocabulary

| Term | Definition |
|------|-----------|
| **Compression** | Encoding data to reduce its file size |
| **Lossy compression** | Compression that permanently removes some data; original cannot be fully restored |
| **Lossless compression** | Compression that preserves all original data; file can be perfectly restored on decompression |
| **RLE (Run-Length Encoding)** | A lossless compression technique that replaces runs of repeated values with a count and the value |
| **Run** | A sequence of consecutive identical values in data |
| **Compression ratio** | The ratio of compressed file size to original file size (smaller = better compression) |
| **Decompression** | The process of restoring a compressed file to its original (or approximated) form |
| **Artefact** | Visual distortion introduced by lossy compression (e.g. blurring or blockiness in JPEG images) |
| **Bitrate** | In audio/video, the amount of data per second; lower bitrate = more compression = lower quality |
| **JPEG** | A common lossy image format suited to photographs |
| **PNG** | A common lossless image format suited to graphics with sharp edges or transparency |
| **ZIP** | A common lossless archive format for compressing any file type |

---

## Common Misconceptions

| Misconception | Correction |
|---------------|-----------|
| "Compression always reduces quality" | Only **lossy** compression reduces quality. **Lossless** compression preserves every bit of the original data — quality is identical after decompression. |
| "Lossy compression is always bad" | Lossy compression is a deliberate, useful trade-off. For photographs shared online, the tiny quality loss is imperceptible to humans while the file size saving is enormous. |
| "RLE works well on all types of data" | RLE only saves space when there are **long runs of repeated values**. On complex photographs with constantly changing pixel colours, RLE can make the file LARGER. |
| "ZIP is a lossy compression format" | ZIP is **lossless**. It compresses files without losing any data. You always get your original file back exactly. |
| "You can decompress a lossy file to get the original back" | No. With lossy compression, the removed data is **permanently gone**. You can decompress a JPEG but you will get a slightly degraded version, not the original. |
| "Compression is just for images" | Compression is used for text, audio, video, documents, programs, and any data. ZIP can compress any file type. |

---

## Diagrams & Worked Examples

### RLE Encoding and Savings Summary

```
Original Data:   AAAABBBCC        (9 bytes)
RLE Encoded:     4A 3B 2C         (6 bytes if stored as digit+letter pairs)
Bytes Saved:     9 - 6 = 3 bytes
Compression %:   (3/9) × 100 = 33.3% smaller

Original Data:   WWWWBBBBWW       (10 bytes)
RLE Encoded:     4W 4B 2W         (6 bytes)
Bytes Saved:     10 - 6 = 4 bytes
Compression %:   (4/10) × 100 = 40% smaller

Original Data:   ABCDE            (5 bytes)
RLE Encoded:     1A 1B 1C 1D 1E   (10 bytes — WORSE!)
Bytes "Saved":   -5 bytes (file grew larger!)
```

### File Format Decision Tree

```
Does the file need to be restored EXACTLY?
│
├── YES → Use LOSSLESS compression
│         (ZIP for any file, PNG for images, FLAC for audio)
│         Examples: programs, text, medical data, archives
│
└── NO → Can you accept some quality loss for smaller size?
          │
          ├── YES → Use LOSSY compression
          │         (JPEG for photos, MP3 for music, MP4 for video)
          │         Examples: social media, streaming, sharing
          │
          └── NOT SURE → Use LOSSLESS to be safe
```

### Lossy Compression Artefact (described)

```
Original JPEG quality 100%:    Sharp edges, fine detail, accurate colours
JPEG quality 50%:              Slight colour bleeding at sharp edges
JPEG quality 10%:              Visible "blocks" (8×8 pixel squares), colour distortion
JPEG quality 1%:               Image barely recognisable

Each re-save of a JPEG at reduced quality removes MORE data permanently.
```

---

## Exam-Style Questions

### Q1 [1 mark]
Name **one** file format that uses lossy compression.

### Q2 [2 marks]
Explain the difference between lossy and lossless compression. In your answer, state whether the original file can be restored with each type.

### Q3 [4 marks]
A black-and-white image contains the following row of pixels (W = White, B = Black):

`W W W W B B B B W W`

(a) Encode this row using Run-Length Encoding. [2 marks]

(b) Calculate how many bytes are saved compared to the original, assuming each pixel or each character in the encoded format takes 1 byte. [2 marks]

### Q4 [2 marks]
Explain why lossy compression must **not** be used to compress a program file. Use an example in your answer.

### Q5 [6 marks]
A student wants to compress a photograph to share on social media, and a friend wants to compress their history essay to email to their teacher.

For each student, recommend whether they should use lossy or lossless compression. Justify your answers, and compare the two types of compression in terms of file size and data preservation.

### Multiple Choice Question
Which of the following statements is **correct**?

- A) PNG is a lossy image format
- B) MP3 uses lossless compression
- C) A file compressed using lossless compression can be perfectly restored to its original
- D) RLE is a lossy compression technique

*(Answer: C)*

### Fill in the Blank
"Run-Length Encoding works by replacing a __________ of repeated values with a __________ followed by the repeated value. It is most effective when data contains __________ runs of the same value."

*(Answers: run / sequence; count / number; long)*

---

## Model Answers

### Q1 Model Answer
Any one of: JPEG, MP3, MP4, AAC, OGG (accept any valid lossy format).

### Q2 Model Answer
**Lossy compression** permanently removes some data from the file to achieve a smaller file size. The original file **cannot** be restored exactly — decompression produces an approximation of the original.

**Lossless compression** reduces file size without removing any data. All original data is preserved, and the file can be **perfectly restored** on decompression — the result is identical to the original.

### Q3 Model Answer

**(a)**
```
W W W W B B B B W W
→ 4W 4B 2W
```

**(b)**
- Original: 10 characters = 10 bytes
- Encoded: 3 pairs of (count + colour) = 6 bytes (e.g. "4W", "4B", "2W" as 6 characters)
- Bytes saved: 10 - 6 = **4 bytes**

### Q4 Model Answer
Lossy compression permanently removes some data, meaning the decompressed file is not identical to the original. A program is made up of precise binary instructions — changing even a single bit can cause the program to behave incorrectly, crash, or create a security vulnerability. For example, a single bit change in a financial calculation routine could cause it to produce wrong totals. Therefore, only lossless compression should ever be used for program files.

### Q5 Model Answer
**Student sharing a photograph on social media:** Recommend **lossy** compression (e.g. JPEG). Photographs can tolerate small quality losses because the human eye cannot detect minor colour variations or slight blurring. Lossy compression can reduce the file size by 80–95%, making the image much faster to upload and download. The original quality is not needed for social media.

**Student emailing a history essay:** Recommend **lossless** compression (e.g. ZIP). A text document must be preserved exactly — even a single changed character could alter a word or a date, changing the meaning. Lossless compression ensures the teacher receives a file identical to what was written. While lossless achieves less dramatic file size reduction (typically 40–60%), text files are already small, so this is not a concern.

**Comparison:** Lossy compression achieves far greater file size reduction but permanently discards some data. Lossless compression achieves more modest savings but guarantees perfect restoration. The right choice depends entirely on whether data integrity or file size is the higher priority.

---

## Revision Checklist

- [ ] I can explain two reasons why data compression is useful (storage, transmission)
- [ ] I can define lossy compression and state that the original cannot be restored
- [ ] I can give at least two examples of lossy file formats (e.g. JPEG, MP3)
- [ ] I can define lossless compression and state that the original is perfectly restored
- [ ] I can give at least two examples of lossless file formats (e.g. ZIP, PNG)
- [ ] I can explain why lossy compression must not be used for text files or programs
- [ ] I can explain how Run-Length Encoding works (count + value for repeated runs)
- [ ] I can encode a simple sequence using RLE and show all steps
- [ ] I can decode an RLE-encoded sequence back to the original
- [ ] I can calculate the number of bytes saved by RLE encoding
- [ ] I can explain when RLE is efficient and when it is not
- [ ] I can compare lossy and lossless compression across multiple criteria
- [ ] I can recommend the appropriate compression type for a given scenario with justification
- [ ] I can correct common misconceptions about ZIP, RLE, and lossy compression
