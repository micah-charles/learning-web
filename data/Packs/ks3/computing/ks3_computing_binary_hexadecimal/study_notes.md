# KS3 Computing — Study Pack
# Topic: Binary & Hexadecimal
**Year 7–9 | Data Representation | UK National Curriculum**

---

## Overview

Every piece of data inside a computer — text, images, videos, programs — is ultimately stored and processed as **binary**: sequences of 0s and 1s. Understanding why computers use binary, how to convert between number systems, and how binary arithmetic works is a fundamental skill in computing.

**Hexadecimal** (base 16) is a shorthand used by professionals because it compresses long binary strings into a much more readable form. It appears everywhere from HTML colour codes (`#FF5733`) to memory addresses in programming.

By the end of this pack you will be able to:
- Explain why computers use binary
- Convert between denary, binary, and hexadecimal
- Perform binary addition including carrying
- Explain overflow and why it matters

---

## Section 1: Binary (Base 2)

### Why Binary?

Modern computers are built from billions of tiny electronic switches called **transistors**. Each transistor has exactly two states:
- **Off** → represented as **0**
- **On** → represented as **1**

Because hardware can only reliably represent two states, all data must be encoded in **base 2** (binary), using only the digits 0 and 1.

### Key Terms

| Term | Definition |
|------|-----------|
| **Bit** | A single binary digit — either 0 or 1; the smallest unit of data |
| **Nibble** | 4 bits grouped together |
| **Byte** | 8 bits grouped together |
| **Kilobyte (KB)** | 1,024 bytes |
| **Megabyte (MB)** | 1,024 KB |
| **Gigabyte (GB)** | 1,024 MB |
| **Terabyte (TB)** | 1,024 GB |

### 8-Bit Column Values

In an 8-bit binary number, each position (column) represents a power of 2:

```
| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|  2⁷ | 2⁶ | 2⁵ | 2⁴ | 2³| 2²| 2¹| 2⁰|
```

The **leftmost** bit is the **most significant bit (MSB)**; the **rightmost** is the **least significant bit (LSB)**.

The maximum value an 8-bit number can hold: 128+64+32+16+8+4+2+1 = **255**

---

### Converting Denary to Binary

**Method:** Find the largest column value that fits into the number. Write a `1` in that column. Subtract and repeat with the remainder. Write `0` in any column that does not fit.

#### Worked Example: Convert 177 to 8-bit binary

```
Column values:  | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

Step 1: Does 128 fit into 177? YES (177 - 128 = 49)   → write 1
Step 2: Does  64 fit into  49? NO                      → write 0
Step 3: Does  32 fit into  49? YES (49 - 32 = 17)      → write 1
Step 4: Does  16 fit into  17? YES (17 - 16 = 1)       → write 1
Step 5: Does   8 fit into   1? NO                      → write 0
Step 6: Does   4 fit into   1? NO                      → write 0
Step 7: Does   2 fit into   1? NO                      → write 0
Step 8: Does   1 fit into   1? YES (1 - 1 = 0)         → write 1

Result: 1 0 1 1 0 0 0 1
```

**Answer: 177 in 8-bit binary is `10110001`**

#### Verification (Binary to Denary check):
128 + 32 + 16 + 1 = **177** ✓

---

### Converting Binary to Denary

**Method:** Write out the column values. For each `1` in the binary number, add that column's value.

**Example:** Convert `01001110` to denary

```
| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|   0 |  1 |  0 |  0 | 1 | 1 | 1 | 0 |

Values where digit = 1:  64 + 8 + 4 + 2 = 78
```

**Answer: `01001110` = 78 in denary**

---

### Binary Addition

**The four rules of binary addition:**

| Operation | Result | Notes |
|-----------|--------|-------|
| 0 + 0 | 0 | No carry |
| 0 + 1 | 1 | No carry |
| 1 + 0 | 1 | No carry |
| 1 + 1 | 10 | Write 0, **carry 1** to next column |
| 1 + 1 + 1 | 11 | Write 1, **carry 1** to next column (three 1s: two inputs plus carry) |

#### Worked Example: Add 01101101 + 00110110

```
    Carry:   1  1  1  1  0  0  0
             0  1  1  0  1  1  0  1
           + 0  0  1  1  0  1  1  0
           ─────────────────────────
             1  0  1  0  0  0  1  1

Column-by-column (right to left):

Position 1 (1s):    1 + 0 = 1              → write 1, carry 0
Position 2 (2s):    0 + 1 = 1              → write 1, carry 0
Position 3 (4s):    1 + 1 = 10             → write 0, carry 1
Position 4 (8s):    1 + 0 + carry 1 = 10   → write 0, carry 1
Position 5 (16s):   0 + 1 + carry 1 = 10   → write 0, carry 1
Position 6 (32s):   1 + 1 + carry 1 = 11   → write 1, carry 1
Position 7 (64s):   1 + 0 + carry 1 = 10   → write 0, carry 1
Position 8 (128s):  0 + 0 + carry 1 = 1    → write 1, carry 0

Result: 1 0 1 0 0 0 1 1
```

**Answer: `01101101` + `00110110` = `10100011`**

**Denary check:** 109 + 54 = 163 → `10100011` = 128+32+2+1 = 163 ✓

---

### Overflow

**Overflow** occurs when the result of a binary calculation is **too large** to be stored in the available number of bits.

**Example:** Adding two 8-bit numbers where the result exceeds 255:

```
  11111111  (255)
+ 00000001  (1)
───────────
 100000000  (256) — requires 9 bits!
```

The 9th bit cannot be stored in an 8-bit register. The computer discards it and stores `00000000` instead — giving the wrong answer of 0. This is a **critical error** that can cause program crashes or incorrect calculations.

---

## Section 2: Hexadecimal (Base 16)

### What is Hexadecimal?

Hexadecimal uses **base 16**: sixteen symbols instead of ten.

Because we only have ten digit characters (0–9), letters are borrowed for the remaining six values:

| Denary | Hex | Binary |
|--------|-----|--------|
| 0 | 0 | 0000 |
| 1 | 1 | 0001 |
| 2 | 2 | 0010 |
| 3 | 3 | 0011 |
| 4 | 4 | 0100 |
| 5 | 5 | 0101 |
| 6 | 6 | 0110 |
| 7 | 7 | 0111 |
| 8 | 8 | 1000 |
| 9 | 9 | 1001 |
| 10 | A | 1010 |
| 11 | B | 1011 |
| 12 | C | 1100 |
| 13 | D | 1101 |
| 14 | E | 1110 |
| 15 | F | 1111 |

### Why Do We Use Hexadecimal?

1. **Shorter than binary:** One hex digit represents exactly 4 binary digits (a nibble). So 8-bit binary `11001010` becomes just `CA` — far easier to read and write.
2. **Colour codes:** Web colours use 6 hex digits (3 bytes) — e.g. `#FF5733` means Red=FF(255), Green=57(87), Blue=33(51).
3. **Memory addresses:** RAM addresses are written in hex (e.g. `0x1A3F`).
4. **Error checking:** MAC addresses, error codes — all use hex.

---

### Converting Binary to Hexadecimal (via Nibbles)

**Method:** Split the binary number into groups of 4 bits (nibbles) from the right. Convert each nibble independently to its hex digit.

#### Worked Example: Convert `10110100` to hex

```
Step 1: Split into nibbles from the right:
        1011  |  0100

Step 2: Convert each nibble:
        1011  =  8 + 2 + 1 = 11  =  B
        0100  =  4              =  4

Step 3: Combine the hex digits (left to right):
        B4
```

**Answer: `10110100` in hex is `B4`**

---

### Converting Hexadecimal to Binary

**Method:** Replace each hex digit with its 4-bit binary nibble equivalent.

**Example:** Convert `3F` to binary

```
3 → 0011
F → 1111

Result: 0011 1111
```

**Answer: `3F` in binary is `00111111`**

---

### Converting Hexadecimal to Denary

**Method:** Multiply each hex digit by 16 raised to the power of its position (rightmost position = 16⁰ = 1).

**Example:** Convert `B4` to denary

```
B = 11,  position 1  →  11 × 16¹ = 11 × 16 = 176
4 =  4,  position 0  →   4 × 16⁰ =  4 ×  1 =   4

Total: 176 + 4 = 180
```

**Answer: `B4` in hex = 180 in denary**

---

### Converting Denary to Hexadecimal

**Method:** Divide by 16, recording the remainder. Remainders above 9 become letters (10→A, 11→B, etc.).

**Example:** Convert 255 to hex

```
255 ÷ 16 = 15 remainder 15  →  F
 15 ÷ 16 =  0 remainder 15  →  F

Read remainders bottom to top: FF
```

**Answer: 255 in hex is `FF`** (this is why `#FFFFFF` is white — all colours at maximum)

---

## Key Vocabulary

| Term | Definition |
|------|-----------|
| **Binary** | Base-2 number system using only digits 0 and 1 |
| **Denary** | Base-10 number system (standard counting system using digits 0–9) |
| **Hexadecimal** | Base-16 number system using digits 0–9 and letters A–F |
| **Bit** | A single binary digit (0 or 1); smallest unit of digital data |
| **Nibble** | 4 bits; one hexadecimal digit |
| **Byte** | 8 bits; the standard unit for storing a single character |
| **MSB** | Most Significant Bit — leftmost bit in a binary number (highest value) |
| **LSB** | Least Significant Bit — rightmost bit (lowest value) |
| **Carry** | A value transferred to the next column during binary addition |
| **Overflow** | Error when an arithmetic result exceeds the available number of bits |
| **Transistor** | Microscopic electronic switch; the physical basis of binary in hardware |
| **Colour depth** | Number of bits used to represent colour; affects file size and quality |

---

## Common Misconceptions

| Misconception | Correction |
|---------------|-----------|
| "Binary uses digits 0 through 9" | Binary uses ONLY 0 and 1. That is the whole point — two states match transistor on/off. |
| "A byte is 4 bits" | A byte is **8 bits**. Four bits is a **nibble**. |
| "1 + 1 = 2 in binary" | In binary, 1 + 1 = **10** (write 0, carry 1). There is no digit 2 in binary. |
| "Hexadecimal is harder to convert than binary" | Hex is actually **easier** to convert to/from binary — just split into nibbles and look up each one. |
| "Overflow just makes the number negative" | Overflow behaviour depends on the system. In simple systems, the extra bit is lost and the stored value wraps around, giving a completely incorrect result. |
| "Hex digits A–F are letters, not numbers" | A–F are just symbols representing the values 10–15. They function as numeric digits. |

---

## Diagrams & Worked Examples

### 8-Bit Column Value Chart

```
┌─────┬────┬────┬────┬───┬───┬───┬───┐
│ 128 │ 64 │ 32 │ 16 │ 8 │ 4 │ 2 │ 1 │
├─────┼────┼────┼────┼───┼───┼───┼───┤
│  2⁷ │ 2⁶ │ 2⁵ │ 2⁴ │2³ │2² │2¹ │2⁰ │
└─────┴────┴────┴────┴───┴───┴───┴───┘
```

### Binary Addition Carry Diagram

```
   Carry row:  → 1  1  1  1  0  0  0  ←
               0  1  1  0  1  1  0  1   (109)
             + 0  0  1  1  0  1  1  0   ( 54)
             ─────────────────────────
               1  0  1  0  0  0  1  1   (163)
```

### Nibble-to-Hex Conversion Chart

```
Binary Nibble → Hex
──────────────────
0000 → 0      1000 → 8
0001 → 1      1001 → 9
0010 → 2      1010 → A
0011 → 3      1011 → B
0100 → 4      1100 → C
0101 → 5      1101 → D
0110 → 6      1110 → E
0111 → 7      1111 → F
```

### Colour Code Example

```
HTML colour: #FF5733

FF → 1111 1111 → Red   = 255 (maximum)
57 → 0101 0111 → Green =  87
33 → 0011 0011 → Blue  =  51

Result: A warm orange-red colour
```

---

## Exam-Style Questions

### Q1 [1 mark]
Convert the denary number **45** into 8-bit binary.

### Q2 [2 marks]
Perform the following binary addition. Show your working including any carry values.

```
  01001110
+ 00101011
──────────
```

### Q3 [3 marks]
Convert the binary number `11010110` into hexadecimal. Show all working, including the nibble split.

### Q4 [2 marks]
A computer uses 8-bit binary numbers. Explain what **overflow** is and give an example of when it might occur, including the incorrect result stored.

### Q5 [4 marks]
Explain why computers use binary to represent data. Include reference to transistors in your answer. Then explain why hexadecimal is commonly used by programmers instead of binary.

### Multiple Choice Question
Which of the following correctly represents the hexadecimal digit **D**?

- A) 12 in denary
- B) 13 in denary and `1101` in binary
- C) 14 in denary and `1110` in binary
- D) 11 in denary

*(Answer: B)*

### Fill in the Blank
Complete the sentence: "A __________ is a group of 4 bits, and it is directly equivalent to exactly one __________ digit."

*(Answers: nibble; hexadecimal)*

---

## Model Answers

### Q1 Model Answer
```
Column values: | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

45 - 32 = 13  → 1 in 32 column
13 - 8  =  5  → 1 in  8 column
 5 - 4  =  1  → 1 in  4 column
 1 - 1  =  0  → 1 in  1 column

Answer: 0 0 1 0 1 1 0 1  →  00101101
```

### Q2 Model Answer
```
  Carry:  0  1  0  0  0  0
          0  1  0  0  1  1  1  0   (78)
        + 0  0  1  0  1  0  1  1   (43)
        ─────────────────────────
          0  1  1  1  1  0  0  1   (121)

Answer: 01111001
Check: 78 + 43 = 121 ✓
```

### Q3 Model Answer
```
11010110  → split into nibbles → 1101 | 0110

1101 = 8 + 4 + 1 = 13 = D
0110 = 4 + 2     =  6 = 6

Answer: D6
```

### Q4 Model Answer
Overflow occurs when the result of a binary arithmetic operation is too large to be stored in the available number of bits. For example, if an 8-bit system tries to store 255 + 1:
```
  11111111  (255)
+ 00000001  (  1)
───────────
 100000000  (256) — 9 bits required
```
The 9th bit is discarded, leaving `00000000` stored, which incorrectly represents 0 instead of 256.

### Q5 Model Answer
Computers use binary because they are built from transistors — electronic switches that have exactly two states: on or off. These two states are represented as 1 (on) and 0 (off). Because there are only two reliable states, all data must be encoded using just two digits, making binary the natural number system for computer hardware.

Programmers use hexadecimal because it is much more compact than binary — each hex digit represents exactly 4 binary bits (a nibble). This means an 8-bit binary number like `10110100` can be written as just `B4` in hex, making it easier to read, write, and remember. Hex is used in colour codes, memory addresses, and error codes for this reason.

---

## Revision Checklist

Use this checklist to track your understanding before an assessment:

- [ ] I can explain why computers use binary (transistors, two states)
- [ ] I know the difference between a bit, nibble, and byte
- [ ] I can recall all 8 column values for an 8-bit binary number (1, 2, 4, 8, 16, 32, 64, 128)
- [ ] I can convert a denary number (0–255) to 8-bit binary using the subtraction method
- [ ] I can convert an 8-bit binary number to denary by summing column values
- [ ] I can apply all four binary addition rules including the carry
- [ ] I can perform 8-bit binary addition showing carry values
- [ ] I can explain what overflow is and give a numerical example
- [ ] I know all 16 hexadecimal digits (0–9, A–F) and their denary/binary equivalents
- [ ] I can explain at least two reasons why hexadecimal is used (compact, colour codes, addresses)
- [ ] I can convert binary to hex by splitting into nibbles
- [ ] I can convert hex to binary by expanding each digit to 4 bits
- [ ] I can convert a two-digit hex number to denary using place values (16¹, 16⁰)
- [ ] I can identify and correct common misconceptions about binary and hex
