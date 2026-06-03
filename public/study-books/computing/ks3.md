# KS3 Computing Study Books

Generated from `data/generated/manifest.json`.

## KS3 Computing — Algorithms, Flowcharts & Pseudocode

- Pack ID: `ks3_computing_algorithms_flowcharts`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_algorithms_flowcharts/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_algorithms_flowcharts/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Algorithms, Flowcharts & Pseudocode
**Year 7–9 | Computational Thinking | UK National Curriculum**

---

## Overview

An **algorithm** is a precise, step-by-step solution to a problem. Every program ever written is built on one or more algorithms. Before writing code, a programmer designs the algorithm — deciding the logic and structure. Two of the most important tools for representing algorithms are **flowcharts** and **pseudocode**.

---

## Section 1: What is an Algorithm?

An **algorithm** is a **finite, unambiguous sequence of steps** that solves a problem or performs a task.

Key properties of a good algorithm:
- **Correct**: produces the right answer for all valid inputs
- **Finite**: always terminates (comes to an end)
- **Unambiguous**: every step has exactly one interpretation — no guesswork
- **Efficient**: completes the task in as few steps as reasonably possible

### Everyday algorithms

Algorithms exist outside computing:
- A recipe is an algorithm for cooking a dish
- An instruction manual is an algorithm for assembling furniture
- A bus timetable is an algorithm for travelling between stops

### Algorithm vs. program

An **algorithm** is the logical design — the sequence of steps.
A **program** is the algorithm written in a specific programming language that a computer can execute.

The same algorithm can be written in Python, Java, pseudocode, or described as a flowchart.

---

## Section 2: Flowcharts

A **flowchart** is a diagram that represents an algorithm using standardised shapes connected by arrows.

### Flowchart symbols

| Shape | Symbol | Meaning |
|---|---|---|
| Oval (rounded rectangle) | `(  )` | **Terminator** — Start or End of the algorithm |
| Rectangle | `[  ]` | **Process** — An action or calculation |
| Parallelogram | `/ /` | **Input / Output** — Reading data from a user or displaying data |
| Diamond | `< >` | **Decision** — A YES/NO question that branches the flow |
| Arrow | `→` | **Flow** — Direction of execution |

### Rules for flowcharts

- A diamond (decision) always has **exactly two exits**: YES and NO
- Flow must eventually reach the END oval
- Arrows should not cross unless absolutely necessary
- Each shape has a single, clear purpose

### Example 1: Flowchart to check if a number is positive

```
    (START)
       |
  /Input N/
       |
   <N > 0?>
   /       \
 YES        NO
  |          |
/Output    /Output
"Positive"/ "Not positive"/
  |          |
(END)      (END)
```

### Example 2: Flowchart for a login system

```
(START)
   |
/Input username, password/
   |
<Username correct?>
  /          \
NO            YES
 |             |
/Output       <Password correct?>
"Invalid"/    /              \
  |          NO              YES
(END)         |               |
          /Output          /Output
          "Wrong        "Welcome"/
          password"/        |
              |           (END)
           (END)
```

---

## Section 3: Pseudocode

**Pseudocode** is a way of writing an algorithm using structured English that resembles a programming language, but is not tied to any specific language. It is used to plan programs before coding.

### Pseudocode conventions (OCR / AQA style)

```pseudocode
# Variables and assignment
score ← 0
name ← "Alice"

# Input and Output
name ← USERINPUT
OUTPUT "Hello " + name

# Selection (IF statements)
IF score >= 50 THEN
    OUTPUT "Pass"
ELSE
    OUTPUT "Fail"
ENDIF

# FOR loop (count-controlled)
FOR i = 1 TO 10
    OUTPUT i
ENDFOR

# WHILE loop (condition-controlled)
WHILE answer != "quit"
    answer ← USERINPUT
ENDWHILE
```

### Writing pseudocode — key rules

- Use **uppercase** for keywords: `IF`, `THEN`, `ELSE`, `ENDIF`, `FOR`, `TO`, `WHILE`, `OUTPUT`, `USERINPUT`
- Use `←` for assignment (not `=`)
- Indent nested blocks consistently (4 spaces or a tab)
- End blocks explicitly: `ENDIF`, `ENDFOR`, `ENDWHILE`

### Example: Pseudocode for finding the largest number in a list

```pseudocode
numbers ← [4, 17, 3, 25, 9]
largest ← numbers[0]

FOR i = 1 TO len(numbers) - 1
    IF numbers[i] > largest THEN
        largest ← numbers[i]
    ENDIF
ENDFOR

OUTPUT "The largest number is: " + largest
```

---

## Section 4: Trace Tables

A **trace table** is used to manually step through an algorithm and track the value of each variable at each step. Trace tables are used to:
- Check whether an algorithm is correct
- Predict the output for given inputs
- Identify errors in an algorithm

### Trace table structure

| Step | Variable 1 | Variable 2 | ... | Output |
|---|---|---|---|---|
| 1 | value | value | | |
| 2 | value | value | | |

### Example: Trace this algorithm

```pseudocode
x ← 5
y ← 2
WHILE x > 0
    OUTPUT x
    x ← x - y
ENDWHILE
```

Trace table:

| Step | x | y | Output |
|---|---|---|---|
| 1 | 5 | 2 | |
| 2 | 5 | 2 | 5 |
| 3 (x = 5-2) | 3 | 2 | |
| 4 | 3 | 2 | 3 |
| 5 (x = 3-2) | 1 | 2 | |
| 6 | 1 | 2 | 1 |
| 7 (x = 1-2) | -1 | 2 | |
| 8 (x > 0 is False) | — | — | Loop ends |

**Output**: 5, 3, 1

---

## Section 5: Algorithm Efficiency

Two algorithms can both be **correct** but one may be much more **efficient** than the other. Efficiency is measured by:
- Number of steps or comparisons required
- Amount of memory used
- Time taken to complete

### Example: Finding a name in a list of 1000 names

**Algorithm A** — check every name from first to last: up to 1000 checks
**Algorithm B** — divide the list in half repeatedly (binary search): up to 10 checks

Both algorithms find the name, but Algorithm B is far more efficient for large data.

At KS3, efficiency is judged by counting the number of steps or comparisons an algorithm requires.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Algorithm | A finite set of unambiguous steps to solve a problem |
| Flowchart | A diagram representing an algorithm using standardised shapes and arrows |
| Pseudocode | A structured, language-independent representation of an algorithm using English-like keywords |
| Trace table | A table used to manually track variable values as an algorithm executes step by step |
| Terminator | The oval shape in a flowchart representing the start or end of an algorithm |
| Decision | A diamond shape in a flowchart; a YES/NO question that splits the flow into two paths |
| Iteration | A loop within an algorithm — a repeated set of steps |
| Efficiency | How few steps or resources an algorithm requires to produce a correct result |
| Unambiguous | Having only one possible interpretation — a required property of a valid algorithm |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| Pseudocode must follow Python syntax | Pseudocode is language-independent. It can use any clear keywords (IF, THEN, OUTPUT, ←) as long as the logic is clear |
| A flowchart is not a proper algorithm representation | A flowchart is equally valid as pseudocode — both represent the same algorithm in different notations |
| Trace tables only work for loops | Trace tables work for any algorithm involving variables — they track value changes step by step |
| A longer algorithm is always less efficient | Correctness comes first. A longer algorithm that gives the right answer is better than a short one that is wrong |
| The diamond shape in a flowchart can have one exit | A diamond always has exactly **two** exits: YES and NO |

---

## Exam-Style Questions

**Q1** [1 mark]
State what shape is used to represent a **decision** in a flowchart.

**Q2** [2 marks]
Complete the trace table for the following algorithm when `n = 3`:

```pseudocode
total ← 0
FOR i = 1 TO n
    total ← total + i
ENDFOR
OUTPUT total
```

| Step | i | total | Output |
|---|---|---|---|
| Start | — | 0 | |
| Iteration 1 | 1 | | |
| Iteration 2 | 2 | | |
| Iteration 3 | 3 | | |
| End | — | — | |

**Q3** [3 marks]
Write pseudocode for an algorithm that:
- Inputs 5 numbers from the user
- Adds them together
- Outputs the total

**Q4** [4 marks]
Draw a flowchart for the following algorithm. Use correct flowchart symbols and label all shapes.

*"Input a student's mark. If the mark is 70 or above, output 'Distinction'. If the mark is between 50 and 69 inclusive, output 'Pass'. Otherwise, output 'Fail'."*

**Q5** [5 marks]
An algorithm searches a list of 10 names one by one from first to last until it finds the target name.

(a) What is this type of search called? [1 mark]
(b) In the worst case, how many comparisons does this algorithm make? [1 mark]
(c) Suggest a more efficient algorithm for searching the list. State one requirement for this more efficient algorithm to work. [2 marks]
(d) Explain why efficiency matters when designing algorithms for large datasets. [1 mark]

**MCQ** [1 mark]
A programmer writes the steps for solving a problem in English-like keywords before coding. What is this representation called?

A) Source code
B) Pseudocode
C) Machine code
D) A flowchart

*(Answer: B)*

**Fill in the blank** [1 mark]
A ___ table is used to track the values of variables at each step as an algorithm runs.

*(Answer: trace)*

---

## Model Answers

**Q1**: A diamond (rhombus) shape.

**Q2 completed trace table**:

| Step | i | total | Output |
|---|---|---|---|
| Start | — | 0 | |
| Iteration 1 | 1 | 1 | |
| Iteration 2 | 2 | 3 | |
| Iteration 3 | 3 | 6 | |
| End | — | — | 6 |

**Q3**:
```pseudocode
total ← 0
FOR i = 1 TO 5
    number ← USERINPUT
    total ← total + number
ENDFOR
OUTPUT total
```

**Q4 flowchart** (described):
```
(START)
   |
/Input mark/
   |
<mark >= 70?> -- NO --> <mark >= 50?> -- NO --> /Output "Fail"/ --> (END)
   |                         |
  YES                       YES
   |                         |
/Output "Distinction"/  /Output "Pass"/
   |                         |
(END)                     (END)
```

**Q5**:
(a) Linear search (sequential search)
(b) 10 comparisons (if the target is the last item or not present)
(c) Binary search. Requirement: the list must be **sorted** in order before binary search can be applied.
(d) For small lists, efficiency differences are negligible. But with millions of records (e.g. a national database), an inefficient algorithm may take hours; an efficient algorithm completes in seconds. As data volumes grow, efficiency becomes critical.

---

## Revision Checklist

Before your exam, make sure you can:

- [ ] Define algorithm and state four properties of a good algorithm
- [ ] Name and draw the four main flowchart shapes with their meanings
- [ ] State that a diamond always has exactly two exits (YES and NO)
- [ ] Write pseudocode using IF/ELSE, FOR, WHILE, INPUT, OUTPUT
- [ ] Trace an algorithm step by step using a trace table
- [ ] Predict the output of an algorithm for a given input
- [ ] Draw a flowchart for a simple multi-branch problem
- [ ] Explain what efficiency means in the context of algorithms
- [ ] Explain the difference between an algorithm and a program

## KS3 Computing — Binary & Hexadecimal

- Pack ID: `ks3_computing_binary_hexadecimal`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_binary_hexadecimal/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_binary_hexadecimal/pack_unified.json`

### Source Content

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

## KS3 Computing — CPU & Fetch-Decode-Execute Cycle

- Pack ID: `ks3_computing_cpu_fde_cycle`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_cpu_fde_cycle/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_cpu_fde_cycle/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: The CPU & Fetch-Decode-Execute Cycle
**Year 7–9 | Computer Systems | UK National Curriculum**

---

## Overview

The CPU (Central Processing Unit) is the most important component of any computer. But the CPU is itself made up of several internal sub-components, each with a specific role. Understanding how these parts work together — and following the precise sequence of steps called the **Fetch-Decode-Execute cycle** — is the key to understanding how any computer program actually runs.

This pack also explores the factors that determine how fast a CPU can process instructions: clock speed, number of cores, and cache size.

By the end of this pack you will be able to:
- Name and describe the CPU's internal components (ALU, Control Unit, Cache, Registers)
- Describe each stage of the Fetch-Decode-Execute cycle in detail
- Explain how clock speed, core count, and cache size affect CPU performance
- Explain the Von Neumann architecture concept
- Apply your knowledge to compare CPUs and predict performance

---

## Section 1: CPU Internal Components

The CPU is not a single simple chip — it contains several specialised sub-components that each handle a different part of the instruction processing task.

### Control Unit (CU)

The **Control Unit** is the "manager" or "coordinator" of the CPU. It:
- Directs the flow of data between the CPU's components and RAM
- Manages and coordinates the Fetch-Decode-Execute cycle
- Does **not** perform calculations itself — it organises and controls everything else
- Sends control signals to other components telling them what to do and when

### Arithmetic and Logic Unit (ALU)

The **ALU** is where all actual computation happens. It performs:
- **Arithmetic operations:** Addition, subtraction, multiplication, division
- **Logical operations:** AND, OR, NOT, XOR (Boolean logic comparisons)
- **Comparison operations:** Is A greater than B? Are A and B equal?

The ALU is the component that executes mathematical instructions. The result is temporarily held in a register.

### Registers

**Registers** are extremely small but ultra-fast memory locations **inside the CPU itself**. They hold data and instructions that the CPU is working with right now — they are faster than cache or RAM.

Key registers:

| Register | Purpose |
|----------|---------|
| **Program Counter (PC)** | Holds the **memory address** of the next instruction to be fetched from RAM |
| **Accumulator** | Holds the result of the most recent ALU operation |
| **Memory Address Register (MAR)** | Holds the address in RAM that data/instructions are being read from or written to |
| **Memory Data Register (MDR)** | Temporarily holds data that has just been fetched from, or is about to be written to, RAM |

At KS3 level, you need to know the Program Counter and Accumulator. The MAR and MDR become more important at GCSE.

### Cache

**Cache** is a small amount of very high-speed memory located **inside or very close to the CPU**. It stores copies of the most frequently used instructions and data.

- **Much faster** than RAM to access
- **Much smaller** than RAM (typically a few MB compared to RAM's many GB)
- Organised in levels: **L1 cache** (smallest, fastest, inside CPU), **L2 cache** (larger, slightly slower), **L3 cache** (largest, shared between cores)
- When the CPU needs data, it checks cache first. If found (a **cache hit**), it reads fast. If not found (a **cache miss**), it must fetch from RAM (slower).

**Why cache matters:** RAM access takes many more clock cycles than cache access. If frequently used instructions are already in cache, the CPU wastes fewer cycles waiting — execution is much faster.

---

## Section 2: The Fetch-Decode-Execute Cycle

Every instruction that every program ever runs goes through the same three-stage process, repeated continuously, billions of times per second.

### The Three Stages

#### Stage 1: FETCH

1. The **Control Unit** reads the memory address stored in the **Program Counter (PC)**
2. It sends this address to RAM via the address bus
3. The instruction stored at that address in RAM is retrieved
4. The instruction is copied into the **Memory Data Register (MDR)**, then into the **Current Instruction Register**
5. The **Program Counter is incremented** (updated to point to the address of the next instruction)

**In plain English:** The CPU finds out where the next instruction is, goes to that location in RAM, brings the instruction back into the CPU, and updates its "bookmark" to remember where to go next.

#### Stage 2: DECODE

1. The **Control Unit** examines the instruction that has just been fetched
2. It interprets what operation is required (e.g. "add these two numbers", "move this value to that location", "jump to this address")
3. It determines what data is needed and where to find it
4. It prepares the appropriate signals to carry out the operation

**In plain English:** The Control Unit reads the instruction and works out exactly what needs to happen and who needs to do it.

#### Stage 3: EXECUTE

1. The relevant component carries out the instruction:
   - If it is a calculation: the **ALU** performs the arithmetic or logic operation
   - If it is a memory access: data is read from or written to RAM
   - If it is a control instruction (e.g. jump/branch): the **Program Counter** is updated to a new address
2. The result may be stored in a **register** (Accumulator) or written back to RAM

**In plain English:** The instruction is actually carried out by the appropriate part of the CPU (or involves RAM).

After Execute, the cycle immediately **returns to Fetch** for the next instruction.

---

### FDE Cycle Flow Diagram

```
                    ┌─────────────────┐
                    │     FETCH       │
                    │                 │
                    │ • Read Program  │
                    │   Counter       │
                    │ • Retrieve      │
                    │   instruction   │
                    │   from RAM      │
                    │ • Increment PC  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     DECODE      │
                    │                 │
                    │ • Control Unit  │
                    │   interprets    │
                    │   instruction   │
                    │ • Determines    │
                    │   operation &   │
                    │   data needed   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     EXECUTE     │
                    │                 │
                    │ • ALU performs  │
                    │   calculation   │
                    │ • OR RAM is     │
                    │   read/written  │
                    │ • Result stored │◄─────┐
                    └────────┬────────┘      │
                             │               │
                             └───────────────┘
                           (repeat continuously)
```

---

### Worked FDE Example

Imagine a program instruction: **"Add the value 5 to the value stored in the Accumulator"**

```
FETCH:
  Program Counter says: "Next instruction is at address 0042"
  CPU retrieves the instruction from RAM address 0042
  PC is updated to 0043 (ready for next instruction)

DECODE:
  Control Unit reads: "ADD 5"
  It recognises this as an addition operation
  It identifies that the number 5 must be added to the Accumulator

EXECUTE:
  ALU takes the current value in the Accumulator (say, 10)
  ALU adds 5 to it: 10 + 5 = 15
  Result (15) is stored in the Accumulator
  
  → Cycle repeats: FETCH next instruction from address 0043
```

---

## Section 3: CPU Performance Factors

### 1. Clock Speed

The **clock** is an electronic signal that synchronises all operations in the CPU. Each "tick" is one clock cycle, and the CPU performs a set amount of work per cycle.

- **Clock speed** is measured in **GHz** (gigahertz = billions of cycles per second)
- A 3.2 GHz CPU performs 3,200,000,000 cycles every second
- Higher clock speed → more instructions processed per second → faster execution

**Limitation:** Higher clock speed generates more heat. There is a physical limit to how fast transistors can switch reliably.

```
Clock speed comparison:
  2.0 GHz  →  2 billion cycles/second
  3.2 GHz  →  3.2 billion cycles/second  (60% faster)
  5.0 GHz  →  5 billion cycles/second   (150% faster than 2.0 GHz)
```

### 2. Number of Cores

A **core** is a complete, independent processing unit. A modern CPU chip typically contains multiple cores on a single piece of silicon.

- **Dual-core:** 2 independent cores
- **Quad-core:** 4 independent cores
- **Octa-core:** 8 independent cores

Each core can fetch, decode, and execute instructions independently, allowing **genuinely parallel execution** of multiple tasks simultaneously.

**Example:** A quad-core CPU can run four separate threads simultaneously — so while one core runs your web browser, another runs your music app, another handles background updates, and another processes a download.

**Limitation:** Not all software is written to use multiple cores (parallelised code). A single-threaded program can only use one core at a time, no matter how many the CPU has.

### 3. Cache Size

As explained earlier, cache is the ultra-fast memory inside the CPU. A **larger cache** means:
- More frequently used instructions and data can be stored close to the CPU
- Fewer **cache misses** (situations where the CPU has to wait for slower RAM)
- Faster execution overall

**Limitation:** Cache is extremely expensive to manufacture. There is a practical limit to how much cache fits on a CPU chip.

---

### Performance Factors Comparison Table

| Factor | How it improves performance | Limitation |
|--------|-----------------------------|-----------|
| **Higher clock speed** | More instruction cycles per second | Generates more heat; physical switch speed limit |
| **More cores** | Multiple tasks execute truly in parallel | Requires software written to use multiple cores |
| **Larger cache** | More frequently used data available instantly; fewer slow RAM accesses | Expensive; limited physical space on chip |

---

### Comparing Two CPUs: Which is Faster?

```
CPU A: 1 core  @ 2.0 GHz, 1 MB cache
CPU B: 4 cores @ 3.2 GHz, 8 MB cache

For a single-threaded task (e.g. running one program):
  CPU B's 3.2 GHz clock speed wins over CPU A's 2.0 GHz — 60% more cycles/second.

For heavy multitasking (e.g. video editing while gaming):
  CPU B's 4 cores massively outperform CPU A's 1 core — 4 tasks can run in parallel.
  CPU A would have to rapidly switch between tasks (slower apparent multitasking).

For cache benefit:
  CPU B's 8 MB cache means far fewer RAM accesses needed.
  CPU A's 1 MB cache fills quickly; frequent cache misses slow execution.

Overall: CPU B is significantly faster in virtually all scenarios.
```

---

## Section 4: Von Neumann Architecture

**Von Neumann architecture** is the design principle that underlies virtually all modern general-purpose computers. Its key idea:

> Both **program instructions** and **data** are stored together in the same memory (RAM), using the same format (binary numbers).

This is why the same RAM that holds your document text also holds the word-processor program's instructions. The CPU cannot tell from a binary value alone whether it is data or an instruction — the position in memory and the context of the program determines this.

```
Von Neumann Architecture (simplified):

        ┌───────────────────────────────────┐
        │              CPU                  │
        │  ┌──────────┐  ┌───────────────┐ │
        │  │ Control  │  │     ALU       │ │
        │  │  Unit    │  │ (calculations)│ │
        │  └──────────┘  └───────────────┘ │
        │  ┌──────────┐  ┌───────────────┐ │
        │  │ Registers│  │    Cache      │ │
        │  │ (PC, Acc)│  │ (fast store)  │ │
        │  └──────────┘  └───────────────┘ │
        └──────────────┬────────────────────┘
                       │ (buses: data, address, control)
                       ▼
        ┌───────────────────────────────────┐
        │              RAM                  │
        │  ┌─────────────┐ ┌─────────────┐ │
        │  │  Program    │ │    Data     │ │
        │  │ Instructions│ │  (values,   │ │
        │  │  (binary)   │ │  results)   │ │
        │  └─────────────┘ └─────────────┘ │
        └───────────────────────────────────┘
```

---

## Key Vocabulary

| Term | Definition |
|------|-----------|
| **CPU** | Central Processing Unit; executes all program instructions |
| **ALU** | Arithmetic and Logic Unit; performs all calculations and logical comparisons |
| **Control Unit** | Manages the FDE cycle; coordinates data flow between CPU components and RAM |
| **Register** | Tiny, ultra-fast memory storage inside the CPU |
| **Program Counter (PC)** | Register that holds the memory address of the next instruction to be fetched |
| **Accumulator** | Register that holds the result of the most recent ALU operation |
| **Cache** | Small, fast memory inside/near the CPU; stores frequently used instructions to reduce RAM accesses |
| **FDE cycle** | Fetch-Decode-Execute; the continuous three-stage process by which a CPU executes instructions |
| **Clock speed** | The number of cycles per second a CPU performs; measured in GHz |
| **Core** | An independent processing unit within a CPU; multiple cores allow parallel execution |
| **Von Neumann architecture** | Design where program instructions and data share the same RAM |
| **Cache hit** | When requested data is found in cache (fast) |
| **Cache miss** | When data is not in cache and must be fetched from RAM (slower) |
| **GHz** | Gigahertz; billions of cycles per second; unit for clock speed |

---

## Common Misconceptions

| Misconception | Correction |
|---------------|-----------|
| "The CPU stores programs" | The CPU **executes** programs. Programs are stored in RAM (while running) and on secondary storage (HDD/SSD) permanently. The CPU only holds the current instruction in a register. |
| "More cores always means faster performance" | More cores improve performance for tasks that can run in parallel. A single-threaded program that cannot be parallelised uses only one core and sees no benefit from additional cores. |
| "Cache is the same as RAM" | Cache is a **smaller, faster** type of memory located inside/near the CPU. RAM is much larger but slower. Cache stores a copy of frequently accessed data from RAM. |
| "Higher clock speed always means a faster computer" | Clock speed is one factor. A 4-core 3.2 GHz CPU will often outperform a single-core 4.0 GHz CPU for typical multitasking workloads. Cache size and core count also matter significantly. |
| "The FDE cycle has only two steps" | There are exactly **three** distinct stages: Fetch, Decode, and Execute. Decode is a separate stage where the Control Unit interprets the instruction — it is not part of Fetch or Execute. |
| "The ALU controls the FDE cycle" | The **Control Unit** manages and coordinates the FDE cycle. The ALU only executes arithmetic and logical operations during the Execute stage. |

---

## Exam-Style Questions

### Q1 [1 mark]
What does **ALU** stand for?

### Q2 [2 marks]
Describe what happens during the **Fetch** stage of the Fetch-Decode-Execute cycle. Include reference to the Program Counter in your answer.

### Q3 [2 marks]
Explain how a **larger cache** improves the performance of a CPU.

### Q4 [4 marks]
A student is choosing between two computers:

- **Computer X:** Single-core CPU running at 2.0 GHz with 2 MB cache
- **Computer Y:** Quad-core CPU running at 3.2 GHz with 8 MB cache

Explain which computer would perform better for (a) running a single program and (b) heavy multitasking. Justify your answers.

### Q5 [6 marks]
Describe the complete Fetch-Decode-Execute cycle. Your answer should clearly describe what happens at each of the three stages, name the components involved, and explain what happens to the Program Counter.

### Multiple Choice Question
Which component of the CPU is responsible for coordinating the Fetch-Decode-Execute cycle and managing the flow of data between components?

- A) ALU
- B) Accumulator
- C) Control Unit
- D) Cache

*(Answer: C)*

### Fill in the Blank
"The __________ holds the memory address of the next instruction to be fetched. After fetching, it is automatically __________ to point to the next instruction. During the Execute stage, calculations are performed by the __________."

*(Answers: Program Counter; incremented; ALU)*

---

## Model Answers

### Q1 Model Answer
Arithmetic and Logic Unit

### Q2 Model Answer
During the Fetch stage, the Control Unit reads the memory address stored in the Program Counter (PC). It uses this address to retrieve the instruction from that location in RAM. The instruction is copied into the CPU. The Program Counter is then incremented (increased) so that it points to the address of the next instruction to be fetched.

### Q3 Model Answer
A larger cache can store more frequently used instructions and data close to the CPU. When the CPU needs data, it checks the cache first. If the data is found (a cache hit), the CPU reads it very quickly without having to access the much slower RAM. With a larger cache, more data can be stored — resulting in more cache hits and fewer time-consuming RAM accesses, so the CPU processes instructions faster overall.

### Q4 Model Answer
**(a) Running a single program:**
Computer Y would still perform better because its 3.2 GHz clock speed is significantly faster than Computer X's 2.0 GHz, allowing it to complete more instruction cycles per second. Its larger 8 MB cache also means fewer RAM accesses. For a single-threaded program that can only use one core, clock speed and cache size are the decisive factors.

**(b) Heavy multitasking:**
Computer Y would perform dramatically better. Its 4 cores can execute 4 tasks truly simultaneously — for example, running a game, a browser, a music app, and background updates all at the same time, each on a separate core. Computer X's single core can only execute one instruction stream at a time, having to rapidly switch between all the tasks (context switching), which creates delays and makes all tasks run slower.

### Q5 Model Answer

**Fetch:**
The Control Unit reads the value stored in the Program Counter (PC), which contains the memory address of the next instruction. The CPU sends this address to RAM and retrieves the instruction stored there. The instruction is brought into the CPU and held in a register. The Program Counter is then incremented — updated to the address of the next instruction — so the CPU knows where to fetch from next.

**Decode:**
The Control Unit examines the fetched instruction. It interprets what operation is required (e.g. an addition, a data move, a jump) and determines what data is needed and where it is. The Control Unit then sends the appropriate control signals to the relevant components to prepare them to carry out the operation.

**Execute:**
The instruction is carried out by the relevant component. If it involves a calculation, the ALU performs the arithmetic or logical operation and stores the result in the Accumulator register. If it involves reading or writing memory, data is transferred between RAM and a register. If it is a branch/jump instruction, the Program Counter may be updated to a new address.

After Execute, the cycle immediately begins again with the next Fetch. This cycle repeats billions of times per second for every program running on the computer.

---

## Revision Checklist

- [ ] I can name the four key internal components of the CPU (Control Unit, ALU, Registers, Cache)
- [ ] I can describe what the Control Unit does (manages FDE cycle, coordinates data flow)
- [ ] I can describe what the ALU does (arithmetic and logical operations)
- [ ] I can explain what registers are and name the Program Counter and Accumulator
- [ ] I can explain the purpose of cache and why it is faster than RAM
- [ ] I can describe all three stages of the FDE cycle (Fetch, Decode, Execute)
- [ ] I know the role of the Program Counter in the Fetch stage (address of next instruction; incremented after fetch)
- [ ] I can explain how clock speed affects CPU performance (GHz = cycles per second)
- [ ] I can explain how having more cores improves multitasking
- [ ] I can explain how larger cache improves performance (fewer RAM accesses, more cache hits)
- [ ] I can compare two CPUs across clock speed, cores, and cache and predict which is faster
- [ ] I know the key idea of Von Neumann architecture (data and instructions stored in same RAM)
- [ ] I can identify and correct common misconceptions about CPU components and performance

## KS3 Computing — Cybersecurity Protection

- Pack ID: `ks3_computing_cybersecurity_protection`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_cybersecurity_protection/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_cybersecurity_protection/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Cybersecurity Protection & Safe Practices
**Year 7–9 | Cybersecurity | UK National Curriculum**

---

## Overview

Understanding threats is only half the battle. This pack focuses on the **protective measures** that individuals, schools, and organisations use to defend against cybersecurity attacks. Effective cybersecurity relies on **multiple layers** of protection — no single measure is sufficient on its own. This approach is called **defence in depth**.

---

## Section 1: Technical Protections

### Firewall

A **firewall** monitors all incoming and outgoing network traffic and compares it against a set of rules. Traffic that does not match the rules is **blocked**.

**How it works:**
- Examines each data packet (source IP, destination IP, port number, protocol)
- Compares against a ruleset (e.g. "block all traffic from IP addresses in this list", "allow only HTTP and HTTPS traffic")
- Allows permitted traffic through; blocks everything else

**Types:**

| Type | What it protects | Where it sits |
|---|---|---|
| Hardware firewall | The entire network | Between the internet and the internal network (in the router) |
| Software firewall | Individual device | Installed on a specific computer or server |

**Network diagram:**

```
[INTERNET]
     |
  [ROUTER with FIREWALL]  <-- Blocks unwanted incoming connections
     |                        and suspicious outgoing traffic
[INTERNAL NETWORK]
  |       |       |
[PC1]  [PC2]  [Server]
```

**What firewalls protect against:** unauthorised access to the network; many types of DoS attack; connections to malicious remote servers (from malware trying to "phone home")

**Limitations:** a firewall alone cannot stop phishing (the user willingly gives away data); cannot stop malware already installed inside the network; cannot inspect encrypted HTTPS traffic without special configuration

### Antivirus / Anti-malware

Antivirus software **scans files and processes** on a device and compares them against a **database of known malware signatures**.

**How it works:**
1. Maintains a constantly updated database of malware signatures (unique patterns of code belonging to known malware)
2. Scans files when they are opened or downloaded
3. If a match is found, the file is **quarantined** (isolated) or deleted
4. Can also monitor running processes for suspicious behaviour (**heuristic detection**)

**Must be kept updated:** new malware is created every day; the signature database must be updated regularly to recognise new threats

**Limitation — zero-day attacks:** a **zero-day** vulnerability is one that was unknown until attackers started exploiting it. Antivirus cannot detect malware it has never seen before — there is no signature yet. Heuristic detection helps but is imperfect.

### Encryption

**Encryption** converts plaintext (readable data) into **ciphertext** (scrambled data) using an algorithm and a key. Only someone with the correct key can decrypt and read the data.

**Two important uses:**

**Encryption in transit (data moving over a network):**
- HTTPS uses SSL/TLS to encrypt all data between browser and web server
- Even if an attacker performs a Man-in-the-Middle attack and intercepts the data, they see only meaningless ciphertext
- Essential for login pages, banking, shopping, any personal data

**Encryption at rest (data stored on a device):**
- A laptop's hard drive can be encrypted (e.g. BitLocker on Windows)
- If the laptop is stolen, the attacker cannot read the files without the decryption key
- Even physically removing the hard drive and connecting it to another computer yields only encrypted, unreadable data

**Analogy:** encryption is like sending a letter in a locked box — the postal workers (routers) carry it, but only the recipient with the key can open it and read it.

### Software Updates and Patches

Software companies regularly release **updates** that fix **security vulnerabilities** — weaknesses in the code that attackers could exploit.

**Why updates are critical:**
- When a vulnerability is discovered, attackers immediately begin scanning the internet for unpatched systems
- Once a patch is released, the vulnerability is publicly known — meaning even more attackers know to exploit systems that have not been patched
- Unpatched systems are therefore at **greater** risk after a patch is released if you do not apply it promptly

**Real-world example:** WannaCry ransomware (2017) exploited a vulnerability in Windows. Microsoft had released a patch two months earlier. Organisations that had not applied the patch were attacked; those that had were unaffected.

**Best practice:** enable **automatic updates** so patches are applied as soon as they are released.

### Two-Factor Authentication (2FA)

**2FA** requires users to provide **two separate forms of identity verification** before access is granted.

**The three factors of authentication:**

| Factor | Type | Examples |
|---|---|---|
| Something you **know** | Knowledge | Password, PIN, security question |
| Something you **have** | Possession | SMS code, authenticator app, hardware token, smart card |
| Something you **are** | Biometric | Fingerprint, face recognition, iris scan |

**How 2FA works:**
1. User enters username and password (first factor — something you know)
2. System sends a one-time code to the user's phone or authenticator app (second factor — something you have)
3. User enters the code to complete login

**Why 2FA is powerful:** even if an attacker obtains your password (via phishing, data breach, or brute force), they **cannot log in without the second factor**. They would need to also physically possess your phone.

**Limitation:** if the attacker has access to your phone (e.g. SIM swapping attack), SMS-based 2FA can be defeated. Authenticator apps and hardware tokens are more secure.

---

## Section 2: Password Security

A password is the most basic form of authentication. Weak passwords are one of the most common causes of account compromise.

### What Makes a Strong Password?

| Characteristic | Guidance |
|---|---|
| Length | At least 12 characters; longer is better |
| Complexity | Mix of uppercase, lowercase, numbers, and symbols |
| Unpredictability | Avoid dictionary words, names, dates, or patterns |
| Uniqueness | Never reuse the same password across multiple accounts |
| Personal info | Never include your name, birthday, or pet's name |

### Password Managers

A **password manager** is software that:
- Generates truly random, unique, complex passwords for every account
- Stores all passwords in an encrypted vault
- Fills them in automatically when you visit a website
- You only need to remember one strong **master password**

**Why reusing passwords is dangerous:** if one website is breached and your password is stolen, attackers try that same password on every other website (called **credential stuffing**). Using unique passwords for every account means a breach of one site does not affect others.

---

## Section 3: Network Security Measures

### SSL/TLS

SSL (Secure Sockets Layer) and TLS (Transport Layer Security) are encryption protocols used by HTTPS. When a website has a valid SSL/TLS certificate, the connection is encrypted and the padlock appears in the browser.

### VPN (Virtual Private Network)

A VPN creates an **encrypted tunnel** for all internet traffic from a device, even over public Wi-Fi.

**How it works:**
1. All traffic from your device is encrypted and sent to a VPN server
2. The VPN server forwards the traffic to its destination
3. The destination sees the VPN server's IP address, not yours
4. Interceptors on the local network (e.g. a coffee shop's Wi-Fi) see only encrypted data

**Use cases:** secure use of public Wi-Fi; employees accessing company networks remotely; privacy from ISP monitoring.

### MAC Address Filtering

A network administrator configures the switch/router to **only allow connections from devices with pre-approved MAC addresses**. Any device with an unrecognised MAC address is denied network access, even with correct Wi-Fi credentials.

**Limitation:** MAC addresses can be "spoofed" (faked) by a determined attacker.

### SSID Hiding

The **SSID** (Service Set Identifier) is the name of a Wi-Fi network. By default, it is broadcast publicly. Hiding the SSID means it does not appear in the list of available networks. Users must know the exact name to connect.

**Limitation:** this provides **security through obscurity** — it is not genuine encryption. Tools can still detect hidden networks. It may deter casual intruders but not determined attackers.

---

## Section 4: User Practices and Policies

### Recognising Phishing

Train users to:
- Check the sender's email address carefully (not just the display name)
- Hover over links before clicking to see the real URL
- Never enter credentials on a page you arrived at from an email — go directly to the website instead
- Be suspicious of urgency, threats, or unexpected prizes
- Report suspected phishing to the IT/security team

### The 3-2-1 Backup Rule

Regular backups protect against ransomware, hardware failure, and accidental deletion.

**3-2-1 Rule:**
- **3** copies of your data (original + 2 backups)
- **2** different storage media (e.g. external hard drive + cloud)
- **1** copy stored offsite/off-network (so ransomware cannot encrypt it)

### Principle of Least Privilege

Users should only be granted the **minimum level of access** they need to do their job. If their account is compromised, the attacker can only access what that user was permitted to access — limiting the damage.

**Examples:**
- A reception staff member does not need access to the payroll database
- A student account cannot install new software
- A department manager can see their department's files but not other departments'

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Firewall | Software or hardware that monitors network traffic and blocks unauthorised connections |
| Antivirus | Software that scans for known malware using a signature database |
| Signature database | Database of unique code patterns belonging to known malware, used by antivirus |
| Quarantine | Isolation of a suspected malicious file so it cannot cause harm while being investigated |
| Zero-day | A previously unknown vulnerability (or attack exploiting it) for which no patch yet exists |
| Encryption | Converting plaintext to ciphertext so only someone with the key can read it |
| Plaintext | Data in its original, readable form |
| Ciphertext | Data after encryption — appears as meaningless characters without the key |
| Encryption in transit | Encrypting data while it moves over a network (e.g. HTTPS) |
| Encryption at rest | Encrypting data while stored on a device (e.g. encrypted hard drive) |
| Patch | A software update that fixes a known security vulnerability |
| 2FA | Two-Factor Authentication — requires two forms of identity verification |
| VPN | Virtual Private Network — creates an encrypted tunnel for all internet traffic |
| MAC address filtering | Only allowing network access to devices with pre-approved MAC addresses |
| SSL/TLS | Encryption protocols used by HTTPS to secure data in transit |
| 3-2-1 backup rule | Three copies of data, two media types, one stored offsite |
| Principle of least privilege | Users are granted only the minimum access required for their role |
| Credential stuffing | Using stolen username/password pairs to attempt logins on other websites |
| Password manager | Software that generates, stores, and auto-fills unique passwords securely |
| Heuristic detection | Antivirus technique that identifies malware by suspicious behaviour rather than known signatures |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "A firewall blocks all attacks" | Firewalls filter traffic based on rules but cannot stop phishing (the user willingly provides data), social engineering, malware already inside the network, or zero-day attacks. |
| "Antivirus software detects all malware" | Antivirus relies on a signature database of known malware. Brand-new (zero-day) malware has no signature yet and may not be detected. Heuristic detection helps but is not perfect. |
| "Encryption makes data completely impossible to access" | Encryption makes data practically unreadable without the key. However, if the key is weak, stolen, or the encryption algorithm is outdated, it can potentially be broken. Good encryption is extremely strong but not theoretically absolute. |
| "HTTPS means a website is safe and trustworthy" | HTTPS means the data between you and the server is encrypted. It does not mean the website itself is legitimate — phishing sites can and do use HTTPS with valid certificates. |
| "If you back up your data, you prevent all data loss" | Backups protect against ransomware and hardware failure but not data theft (the data is still stolen) or breaches where data was never backed up in a useful way. |

---

## Protection Methods Table

| Protection | Guards Against | How It Works | Key Limitation |
|---|---|---|---|
| Firewall | Unauthorised access, many network attacks | Blocks traffic not matching permitted rules | Cannot stop attacks from inside the network or phishing |
| Antivirus | Known malware | Scans against signature database; quarantines threats | Cannot detect zero-day (unknown) malware |
| Encryption | Data theft in transit or from stolen device | Scrambles data; only decryptable with correct key | Key management is critical; weak keys can be broken |
| Patches/updates | Exploitation of software vulnerabilities | Fixes known security flaws in software | Cannot fix vulnerabilities that have not yet been discovered |
| 2FA | Account compromise even if password stolen | Requires second verification factor to log in | SIM swapping can defeat SMS-based 2FA |
| Strong passwords | Brute force attacks | Makes systematic guessing computationally infeasible | No protection against phishing or keyloggers |
| VPN | Data interception on public Wi-Fi | Encrypts all traffic to VPN server | VPN provider can see your traffic |
| Backups (3-2-1) | Ransomware, hardware failure, accidental deletion | Maintains multiple copies of data in separate locations | Does not prevent data theft |

---

## Scenario: Company Security Review

**Scenario:** TechStore Ltd stores customer names, addresses, and credit card numbers on their servers. They currently have no security measures in place.

**Identify and explain four security measures they should implement:**

1. **Firewall**: Install a hardware firewall between their servers and the internet to block unauthorised incoming connections and suspicious outbound traffic from compromised servers.

2. **Encryption**: Encrypt all stored customer data (encryption at rest) and use HTTPS (encryption in transit) for all customer interactions. This means that even if data is stolen, it cannot be read without the key.

3. **Two-Factor Authentication**: Require 2FA for all staff accounts, particularly those with access to customer data. Even if a staff member's password is phished, attackers cannot log in without the second factor.

4. **Regular Backups (3-2-1 Rule)**: Maintain three copies of customer data across two media types with one copy offsite. This protects against ransomware (which encrypted the primary copy) and hardware failure.

5. **Software Updates**: Apply all security patches promptly to all servers and workstations to remove known vulnerabilities.

6. **Principle of Least Privilege**: Ensure only staff who genuinely need access to customer credit card data have it, limiting the blast radius if any account is compromised.

---

## Exam-Style Questions

**Q1 [1 mark]**
State **one** purpose of a firewall.

**Q2 [3 marks]**
A company employee's laptop containing customer data is stolen. Explain how **encryption** could protect the data on the laptop.

**Q3 [3 marks]**
Explain why it is important for individuals and organisations to install software **updates** promptly. Use an example in your answer.

**Q4 [6 marks]**
A small healthcare company stores patient records on their computer systems. Describe **four** security measures the company should implement. For each measure, state what threat it addresses and how it works.

**Q5 [6 marks]**
Evaluate the use of **Two-Factor Authentication (2FA)**. In your answer, explain:
- how 2FA works
- what threat it addresses
- one advantage
- one limitation

**MCQ**
What is the main purpose of a software patch?

A) To add new features to software
B) To fix known security vulnerabilities in software
C) To make software run faster
D) To back up user data

**Fill in the blanks**
Antivirus software works by comparing files against a __________ of known malware signatures. If a match is found, the file is placed in __________. A weakness of antivirus software is that it may not detect __________ attacks where the malware has never been seen before. Encrypting data converts it from __________ into __________ so that it cannot be read without the correct key.

---

## Model Answers

**Q1:** A firewall monitors incoming and outgoing network traffic and blocks any traffic that does not match the permitted rules / blocks unauthorised connections to the network. **[1 mark]**

**Q2:** Encryption converts the data on the laptop's hard drive from readable plaintext into ciphertext (1). If the thief attempts to access the files — even by removing the hard drive and connecting it to another computer — they will only see meaningless encrypted data (1). Without the decryption key, the customer data cannot be read, protecting the individuals whose data is stored (1). **[3 marks]**

**Q3:** Software updates include security **patches** that fix known vulnerabilities in the software (1). Once a patch is released, the vulnerability becomes publicly known, meaning attackers actively target systems that have not yet applied it (1). For example, the WannaCry ransomware in 2017 attacked Windows computers that had not applied a patch Microsoft released two months earlier; organisations that had applied it were unaffected (1). **[3 marks]**

**Q4:** Award 1 mark for correctly identifying each measure and 1 mark for explaining how it works/what it protects against, up to 6 marks (any four of):
- **Firewall**: guards against unauthorised network access; monitors all traffic and blocks connections that do not match permitted rules.
- **Encryption**: guards against data theft; encrypts patient records so that even if data is stolen, it cannot be read without the key.
- **2FA**: guards against account compromise even if a password is stolen; requires staff to provide a password and a second factor (e.g. SMS code) to log in.
- **Regular backups**: guards against ransomware and hardware failure; maintaining offsite/cloud copies means data can be restored even if the primary system is encrypted.
- **Software updates**: guards against exploitation of known vulnerabilities; applying patches promptly removes security flaws before attackers can exploit them.
- **Principle of least privilege**: limits damage if an account is compromised; ensures staff can only access the patient data they need for their specific role.

**Q5:** How 2FA works: the user enters their password (first factor) and then must also provide a second factor — typically a one-time code sent to their phone or generated by an authenticator app — before access is granted (2 marks). Threat addressed: even if an attacker steals or guesses the user's password (via phishing, data breach, or brute force), they cannot log in without also possessing the user's phone (1 mark). Advantage: significantly increases the security of accounts without requiring a more complex password (1 mark). Limitation: if an attacker gains access to the user's phone (e.g. SIM swapping, phone theft), SMS-based 2FA can be bypassed; authenticator apps are more secure but still dependent on device security (1 mark). Award 1 additional mark for a well-structured, coherent evaluation. **[6 marks]**

**MCQ:** B — To fix known security vulnerabilities in software

**Fill in the blanks:** signature database / quarantine / zero-day / plaintext / ciphertext

---

## Revision Checklist

- [ ] I can explain what a firewall does and state one limitation
- [ ] I can describe the difference between a hardware and software firewall
- [ ] I can explain how antivirus software works (signature database, quarantine)
- [ ] I can explain what a zero-day attack is and why antivirus may not detect it
- [ ] I can explain encryption in transit (HTTPS) and encryption at rest (hard drive)
- [ ] I can explain how encryption protects a stolen laptop
- [ ] I can explain why software updates and patches are important, with an example
- [ ] I can describe how 2FA works and identify the three types of authentication factor
- [ ] I can explain why 2FA protects against stolen passwords
- [ ] I can describe characteristics of a strong password
- [ ] I can explain the 3-2-1 backup rule
- [ ] I can explain the principle of least privilege with an example
- [ ] I can describe what a VPN is and when it should be used
- [ ] I can recommend and justify security measures for a given scenario

## KS3 Computing — Cybersecurity Threats & Attacks

- Pack ID: `ks3_computing_cybersecurity_threats`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_cybersecurity_threats/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_cybersecurity_threats/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Cybersecurity Threats & Attacks
**Year 7–9 | Cybersecurity | UK National Curriculum**

---

## Overview

Cybersecurity threats fall into two broad categories: **technical attacks** (which target vulnerabilities in software and systems) and **social engineering** (which target the weakest link — human psychology). Understanding both is essential for protecting yourself and others online. This pack covers the main types of malware, social engineering attacks, and network-based threats.

**Why this matters:** Cybercrime costs the global economy hundreds of billions of pounds each year. The NHS was severely disrupted by the WannaCry ransomware attack in 2017. Personal accounts, banking details, and sensitive photos can all be compromised through attacks described in this pack.

---

## Section 1: Malware (Malicious Software)

**Malware** is any software specifically designed to disrupt, damage, or gain unauthorised access to a computer system. It is an umbrella term — viruses, worms, and ransomware are all types of malware.

### Virus

- **What it does**: attaches itself to a legitimate file; when the infected file is shared or opened, the virus spreads; can corrupt or delete data, slow the system, or give attackers access
- **How it spreads**: requires **human action** — a user must open an infected file (email attachment, downloaded file, infected USB drive)
- **Analogy**: like a biological virus — it cannot replicate on its own; it needs a host cell (a file) and a carrier (a human to share the file)
- **Example**: a virus hidden inside a Word document sent as an email attachment

### Worm

- **What it does**: similar damaging effects to a virus, but spreads differently
- **How it spreads**: **self-replicating** — spreads automatically across networks **without any user action**; exploits vulnerabilities in operating systems or network services
- **Key difference from virus**: does NOT need to attach to a file; does NOT need a human to share it
- **Danger**: can spread across an entire organisation's network in minutes; can overload networks with self-replication traffic
- **Example**: the WannaCry ransomware worm spread automatically across NHS networks in 2017 without staff clicking anything

### Trojan (Trojan Horse)

- **What it does**: disguises itself as legitimate, useful software (a game, a free tool, a codec); once installed, it opens a **backdoor** allowing attackers remote access to the system
- **How it spreads**: requires human to deliberately install it (thinking it is something useful)
- **Does NOT self-replicate**: unlike viruses and worms, Trojans do not spread themselves
- **What attackers do with backdoor access**: steal files, install more malware, use the device in a botnet, access webcam/microphone
- **Example**: "Free video player" download that secretly gives an attacker control of your computer

### Ransomware

- **What it does**: **encrypts** all the victim's files so they cannot be opened; displays a ransom demand — pay (usually cryptocurrency) to receive the decryption key
- **How it spreads**: typically via phishing emails, infected downloads, or (like WannaCry) as a worm
- **Impact**: particularly devastating to hospitals, businesses, local councils — patient records inaccessible, operations cancelled, business halted
- **Paying the ransom**: not recommended — no guarantee the key will be provided; funds further attacks
- **Example**: WannaCry (2017) — affected 200,000+ computers in 150 countries including NHS

### Spyware

- **What it does**: secretly monitors user activity — records keystrokes (keylogger), captures screenshots, monitors browsing history; sends stolen data to attacker
- **What is stolen**: passwords, banking details, credit card numbers, personal messages
- **How it spreads**: often bundled with free software (same as adware)
- **Key word**: operates **secretly** — victim usually has no idea it is running

### Adware

- **What it does**: displays unwanted advertisements; redirects browser searches to advertising websites; can slow the system significantly
- **How it spreads**: often bundled with free software (user installs free application, adware installs alongside it)
- **Least harmful**: of the malware types — no data theft, no encryption, but annoying and potentially covers for more harmful software

### Malware Types Summary Table

| Malware | How It Spreads | Main Effect | Prevention |
|---|---|---|---|
| Virus | Human shares infected file | Corrupts/deletes data, spreads to other files | Antivirus, avoid opening unknown attachments |
| Worm | Self-replicating across network, no user action | Overloads networks, installs further malware | Firewall, keep software patched/updated |
| Trojan | User installs thinking it is legitimate software | Opens backdoor for attacker remote access | Only install software from trusted sources |
| Ransomware | Phishing emails, infected downloads, worm-based | Encrypts files, demands ransom payment | Regular backups, software updates, antivirus |
| Spyware | Bundled with free software, malicious downloads | Steals passwords, banking details, keystrokes | Antivirus, trusted software sources |
| Adware | Bundled with free software | Unwanted adverts, browser redirects, slow system | Careful about what free software you install |

---

## Section 2: Social Engineering

**Social engineering** attacks exploit **human psychology** rather than technical vulnerabilities. Attackers manipulate people into doing something they should not — revealing passwords, clicking a link, or transferring money. Even the most technically secure system can be defeated if the people using it can be tricked.

### Phishing

- **Method**: fake email, website, or message that **mimics a trusted organisation** (bank, HMRC, Apple, Netflix, a school, a government department)
- **Goal**: trick the user into clicking a malicious link (which installs malware or leads to a fake login page) or directly entering their credentials
- **Channel**: primarily email
- **Scale**: sent to thousands or millions of people at once — untargeted

**Warning signs in a phishing email:**
1. Sender email address does not match the organisation (e.g. `noreply@apple-security-alert.com` instead of `@apple.com`)
2. Urgent/threatening language: "Your account will be suspended in 24 hours!"
3. Generic greeting: "Dear Customer" instead of your actual name
4. Suspicious link: hover over the link — the real URL is different from the displayed text
5. Requests sensitive information: no legitimate organisation asks for full passwords by email
6. Poor spelling and grammar (though modern AI-written phishing is increasingly polished)

### Spear Phishing

- **Method**: highly **targeted** phishing; the attacker researches the specific individual (from LinkedIn, social media, company websites, previous data breaches)
- **Personalised**: uses victim's real name, job title, manager's name, recent projects
- **Why more dangerous**: much harder to recognise as fake because it appears credible and specific
- **Example**: "Hi Sarah, as discussed in yesterday's meeting with [your manager's real name], please review the attached budget spreadsheet and enter your login to submit it."

### Smishing

- **Method**: phishing via **SMS text messages**
- **Example**: "Your parcel could not be delivered. Pay the £2.99 redelivery fee here: [malicious link]"
- **Why effective**: people tend to trust text messages more than emails; links are harder to inspect on mobile

### Vishing

- **Method**: phishing via **voice call/phone** — the attacker calls the victim and impersonates a bank, HMRC, police, or technical support
- **Example**: "This is your bank's fraud department. We've detected suspicious activity on your account. I'll need to verify your details to protect you."
- **Manipulation techniques**: create urgency, play on trust of authority, keep victim talking to prevent them from checking

### Pretexting

- **Method**: attacker creates a **fabricated backstory (pretext)** to manipulate the target into providing information or access
- **Example**: calling an employee pretending to be an IT support technician who needs the employee's password to "fix a problem with their account"
- **Difference from phishing**: usually involves building a longer, more elaborate fictional narrative rather than a simple email trick

### Shouldering (Shoulder Surfing)

- **Method**: **physically watching** a victim enter their password, PIN, or other sensitive information
- **Where it happens**: ATMs, offices, trains, cafes, shared screens
- **Low-tech but effective**: no computer skills required; purely observational
- **Prevention**: shield the keypad/screen when entering PINs; be aware of surroundings in public

### Social Engineering Summary Table

| Attack | Method | Channel | Example |
|---|---|---|---|
| Phishing | Fake communication from trusted org | Email | Fake Apple security alert email |
| Spear phishing | Targeted, personalised phishing | Email | Email using victim's name, manager, real project |
| Smishing | Phishing via SMS | Text message | "Pay parcel redelivery fee" text |
| Vishing | Phishing via voice call | Phone | Fake bank fraud department call |
| Pretexting | Fabricated backstory | Phone / in-person | Fake IT support asking for password |
| Shouldering | Physically watching credentials entered | Physical | Watching someone type PIN at ATM |

---

## Section 3: Network Attacks

### DoS (Denial of Service)

- **What it does**: floods a web server or network service with so many requests that it cannot respond to legitimate users — effectively taking the service offline
- **How**: attacker sends millions of fake requests per second from one machine
- **Targets**: websites, online services, banks, gaming platforms
- **Effect**: customers cannot access the service; lost revenue, reputational damage

### DDoS (Distributed Denial of Service)

- **What it does**: same as DoS but coordinated across **thousands or millions of compromised devices** (a **botnet** — a network of infected devices the attacker controls)
- **Why harder to stop**: traffic comes from thousands of different IP addresses worldwide; blocking one IP does nothing; traffic volumes can reach Tbps (terabits per second)
- **Botnet**: created by infecting ordinary devices (home routers, webcams, computers) with Trojan malware; owners often have no idea their device is in a botnet

### Man-in-the-Middle (MITM)

- **What it does**: attacker secretly **intercepts communications** between two parties who believe they are communicating directly with each other
- **What attacker can do**: read private messages, steal credentials, alter data in transit (e.g. change a bank account number in a transfer)
- **Where it happens**: unencrypted Wi-Fi networks (public cafes, hotels); HTTP (not HTTPS) connections
- **Prevention**: always use HTTPS; avoid sensitive activity on public Wi-Fi; use a VPN

### Brute Force Attack

- **What it does**: systematically tries **every possible combination** of characters until the correct password is found
- **Speed**: modern computers can try billions of combinations per second
- **Defeated by**:
  - Long, complex passwords (12+ characters with symbols, numbers, mixed case)
  - Account lockout after a number of failed attempts
  - Multi-factor authentication (even if password is found, a second factor is needed)

### SQL Injection (Awareness)

- **What it does**: attacker enters **malicious SQL code** into a web form (login field, search box) that gets executed by the database behind the website
- **Effect**: can retrieve all data from the database, bypass login authentication, delete data
- **Example**: entering `' OR '1'='1` into a login form to bypass password checking
- **Prevention**: input validation; parameterised queries (not required to know at KS3)

### Unpatched Software

- **What it is**: software that has not been updated with the latest **security patches**
- **Why dangerous**: when vulnerabilities are discovered in software, attackers actively target unpatched systems; patches fix the vulnerability
- **Example**: WannaCry exploited a vulnerability in Windows that had been patched months earlier — organisations that had not applied the patch were attacked

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Malware | Malicious software designed to disrupt, damage, or gain unauthorised access to systems |
| Virus | Malware that attaches to files and spreads when infected files are shared (requires human action) |
| Worm | Self-replicating malware that spreads automatically across networks without user action |
| Trojan | Malware disguised as legitimate software that opens a backdoor for attackers |
| Ransomware | Malware that encrypts files and demands payment for the decryption key |
| Spyware | Malware that secretly monitors user activity and steals personal data/passwords |
| Adware | Malware that displays unwanted advertisements |
| Social engineering | Manipulating people psychologically to reveal information or perform actions |
| Phishing | Fake emails/websites mimicking trusted organisations to steal credentials |
| Spear phishing | Targeted, personalised phishing using specific details about the victim |
| Smishing | Phishing via SMS text messages |
| Vishing | Phishing via voice/phone call |
| Pretexting | Creating a fabricated backstory to manipulate someone into revealing information |
| Shouldering | Physically watching someone enter credentials or a PIN |
| DoS | Denial of Service — flooding a server with requests to make it unavailable |
| DDoS | Distributed DoS — coordinated from thousands of devices (botnet) |
| Botnet | Network of compromised devices controlled by an attacker |
| MITM | Man-in-the-Middle — attacker secretly intercepts communications between two parties |
| Brute force | Systematically trying every possible password combination |
| SQL injection | Entering malicious SQL code into a web form to manipulate the database |
| Patch | Software update that fixes known security vulnerabilities |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "Virus means all malware" | Virus is one specific type of malware. Worms, Trojans, ransomware, and spyware are different types of malware, not all of which are viruses. |
| "Phishing emails are easy to spot — they're always obviously fake" | Modern phishing attacks are increasingly sophisticated, using genuine company logos, correct grammar, and personalised details. Spear phishing in particular can be very convincing. |
| "DoS attacks only affect big companies" | Any internet-connected server can be targeted, including school websites, small businesses, and personal servers. |
| "Malware must be downloaded from the internet" | Malware can also spread via infected USB drives, physical media, email attachments, and self-replicating worms that need no user action at all. |
| "A strong password prevents all attacks" | Passwords protect against brute force, but not phishing (where you hand over the password), keyloggers (which record it), or MITM attacks (which intercept it). Multiple layers of security are needed. |

---

## Simulated Phishing Email — 5 Warning Signs

```
FROM: security-alert@apple-accounts-verify.net        <-- (1) WRONG DOMAIN
TO: user@email.com
SUBJECT: URGENT: Your Apple ID has been compromised

Dear Apple Customer,                                   <-- (2) GENERIC GREETING

We have detected suspicious activity on your Apple    
account. Your account will be PERMANENTLY DISABLED    <-- (3) URGENT/THREATENING
within 24 hours unless you verify your identity.               LANGUAGE

Please click the link below to verify your account:

http://apple-id-verify-secure.ru/login                <-- (4) SUSPICIOUS LINK
                                                               (wrong domain, .ru)

You will need to enter your:                          <-- (5) REQUESTS
 - Apple ID email address                                      CREDENTIALS
 - Password
 - Credit card number (for identity verification)

Apple Support Team
```

---

## Exam-Style Questions

**Q1 [2 marks]**
State **one** difference between a virus and a worm.

**Q2 [3 marks]**
Explain what is meant by **phishing**. Give an example of how a phishing attack might try to steal someone's banking password.

**Q3 [4 marks]**
Describe how a ransomware attack progresses from initial infection to the demand for payment.

**Q4 [3 marks]**
The email below is a phishing attempt. Identify **three** warning signs that suggest this email is not genuine.

*[Students would be shown a phishing email — use the annotated example above]*

**Q5 [6 marks]**
Compare **three** different types of malware. For each type, describe how it spreads, what it does, and how users can protect themselves against it.

**MCQ**
Which type of malware spreads automatically across a network without any user action?

A) Virus
B) Trojan
C) Worm
D) Adware

**Fill in the blanks**
A __________ attack involves flooding a server with requests from one machine, making it unavailable to real users. A __________ attack is similar but uses thousands of compromised devices called a __________. __________ is a form of social engineering where attackers physically watch someone enter their credentials. An email pretending to be from a bank in order to steal login details is an example of __________.

---

## Model Answers

**Q1:** A virus requires human action to spread — it attaches to files and spreads when an infected file is shared (1). A worm is self-replicating and spreads automatically across networks without any user action (1). **[2 marks]**

**Q2:** Phishing is when an attacker sends a fake email (or creates a fake website) that appears to come from a trusted organisation, such as a bank (1). The attacker's goal is to trick the user into clicking a link or entering their personal details (1). Example: an email claiming to be from Barclays Bank says "unusual activity has been detected — click here to verify your account" and links to a fake website where the victim enters their username and password, which the attacker then steals (1). **[3 marks]**

**Q3:**
1. Victim receives a phishing email containing a malicious attachment or link, and opens/clicks it (1)
2. The ransomware installs itself and begins encrypting all files on the device (and any network drives it can reach) (1)
3. A message appears on screen informing the victim that their files are encrypted and demanding payment — typically in cryptocurrency such as Bitcoin — in exchange for the decryption key (1)
4. If the victim pays, they may or may not receive the key; there is no guarantee, and paying funds further attacks (1) **[4 marks]**

**Q4:** Any three of: incorrect/suspicious sender email domain; urgent/threatening language; generic greeting (not the user's real name); suspicious URL that does not match the real organisation; requests for passwords or financial information by email; poor spelling/grammar. **[1 mark each, 3 marks total]**

**Q5:** Award 2 marks per malware type (1 for spread/effect, 1 for prevention), up to 6 marks. Example:
- Virus: spreads when a user opens or shares an infected file; corrupts or deletes data; prevented by antivirus software and not opening unknown email attachments.
- Ransomware: spreads via phishing emails or as a worm; encrypts all files and demands payment; prevented by regular backups, keeping software updated, and antivirus.
- Spyware: spreads bundled with free software; secretly records keystrokes and steals passwords; prevented by downloading software only from trusted sources and running antivirus scans.

**MCQ:** C — Worm

**Fill in the blanks:** DoS (Denial of Service) / DDoS (Distributed Denial of Service) / botnet / Shouldering (shoulder surfing) / phishing

---

## Revision Checklist

- [ ] I can define malware and list six types
- [ ] I can explain how a virus spreads and what it does
- [ ] I can explain the difference between a virus and a worm (self-replication)
- [ ] I can describe what a Trojan is and how it differs from a virus/worm
- [ ] I can explain what ransomware does and describe a real-world example (WannaCry)
- [ ] I can explain what spyware does and how it differs from adware
- [ ] I can define social engineering and explain why it is effective
- [ ] I can describe phishing, spear phishing, smishing, and vishing
- [ ] I can identify at least four warning signs in a phishing email
- [ ] I can explain what a DoS attack is and how a DDoS differs
- [ ] I can explain what a botnet is
- [ ] I can describe a Man-in-the-Middle attack
- [ ] I can explain how a brute force attack works and how to defend against it
- [ ] I can explain why keeping software updated is important for security

## KS3 Computing — Data Compression

- Pack ID: `ks3_computing_compression`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_compression/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_compression/pack_unified.json`

### Source Content

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

## KS3 Computing — Databases & SQL

- Pack ID: `ks3_computing_databases_sql`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_databases_sql/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_databases_sql/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Databases & SQL
**Year 7–9 | Databases | UK National Curriculum**

---

## Overview

A **database** is an organised, structured collection of data that enables efficient storage, retrieval, and management. Databases power virtually every digital system you interact with — from school administration systems to streaming services, social media platforms, and the NHS. This pack covers how databases are structured, the rules that keep data accurate, and the SQL language used to query them.

---

## Section 1: Data Fundamentals

### Data vs Information

These terms are often used interchangeably but have distinct meanings:

- **Data** = raw, unprocessed facts with no context. On its own, data is meaningless.
- **Information** = data that has been given context and meaning so it can be interpreted and used.

| Example | Data | Information |
|---|---|---|
| A number | `17` | "Student age: 17 years" |
| A series of digits | `07700900123` | "Emergency contact phone number" |
| A word | `"Red"` | "Traffic light status: Red — stop" |

### Flat-File Databases

A **flat-file database** stores all data in a **single table** (like a spreadsheet). Simple to create and understand for small datasets.

**Problems with flat-file databases:**

- **Data redundancy**: the same data is stored multiple times (e.g. a teacher's name appears in every row for every student in their class)
- **Update anomalies**: if one piece of repeated data changes (e.g. the teacher changes their name), every row must be updated — miss one and the data becomes inconsistent
- **Inconsistency**: different rows may contain different versions of the same data
- **Not scalable**: becomes slow and unwieldy with large amounts of data

**Example flat-file (showing redundancy problem):**

| StudentID | StudentName | Subject | TeacherName | TeacherEmail |
|---|---|---|---|---|
| 101 | Alice | Computing | Mr Smith | smith@school.ac.uk |
| 102 | Bob | Computing | Mr Smith | smith@school.ac.uk |
| 103 | Charlie | Computing | Mr Smith | smith@school.ac.uk |

If Mr Smith leaves and Ms Jones takes over, three rows must all be updated. With 300 students, that is 300 changes — and missing even one causes an inconsistency.

### Relational Databases

A **relational database** splits data across **multiple linked tables**, each storing data about one type of entity. Tables are linked using **keys**.

**Benefits:**
- **No redundancy**: teacher data is stored once in the Teachers table, not repeated in every student row
- **No update anomalies**: change the teacher's name once in one row — all linked student records automatically reflect the change
- **Consistency**: only one version of each piece of data exists
- **Scalable**: can handle millions of records efficiently

### Flat-File vs Relational Comparison

| Feature | Flat-File | Relational |
|---|---|---|
| Number of tables | One | Multiple (linked) |
| Data redundancy | High — data repeated in many rows | Low — each fact stored once |
| Update anomalies | Common — must update many rows | Rare — update one record in one table |
| Consistency | Risk of inconsistency | High consistency |
| Complexity | Simple to understand | More complex to design |
| Scalability | Poor | Excellent |

---

## Section 2: Database Structure

### Tables, Fields, and Records

A database is made up of **tables**. Each table stores data about one type of entity (e.g. Students, Teachers, Subjects).

**Terminology:**

| Term | Also called | Description | Example |
|---|---|---|---|
| Table | Relation | Grid of rows and columns storing data about one entity type | `Students` table |
| Field | Column / Attribute | A single category of data — one property of the entity | `Name`, `Age`, `Subject` |
| Record | Row / Tuple | One complete entry — all the data about one individual entity | Row for student Alice: 101, Alice, 15, Computing |

### Sample Students Table

| StudentID | Name | Age | Subject | YearGroup |
|---|---|---|---|---|
| 101 | Alice | 15 | Computing | 10 |
| 102 | Bob | 14 | Computing | 9 |
| 103 | Charlie | 15 | Science | 10 |
| 104 | Diana | 13 | History | 8 |
| 105 | Ed | 14 | Computing | 9 |

- The **fields** (columns) are: StudentID, Name, Age, Subject, YearGroup
- Each **row** is a **record** — one student's complete data
- `StudentID` is the **primary key**

### Primary Key

The **primary key** is the field (or combination of fields) that **uniquely identifies each record** in a table. Rules:

1. Must be **unique** — no two records can have the same primary key value
2. Must **not be empty (null)** — every record must have a primary key value
3. Should be **stable** — the primary key should not need to change

**Why names cannot be primary keys:** two students could have the same name (Alice Smith and Alice Jones). A primary key must be guaranteed unique — hence the use of generated IDs (StudentID: 101, 102, 103...).

**Choosing a good primary key:**
- StudentID (auto-generated number) — excellent
- Email address — could work (unique) but changes are problematic
- National Insurance number — unique but sensitive data
- Name — poor choice (duplicates possible)

### Foreign Key

A **foreign key** is a field in one table that contains the **primary key from another table**, creating a **link** (relationship) between the two tables.

**Example — linking Students to Teachers:**

**Students table:**

| StudentID | Name | TeacherID |
|---|---|---|
| 101 | Alice | T01 |
| 102 | Bob | T01 |
| 103 | Charlie | T02 |

**Teachers table:**

| TeacherID | TeacherName | Email |
|---|---|---|
| T01 | Mr Smith | smith@school.ac.uk |
| T02 | Ms Jones | jones@school.ac.uk |

- `TeacherID` in the Students table is a **foreign key** — it references the primary key (`TeacherID`) in the Teachers table
- This is how the two tables are linked — to find Alice's teacher's email, follow the TeacherID link from her record to the Teachers table

---

## Section 3: Data Validation and Verification

### Validation

**Validation** is automated checking that data entered is **acceptable, sensible, and within expected parameters**. It is performed by the system before the data is stored.

**Important:** validation checks that data is **reasonable** — it does not guarantee the data is **correct**. A person could enter the wrong (but valid) date of birth.

### Validation Types

| Validation Type | What It Checks | Example |
|---|---|---|
| Presence check | The field cannot be left empty | StudentID must not be blank |
| Range check | The value must be within a specified minimum and maximum | Age must be between 5 and 110 |
| Format check | The data must match a specified pattern | Date must be in format DD/MM/YYYY; postcode must match UK pattern |
| Type check | The data must be the correct data type | Age must be an integer, not text; price must be a decimal |
| Length check | The data must be within a specified character limit | Password must be 8–20 characters; name must not exceed 50 characters |
| Lookup check | The value must exist in a predefined list | Subject must be one of: Computing, Science, History, Geography, Maths |

### Verification

**Verification** is checking that data has been entered **accurately** — that it matches the original source document exactly. This is a human-controlled process, unlike automated validation.

**Verification methods:**

| Method | How It Works |
|---|---|
| Double data entry | Data is entered twice (often by two different people); the system compares both entries and flags any differences |
| Proofreading | A human reads the entered data and compares it against the original document |
| Visual check | The data entry person checks the screen before submitting |

### Validation vs Verification — Key Distinction

| Aspect | Validation | Verification |
|---|---|---|
| What it checks | Is the data reasonable/within rules? | Is the data an accurate copy of the source? |
| Who performs it | The computer system (automated) | A human (or double-entry system) |
| What it catches | Wrong data type, out-of-range, wrong format | Typos, transpositions, copying errors |
| Example | Age = -5 is rejected as out of range | A student's actual age is 15 but 51 was typed |

**Can validation detect wrong-but-valid data?** No. If a student is 15 but the user types 16 by mistake, range check (5–110) will accept 16 as valid. Only verification (proofreading) would catch this.

---

## Section 4: SQL — Structured Query Language

SQL (pronounced "sequel") is the standard language for interacting with relational databases. At KS3, you need to understand how to **retrieve data** using SELECT queries.

### Core SQL Keywords

| Keyword | Purpose | Example |
|---|---|---|
| `SELECT` | Specifies which fields to display | `SELECT Name, Age` |
| `SELECT *` | Select ALL fields | `SELECT *` |
| `FROM` | Specifies which table to query | `FROM Students` |
| `WHERE` | Filters records to only show those matching a condition | `WHERE Age > 14` |
| `ORDER BY` | Sorts results by a specified field | `ORDER BY Name` |
| `ASC` | Sort in ascending order (A→Z, 0→9) — default | `ORDER BY Name ASC` |
| `DESC` | Sort in descending order (Z→A, 9→0) | `ORDER BY Age DESC` |
| `AND` | Both conditions must be true | `WHERE Age > 14 AND Subject = "Computing"` |
| `OR` | At least one condition must be true | `WHERE Subject = "Computing" OR Subject = "Science"` |

### SQL Syntax Structure

```sql
SELECT  field1, field2, field3
FROM    TableName
WHERE   condition1 AND/OR condition2
ORDER BY fieldName ASC/DESC;
```

### Fully Annotated SQL Example

```sql
SELECT Name, Age
FROM Students
WHERE Age > 14 AND Subject = "Computing"
ORDER BY Name ASC;
```

**Line-by-line explanation:**

```
SELECT Name, Age         -- Show only the Name and Age columns (not StudentID, Subject, etc.)
FROM Students            -- Look in the Students table
WHERE Age > 14           -- Only include records where Age is greater than 14...
  AND Subject = "Computing"  -- ...AND where Subject is exactly "Computing"
ORDER BY Name ASC;       -- Sort the results alphabetically by Name (A first)
```

**Applying this query to our sample table:**

| StudentID | Name | Age | Subject | YearGroup |
|---|---|---|---|---|
| 101 | Alice | 15 | Computing | 10 |
| 102 | Bob | 14 | Computing | 9 |
| 103 | Charlie | 15 | Science | 10 |
| 104 | Diana | 13 | History | 8 |
| 105 | Ed | 14 | Computing | 9 |

- Bob (Age 14): fails `Age > 14` — excluded
- Diana (Age 13, History): fails both conditions — excluded
- Charlie (Science): fails `Subject = "Computing"` — excluded
- Ed (Age 14): fails `Age > 14` — excluded
- Alice (Age 15, Computing): passes both — included

**Result:**

| Name | Age |
|---|---|
| Alice | 15 |

*(Only Alice matches. If there were more Computing students over 14, they would be listed alphabetically.)*

### More SQL Examples

**Select all students in Year 9:**
```sql
SELECT *
FROM Students
WHERE YearGroup = 9;
```

**Select names of students studying History or Geography, sorted by age (oldest first):**
```sql
SELECT Name
FROM Students
WHERE Subject = "History" OR Subject = "Geography"
ORDER BY Age DESC;
```

**Select all students under 15 in Year 8:**
```sql
SELECT Name, Age, Subject
FROM Students
WHERE Age < 15 AND YearGroup = 8;
```

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Data | Raw, unprocessed facts with no context |
| Information | Data given context and meaning so it can be interpreted |
| Database | An organised, structured collection of data |
| Flat-file database | All data in a single table; suffers from redundancy and update anomalies |
| Relational database | Data across multiple linked tables; reduces redundancy |
| Table | A grid of rows and columns storing data about one entity type |
| Field | A single column — one attribute or property of an entity |
| Record | A single row — all data about one entity |
| Primary key | Field that uniquely identifies each record; must be unique and not null |
| Foreign key | Field in one table holding the primary key of another table, creating a relationship |
| Data redundancy | The same data stored multiple times in different places |
| Update anomaly | Inconsistency caused by updating data in one place but not all places it is stored |
| Validation | Automated system check that entered data is acceptable/within rules |
| Verification | Human-based check that entered data accurately matches the source document |
| Presence check | Validation ensuring a field is not left empty |
| Range check | Validation ensuring a value is within specified minimum and maximum |
| Format check | Validation ensuring data matches a required pattern |
| Type check | Validation ensuring data is the correct data type |
| SQL | Structured Query Language — the standard language for querying relational databases |
| SELECT | SQL keyword specifying which fields to display |
| FROM | SQL keyword specifying which table to query |
| WHERE | SQL keyword filtering results to records matching a condition |
| ORDER BY | SQL keyword sorting results by a specified field |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "A database is just a spreadsheet" | A spreadsheet stores flat-file data in one sheet. A relational database has multiple linked tables, enforces data types, supports complex queries, handles millions of records efficiently, and includes primary/foreign key relationships. |
| "The primary key can repeat as long as most values are unique" | No. The primary key must be unique for EVERY record with no exceptions. Even one duplicate defeats the purpose — you can no longer uniquely identify a specific record. |
| "WHERE and ORDER BY do the same thing" | WHERE filters which records are included in the results. ORDER BY sorts the records that have already been selected. They are completely different operations. |
| "Validation proves the data is correct" | Validation only proves data is within acceptable parameters (e.g. age is between 5 and 110). It cannot detect errors that are within range — entering age 16 when the real age is 15 would pass validation. |
| "SQL can only be used to select/retrieve data" | SQL also includes commands for inserting new records (INSERT), updating existing records (UPDATE), deleting records (DELETE), and creating/modifying table structures (CREATE, ALTER, DROP). At KS3 we focus on SELECT. |

---

## Exam-Style Questions

**Q1 [2 marks]**
Explain what is meant by a **primary key** in a database table.

**Q2 [2 marks]**
Describe **one** difference between **validation** and **verification** of data.

**Q3 [3 marks]**
Write an SQL query that selects the `Name` and `Age` of all students who are over 14 years old, sorted alphabetically by name. Use the `Students` table.

**Q4 [4 marks]**
Look at the `Students` table below.

| StudentID | Name | Age | Subject | YearGroup |
|---|---|---|---|---|
| 101 | Alice | 15 | Computing | 10 |
| 102 | Bob | 14 | Computing | 9 |
| 103 | Charlie | 15 | Science | 10 |

(a) Identify the **primary key** in this table. [1 mark]
(b) Identify **one** field that would benefit from a **range check** validation and explain what the range check would do. [2 marks]
(c) Identify **one** type of validation that would be applied to the `StudentID` field. [1 mark]

**Q5 [6 marks]**
Compare flat-file databases with relational databases. Your answer should refer to:
- how data is stored
- data redundancy
- what happens when data needs to be updated
- which is more suitable for a school with 2000 students and 150 teachers

**MCQ**
Which SQL keyword is used to filter records in a query?

A) SELECT
B) ORDER BY
C) FROM
D) WHERE

**Fill in the blanks**
A __________ key uniquely identifies each record in a table. A __________ key in one table links to the primary key in another table, creating a relationship. __________ validation checks that a field is not left empty. In SQL, the __________ keyword is used to specify which table to search, and the __________ keyword sorts the results.

---

## Model Answers

**Q1:** A primary key is a field in a database table that uniquely identifies each record (1). No two records in the table can have the same primary key value, and the field cannot be empty/null (1). **[2 marks]**

**Q2:** Validation is an automated system check that data is within acceptable rules/parameters (e.g. checking a number is within a given range) (1). Verification is checking that the data entered is an accurate copy of the original source — typically done by a human (e.g. proofreading or double data entry) (1). **[2 marks]**

**Q3:**
```sql
SELECT Name, Age
FROM Students
WHERE Age > 14
ORDER BY Name ASC;
```
Award marks for: correct SELECT fields (1), correct WHERE condition (1), correct ORDER BY (1). Penalise but do not withhold all marks for minor syntax issues if intent is clear. **[3 marks]**

**Q4:**
(a) `StudentID` — it is unique for every student and identifies each record. **[1 mark]**
(b) `Age` — a range check would ensure that the age entered is between a sensible minimum (e.g. 11) and maximum (e.g. 18 for a school context), rejecting values like -5 or 200 as impossible. **[2 marks: 1 for identifying field, 1 for explaining what the check does]**
(c) Presence check (the StudentID cannot be empty/null) OR type check (must be an integer). **[1 mark]**

**Q5:** Award 1 mark per valid point, up to 6 marks:
- Flat-file: all data in one table; relational: data spread across multiple linked tables.
- Flat-file has high data redundancy — teacher data would be repeated in every student record; relational stores each teacher's data once in a Teachers table.
- In a flat-file, if a teacher changes name, every student record for that teacher must be updated (update anomaly); in a relational database, only one record in the Teachers table is updated.
- Flat-file may suffer from inconsistency if some rows are updated and others are not; relational is consistent because each fact is stored in only one place.
- For a school with 2000 students and 150 teachers, a relational database is more suitable because it eliminates redundancy, prevents update anomalies, and scales efficiently to this volume of data.

**MCQ:** D — WHERE

**Fill in the blanks:** primary / foreign / Presence / FROM / ORDER BY

---

## Revision Checklist

- [ ] I can explain the difference between data and information with an example
- [ ] I can describe what a flat-file database is and state two problems with it
- [ ] I can explain what a relational database is and state two advantages over flat-file
- [ ] I can define: table, field, record
- [ ] I can explain what a primary key is and why names are often poor choices
- [ ] I can explain what a foreign key is and how it links two tables
- [ ] I can describe six types of validation with examples
- [ ] I can explain the difference between validation and verification
- [ ] I can write a SQL SELECT query using SELECT, FROM, WHERE, and ORDER BY
- [ ] I can use AND/OR to combine conditions in a WHERE clause
- [ ] I can trace through a SQL query on a given table and identify the output
- [ ] I can explain the difference between SELECT * and SELECT specific fields
- [ ] I can identify the primary key, foreign key, and validation rules in a given table

## KS3 Computing — Debugging & Testing

- Pack ID: `ks3_computing_debugging_testing`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_debugging_testing/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_debugging_testing/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Debugging & Testing
**Year 7–9 | Programming Fundamentals | UK National Curriculum**

---

## Overview

Writing code that runs without errors is only the beginning. The harder skill is writing code that runs **correctly** — producing the right output for every possible input. All programmers, regardless of experience, write buggy code. The difference between novice and expert programmers is not that experts never make mistakes; it is that experts have systematic strategies for finding, classifying, and fixing those mistakes efficiently.

**Debugging** is the process of finding and correcting errors (bugs) in a program. **Testing** is the process of running a program with carefully chosen inputs to verify that it behaves correctly. These two activities are deeply related: good testing reveals bugs, and systematic debugging fixes them.

Understanding the three categories of programming errors — syntax, runtime, and logic — is fundamental. Each type requires a different debugging strategy, and identifying which type you are dealing with is the first step to fixing it. Equally important is understanding what "good testing" means: it is not enough to test one example that works; you must test the boundaries and the edge cases where programs most commonly fail.

---

## Section 1: Types of Errors

### Syntax Errors

A **syntax error** occurs when the code breaks the grammatical rules of the programming language. The program **cannot run at all** — the interpreter or compiler rejects it before execution begins.

Syntax errors are the easiest to find because Python tells you exactly where they occur, and modern IDEs highlight them before you even run the program.

**Common causes of syntax errors:**
- Missing colon after `if`, `elif`, `else`, `for`, `while`, `def`
- Misspelling a keyword (`whlie` instead of `while`)
- Mismatched or missing brackets/parentheses
- Missing closing quote on a string
- Incorrect indentation (Python-specific)

**Examples:**

```python
# SYNTAX ERROR — missing colon
if score > 50
    print("Pass")

# SYNTAX ERROR — misspelled keyword
whlie count < 10:
    count = count + 1

# SYNTAX ERROR — missing closing bracket
print("Hello"
```

**How detected:** Python will not run the program; it shows a `SyntaxError` message with a line number.

### Runtime Errors

A **runtime error** (also called an exception) occurs when the program is syntactically correct and starts running, but **crashes during execution** due to an illegal operation.

**Common causes of runtime errors:**
- Division by zero (`ZeroDivisionError`)
- Accessing a list index that does not exist (`IndexError`)
- Using a variable before it is defined (`NameError`)
- Adding a string and an integer without conversion (`TypeError`)
- Converting a non-numeric string to an integer (`ValueError`)

**Examples:**

```python
# RUNTIME ERROR — division by zero
result = 10 / 0      # ZeroDivisionError

# RUNTIME ERROR — index out of range
myList = [1, 2, 3]
print(myList[5])     # IndexError: list index out of range

# RUNTIME ERROR — wrong type
age = int("hello")   # ValueError: invalid literal for int()
```

**How detected:** The program starts, runs some code, then crashes with an error message and traceback.

### Logic Errors

A **logic error** occurs when the program runs without crashing but produces **incorrect output** due to a mistake in the algorithm or conditions. Logic errors are the hardest to find because Python gives no error message — the program appears to work fine.

**Common causes of logic errors:**
- Using `=` instead of `==` in a comparison
- Wrong operator (`AND` instead of `OR`, `>` instead of `>=`)
- Off-by-one in a loop (`< 10` instead of `<= 10`)
- Incorrect formula
- Actions in the wrong order

**Examples:**

```python
# LOGIC ERROR — wrong operator
score = 75
if score = 75:        # This is actually a syntax error in Python,
    print("Pass")     # but conceptually represents the = vs == confusion

# LOGIC ERROR — off-by-one
for i in range(1, 10):     # Should be range(1, 11) to count 1–10
    print(i)               # Only prints 1–9

# LOGIC ERROR — incorrect formula
average = total + count    # Should be total / count
```

**How detected:** Only by careful testing with known inputs and comparing actual output to expected output. Trace tables help.

---

## Section 2: Debugging Strategies

### 1. Manual Tracing (Trace Tables)

Work through the code line by line, recording the value of every variable at each step. This is the most reliable method for finding logic errors.

```
Track: what is the value of each variable AFTER each line executes?
Does it match what you expected?
Where does the value first become wrong?
```

### 2. Print Statement Debugging

Insert `print()` statements at key points in the program to display variable values as the program runs. This helps pinpoint where a value first goes wrong.

```python
def calculate_total(prices):
    total = 0
    for price in prices:
        print("Before:", total, "Adding:", price)   # debug print
        total = total + price
        print("After:", total)                       # debug print
    return total
```

Remove debug prints once the bug is fixed.

### 3. IDE Debugger

Most IDEs (e.g., Thonny, VS Code) have a built-in debugger that allows you to:
- **Step through** code one line at a time
- **Watch variables** — see their values update in real time
- Set **breakpoints** — pause execution at a specific line

---

## Section 3: Testing

Testing is the systematic process of running a program with specific inputs to verify it produces the correct outputs.

### Why Testing Matters

- Reveals bugs that static code reading misses.
- Confirms the program works for the full range of expected inputs.
- Especially important at the boundaries where programs most frequently fail.

**Important:** Testing can demonstrate the presence of bugs, but it can never prove a program is completely bug-free. There are always input combinations you have not tested.

### Types of Test Data

| Test Type | Description | Purpose |
|---|---|---|
| **Normal** | Typical, valid inputs that the program is designed to handle | Confirms the program works under expected conditions |
| **Boundary** | Values at the very edge of the valid input range — the minimum, maximum, and values just outside | Tests where programs most commonly fail (off-by-one errors, `>=` vs `>`) |
| **Erroneous** | Invalid inputs the program should reject or handle gracefully | Confirms the program does not crash or produce nonsense when given bad data |

### Boundary Testing in Detail

For a program that accepts ages between 11 and 18, boundary test data should include:

| Input | Category | Expected Behaviour |
|---|---|---|
| 10 | Boundary (just below min) | Rejected — "Invalid age" |
| 11 | Boundary (minimum valid) | Accepted |
| 14 | Normal | Accepted |
| 18 | Boundary (maximum valid) | Accepted |
| 19 | Boundary (just above max) | Rejected — "Invalid age" |
| -5 | Erroneous | Rejected |
| "abc" | Erroneous | Rejected or handled gracefully |

**Why both sides of the boundary?** A condition written as `age > 11` instead of `age >= 11` would incorrectly reject 11. Testing with 11 reveals this bug; testing only with 14 would not.

### Test Table

A **test table** documents planned tests and records whether they passed or failed.

| Test # | Test Type | Input | Expected Output | Actual Output | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Normal | age = 15 | "Valid age" | "Valid age" | Pass |
| 2 | Boundary | age = 11 | "Valid age" | "Invalid age" | Fail |
| 3 | Boundary | age = 18 | "Valid age" | "Valid age" | Pass |
| 4 | Boundary | age = 10 | "Invalid age" | "Invalid age" | Pass |
| 5 | Erroneous | age = "hello" | Error message | Program crashes | Fail |

When a test fails, you examine the actual output, identify the bug, fix the code, and re-run the test.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Bug | An error in a program that causes it to behave incorrectly |
| Debugging | The process of finding and correcting errors in a program |
| Syntax error | An error caused by code that breaks the grammatical rules of the language; the program will not run |
| Runtime error | An error that occurs during program execution, causing it to crash (e.g., division by zero) |
| Logic error | An error where the program runs without crashing but produces incorrect output due to a flaw in the algorithm |
| Testing | Running a program with specific inputs to verify that it produces the correct outputs |
| Test data | The inputs used when testing a program |
| Normal test data | Typical, valid inputs that represent expected everyday use |
| Boundary test data | Inputs at the edge of the valid range, including the minimum, maximum, and values just outside |
| Erroneous test data | Invalid inputs that the program should reject or handle without crashing |
| Test table | A structured table documenting test inputs, expected outputs, actual outputs, and pass/fail results |
| Trace table | A table used to manually track variable values as each line of a program executes |
| Exception | Python's term for a runtime error (e.g., `ZeroDivisionError`, `TypeError`) |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| Syntax errors are the most serious type | Syntax errors are the **easiest** to find and fix — Python tells you exactly where they are. Logic errors are far more dangerous because they are invisible: the program runs but gives wrong answers. |
| Testing proves that a program is correct | Testing can reveal bugs, but it cannot **prove** correctness. There are always untested input combinations. |
| Normal test data is enough | Normal data only tests the typical case. Boundary data is where programs most commonly fail. Erroneous data tests robustness. All three types are needed. |
| Runtime errors are always the programmer's fault | Some runtime errors arise from unexpected user input (e.g., user types letters when a number is expected). Good programs anticipate and handle these gracefully. |
| A program that runs without crashing is correct | A program can run to completion and still produce wrong answers (a logic error). Correct execution is not the same as correct output. |
| You only need to test once | Testing should be re-run after every code change. A fix for one bug might introduce a new bug elsewhere. |
| Indentation errors are logic errors | Incorrect indentation in Python causes either a **syntax error** (IndentationError) or changes which block a statement belongs to, making it a **logic error** if the program still runs. |

---

## Diagrams / Code Examples

### Error Type Comparison Table

| Feature | Syntax Error | Runtime Error | Logic Error |
|---|---|---|---|
| Program runs? | No | Starts, then crashes | Yes, runs fully |
| Error message? | Yes (before running) | Yes (during running) | No |
| Detected by | IDE / Python before run | Python during execution | Careful testing only |
| Example | Missing `:` after `if` | Division by zero | Wrong operator in condition |
| How to find | IDE highlights it | Read the traceback | Trace table, test table |
| Difficulty to find | Easy | Medium | Hard |

### Buggy Code Example — All Three Error Types

```python
# Program to classify a score as Pass, Merit, or Distinction

score = int(input("Enter score: "))    # Line 1

if score >= 70                         # Line 2 — SYNTAX ERROR: missing colon
    grade = "Distinction"
elif score >= 50:
    grade = "Merit"
else:
    grade = "Pass"

percentage = score / 0                 # Line 9 — RUNTIME ERROR: division by zero

if score >= 50 AND score <= 69:        # Line 11 — SYNTAX ERROR: AND not valid Python (use 'and')
    result = "Merit range"

average = score + 100                  # Line 13 — LOGIC ERROR: should be score / 100

print("Grade:", grade)
print("Percentage:", percentage)
```

**Identified errors:**
1. Line 2: Syntax error — missing `:` after the `if` condition.
2. Line 9: Runtime error — `ZeroDivisionError` (divides by 0).
3. Line 11: Syntax error — `AND` should be `and` (Python is lowercase).
4. Line 13: Logic error — `score + 100` should be `score / 100` to compute a percentage.

### Test Table: Age Validation Program

Program validates age for a school (must be 11–18 inclusive):

```python
age = int(input("Enter age: "))
if age >= 11 and age <= 18:
    print("Valid age")
else:
    print("Invalid age")
```

| Test # | Type | Input | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Normal | 15 | "Valid age" | "Valid age" | Pass |
| 2 | Boundary (min) | 11 | "Valid age" | "Valid age" | Pass |
| 3 | Boundary (max) | 18 | "Valid age" | "Valid age" | Pass |
| 4 | Boundary (below min) | 10 | "Invalid age" | "Invalid age" | Pass |
| 5 | Boundary (above max) | 19 | "Invalid age" | "Invalid age" | Pass |
| 6 | Erroneous | -1 | "Invalid age" | "Invalid age" | Pass |
| 7 | Erroneous | "abc" | Error message | Program crashes | Fail |

Test 7 fails — the program crashes when the user enters text because `int("abc")` raises a `ValueError`. A fix would wrap the `int()` call in error handling.

### Debugging with Print Statements

```python
# Finding a logic error in a sum program

def sum_to_n(n):
    total = 0
    for i in range(1, n):           # Bug: should be range(1, n+1)
        print(f"i={i}, total={total}")   # Debug print
        total = total + i
    return total

print(sum_to_n(5))   # Expected: 15, Actual: 10
```

The debug prints reveal that the loop stops at `i=4` instead of `i=5`. The fix is `range(1, n+1)`.

---

## Exam-Style Questions

**Q1** [1 mark]
The following line of Python code produces an error. State the type of error and explain why.

```python
if score > 50
    print("Pass")
```

---

**Q2** [2 marks]
Explain the difference between a **runtime error** and a **logic error**. Give one example of each.

---

**Q3** [3 marks]
A program accepts a user's age and prints a message. The valid age range is 5 to 16 inclusive.

Design a test plan showing one example of each of the three types of test data (normal, boundary, erroneous). Present your answer as a table with columns: Test Type, Input, Expected Output.

---

**Q4** [3 marks]
Identify and classify **two** errors in the following code, and write the corrected version of each line.

```python
count = 0
while count < 5
    count = count + 1
print("Total" + count)
```

---

**Q5** [4 marks]
A student writes the following program to find the average of three numbers:

```python
a = int(input("Number 1: "))
b = int(input("Number 2: "))
c = int(input("Number 3: "))
total = a + b + c
average = total + 3
print("Average:", average)
```

a) The program produces incorrect output. State the type of error. [1 mark]
b) Identify the specific line containing the error and explain what is wrong. [1 mark]
c) Write the corrected line of code. [1 mark]
d) Design a test table with three tests (normal, boundary involving 0, erroneous) to verify the corrected program. [1 mark]

---

**Q6** [2 marks]
Explain why **boundary test data** is particularly important when testing a program. Use an example to support your answer.

---

**MCQ** [1 mark]
Which type of error causes a program to produce incorrect results without showing any error message?

A) Syntax error
B) Runtime error
C) Logic error
D) Indentation error

---

**Fill in the blank** [1 mark]
A test that uses an input of 0 for a program that accepts numbers from 1 to 100 would be classified as `________` test data.

---

## Model Answers

**Q1:** Syntax error [1] — there is a missing colon (`:`) at the end of the `if` statement. Python requires a colon to end every `if`, `elif`, `else`, `for`, `while`, and `def` statement. The program will not run at all. [accept: missing colon identified]

**Q2:**
A **runtime error** occurs when a syntactically correct program crashes during execution due to an illegal operation. Example: dividing by zero (`10 / 0` causes a `ZeroDivisionError`). [1]
A **logic error** occurs when a program runs to completion without crashing but produces incorrect output due to a flaw in the algorithm. Example: writing `total * 3` instead of `total / 3` to calculate an average — the program runs but gives the wrong answer. [1]

**Q3:**

| Test Type | Input | Expected Output |
|---|---|---|
| Normal | 10 | Age accepted / valid message |
| Boundary | 5 (minimum valid) | Age accepted |
| Boundary | 16 (maximum valid) | Age accepted |
| Boundary | 4 (just below min) | Age rejected / invalid |
| Erroneous | "hello" / -1 | Error message or rejection |

[1 per correct type with appropriate input and expected output, max 3]

**Q4:**
- Error 1: Line 2 — `while count < 5` is missing a colon. Type: **syntax error**. Correction: `while count < 5:` [1]
- Error 2: Line 4 — `"Total" + count` attempts to concatenate a string and an integer. Type: **runtime error** (TypeError). Correction: `print("Total " + str(count))` or `print("Total", count)` [1]
- No logic errors present once the above are fixed [1 for correct classification of both]

**Q5:**
a) Logic error [1]
b) Line 5: `average = total + 3` — uses `+` (addition) instead of `/` (division), so it adds 3 to the total rather than dividing to find the mean. [1]
c) `average = total / 3` [1]
d)

| Test Type | Input | Expected Output |
|---|---|---|
| Normal | 6, 9, 12 | Average: 9.0 |
| Boundary (0) | 0, 0, 0 | Average: 0.0 |
| Erroneous | "abc", 5, 7 | Error / program should handle non-numeric input |

[1 for a reasonable table with all three types present]

**Q6:** Boundary test data is important because programs most often fail at the edges of their valid input range, not in the middle. [1] For example, a condition written as `age > 11` instead of `age >= 11` would incorrectly reject the value 11. Testing with a normal value like 14 would not reveal this bug, but testing with the boundary value 11 would. Both the boundary itself and the value just outside it must be tested. [1]

**MCQ:** C — Logic error [1]

**Fill in the blank:** boundary [1]
(0 is just below the minimum value of 1, making it a boundary test)

---

## Revision Checklist

- [ ] I can define all three types of programming error: syntax, runtime, and logic.
- [ ] I can give an example of each type of error and explain how it is detected.
- [ ] I understand that a syntax error prevents the program from running at all.
- [ ] I understand that a runtime error causes the program to crash during execution.
- [ ] I understand that a logic error produces wrong output but no error message.
- [ ] I can classify a given error as syntax, runtime, or logic, and justify my classification.
- [ ] I can describe three debugging strategies: manual tracing, print statements, and IDE debugger.
- [ ] I can define normal, boundary, and erroneous test data and explain the purpose of each.
- [ ] I can design a test table with appropriate columns: test type, input, expected output, actual output, pass/fail.
- [ ] I can explain why boundary data must include values both at and just outside the valid range.
- [ ] I can design a complete test plan for a given program, including all three types of test data.
- [ ] I understand that testing reveals bugs but does not prove a program is bug-free.
- [ ] I can identify errors in a given piece of code, classify each one, and write the corrected code.
- [ ] I can explain why a program that runs without crashing is not necessarily correct.

## KS3 Computing — Decomposition & Abstraction

- Pack ID: `ks3_computing_decomposition_abstraction`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_decomposition_abstraction/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_decomposition_abstraction/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Decomposition & Abstraction
**Year 7–9 | Computational Thinking | UK National Curriculum**

---

## Overview

Computational thinking is a set of problem-solving skills used by computer scientists. It has four pillars:

1. **Decomposition** — breaking a complex problem into smaller parts
2. **Abstraction** — removing unnecessary detail to focus on what matters
3. **Pattern recognition** — identifying similarities and repeating structures
4. **Algorithm design** — creating step-by-step solutions

This pack focuses on **decomposition** and **abstraction** — the two pillars that form the foundation of how programmers approach any large project.

---

## Section 1: Decomposition

### What is decomposition?

**Decomposition** means breaking a large, complex problem into smaller, more manageable **sub-problems**. Each sub-problem is easier to understand, solve, and test than the original problem.

Think of it like building a house. You would not try to build the entire house in one step. Instead, you would break the project into tasks: lay the foundations, build the walls, install the roof, fit the windows, and so on. Each task can be worked on separately and by different people.

### Why is decomposition useful?

- **Easier to understand**: a large problem can be overwhelming; sub-problems are approachable
- **Divide and conquer**: different people (or different parts of a program) can work on different sub-problems simultaneously
- **Easier to test**: smaller components can be tested individually
- **Easier to maintain**: if one part goes wrong, only that part needs fixing
- **Reusable**: a solved sub-problem can be reused in other projects

### Real-world example: Building a website

Imagine you are asked to build a school website. The full problem is huge, so you decompose it:

```
Build School Website
├── Design the layout
│   ├── Choose colours and fonts
│   └── Create page structure
├── Write the content
│   ├── Home page text
│   ├── About page text
│   └── Contact details
├── Build the navigation menu
├── Create the image gallery
└── Test on different devices
```

Each branch is a sub-problem that can be tackled separately.

### Real-world example: Planning a school trip

```
Organise School Trip
├── Choose a destination
├── Book transport
│   ├── Research coach companies
│   └── Book and confirm
├── Manage finance
│   ├── Calculate costs per student
│   └── Collect payments
├── Prepare risk assessment
└── Send permission letters to parents
```

### How decomposition leads to modular programs

In programming, decomposition is implemented through **subroutines** (functions and procedures). Instead of writing one enormous block of code, a programmer writes separate, named blocks, each solving one sub-problem.

```pseudocode
CALL getStudentData()
CALL calculateAverageScore()
CALL displayResults()
```

Each `CALL` triggers a separate subroutine. The main program is clean and readable. Each subroutine can be written and tested independently.

---

## Section 2: Abstraction

### What is abstraction?

**Abstraction** means removing unnecessary detail from a representation so that only the relevant information remains. It is about creating a simplified model of something real.

The key insight: you do not need to understand every detail of a system to use it effectively. A driver does not need to understand the engine's fuel injection system to drive a car. A programmer does not need to know how the CPU physically moves data to write a program.

### Abstraction vs. simplification

These are related but different:

- **Simplification** makes something easier by reducing complexity overall
- **Abstraction** selectively removes detail that is **not relevant to the current task** while keeping detail that **is**

A map is a classic example of abstraction:

| Feature | Real world | Map |
|---|---|---|
| Roads | Physical tarmac, width, surface | Lines on paper |
| Buildings | Brick, glass, 3D structures | Rectangles |
| Elevation | Real hills and valleys | Contour lines or colours |
| Colour | Green grass, brown soil | Simplified zones |
| People | Present on roads | Not shown |

The map abstracts away detail (texture, 3D shape, people) that is irrelevant to navigation, while keeping detail (road connections, distances, landmarks) that matters.

### Real-world examples of abstraction

**Car dashboard**: A driver sees speed, fuel level, and engine temperature. The dashboard abstracts away thousands of sensor readings, mechanical processes, and diagnostic codes — showing only what the driver needs.

**ATM / cash machine**: You interact with a simple touchscreen. Underneath, the machine is performing secure bank authentication, communicating with central servers, physically counting and releasing notes. All of that complexity is hidden — abstracted away.

**Programming variables**: When you write `score = 10`, you are using abstraction. Underneath, the value `10` is stored at a specific memory address in binary. You do not need to know the address or the binary pattern — the variable name `score` abstracts that away.

**Functions/subroutines**: When a programmer calls `calculateTax(income)`, they do not need to know how the calculation works internally. The function's implementation is abstracted away — only the name, inputs, and output matter.

### Abstraction in programming — example

```pseudocode
FUNCTION calculateArea(length, width)
    area ← length * width
    RETURN area
ENDFUNCTION

result ← calculateArea(5, 3)
OUTPUT result
```

The programmer calling `calculateArea(5, 3)` does not need to know how the multiplication works at a hardware level. The function name and parameters are the **interface**; the internal logic is **abstracted**.

---

## Section 3: Decomposition and Abstraction Working Together

These two skills are always used together. Consider building a quiz app:

**Step 1 — Decompose** the problem:
```
Quiz App
├── Load questions from file
├── Display question to user
├── Accept and validate user answer
├── Check answer correctness
├── Update score
└── Display final result
```

**Step 2 — Abstract** within each sub-problem:
- "Load questions from file" hides the file format, encoding, and parsing — the rest of the app just receives a list of questions
- "Display question to user" hides the screen rendering — the rest of the app just calls `displayQuestion(question)`
- "Check answer correctness" hides the comparison logic — the rest of the app just calls `checkAnswer(userAnswer, correctAnswer)`

The result is a program built from clean, independent modules — each doing one job, with unnecessary detail hidden from the rest of the system.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Computational thinking | A structured approach to problem-solving used in computer science, involving decomposition, abstraction, pattern recognition, and algorithm design |
| Decomposition | Breaking a complex problem into smaller, simpler sub-problems |
| Abstraction | Removing unnecessary detail from a problem or model to focus on what is important |
| Sub-problem | A smaller, more manageable problem created by decomposing a larger one |
| Modular design | Designing software as a collection of self-contained, reusable modules (subroutines) |
| Model | A simplified representation of a real-world system that emphasises relevant features |
| Interface | The visible part of a subroutine or system — its name, inputs, and outputs — hiding its internal detail |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| Abstraction means making things vague or artistic | Abstraction is a precise technical skill: selectively removing irrelevant detail while keeping relevant detail |
| Decomposition means splitting code into individual lines | Decomposition splits **problems**, not lines of code. A sub-problem may still involve many lines of code |
| Abstraction hides everything | Only irrelevant detail is hidden. A function still exposes its name, parameters, and return value — the key interface |
| Decomposition and abstraction are the same skill | They are distinct. Decomposition divides problems; abstraction hides detail within each part |
| A well-decomposed program must have many small functions | Quality matters more than quantity. Sub-problems should be logically meaningful, not arbitrarily small |

---

## Real-World Connections

- **Software development**: Large applications (e.g. a social media platform) are decomposed into modules: user authentication, post feed, messaging, notifications — each built and maintained separately
- **Operating systems**: The OS abstracts hardware — a programmer writes `print("Hello")` without worrying about the specific printer model, driver, or serial port protocol
- **APIs**: An application programming interface is abstraction in practice — you call a weather API to get a forecast without understanding how the weather data is collected, stored, or processed
- **Machine learning**: Training an AI model is decomposed into: data collection → data cleaning → model selection → training → evaluation → deployment

---

## Diagrams

### Decomposition Tree: Build a Quiz App

```
                    [Build Quiz App]
                          |
        ┌─────────────────┼─────────────────┐
        |                 |                 |
  [Load Questions]  [Run Quiz Loop]  [Show Results]
        |                 |
  [Parse file]   [Display Question]
  [Store list]   [Get User Answer]
                 [Check & Score]
```

### Abstraction Layers in a Computer System

```
    ┌─────────────────────────────────────┐
    │           USER (You)                │  ← Sees: icons, windows, menus
    ├─────────────────────────────────────┤
    │       APPLICATION SOFTWARE          │  ← Sees: OS functions, file system
    ├─────────────────────────────────────┤
    │         OPERATING SYSTEM            │  ← Sees: hardware instructions
    ├─────────────────────────────────────┤
    │            HARDWARE                 │  ← Physical circuits and electricity
    └─────────────────────────────────────┘
```

Each layer abstracts the layer below it. You never need to think about transistors when you click a button.

---

## Exam-Style Questions

**Q1** [1 mark]
Define the term **decomposition** in computing.

**Q2** [1 mark]
Define the term **abstraction** in computing.

**Q3** [2 marks]
Give two benefits of using decomposition when developing a large software project.

**Q4** [3 marks]
A map is often used as an example of abstraction. Explain what features of the real world have been abstracted away in a map, and why this makes the map more useful than a photograph.

**Q5** [4 marks]
A student is asked to create a program for a school library system. The program needs to:
- Store details of books (title, author, ISBN, availability)
- Allow a librarian to search for a book
- Record when a book is borrowed or returned
- Display overdue books

Decompose this problem into sub-problems. Present your answer as a labelled tree diagram or bulleted hierarchy. Explain the purpose of each sub-problem.

**Q6** [4 marks]
Explain how abstraction is used in the following two programming scenarios. For each, state what detail is being hidden and why.

(a) A function called `sendEmail(recipient, subject, body)` in a large program.

(b) A variable called `playerScore` used throughout a game program.

**MCQ** [1 mark]
Which of the following is the best example of abstraction?

A) Breaking a school timetabling program into modules for each year group
B) Using the variable name `x` instead of a memory address when programming
C) Writing a plan for a program before coding it
D) Testing a program with different inputs

*(Answer: B)*

**Fill in the blank** [1 mark]
Breaking a complex problem into smaller, simpler parts is called ___.

*(Answer: decomposition)*

---

## Model Answers

**Q1**: Decomposition is the process of breaking a complex problem into smaller, simpler sub-problems that are easier to solve individually.

**Q2**: Abstraction is the process of removing unnecessary or irrelevant detail from a problem or model, so that only the important features are represented.

**Q3**: Any two from:
- Smaller sub-problems are easier to understand and solve
- Different programmers can work on different sub-problems simultaneously
- Each sub-problem can be tested independently, making debugging easier
- Completed sub-problems (subroutines) can be reused in other projects
- If one part has a bug, only that part needs to be fixed

**Q4**: A map abstracts away features such as the exact texture of roads, the three-dimensional height of buildings, the colours of individual objects, and the presence of people. These details are irrelevant to navigation. By removing them, the map becomes cleaner and quicker to read. A photograph would show too much irrelevant visual information, making it harder to plan a route or find a location.

**Q5 (model decomposition)**:
```
Library System
├── Book Management
│   ├── Store book details (title, author, ISBN, availability)
│   └── Update availability when borrowed/returned
├── Search
│   └── Search by title, author, or ISBN
├── Borrowing & Returns
│   ├── Record borrow date and student name
│   └── Record return date and update availability
└── Overdue Reports
    └── Compare borrow date to today's date; flag overdue books
```

**Q6**:
(a) `sendEmail(recipient, subject, body)` — the programmer calling this function does not need to know how email is transmitted across the internet (SMTP protocol, server addresses, authentication). The internal process is abstracted away; only the three inputs and the effect (email sent) are visible.

(b) `playerScore` — the programmer uses the name `playerScore` to read and write a value. Underneath, this value is stored at a specific binary memory address. The abstraction (the variable name) hides the memory address and binary storage, allowing the programmer to think in terms of game logic rather than hardware.

---

## Revision Checklist

Before your exam, make sure you can:

- [ ] Define computational thinking and name its four pillars
- [ ] Define decomposition and give a real-world example
- [ ] Explain two benefits of decomposition when writing a program
- [ ] Define abstraction and explain what "removing irrelevant detail" means
- [ ] Give two real-world examples of abstraction (e.g. map, car dashboard)
- [ ] Explain how a function / subroutine uses abstraction
- [ ] Decompose a given problem into sub-problems using a tree or list
- [ ] Distinguish between decomposition and abstraction in a given scenario
- [ ] Explain how abstraction and decomposition are used together

## KS3 Computing — Environmental & Social Impact

- Pack ID: `ks3_computing_environmental_social_impact`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_environmental_social_impact/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_environmental_social_impact/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Environmental & Social Impact of Technology
**Year 7–9 | Impact of Technology | UK National Curriculum**

---

## Overview

Technology shapes society and the natural world in profound ways — for better and for worse. This pack takes a balanced, evidence-based view of both the environmental costs (energy consumption, e-waste, mining) and benefits (smart grids, dematerialisation), and the social impacts — positive (access to education, telemedicine) and negative (digital divide, health effects, misinformation). It also covers the concept of your **digital footprint** — the permanent trail of data you leave online.

---

## Section 1: Environmental Impact of Technology

### Negative Environmental Impacts

#### Energy Consumption of Data Centres

Every time you stream a video, send an email, or load a web page, that data is processed and stored in a **data centre** — vast warehouses filled with servers running 24 hours a day, 7 days a week.

**The scale:**
- Global data centres consume approximately **1–2% of the world's electricity**
- This is equivalent to the electricity consumption of entire countries
- This electricity generation produces significant **CO₂ emissions** — contributing to climate change
- A single Google search uses roughly the same energy as turning on a 60-watt lightbulb for a few seconds
- Streaming HD video for one hour uses approximately as much energy as boiling a kettle several times
- Data centres require enormous amounts of water for cooling

**Key point:** cloud services feel weightless and invisible, but they have a real, physical energy footprint.

#### Carbon Footprint of Manufacturing

The environmental impact of technology does not begin when you turn it on — **manufacturing** is itself highly energy-intensive.

- Producing a single smartphone generates approximately **70 kg of CO₂ equivalent** during manufacture — before it is ever used
- Manufacturing requires mining of raw materials, high-temperature smelting and refining, precision electronics manufacturing (often in highly energy-intensive "clean room" environments), and global shipping
- A smartphone is typically replaced every 2–3 years, multiplying this manufacturing footprint per user per decade

#### E-Waste (Electronic Waste)

**E-waste** is discarded electronic equipment — old phones, laptops, TVs, cables, printers, and batteries.

**The statistics:**
- More than **50 million tonnes** of e-waste are generated globally every year — a weight greater than all commercial aircraft ever built
- The UK generates approximately **25 kg of e-waste per person per year** — among the highest in Europe
- Less than **20% of global e-waste** is formally collected and recycled through proper channels

**Why e-waste is dangerous:**
- Electronics contain **toxic materials**: lead (in solder), mercury (in screens), cadmium (in batteries), arsenic, and brominated flame retardants
- When e-waste is dumped in landfill or informally processed (burning cables to recover copper), these toxins leach into soil and groundwater
- Much of the world's e-waste is exported to developing countries, where informal workers — often children — dismantle electronics by hand in hazardous conditions

**What should happen:** proper recycling through certified e-waste recyclers; manufacturers designing products for disassembly and repair; "right to repair" legislation.

#### Rare Earth Minerals

Modern electronics depend on **rare earth minerals** and critical materials — many of which are difficult to mine and process sustainably:

- **Lithium and cobalt**: in rechargeable batteries (phones, laptops, electric vehicles)
- **Neodymium**: in speakers and hard drive magnets
- **Indium and gallium**: in touchscreens
- **Tantalum**: in capacitors

**Environmental concerns:** mining these minerals clears forests, generates toxic waste water, and contaminates local ecosystems. Many deposits are in environmentally sensitive or geopolitically unstable regions.

### Positive Environmental Impacts

#### Smart Energy Grids

AI and computing technology can **optimise the distribution of electricity** across the national grid — balancing supply and demand in real time, integrating renewable energy sources (wind, solar), and reducing waste. Smart meters allow consumers and utilities to see and manage energy use in ways not previously possible.

#### Remote Working and Reduced Commuting

Video conferencing and cloud-based collaboration tools (used widely since COVID-19) allow millions of people to work from home. Fewer journeys to work = fewer cars on roads = lower transport emissions. UK transport accounts for approximately 27% of UK greenhouse gas emissions — even a partial reduction is significant.

#### AI-Optimised Transport and Logistics

Route planning algorithms minimise unnecessary journeys and fuel consumption for delivery vehicles. Ride-sharing apps reduce the number of cars making a given trip. AI traffic management systems reduce congestion and therefore engine idling.

#### Dematerialisation

Technology has replaced many physical products:
- Digital books instead of printed books
- Music streaming instead of CDs
- Digital newspapers instead of printed ones
- Video calls instead of air travel for many business meetings

Each of these replaces the manufacturing, transport, and disposal chain of physical products with a digital service — though this comes with its own energy footprint.

### Environmental Impacts Summary Table

| Impact | Negative / Positive | Example | Scale |
|---|---|---|---|
| Data centre energy consumption | Negative | Netflix servers running 24/7 | 1–2% of global electricity |
| Carbon cost of manufacturing | Negative | Smartphone = ~70 kg CO₂ to produce | Per device, multiplied by billions |
| E-waste and toxic landfill | Negative | Old phones in landfill; toxic lead/mercury | 50m+ tonnes/year globally |
| Rare earth mineral mining | Negative | Cobalt mining for batteries | Environmental destruction at mine sites |
| Smart energy grids | Positive | AI balancing wind/solar supply in real time | National/global scale efficiency |
| Remote working | Positive | Video calls replacing commutes | Significant transport emission reduction |
| Dematerialisation | Positive | Streaming replacing CD/DVD manufacturing | Eliminates manufacturing/transport chains |

---

## Section 2: Social Impact of Technology

### Negative Social Impacts

#### The Digital Divide

The **digital divide** is the gap between people who have access to and can use technology effectively, and those who do not.

**Who is affected in the UK:**
- **Elderly people**: less likely to have grown up with technology; may lack skills and confidence; may have physical barriers (vision, dexterity)
- **Low-income households**: unable to afford devices or broadband subscriptions
- **Rural communities**: slower or no broadband; poor mobile signal
- **People with disabilities**: may need assistive technology that is not always available or affordable

**Consequences:**
- Inability to access services now only available online: job applications, Universal Credit, NHS appointment booking, banking
- Educational disadvantage: children without home computers or internet cannot access online learning resources
- Social isolation: unable to use video calls to maintain family connections
- Economic exclusion: jobs increasingly require digital skills

**COVID-19 and the digital divide:** when schools switched to remote learning in 2020, the gap between students with and without home technology became starkly visible. Some students attended no lessons for months.

#### Health Effects

| Effect | Detail |
|---|---|
| Sleep disruption | Blue light from screens suppresses melatonin (the sleep hormone); using phones before bed delays sleep onset |
| Eye strain | Prolonged screen use causes digital eye strain (headaches, blurred vision, dry eyes) |
| Sedentary behaviour | Increased screen time displaces physical activity; contributes to obesity and associated health risks |
| Social media and mental health | Research links heavy social media use in teenagers to increased rates of anxiety, depression, and poor body image, particularly in girls; exposure to "ideal" images and social comparison |
| Cyberbullying | Online harassment can occur 24 hours a day, 7 days a week; anonymity emboldens attackers; difficulty escaping; significant impact on mental health |

#### Misinformation and Echo Chambers

- Social media algorithms optimise for **engagement** — content that provokes strong emotion (outrage, fear) spreads furthest and fastest
- This creates **echo chambers** where users see only content reinforcing their existing beliefs
- False health information (anti-vaccine claims, bogus cures) spread during the COVID-19 pandemic caused real harm
- Deepfakes (AI-generated fake videos of real people) make it increasingly difficult to trust video evidence

#### Cyberbullying

- Unlike face-to-face bullying, cyberbullying occurs **24/7 without physical distance**
- The victim cannot escape it by going home from school
- **Anonymity** enables cruelty that bullies might not show in person
- **Permanence** — screenshots and recordings of humiliating content can be shared indefinitely
- Significant mental health impact, in extreme cases linked to self-harm and suicide

### Positive Social Impacts

#### Access to Education

- Free online learning platforms (Khan Academy, BBC Bitesize, YouTube, Coursera) provide high-quality educational content to anyone with internet access
- Students in remote areas or developing countries can access resources that would otherwise be unavailable
- Adults can retrain and upskill without attending physical classes
- People with disabilities can access education that suits their needs

#### Telemedicine

- Video consultations with GPs and hospital consultants reduce the need for travel — particularly valuable for elderly, disabled, or rural patients
- Remote monitoring (wearable devices sending health data to clinicians) allows earlier intervention
- Mental health services can be accessed from home — reducing stigma and transport barriers

#### Accessibility Technology

Technology makes the world more accessible for people with disabilities:
- **Screen readers**: convert text to speech for visually impaired users
- **Voice control**: allow people with limited mobility to control computers, phones, and smart home devices
- **Live captions**: automatically generate subtitles for deaf or hard-of-hearing users
- **Hearing aid apps**: smartphones can amplify and process sounds
- **Augmentative and Alternative Communication (AAC)** apps: help people who cannot speak to communicate

#### Global Connectivity

- People can maintain close relationships with family and friends across the world via video calls
- International research collaboration is possible without travel
- Humanitarian organisations can coordinate disaster relief rapidly
- Minority communities can maintain cultural connections across geographic distance

### Social Impacts by Group

| Group | Key Challenges | Key Benefits |
|---|---|---|
| Elderly | Digital divide; lack of skills; isolation if excluded | Telemedicine; video calls to family; online shopping/banking |
| Young people | Cyberbullying; social media mental health; screen time | Education resources; communication; career opportunities in tech |
| People with disabilities | Need for affordable assistive technology; inaccessible websites | Screen readers; voice control; captioning; AAC apps |
| Low-income households | Cannot afford devices/broadband; excluded from digital services | Free learning resources when access is available |
| Rural communities | Poor broadband/mobile signal; digital exclusion | Remote working removes need to be near employers; telemedicine |
| Developing countries | Infrastructure gaps; manufacturing workers in poor conditions | Access to education, health information, and global markets |

---

## Section 3: The Digital Footprint

### What is a Digital Footprint?

Your **digital footprint** is the trail of data that your online activity creates. It includes:

**Active digital footprint** (data you knowingly create):
- Social media posts, photos, comments, and likes
- Emails you send
- Blog posts and articles you write
- Reviews you leave on websites
- Information you fill in on forms

**Passive digital footprint** (data collected about you without you actively creating it):
- Your IP address (recorded every time you visit a website)
- Location data from your phone's GPS
- Search history (recorded by search engines)
- Browsing history (recorded by websites via cookies)
- Shopping and viewing history (used for targeted advertising)
- Data collected by apps running in the background

### Why Your Digital Footprint Matters

**It is largely permanent:**
- Even deleted social media posts may be archived by web crawlers
- Screenshots by other users preserve content you have removed
- Companies retain data you have requested deleted (subject to legal challenges)
- The Internet Archive (Wayback Machine) preserves historic versions of websites

**It can affect your future:**
- University admissions tutors and employers routinely search candidates online
- A post made at age 13 may still be findable when you apply for jobs at 21
- Insurance companies may use social media to verify claims
- Posts showing illegal activity or expressing extreme views can have serious consequences

**Targeted advertising:**
- Companies use your browsing and purchase history to serve highly targeted advertisements
- The more data they have, the more precisely they can target — and the more revenue they earn from advertisers

**How to manage your digital footprint:**
- Use privacy settings on social media — limit who sees your posts
- Think before posting — "Would I be happy for a future employer to see this?"
- Use private/incognito browsing to reduce cookie tracking (though this does not make you anonymous)
- Regularly review and delete old content
- Be aware of what apps are collecting (check app permissions)

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Data centre | A facility housing large numbers of servers providing cloud storage and computing services |
| E-waste | Discarded electronic equipment containing toxic materials |
| Rare earth minerals | Materials used in electronics manufacturing, often mined in environmentally damaging ways |
| Dematerialisation | Replacing physical products with digital equivalents (e.g. streaming replacing CDs) |
| Digital divide | The gap between those with and without adequate access to technology |
| Cyberbullying | Using technology to harass, intimidate, or humiliate individuals, often anonymously |
| Digital footprint | The trail of data created by a person's online activity |
| Active digital footprint | Data knowingly created by the user (posts, messages, form submissions) |
| Passive digital footprint | Data collected about the user without their direct input (browsing data, location) |
| Echo chamber | An online environment where users are only exposed to content reinforcing their existing beliefs |
| Misinformation | False or inaccurate information spread — sometimes unintentionally, sometimes deliberately |
| Telemedicine | Delivering healthcare remotely via technology (video consultations, remote monitoring) |
| Assistive technology | Technology that helps people with disabilities use computers and access information |
| Smart grid | An electricity network using computing and AI to optimise power distribution |
| Carbon footprint | The total greenhouse gas emissions caused by an individual, product, or activity |
| Melatonin | The sleep hormone, suppressed by blue light emitted by screens |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "Technology is always good for the environment because it replaces physical things" | Technology has significant environmental costs: data centres use massive amounts of electricity, manufacturing produces large quantities of CO₂, and e-waste creates toxic pollution. Digital services are not environmentally free. |
| "The digital divide only affects people in developing countries" | The digital divide is significant within wealthy countries like the UK — affecting elderly people, those on low incomes, rural communities, and people with disabilities. Approximately 5–10% of UK adults have never used the internet. |
| "Your digital footprint disappears when you delete something" | Deleted content may remain in web archives, company servers, or screenshots taken by others. Digital footprints are largely permanent. |
| "Social media only has harmful effects on young people" | Social media also enables young people to maintain friendships, access support communities, express creativity, and develop digital skills. The impact depends on how it is used and moderated. |
| "E-waste is properly recycled and therefore not a problem" | Less than 20% of global e-waste is formally recycled through certified channels. The majority ends up in landfill or is informally processed in hazardous conditions. |

---

## E-Waste Data Stimulus

**Use the following data to answer the interpretation questions below:**

| Year | Global E-Waste Generated (million tonnes) | Formally Recycled (%) |
|---|---|---|
| 2014 | 41.8 | 15.5% |
| 2016 | 44.7 | 17.4% |
| 2018 | 49.8 | 17.4% |
| 2020 | 53.6 | 17.4% |
| 2022 | 62.0 (estimated) | ~18% |

**Data interpretation questions:**
1. By how many million tonnes did global e-waste increase between 2014 and 2020?
2. What percentage of the 2020 e-waste total was NOT formally recycled?
3. Describe the trend in e-waste generation shown by the data.
4. Even though the percentage formally recycled has increased slightly, explain why the absolute amount of unrecycled e-waste is still growing.

*(Answers: 1. 11.8 million tonnes; 2. 82.6%; 3. Steadily increasing year on year; 4. The amount generated is growing faster than the recycling percentage — even at 18% recycling, 18% of a much larger total is more unrecycled waste than 15.5% of a smaller total.)*

---

## Exam-Style Questions

**Q1 [1 mark]**
State **one** environmental problem caused by the disposal of old electronic devices.

**Q2 [3 marks]**
Explain what is meant by a **digital footprint**. Give **one** example of an active digital footprint and **one** example of a passive digital footprint.

**Q3 [4 marks]**
Explain how the **digital divide** affects elderly people. Suggest **one** way in which this problem could be reduced.

**Q4 [6 marks]**
Evaluate the **environmental impact of video streaming services**. In your answer, consider:
- the energy used by data centres
- the benefits compared with physical alternatives (DVDs, Blu-ray)
- what streaming companies could do to reduce their environmental impact

**Q5 [8 marks]**
"Social media has done more harm than good to young people."

Discuss this statement. In your answer, include:
- **two** negative effects of social media on young people
- **two** positive effects of social media on young people
- a reasoned conclusion about whether you agree with the statement

**MCQ**
Which of the following is an example of a **passive** digital footprint?

A) Posting a photo on social media
B) Writing a comment on a forum
C) Location data collected by a smartphone app
D) Sending an email to a friend

**Fill in the blanks**
Global data centres consume approximately __________ of the world's electricity. Less than __________ of e-waste is formally recycled. A person's online trail of data is called their digital __________. The __________ divide describes the gap between those with and without access to technology. When social media algorithms only show users content matching their existing views, this is called an __________ chamber.

---

## Model Answers

**Q1:** Any one of: toxic materials (lead, mercury, cadmium) leaching into soil and groundwater from landfill; release of hazardous substances during informal burning or dismantling; e-waste taking up landfill space. **[1 mark]**

**Q2:** A digital footprint is the trail of data that a person's online activity creates (1). Active example: posting a photo on Instagram — the user has chosen to create and share this content (1). Passive example: a website recording the user's IP address and browsing history through cookies without the user doing anything specific to create this data (1). **[3 marks]**

**Q3:** Elderly people may lack the digital skills and confidence to use online services (1), meaning they are excluded from services that have moved online — such as booking GP appointments, applying for benefits, or online banking (1). Physical barriers (vision impairment, reduced dexterity) can also make devices harder to use (1). One way to reduce this: free digital skills training workshops run by libraries, community centres, or charities; subsidised tablets or broadband for over-65s; improved design of websites and apps with accessibility needs in mind. **[4 marks: 3 for explanation of how elderly are affected + 1 for valid solution]**

**Q4:** Award 1–2 marks per developed point, up to 6 marks:
- Streaming services run on data centres that consume vast amounts of electricity 24/7, generating significant CO₂ emissions — streaming HD video for one hour uses as much energy as boiling a kettle several times.
- However, streaming replaces the need to manufacture, package, transport, and eventually dispose of physical DVDs or Blu-ray discs, eliminating that entire chain of physical environmental impact.
- Streaming companies could switch to renewable energy (many large providers including Google and Microsoft have committed to this), optimise compression algorithms to reduce data transferred per stream, and use carbon offsetting.
- Overall evaluation: streaming is not environmentally free but may have lower total impact than physical media at scale, particularly as energy grids become greener.

**Q5:** Award 2 marks per negative effect, 2 marks per positive effect, 2 marks for a reasoned conclusion:
- Negative: social media is linked to increased anxiety, depression, and poor body image in young people, particularly girls, through social comparison with curated "ideal" images (1) — evidence from multiple studies links heavy use to declining mental health (1).
- Negative: cyberbullying through social media platforms occurs 24/7 without physical distance; anonymity enables cruelty that may not occur face to face (1); the permanence of online content can mean humiliating posts follow victims indefinitely (1).
- Positive: social media allows young people to maintain and strengthen friendships, particularly across distances or for those who struggle with face-to-face socialisation (1); it provides access to supportive communities for people experiencing isolation or minority identities (1).
- Positive: social media enables young people to access educational content, creative inspiration, and public information, and to develop digital communication skills valued by employers (1); it has been used by young people to organise social movements and campaigns on issues important to them (1).
- Conclusion: the statement is partially correct but oversimplified — social media's impact depends heavily on how it is used, the content encountered, and the individual. Regulation, improved platform design, and digital literacy education could increase benefits while reducing harms.

**MCQ:** C — Location data collected by a smartphone app

**Fill in the blanks:** 1–2% / 20% / footprint / digital / echo

---

## Revision Checklist

- [ ] I can state the approximate percentage of global electricity used by data centres
- [ ] I can explain what e-waste is and state two environmental dangers it creates
- [ ] I can state what percentage of e-waste is formally recycled (less than 20%)
- [ ] I can explain the carbon footprint of manufacturing a smartphone
- [ ] I can describe two positive environmental impacts of technology
- [ ] I can explain what the digital divide is and identify three groups affected by it
- [ ] I can describe three negative health effects of increased screen time
- [ ] I can explain what cyberbullying is and why it is particularly harmful
- [ ] I can explain what misinformation and echo chambers are
- [ ] I can describe two positive social impacts of technology (e.g. telemedicine, accessibility)
- [ ] I can explain what a digital footprint is
- [ ] I can distinguish between an active and a passive digital footprint with examples
- [ ] I can explain why digital footprints are largely permanent
- [ ] I can construct a balanced argument about a technology and society topic
- [ ] I can interpret data about e-waste statistics and describe trends

## KS3 Computing — Hardware Components

- Pack ID: `ks3_computing_hardware_components`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_hardware_components/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_hardware_components/pack_unified.json`

### Source Content

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

## KS3 Computing — Internet, Protocols & the WWW

- Pack ID: `ks3_computing_internet_protocols_www`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_internet_protocols_www/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_internet_protocols_www/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: The Internet, Protocols & the World Wide Web
**Year 7–9 | Networks | UK National Curriculum**

---

## Overview

People frequently use "the internet" and "the World Wide Web" as if they mean the same thing — they do not. Understanding this distinction is one of the most important concepts in this topic. This pack also covers how data travels across networks in **packets**, how addresses work, and the **protocols** (agreed rules) that allow billions of different devices to communicate reliably.

---

## Section 1: The Internet vs the World Wide Web

### The Internet

The **Internet** is the global **infrastructure** — the physical and logical network of interconnected networks spanning the entire planet. It consists of:

- Undersea fibre optic cables crossing oceans
- Overland cables connecting countries
- Routers directing traffic across the network
- Servers providing services
- The physical connections between billions of devices

Think of the internet as the **road network** — the roads, motorways, and junctions that exist everywhere.

### The World Wide Web (WWW)

The **WWW** is a **service** that runs **on top of** the internet. It is the collection of web pages, websites, images, and other media that are linked together using **hyperlinks** and accessed using the **HTTP/HTTPS protocol** via a web browser.

Think of the WWW as the **cars and lorries** that travel on the road network — they use the roads (internet) but are not the same thing as the roads.

### Other Services That Run on the Internet

The internet carries many services — the WWW is just one of them:

| Service | Protocol used | What it does |
|---|---|---|
| World Wide Web | HTTP / HTTPS | Browsing web pages |
| Email | SMTP, IMAP, POP3 | Sending and receiving emails |
| File transfer | FTP | Uploading/downloading files |
| Video streaming | RTSP / HTTP | Netflix, YouTube |
| Online gaming | TCP/UDP | Real-time game data |
| Video calls | WebRTC / SIP | Zoom, Teams |

**Key point**: When you send an email, you are using the internet but NOT the WWW. When you browse Wikipedia, you are using both the internet (to carry the data) and the WWW (the web page itself).

---

## Section 2: Addressing — IP Addresses, Domain Names, and DNS

### IP Addresses

Every device connected to the internet has a unique **IP (Internet Protocol) address** — a numerical identifier that allows routers to direct data to the correct destination.

**IPv4**: The original format. Written as four groups of numbers separated by dots, each 0–255.
- Example: `192.168.1.1` or `66.220.149.25`
- Uses 32 bits → approximately **4.3 billion** unique addresses
- Problem: the world has run out of IPv4 addresses (more devices than addresses)

**IPv6**: The replacement format, designed to solve address exhaustion.
- Example: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`
- Uses 128 bits → approximately **340 undecillion** (3.4 × 10³⁸) unique addresses
- Gradually being adopted alongside IPv4

### Domain Names

IP addresses like `172.217.169.68` are difficult for humans to remember. **Domain names** provide human-readable addresses:

- `www.bbc.co.uk`
- `www.google.com`
- `www.educationwebsite.org`

**Anatomy of a domain name:**
```
   www    .    bbc    .    co    .    uk
   |           |           |          |
subdomain    second-    domain    country-
             level      type      code
```

### DNS — Domain Name System

The **DNS** is the system that translates domain names into IP addresses. It acts like a **phone book** for the internet — you provide a name and it gives you the number (IP address).

Without DNS, you would need to memorise the IP address of every website you want to visit.

**DNS Resolution — Step by Step:**

```
Step 1: User types "www.bbc.co.uk" in browser

Step 2: Browser checks its LOCAL CACHE
        → Has it looked up this address recently?
        → If yes: use cached IP address (fast)
        → If no: proceed to Step 3

Step 3: Browser contacts the DNS SERVER
        (provided by ISP or configured manually e.g. 8.8.8.8 = Google DNS)
        → "What is the IP address for www.bbc.co.uk?"

Step 4: DNS SERVER responds
        → "www.bbc.co.uk is at 151.101.0.81"

Step 5: Browser contacts the WEB SERVER at that IP address
        → "Please send me the home page"

Step 6: Web server sends the HTML, CSS, images back to browser

Step 7: Browser renders and displays the web page
```

### ASCII DNS Resolution Flow Diagram

```
[USER]
  |
  | Types: www.bbc.co.uk
  v
[BROWSER]
  |
  |---(1) Is it in cache?---> YES ---> [IP known, skip to step 5]
  |
  | NO
  v
[DNS SERVER]  <---(2) "What IP for www.bbc.co.uk?"
  |
  |---(3) Returns: 151.101.0.81
  v
[BROWSER]
  |
  |---(4) HTTP request to 151.101.0.81
  v
[WEB SERVER at bbc.co.uk]
  |
  |---(5) Returns HTML, CSS, images
  v
[BROWSER renders page for USER]
```

---

## Section 3: Packets and Packet Switching

### What are Packets?

When you send a file, email, or load a web page, the data is **not sent as one continuous stream**. Instead, it is broken into small chunks called **packets**.

**Each packet contains:**

```
+------------------------------------------+
|  HEADER                                  |
|  - Source IP address (where it came from)|
|  - Destination IP address (where to go)  |
|  - Sequence number (packet 3 of 10)      |
|  - Protocol information                  |
+------------------------------------------+
|  PAYLOAD                                 |
|  - The actual chunk of data              |
|  (e.g. part of a web page, part of file) |
+------------------------------------------+
|  TRAILER                                 |
|  - Error checking (checksum)             |
+------------------------------------------+
```

### Packet Switching

**Packet switching** is the method used to send packets across the internet. Key characteristics:

1. **Different routes**: each packet in a message may travel via a completely different route through the network
2. **Independent decisions**: each router decides the best path for each packet at that moment, based on network conditions
3. **Reassembly**: at the destination, packets are reassembled into the correct order using the sequence numbers

### Packet Switching Diagram

```
SOURCE (sending a 3-packet message A, B, C)
|
|  Packet A ---> Router 1 ---> Router 3 ---> DESTINATION
|  Packet B ---> Router 1 ---> Router 2 ---> Router 4 --> DESTINATION
|  Packet C ---> Router 2 ---> Router 4 ---> DESTINATION

All three packets arrive at DESTINATION:
Packet A (arrived 1st), Packet C (arrived 2nd), Packet B (arrived 3rd)

REASSEMBLED in correct order using sequence numbers: A, B, C
```

### Benefits of Packet Switching

| Benefit | Explanation |
|---|---|
| Efficient use of network | No dedicated line is reserved between sender and receiver — many users share the same network infrastructure simultaneously |
| Fault tolerant | If a router fails, packets automatically reroute around the problem — the message still arrives |
| Scalable | Works for billions of simultaneous connections |
| No wasted bandwidth | Lines are only used when actually carrying a packet |

---

## Section 4: Protocols

A **protocol** is a set of agreed rules that define how data is formatted, transmitted, and received. Protocols allow different devices (different manufacturers, different operating systems) to communicate reliably.

### Key Protocols Reference Table

| Protocol | Full Name | Port | Purpose |
|---|---|---|---|
| HTTP | HyperText Transfer Protocol | 80 | Transfers web pages from server to browser; data sent in plain text (unsecured) |
| HTTPS | HTTP Secure | 443 | HTTP with SSL/TLS encryption; data encrypted in transit; padlock shown in browser |
| TCP | Transmission Control Protocol | — | Splits data into packets; ensures all packets arrive; requests retransmission of lost packets; reliable |
| IP | Internet Protocol | — | Handles routing of packets across networks using IP addresses |
| TCP/IP | Combined protocol suite | — | Foundation of internet communication; TCP + IP working together |
| DNS | Domain Name System | 53 | Translates domain names to IP addresses |
| SMTP | Simple Mail Transfer Protocol | 25/587 | Sends email from client to mail server or between servers |
| IMAP | Internet Message Access Protocol | 143/993 | Receives email; messages stay on server; accessible from multiple devices |
| POP3 | Post Office Protocol v3 | 110/995 | Receives email; messages downloaded to device and deleted from server |
| FTP | File Transfer Protocol | 20/21 | Transfers files between computers |

### HTTP vs HTTPS — The Critical Difference

**HTTP (port 80):**
- Data is transmitted as **plain text**
- Anyone intercepting the data can read it
- Suitable only for public, non-sensitive content
- No padlock in the browser address bar

**HTTPS (port 443):**
- Data is **encrypted** using SSL/TLS before transmission
- Even if intercepted, the data appears as meaningless ciphertext
- Required for any login page, banking, shopping, or personal data
- Shows a **padlock** icon in the browser
- The server has an SSL/TLS **certificate** proving its identity

### TCP/IP — The Internet's Foundation

**TCP** (Transmission Control Protocol) handles the reliable delivery of data:
1. Breaks data into packets
2. Numbers each packet (sequence numbers)
3. Ensures all packets arrive at the destination
4. Requests retransmission of any lost packets
5. Reassembles packets in the correct order

**IP** (Internet Protocol) handles routing:
1. Each packet has a source and destination IP address
2. Routers read the IP address and forward the packet toward its destination
3. Each router makes an independent decision about the next hop

Together, **TCP/IP** ensures that data gets from A to B accurately, regardless of the route taken or the hardware involved.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Internet | The global physical and logical infrastructure — the network of interconnected networks |
| WWW (World Wide Web) | A service running on the internet — the collection of linked web pages accessed via HTTP/HTTPS |
| IP address | A unique numerical identifier assigned to every device on a network |
| IPv4 | 32-bit IP address format; approximately 4.3 billion unique addresses (now largely exhausted) |
| IPv6 | 128-bit IP address format; designed to replace IPv4 with vastly more addresses |
| Domain name | A human-readable address for a website (e.g. www.bbc.co.uk) |
| DNS | Domain Name System — translates domain names into IP addresses |
| Packet | A small chunk of data (with header, payload, and trailer) sent across a network |
| Packet switching | Method of sending packets independently via different routes; reassembled at destination |
| Protocol | A set of agreed rules for how data is formatted and transmitted between devices |
| HTTP | Protocol for transferring web pages; data is unencrypted |
| HTTPS | Secure version of HTTP; data is encrypted using SSL/TLS |
| TCP | Protocol that splits data into packets, ensures reliable delivery, and reassembles them |
| IP | Protocol that handles routing of packets across networks using IP addresses |
| SMTP | Protocol for sending email |
| IMAP | Protocol for receiving email; keeps messages on the server |
| FTP | Protocol for transferring files between computers |
| SSL/TLS | Encryption protocols used by HTTPS to secure data in transit |
| Cache | Temporary storage of previously accessed data (e.g. DNS records) to speed up future requests |
| Sequence number | Number in each packet's header that allows correct reassembly at the destination |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "The internet and the World Wide Web are the same thing" | The internet is the physical infrastructure (cables, routers, servers). The WWW is a service — just one of many — that runs on the internet. Email also uses the internet but is not part of the WWW. |
| "HTTP and HTTPS are completely different protocols" | HTTPS is HTTP with SSL/TLS encryption added on top. The underlying protocol is the same; HTTPS simply encrypts the data before sending it. |
| "All packets in a message travel the same route" | In packet switching, each packet may take a completely different route through the network, depending on traffic and router decisions. They are reassembled in the correct order at the destination. |
| "DNS stores the actual web page content" | DNS only stores the mapping between domain names and IP addresses — a "phone book" entry. The actual web content is stored on web servers. |
| "IPv4 and IPv6 work the same way — IPv6 is just bigger" | While both are IP addressing schemes, IPv6 was redesigned with a much larger address space (128-bit vs 32-bit) and includes additional features. They are not directly compatible without translation mechanisms. |
| "A web browser is the internet" | A browser (Chrome, Firefox, Safari) is a program that accesses the WWW. The internet exists independently of any browser. |

---

## Diagrams / ASCII Art

### The Internet vs WWW — Conceptual Model

```
+---------------------------------------------------------------+
|                        THE INTERNET                           |
|  (Physical cables, routers, servers, fibre, satellites)       |
|                                                               |
|   +------------------+  +-----------+  +------------------+  |
|   |  WORLD WIDE WEB  |  |   EMAIL   |  | VIDEO STREAMING  |  |
|   |  (HTTP/HTTPS)    |  |   (SMTP   |  |   (RTSP/HTTP)    |  |
|   |  Web pages,      |  |    IMAP)  |  |   Netflix,       |  |
|   |  hyperlinks      |  |           |  |   YouTube        |  |
|   +------------------+  +-----------+  +------------------+  |
|                                                               |
|   +------------------+  +-----------+                        |
|   |   FILE TRANSFER  |  |  GAMING   |                        |
|   |      (FTP)       |  |  (UDP)    |                        |
|   +------------------+  +-----------+                        |
+---------------------------------------------------------------+
```

### Packet Header Structure

```
PACKET 3 of 7:
+---------------------------+
| Source IP: 192.168.1.5    |  <- Where did this packet come from?
| Dest. IP:  151.101.0.81   |  <- Where is it going?
| Seq. No:   3              |  <- This is packet number 3
| Checksum:  A4F2           |  <- Error checking
+---------------------------+
| PAYLOAD: ...data chunk... |  <- The actual content
+---------------------------+
| TRAILER: error check bits |
+---------------------------+
```

---

## Exam-Style Questions

**Q1 [2 marks]**
State **one** similarity and **one** difference between the internet and the World Wide Web.

**Q2 [3 marks]**
Explain how DNS resolves a domain name. Your answer should include what information is sent and what is returned.

**Q3 [4 marks]**
Explain what is meant by **packet switching**. In your answer, explain:
- what a packet is
- what packet switching means
- one benefit of packet switching

**Q4 [2 marks]**
Explain why a website that handles bank account details should use **HTTPS** rather than **HTTP**.

**Q5 [6 marks]**
Trace the steps that occur from a user typing `www.example.com` into their browser to the web page appearing on screen. You should include: DNS, IP address, HTTP request, web server, and packet delivery.

**MCQ**
Which protocol is used to send email?

A) HTTP
B) FTP
C) SMTP
D) DNS

**Fill in the blanks**
Data sent across the internet is broken into small chunks called __________. Each chunk contains a __________, which includes the source and destination __________ addresses, and a sequence number used for __________. This method, where each chunk may travel via a different __________, is called packet switching.

---

## Model Answers

**Q1:**
- Similarity: both the internet and the WWW involve transferring data between computers (1).
- Difference: the internet is the physical global infrastructure (cables, routers, servers), whereas the WWW is a service (collection of web pages) that runs on top of the internet (1). **[2 marks]**

**Q2:** The user's browser sends a request to a DNS server containing the domain name (1). The DNS server looks up the domain name in its database and finds the matching IP address (1). The DNS server returns the IP address to the browser, which then contacts the web server at that IP address (1). **[3 marks]**

**Q3:**
- A packet is a small chunk of data that includes a header (containing source IP, destination IP, and sequence number), a payload (the actual data), and a trailer (error checking) (1).
- Packet switching is a method where the data is broken into packets and each packet may travel via a different route through the network (1).
- Packets are reassembled in the correct order at the destination using sequence numbers (1).
- Benefit: if one router fails, packets can be rerouted automatically around the failure, making the system fault tolerant / the network is used efficiently because no dedicated line is reserved (1). **[4 marks]**

**Q4:** HTTPS encrypts the data using SSL/TLS before it is transmitted (1). This means that even if an attacker intercepts the data, they cannot read the account details — it appears as meaningless ciphertext (1). HTTP sends data as plain text, which anyone intercepting the connection could read. **[2 marks]**

**Q5:** Award 1 mark per correct step, up to 6 marks:
1. User types `www.example.com` — browser checks local DNS cache for the IP address
2. If not cached, browser sends a DNS query to the DNS server asking for the IP address of `www.example.com`
3. DNS server returns the IP address (e.g. `93.184.216.34`) to the browser
4. Browser sends an HTTP/HTTPS request (a packet) to the web server at that IP address, asking for the web page
5. The request and response are broken into packets; each packet travels via routers across the internet, potentially via different routes, and is reassembled at the destination
6. The web server at `www.example.com` sends back the HTML, CSS, and image files; the browser renders these and displays the page

**MCQ:** C — SMTP

**Fill in the blanks:** packets / header / IP / reassembly / route

---

## Revision Checklist

- [ ] I can explain the difference between the internet and the WWW with an example
- [ ] I can name three services that use the internet other than the WWW
- [ ] I can describe what an IP address is and why it is needed
- [ ] I can state one difference between IPv4 and IPv6
- [ ] I can explain what DNS does and why it is needed
- [ ] I can describe the DNS resolution process step by step
- [ ] I can explain what a packet is and name three parts of a packet
- [ ] I can explain what packet switching means
- [ ] I can state two benefits of packet switching
- [ ] I can state the purpose of HTTP and HTTPS and explain the difference
- [ ] I can explain why HTTPS is more secure than HTTP
- [ ] I can state the purpose of TCP/IP, SMTP, IMAP, and FTP
- [ ] I can explain what a protocol is and why protocols are needed

## KS3 Computing — Iteration & Loops

- Pack ID: `ks3_computing_iteration_loops`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_iteration_loops/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_iteration_loops/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Iteration & Loops
**Year 7–9 | Programming Fundamentals | UK National Curriculum**

---

## Overview

Iteration is one of the most powerful ideas in programming. Without it, a program that needed to print 100 lines would require 100 separate `print` statements; a program checking passwords until the user gets it right would be impossible to write at all. Iteration — the ability to repeat a block of instructions — is what makes programs practical and scalable.

There are two fundamental types of loop: **count-controlled** loops, which repeat a fixed number of times known before the loop starts, and **condition-controlled** loops, which keep repeating until a particular condition becomes false. Choosing the right type of loop for a given problem is an important programming skill. Using a FOR loop when you should use a WHILE loop (or vice versa) will still often produce a working program, but it may be harder to understand, maintain, or extend.

This pack covers both loop types, explains how to read and write them in pseudocode and Python, and provides trace tables so you can follow exactly what happens inside a loop iteration by iteration. Understanding loops deeply — including the edge cases like infinite loops and nested loops — is essential for the programming questions in your assessments.

---

## Section 1: FOR Loops (Count-Controlled Iteration)

A **FOR loop** repeats a block of code a fixed, known number of times. The number of repetitions is determined before the loop starts, either by a literal number or by the length of a collection.

### Pseudocode FOR Loop

```pseudocode
FOR i ← 1 TO 5
    OUTPUT i
ENDFOR
```

This outputs the numbers 1 through 5. The variable `i` (the **loop variable** or **counter**) starts at 1, the block executes, then `i` increases by 1, and this repeats until `i` exceeds 5.

### Python FOR Loop

In Python, the `for` loop most commonly uses `range()`:

```python
for i in range(1, 6):    # range(start, stop) — stop is EXCLUSIVE
    print(i)
```

Output:
```
1
2
3
4
5
```

**Important `range()` details:**
- `range(5)` — produces 0, 1, 2, 3, 4 (starts at 0 by default)
- `range(1, 6)` — produces 1, 2, 3, 4, 5 (stops before 6)
- `range(0, 10, 2)` — produces 0, 2, 4, 6, 8 (step of 2)

### When to Use a FOR Loop

Use a FOR loop when you know **in advance** how many times the loop should run. Examples:
- Print the 5 times table.
- Process each item in a list.
- Repeat a quiz question 10 times.

---

## Section 2: WHILE Loops (Condition-Controlled Iteration)

A **WHILE loop** repeats a block of code as long as a condition remains `True`. The number of repetitions is not fixed — it depends on when the condition becomes `False`.

### Pseudocode WHILE Loop

```pseudocode
WHILE condition = True DO
    [block of code]
ENDWHILE
```

### Python WHILE Loop

```python
while condition:
    # block of code
```

### Example: Counting with WHILE

```pseudocode
count ← 1
WHILE count <= 5 DO
    OUTPUT count
    count ← count + 1
ENDWHILE
```

```python
count = 1
while count <= 5:
    print(count)
    count = count + 1
```

Both produce the same output as the FOR loop above, but the WHILE version requires manually initialising and incrementing the counter.

### Example: Password Checker

```pseudocode
password ← USERINPUT
WHILE password != "secret123" DO
    OUTPUT "Incorrect. Try again."
    password ← USERINPUT
ENDWHILE
OUTPUT "Access granted."
```

```python
password = input("Enter password: ")
while password != "secret123":
    print("Incorrect. Try again.")
    password = input("Enter password: ")
print("Access granted.")
```

This is a perfect use case for WHILE: we cannot know in advance how many attempts the user will need.

### When to Use a WHILE Loop

Use a WHILE loop when the number of repetitions is **not known in advance**. Examples:
- Keep asking for input until the user enters a valid value.
- Keep running a game until the player loses all lives.
- Keep reading data until the end of a file.

---

## Section 3: Infinite Loops and Nested Loops

### Infinite Loops

An **infinite loop** is a loop whose condition never becomes `False`, causing the program to run forever (or until it is forcibly stopped).

```pseudocode
count ← 1
WHILE count > 0 DO
    OUTPUT count
    count ← count + 1
ENDWHILE
```

Here, `count` starts at 1 and keeps increasing — it will never be `<= 0`, so the loop never ends. This is almost always a bug.

**Common causes of infinite loops:**
- Forgetting to update the loop variable inside the loop.
- Using the wrong comparison operator (e.g., `>` instead of `<`).
- Accidentally resetting the variable inside the loop.

**How to fix:** Identify the condition, then trace through the loop to ensure the condition will eventually become `False`. Make sure the variable being tested is updated correctly inside the loop body.

### Nested Loops

A **nested loop** is a loop placed inside another loop. The inner loop runs **completely** for every single iteration of the outer loop.

```pseudocode
FOR i ← 1 TO 3
    FOR j ← 1 TO 4
        OUTPUT i, j
    ENDFOR
ENDFOR
```

- Outer loop runs 3 times (i = 1, 2, 3).
- Inner loop runs 4 times for each outer iteration.
- Total iterations of the inner loop body: 3 × 4 = **12**.

### Nested Loop: Multiplication Table

```pseudocode
FOR row ← 1 TO 3
    FOR col ← 1 TO 3
        OUTPUT row * col
    ENDFOR
ENDFOR
```

Output:
```
1  2  3
2  4  6
3  6  9
```

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Iteration | Repeating a block of instructions; also called a loop |
| FOR loop | A count-controlled loop that repeats a fixed number of times; the count is known before the loop starts |
| WHILE loop | A condition-controlled loop that repeats as long as its condition remains `True`; the count is not known in advance |
| Loop variable | The variable (counter) used in a FOR loop that tracks the current iteration number |
| Loop body | The block of code that is repeated on each iteration of the loop |
| Condition | The Boolean expression checked by a WHILE loop; when it becomes `False`, the loop ends |
| Infinite loop | A loop whose condition never becomes `False`; the program runs forever — almost always a bug |
| Nested loop | A loop placed inside another loop; the inner loop completes fully on every iteration of the outer loop |
| `range()` | A Python function that generates a sequence of numbers used with `for` loops; range(start, stop, step) |
| Count-controlled | A loop that repeats a specific, predetermined number of times |
| Condition-controlled | A loop that repeats until a condition becomes False; the number of repetitions is not fixed in advance |
| Iteration count | The total number of times a loop body executes |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| FOR loops are always better than WHILE loops | Neither is universally better. FOR loops suit situations where the count is known; WHILE loops suit situations where repetition depends on an unknown condition. |
| A WHILE loop always runs at least once | A WHILE loop checks its condition **before** the first iteration. If the condition is False at the start, the body never runs at all. (A DO-WHILE loop does run at least once, but Python has no built-in DO-WHILE.) |
| You can control a FOR loop by changing the loop variable inside the loop | In Python, changing `i` inside a `for` loop has no effect — Python resets it to the next value in the sequence at the start of each iteration. |
| Nested loops: the inner loop only runs once per outer loop | The inner loop runs **completely** (all its iterations) each time the outer loop's body executes. |
| An infinite loop crashes the computer | An infinite loop hangs the program (it stops responding), but it does not crash the entire computer. You can stop it with Ctrl+C in Python. |
| `range(5)` generates 1, 2, 3, 4, 5 | `range(5)` generates 0, 1, 2, 3, 4. To get 1–5, use `range(1, 6)`. |

---

## Diagrams / Code Examples

### Flowchart: WHILE Loop

```
         START
           |
           v
    ┌──────────────┐
    │  Check       │
    │  condition   │◄──────────┐
    └──────────────┘           │
         /    \                │
       TRUE   FALSE            │
       /          \            │
      v            v           │
 ┌─────────┐     END           │
 │  Loop   │                  │
 │  body   │──────────────────┘
 └─────────┘
  (loop back to condition check)
```

### Flowchart: FOR Loop

```
         START
           |
           v
      i ← start
           |
           v
    ┌──────────────┐
    │  i <= end?   │◄──────────┐
    └──────────────┘           │
         /    \                │
       TRUE   FALSE            │
       /          \            │
      v            v           │
 ┌─────────┐     END           │
 │  Loop   │                  │
 │  body   │                  │
 └─────────┘                  │
      |                       │
      v                       │
  i ← i + 1 ─────────────────┘
```

### Trace Table: FOR Loop

Program:
```pseudocode
total ← 0
FOR i ← 1 TO 4
    total ← total + i
ENDFOR
OUTPUT total
```

| Iteration | `i` | `total` before | `total` after |
|---|---|---|---|
| Start | — | 0 | 0 |
| 1 | 1 | 0 | 1 |
| 2 | 2 | 1 | 3 |
| 3 | 3 | 3 | 6 |
| 4 | 4 | 6 | 10 |
| End | — | — | Output: `10` |

### Trace Table: WHILE Loop

Program:
```pseudocode
number ← 1
WHILE number < 20 DO
    number ← number * 2
ENDWHILE
OUTPUT number
```

| Check | `number` (before body) | Condition `number < 20`? | `number` (after body) |
|---|---|---|---|
| 1st | 1 | True | 2 |
| 2nd | 2 | True | 4 |
| 3rd | 4 | True | 8 |
| 4th | 8 | True | 16 |
| 5th | 16 | True | 32 |
| 6th | 32 | False | Loop ends |
| Output | 32 | | |

### Pseudocode: Password Checker (WHILE)

```pseudocode
CONSTANT PASSWORD = "letmein"
attempts ← 0
guess ← USERINPUT
WHILE guess != PASSWORD AND attempts < 3 DO
    OUTPUT "Wrong password."
    attempts ← attempts + 1
    guess ← USERINPUT
ENDWHILE
IF guess == PASSWORD THEN
    OUTPUT "Access granted."
ELSE
    OUTPUT "Too many attempts. Locked."
ENDIF
```

### Pseudocode: Multiplication Table (Nested FOR)

```pseudocode
FOR i ← 1 TO 5
    FOR j ← 1 TO 5
        OUTPUT i * j
    ENDFOR
ENDFOR
```

Total iterations of inner body: 5 × 5 = 25.

---

## Exam-Style Questions

**Q1** [1 mark]
State one difference between a FOR loop and a WHILE loop.

---

**Q2** [2 marks]
Trace through the following program, completing the trace table.

```pseudocode
FOR i ← 1 TO 4
    OUTPUT i * 3
ENDFOR
```

| Iteration | `i` | Output |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |

---

**Q3** [3 marks]
Write a pseudocode program using a WHILE loop that:
- asks the user to input a positive number
- keeps asking until the user enters a number greater than 0
- once a valid number is entered, outputs the square of the number

---

**Q4** [3 marks]
Trace through the following program, completing the trace table.

```pseudocode
x ← 100
WHILE x > 10 DO
    x ← x DIV 2
ENDWHILE
OUTPUT x
```

(`DIV` means integer division — discard the remainder.)

| Check | `x` before | Condition `x > 10`? | `x` after |
|---|---|---|---|
| 1 | 100 | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| ... | | | |

---

**Q5** [2 marks]
Look at the following code:

```pseudocode
count ← 10
WHILE count > 0 DO
    OUTPUT count
ENDWHILE
```

a) What is the problem with this code? [1 mark]
b) Write the corrected version. [1 mark]

---

**Q6** [4 marks]
A nested loop program is shown below:

```pseudocode
FOR outer ← 1 TO 3
    FOR inner ← 1 TO 2
        OUTPUT outer * inner
    ENDFOR
ENDFOR
```

a) How many times does the inner loop body execute in total? [1 mark]
b) Complete the trace table showing each output. [3 marks]

| `outer` | `inner` | Output |
|---|---|---|
| 1 | 1 | |
| 1 | 2 | |
| 2 | 1 | |
| 2 | 2 | |
| 3 | 1 | |
| 3 | 2 | |

---

**MCQ** [1 mark]
Which type of loop is most suitable for asking a user to enter their age until they enter a value between 0 and 120?

A) FOR loop, because the number of questions is fixed
B) WHILE loop, because we don't know how many attempts are needed
C) Nested loop, because we need to check two conditions
D) FOR loop, because it always runs at least once

---

**Fill in the blank** [1 mark]
In Python, `range(1, 9)` generates the numbers 1, 2, 3, 4, 5, 6, 7, `____`.

---

## Model Answers

**Q1:** A FOR loop repeats a **fixed, known** number of times (count-controlled). A WHILE loop repeats until a **condition becomes False** and the number of repetitions is not known in advance (condition-controlled). [1]

**Q2:**

| Iteration | `i` | Output |
|---|---|---|
| 1 | 1 | 3 |
| 2 | 2 | 6 |
| 3 | 3 | 9 |
| 4 | 4 | 12 |

[1 mark for i values correct; 1 mark for all outputs correct]

**Q3:**
```pseudocode
OUTPUT "Enter a positive number:"
number ← USERINPUT
WHILE number <= 0 DO
    OUTPUT "Invalid. Enter a number greater than 0:"
    number ← USERINPUT
ENDWHILE
OUTPUT number * number
```
[1 for correct WHILE condition; 1 for re-prompting inside loop; 1 for output of square]

**Q4:**

| Check | `x` before | Condition `x > 10`? | `x` after |
|---|---|---|---|
| 1 | 100 | True | 50 |
| 2 | 50 | True | 25 |
| 3 | 25 | True | 12 |
| 4 | 12 | True | 6 |
| 5 | 6 | False | Loop ends |

Output: `6`
[1 for each of: x=50 and x=25 correct; x=12 correct; x=6 and False noted; output correct]

**Q5:**
a) `count` is never updated inside the loop — it stays 10 forever, so the condition `count > 0` is always True. This is an **infinite loop**. [1]
b)
```pseudocode
count ← 10
WHILE count > 0 DO
    OUTPUT count
    count ← count - 1
ENDWHILE
```
[1]

**Q6:**
a) 3 × 2 = **6 times** [1]

b)
| `outer` | `inner` | Output |
|---|---|---|
| 1 | 1 | 1 |
| 1 | 2 | 2 |
| 2 | 1 | 2 |
| 2 | 2 | 4 |
| 3 | 1 | 3 |
| 3 | 2 | 6 |

[1 per 2 correct rows]

**MCQ:** B [1]

**Fill in the blank:** 8 [1]

---

## Revision Checklist

- [ ] I can explain what iteration is and why it is useful.
- [ ] I can explain the difference between count-controlled (FOR) and condition-controlled (WHILE) loops.
- [ ] I can write a FOR loop in pseudocode and Python, including using `range()` with start, stop, and step values.
- [ ] I can write a WHILE loop in pseudocode and Python with a correct condition.
- [ ] I can choose between a FOR loop and a WHILE loop for a given problem and justify my choice.
- [ ] I can trace a FOR loop through a trace table, recording the loop variable and any changed variables at each iteration.
- [ ] I can trace a WHILE loop through a trace table, recording the condition check result and variable values at each step.
- [ ] I can identify an infinite loop, explain why it is infinite, and correct it.
- [ ] I understand that a WHILE loop may not execute at all if the condition is False before the first check.
- [ ] I can write and trace a nested loop, and calculate the total number of inner-body iterations.
- [ ] I know that `range(5)` generates 0–4 and that `range(1, 6)` generates 1–5.
- [ ] I can write a password checker using a WHILE loop.
- [ ] I can draw or interpret a flowchart for both FOR and WHILE loops, including the loop-back arrow.

## KS3 Computing — Legal & Ethical Issues

- Pack ID: `ks3_computing_legal_ethical_issues`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_legal_ethical_issues/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_legal_ethical_issues/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Legal & Ethical Issues in Computing
**Year 7–9 | Impact of Technology | UK National Curriculum**

---

## Overview

Technology raises both **legal** and **ethical** questions that affect everyone in society. These are not the same thing:

- A **legal issue** is something prohibited by law — breaking it can result in prosecution, fines, or imprisonment.
- An **ethical issue** is a moral question — something that may be legal but that reasonable people might consider wrong, harmful, or unfair.

The two categories overlap: hacking a computer is both illegal (Computer Misuse Act) and widely considered unethical. But they can also be separate: a company that collects huge amounts of personal data for targeted advertising may do so legally (with buried consent in Terms & Conditions) while many people consider it ethically questionable.

---

## Section 1: UK Computing Legislation

### The Computer Misuse Act 1990

Passed to make hacking and related activities a criminal offence. The Act defines **three offences**, each carrying increasing penalties:

**Offence 1: Unauthorised access to computer material**
- Simply accessing a computer system or data you do not have permission to access
- Does NOT require any damage to be done — just accessing without permission is enough
- Examples: guessing a classmate's password and logging into their account; accessing company files you are not authorised to see; a low-level employee reading the CEO's private emails

**Offence 2: Unauthorised access with intent to commit a further offence**
- Accessing a system specifically with the intention of committing another crime
- Examples: hacking a bank's servers to commit fraud; accessing a company's database to steal customer credit card details; breaking into a system to plant ransomware

**Offence 3: Unauthorised modification of computer material**
- Intentionally altering, deleting, or corrupting data or software without authorisation
- Examples: planting a virus; deleting someone else's files; altering exam records; defacing a website; deploying ransomware that encrypts data

**Penalties:** up to 10 years imprisonment for the most serious offences; unlimited fines.

### The Data Protection Act 2018 / UK GDPR

Governs how personal data about individuals must be collected, stored, used, and protected. Based on the UK General Data Protection Regulation (UK GDPR) — the UK version of the EU's GDPR framework, retained after Brexit.

**Key principles — personal data must be:**

| Principle | What It Means |
|---|---|
| Lawful, fair, and transparent | Data collected only with a valid legal basis; individuals know what is collected and why |
| Purpose limitation | Data used only for the specific, stated reason it was collected; not repurposed without consent |
| Data minimisation | Only the data actually needed is collected — not more |
| Accuracy | Data must be kept accurate and up to date |
| Storage limitation | Data not kept longer than necessary for its purpose |
| Integrity and confidentiality | Stored securely with appropriate technical and organisational measures |
| Accountability | Organisations must be able to demonstrate compliance |

**Individual rights under the DPA:**
- Right to access: individuals can request a copy of all personal data held about them (Subject Access Request)
- Right to be forgotten: individuals can request their data be deleted (in certain circumstances)
- Right to correction: individuals can request inaccurate data be corrected
- Breach notification: organisations must report significant data breaches to the ICO (Information Commissioner's Office) within **72 hours**

**ICO**: the Information Commissioner's Office is the UK regulator that enforces the DPA. It can issue fines of up to £17.5 million or 4% of global annual turnover.

### The Copyright, Designs and Patents Act 1988

Protects the **intellectual property** of creators — their original creative works are protected from being copied, distributed, or modified without permission.

**What it covers:**
- Software and code
- Music, films, and videos
- Images, photographs, artwork
- Written text, books, articles
- Databases

**What is illegal without permission:**
- Copying software and distributing it
- Downloading music or films without paying
- Using someone's image in your project without credit or licence
- Modifying and distributing someone else's code

**Creative Commons licences:** allow creators to specify exactly what others can do with their work (e.g. free to use but must credit the creator; can modify but only for non-commercial use; must share modifications under the same licence).

**Open Source Software:** software whose source code is published and freely available. Comes with its own licence terms (e.g. MIT, GNU GPL) which specify whether it can be used commercially, whether modifications must also be open source, etc.

### Freedom of Information Act 2000

Public sector organisations (government, councils, NHS, schools, police) must disclose information held about their activities upon request, within 20 working days, unless an exemption applies.

**Exemptions include:** national security; personal data about third parties; information that would prejudice commercial interests; information still being used in policy development.

**Why it matters for computing:** members of the public can request data about government IT contracts, algorithms used in public services, or how data is processed.

### UK Laws Summary Table

| Law | Year | What It Covers | Example Offence/Application |
|---|---|---|---|
| Computer Misuse Act | 1990 | Criminalises unauthorised access to computer systems and data | Hacking a school's database to change exam grades |
| Data Protection Act / UK GDPR | 2018 | Governs how personal data is collected, stored, used, and protected | Company selling customer data to third parties without consent |
| Copyright, Designs and Patents Act | 1988 | Protects creators' intellectual property from unauthorised copying/use | Distributing cracked software or using music without a licence |
| Freedom of Information Act | 2000 | Public sector must disclose information on request | Requesting details of a council's CCTV data processing |

---

## Section 2: Ethical Issues in Computing

Ethical issues arise where technology creates moral dilemmas — situations where the right course of action is unclear, or where different values (privacy vs security; innovation vs fairness) come into conflict.

### AI Bias

**The issue:** Machine learning algorithms are trained on historical data. If that historical data reflects historical biases (discrimination, inequality), the AI learns and perpetuates those biases.

**Example:** a recruitment AI trained on historical hiring data from a company that historically promoted mostly men will learn to favour male candidates — not because it is programmed to discriminate, but because it is optimising for "candidates similar to those who succeeded in the past."

**Why difficult to fix:** the bias is embedded in the training data; even removing explicitly protected characteristics (gender, race) may not help if other data (postcode, school attended) correlates with them.

**Ethical concern:** AI bias can systematically disadvantage entire groups at massive scale, affecting jobs, loans, bail decisions, and medical diagnoses.

### Surveillance and Privacy

**The issue:** CCTV cameras, facial recognition systems, smartphone location tracking, government data collection — the technology exists to monitor people's movements and behaviour extensively.

**Arguments for surveillance:** prevents and solves crime; finds missing persons; deters terrorism; improves public safety.

**Arguments against:** significant invasion of privacy; chilling effect on freedom of expression and assembly; facial recognition has higher error rates for people of colour (an AI bias issue); collected data can be misused; "who watches the watchers?"

### Automation and Job Displacement

**The issue:** Robots and AI are capable of performing an increasing range of tasks previously done by humans — manufacturing (car assembly robots), logistics (automated warehouses), transport (autonomous vehicles), and customer service (chatbots).

**Arguments for automation:** increases efficiency and reduces costs; removes humans from dangerous jobs; frees people from repetitive tasks; creates new jobs in technology.

**Arguments against:** widespread job displacement, particularly for low-skilled workers who cannot easily retrain; new tech jobs may not be accessible to displaced workers; increasing wealth inequality if profits go to technology owners rather than workers.

### Digital Divide

**The issue:** Not everyone has equal access to technology. This creates a two-tier society — those with technology and the skills to use it (the digitally included) and those without (the digitally excluded).

**Who is affected:** elderly people; those on low incomes; people in rural areas with poor broadband infrastructure; people with disabilities who need assistive technology they cannot afford.

**Consequences:** educational disadvantage; inability to access government services, job applications, banking, and healthcare that have moved online; social isolation.

**Exposed by COVID-19:** when schools moved to remote learning, students without home computers or internet connections were severely disadvantaged.

### Data Ethics

**The issue:** large technology companies collect vast amounts of personal data — browsing history, location, purchases, social connections, health data. This data is used to target advertising, train AI models, and make inferences about individuals.

**Ethical questions:**
- Is "implied consent" (clicking "I Agree" on Terms & Conditions without reading them) genuinely informed consent?
- Should companies be able to profit from personal data without meaningfully sharing that profit with the people who generated it?
- Who owns your data — you or the company?

### Algorithmic Accountability

**The issue:** when an AI system makes a harmful decision — an autonomous vehicle kills a pedestrian, a medical AI misdiagnoses cancer, a credit scoring algorithm unfairly denies loans to a demographic — who is responsible?

**Options:** the developer who wrote the algorithm; the company that deployed it; the user who relied on it without questioning it; the person whose data trained it.

**Why difficult:** AI decisions are often opaque ("black box" — not even the developers fully understand why the model made a specific decision).

### Ethical Issues Table

| Ethical Issue | Description | Argument For Technology | Argument Against / Concern |
|---|---|---|---|
| AI bias | Algorithms perpetuate historical biases | AI can make faster, more consistent decisions than biased humans | Systematically disadvantages groups at scale; hard to detect and fix |
| Surveillance | CCTV, facial recognition, data collection | Deters crime; helps find missing people | Invasion of privacy; chilling effect on freedom; facial recognition errors |
| Automation | Robots/AI replacing human workers | Efficiency gains; removes humans from danger | Job displacement; growing inequality; retraining barriers |
| Digital divide | Unequal access to technology | Technology has made services more accessible overall | Excludes those who cannot access technology from education, employment, services |
| Data ethics | Companies collecting and profiting from personal data | Enables personalised services; drives innovation | Uninformed consent; exploitation; loss of privacy and autonomy |
| Algorithmic accountability | Who is responsible when AI causes harm | AI can supplement human judgement | Opacity ("black box"); unclear liability; potential for undetected bias |

---

## Case Study: TechCorp Ltd

**Scenario:** TechCorp Ltd is a software company. They operate a free app that stores users' contact details, location history, and browsing habits. Without telling users, TechCorp sells this data to advertisers. A disgruntled employee hacks into the rival company's server and modifies their pricing data.

**Legal issues:**
- TechCorp selling personal data without explicit consent → **Data Protection Act 2018 / UK GDPR** violation (purpose limitation: data used for something other than the stated purpose)
- The employee accessing and modifying the rival's server → **Computer Misuse Act 1990** (Offence 1: unauthorised access + Offence 3: unauthorised modification)

**Ethical issues:**
- Even if TechCorp buried consent in Terms & Conditions (making it technically legal), selling users' data without genuine informed consent is ethically questionable
- The employee's hacking is both illegal and widely considered unethical

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Legal issue | Something prohibited by law — breaking it can lead to prosecution |
| Ethical issue | A moral question about whether an action is right or wrong, regardless of legality |
| Computer Misuse Act | UK law (1990) criminalising unauthorised access to computer systems |
| Data Protection Act | UK law (2018/UK GDPR) governing the collection, storage, and use of personal data |
| Copyright | Legal protection for creators of original works |
| ICO | Information Commissioner's Office — UK regulator for data protection |
| Subject Access Request | A formal request by an individual to see all personal data held about them |
| Creative Commons | Licences that allow creators to specify permitted uses of their work |
| Open source | Software with publicly available source code and specific licence terms |
| AI bias | Discrimination embedded in AI systems because of biased training data |
| Digital divide | The gap between those with and without access to technology |
| Algorithmic accountability | The question of who is responsible when an AI system causes harm |
| Automation | Using technology to perform tasks previously done by humans |
| Surveillance | Monitoring of people's activities, movements, and communications |
| Intellectual property | Creative works or inventions protected by copyright, patents, or trademarks |
| Breach notification | Legal requirement to report data breaches to the ICO within 72 hours |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "Legal and ethical are the same thing" | Something can be legal but unethical (selling customer data with buried consent) or illegal but some might consider ethical (whistleblowing). They are separate categories that sometimes overlap. |
| "The Computer Misuse Act only applies to professional hackers" | The CMA applies to anyone who accesses a system without authorisation — including a student who guesses a classmate's password or a curious employee who reads files they are not supposed to see. |
| "If you remove names, data is anonymous" | Removing names often does not make data truly anonymous. If age, postcode, medical condition, and employer are all known, an individual can often be re-identified — a process called de-anonymisation. |
| "Copyright only covers music and films" | Copyright covers any original creative work — including software code, images, text, databases, and web content. |
| "AI is unbiased because it is a machine" | AI systems reflect the data they are trained on. If training data contains biases, the AI learns and amplifies those biases. Machines can be more consistently biased than humans. |

---

## Exam-Style Questions

**Q1 [1 mark]**
Describe **one** offence under the Computer Misuse Act 1990.

**Q2 [3 marks]**
Explain how the Data Protection Act 2018 protects individuals from the misuse of their personal data. Refer to at least **two** principles in your answer.

**Q3 [4 marks]**
A company collects customer email addresses and sells them to advertising companies without the customers' knowledge or explicit consent.

(a) State which UK law has been broken. [1 mark]
(b) Explain how the company has broken this law. [3 marks]

**Q4 [6 marks]**
A city council is planning to install facial recognition cameras in its town centre.

Evaluate this proposal by discussing:
- the relevant law(s) that apply
- the potential benefits
- the ethical concerns raised
- a reasoned conclusion

**Q5 [6 marks]**
Discuss how **automation** is changing employment. In your answer, consider:
- which types of jobs are most affected
- arguments in favour of automation
- arguments against automation
- the ethical responsibilities of companies that automate

**MCQ**
Which law protects an individual's right to know what personal data a company holds about them?

A) Computer Misuse Act 1990
B) Copyright, Designs and Patents Act 1988
C) Data Protection Act 2018
D) Freedom of Information Act 2000

**Fill in the blanks**
The __________ Act 1990 makes it illegal to access a computer system without __________. The Data Protection Act states that personal data must only be used for the __________ for which it was collected. An issue that is morally questionable but not illegal is an __________ issue. When AI systems are trained on biased historical data, they may produce __________ outcomes that discriminate against certain groups.

---

## Model Answers

**Q1:** Any one of: unauthorised access to computer material (e.g. accessing another person's account or files without permission); unauthorised access with intent to commit a further offence (e.g. hacking a system to commit fraud); unauthorised modification of computer material (e.g. planting a virus, deleting files, altering records). **[1 mark]**

**Q2:** Any two principles with explanation, for example:
- Purpose limitation: the DPA requires that personal data is only used for the specific purpose for which it was collected (1). If a company collects emails for order confirmations but then uses them for marketing, this violates the DPA (1).
- Storage limitation: the DPA requires that personal data is not kept longer than is necessary for its stated purpose (1). A company that retains customer data indefinitely after they have closed their account is in breach (1). **[3 marks: up to 2 per principle, but cap at 3 total]**

**Q3:**
(a) Data Protection Act 2018 / UK GDPR **[1 mark]**
(b) The Data Protection Act requires that personal data is used only for the specific, stated purpose for which it was collected (1). Selling email addresses to advertisers is a different purpose from that for which they were collected (1). Additionally, the DPA requires that data processing is done lawfully and transparently — the customers were not told their data would be sold, so there was no lawful basis for this processing (1). **[3 marks]**

**Q4:** Award marks for: identifying relevant laws (surveillance law, GDPR for biometric data) (1); benefit: prevents crime, deters criminals, helps identify suspects (1–2); ethical concern: invasion of privacy, facial recognition has higher error rates for darker skin tones (AI bias), chilling effect on freedom of movement (1–2); reasoned conclusion: must be balanced against proportionality, transparency, and safeguards (1). **[6 marks total]**

**Q5:** Award 1 mark per developed point, up to 6 marks:
- Jobs most affected: routine, repetitive manual work (factory assembly), transport (lorry/taxi drivers), customer service (call centres), some administrative roles.
- Arguments for: efficiency and productivity gains; humans freed from dangerous or monotonous work; lower costs leading to cheaper goods; new technology jobs created.
- Arguments against: job displacement particularly affects low-skilled workers; new jobs in technology may require high skills displaced workers do not have; increases income inequality.
- Ethical responsibilities: companies have a duty to consider the impact on workers, invest in retraining programmes, and not purely prioritise profit over people; governments may need to intervene with regulation or taxation of automation.

**MCQ:** C — Data Protection Act 2018

**Fill in the blanks:** Computer Misuse / authorisation (permission) / purpose / ethical / biased (discriminatory)

---

## Revision Checklist

- [ ] I can distinguish between a legal issue and an ethical issue with examples
- [ ] I can describe three offences under the Computer Misuse Act 1990
- [ ] I can state five principles from the Data Protection Act 2018 / UK GDPR
- [ ] I can explain what a Subject Access Request is
- [ ] I can explain what the ICO is and what it does
- [ ] I can describe what the Copyright, Designs and Patents Act protects
- [ ] I can explain what Creative Commons and open source licences are
- [ ] I can explain what AI bias is and give an example
- [ ] I can describe the digital divide and identify who is most affected
- [ ] I can explain what algorithmic accountability means
- [ ] I can construct a balanced argument about a computing ethical issue (surveillance, automation)
- [ ] I can identify which law applies to a given computing scenario
- [ ] I can evaluate a computing proposal by discussing legal, ethical, and social dimensions

## KS3 Computing — Lists, Arrays & Strings

- Pack ID: `ks3_computing_lists_arrays_strings`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_lists_arrays_strings/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_lists_arrays_strings/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Lists, Arrays & String Handling
**Year 7–9 | Programming Fundamentals | UK National Curriculum**

---

## Overview

Most real programs need to store and work with collections of related data, not just a single value. A school register, a set of quiz scores, the letters in a word — all of these are collections. Storing them as separate variables (`score1`, `score2`, `score3`, ...) becomes unmanageable very quickly. **Arrays** (called lists in Python) solve this by grouping related values under a single name, accessible by their position.

**Strings** are closely related. A string is actually a sequence of characters — in many ways, it behaves like a list of letters. Python gives programmers a rich set of tools for working with strings: finding their length, extracting portions of them, changing their case, splitting them into words, and much more. These skills are used constantly in real programs: processing user input, building output messages, validating passwords, and working with text data.

This pack covers both lists/arrays and string handling, exploring how to access, modify, and iterate over them — including key operations you are likely to be asked about in assessments.

---

## Section 1: Arrays and Lists

### What is an Array?

An **array** is an ordered collection of values stored under a single variable name. Each value is called an **element**, and each element is accessed by its **index** — its position in the array. Arrays are ideal for storing sets of related values: a list of scores, a set of names, the items in a shopping cart.

In Python, arrays are called **lists**. They are written using square brackets with elements separated by commas.

```python
scores = [85, 72, 90, 65, 88]
names  = ["Alice", "Bob", "Charlie"]
mixed  = [42, "hello", True]    # Python lists can mix types (arrays often cannot)
```

### Zero-Based Indexing

Array indices in Python (and most programming languages) start at **0**, not 1. This is called **zero-indexed**.

```
scores = [ 85,  72,  90,  65,  88 ]
index:     0    1    2    3    4
```

| Index | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| Value | 85 | 72 | 90 | 65 | 88 |

```python
print(scores[0])   # 85  (first element)
print(scores[2])   # 90  (third element)
print(scores[4])   # 88  (last element)
print(scores[-1])  # 88  (last element — negative indexing)
```

### Modifying Elements

```python
scores[1] = 99     # Change the second element from 72 to 99
scores[0] = scores[0] + 5   # Increase first element by 5 (85 → 90)
```

Changing one element does **not** affect other elements in the list.

### Finding the Length

```python
length = len(scores)   # Returns 5 — the number of elements
```

### Common List Operations

| Operation | Python code | Effect |
|---|---|---|
| Access element | `scores[2]` | Returns the element at index 2 |
| Modify element | `scores[2] = 95` | Replaces element at index 2 with 95 |
| Append (add to end) | `scores.append(77)` | Adds 77 as a new last element |
| Remove element | `scores.remove(65)` | Removes the first occurrence of 65 |
| Length | `len(scores)` | Returns the number of elements |
| Iterate | `for s in scores:` | Loops through each element in order |

### Iterating Over a List

```pseudocode
scores ← [85, 72, 90, 65, 88]
FOR i ← 0 TO len(scores) - 1
    OUTPUT scores[i]
ENDFOR
```

```python
scores = [85, 72, 90, 65, 88]
for score in scores:
    print(score)
```

### Finding the Largest Element

```pseudocode
scores ← [85, 72, 90, 65, 88]
largest ← scores[0]
FOR i ← 1 TO len(scores) - 1
    IF scores[i] > largest THEN
        largest ← scores[i]
    ENDIF
ENDFOR
OUTPUT largest
```

### 2D Arrays (Awareness Level)

A **2D array** is an array of arrays — a grid of values. In Python this is a list of lists.

```python
grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]
print(grid[1][2])   # Row 1, Column 2 → 6
```

2D arrays are used for grids, tables, and game boards (e.g., chess, noughts and crosses).

---

## Section 2: String Handling

### What is a String?

A **string** is a sequence of characters enclosed in quote marks. Every character in a string has an index, just like a list — starting at 0.

```
"Computing"
  C  o  m  p  u  t  i  n  g
  0  1  2  3  4  5  6  7  8
```

### String Indexing

```python
word = "Computing"
print(word[0])    # C
print(word[4])    # u
print(word[-1])   # g (last character)
```

### String Length

```python
print(len("Computing"))   # 9
print(len(""))            # 0 (empty string)
```

### String Slicing

**Slicing** extracts a portion of a string using `[start:stop]`. The character at `start` is included; the character at `stop` is **excluded**.

```python
word = "Computing"
print(word[0:4])    # "Comp"  (indices 0, 1, 2, 3)
print(word[4:9])    # "uting" (indices 4, 5, 6, 7, 8)
print(word[3:])     # "puting" (from index 3 to end)
print(word[:4])     # "Comp"  (from start to index 3)
```

### String Concatenation

Strings are joined using the `+` operator.

```python
first = "Hello"
second = "World"
message = first + " " + second    # "Hello World"
```

Note: you can only concatenate strings with strings. `"Score: " + 85` causes a TypeError — you must use `str(85)` first.

### String Methods

Python provides many built-in methods for working with strings:

| Method | What it does | Example | Result |
|---|---|---|---|
| `.upper()` | Converts to uppercase | `"hello".upper()` | `"HELLO"` |
| `.lower()` | Converts to lowercase | `"HELLO".lower()` | `"hello"` |
| `.strip()` | Removes leading/trailing whitespace | `"  hi  ".strip()` | `"hi"` |
| `.replace(old, new)` | Replaces all occurrences of old with new | `"cat".replace("c","b")` | `"bat"` |
| `.split(delimiter)` | Splits string into a list at each delimiter | `"a,b,c".split(",")` | `["a","b","c"]` |
| `.find(sub)` | Returns index of first occurrence of sub | `"hello".find("l")` | `2` |

### Type Conversion Between Strings and Numbers

```python
num_string = "42"
num_int    = int(num_string)      # "42" → 42
num_float  = float("3.14")       # "3.14" → 3.14
back_to_str = str(99)             # 99 → "99"
```

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Array | An ordered collection of values stored under one name, accessed by index |
| List | Python's implementation of an array; can hold multiple values of any type |
| Element | An individual value stored in an array/list |
| Index | The numerical position of an element in an array/list; starts at 0 |
| Zero-indexed | Indexing that begins at 0; the first element is at index 0, not index 1 |
| `len()` | Python function that returns the number of elements in a list, or characters in a string |
| `.append()` | Python list method that adds an element to the end of the list |
| 2D array | An array of arrays; used to represent a grid or table |
| String | A sequence of characters enclosed in quotes; treated as a data type for text |
| Concatenation | Joining two or more strings together using the `+` operator |
| Slicing | Extracting a portion of a string or list using `[start:stop]` notation |
| String method | A built-in function associated with string objects (e.g., `.upper()`, `.split()`) |
| Type conversion | Converting a value from one data type to another (e.g., `int("5")`, `str(99)`) |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| The first element of an array is at index 1 | Arrays are **zero-indexed**: the first element is at index **0**, the second at index 1, and so on. |
| Strings cannot be indexed like lists | Strings support all the same indexing and slicing operations as lists. `"Computing"[0]` gives `"C"`. |
| Changing one element of a list changes the whole list | Each element is independent. `scores[2] = 99` only changes the element at index 2. |
| You can concatenate a string and an integer with `+` | `"Score: " + 85` causes a **TypeError**. You must convert the integer first: `"Score: " + str(85)`. |
| `.split()` splits a string into individual characters | `.split()` splits at whitespace (spaces) by default, or at a specified delimiter. To split into characters, use `list("hello")`. |
| `len("Computing")` returns 8 | "Computing" has **9** characters (C-o-m-p-u-t-i-n-g), so `len("Computing")` returns 9. |
| `scores[-1]` is an error | Negative indexing is valid in Python. `-1` refers to the last element, `-2` to the second-last, etc. |

---

## Diagrams / Code Examples

### List Index Diagram

```
 List:    scores = [ 85,  72,  90,  65,  88 ]

 Index:              0    1    2    3    4
 Neg index:         -5   -4   -3   -2   -1

 scores[0]  →  85
 scores[2]  →  90
 scores[-1] →  88
```

### String Index Diagram

```
 String:  word = "Computing"

 Index:           0  1  2  3  4  5  6  7  8
 Character:       C  o  m  p  u  t  i  n  g

 word[0]      →  'C'
 word[0:4]    →  'Comp'
 word[4:]     →  'uting'
 len(word)    →  9
```

### Trace Table: List Manipulation

Program:
```pseudocode
marks ← [60, 75, 80]
marks[0] ← marks[0] + 10
marks[2] ← marks[1] - 5
OUTPUT marks[0]
OUTPUT marks[1]
OUTPUT marks[2]
```

| Line | Action | `marks[0]` | `marks[1]` | `marks[2]` | Output |
|---|---|---|---|---|---|
| Init | `marks ← [60, 75, 80]` | 60 | 75 | 80 | |
| 2 | `marks[0] ← 60 + 10` | 70 | 75 | 80 | |
| 3 | `marks[2] ← 75 - 5` | 70 | 75 | 70 | |
| 4 | `OUTPUT marks[0]` | 70 | 75 | 70 | `70` |
| 5 | `OUTPUT marks[1]` | 70 | 75 | 70 | `75` |
| 6 | `OUTPUT marks[2]` | 70 | 75 | 70 | `70` |

### Iterating a List with FOR

```python
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print("I like", fruit)
```

Output:
```
I like apple
I like banana
I like cherry
```

### String Operations Example

```python
sentence = "  Hello, World!  "

print(sentence.strip())           # "Hello, World!"
print(sentence.strip().lower())   # "hello, world!"
print(sentence.strip().upper())   # "HELLO, WORLD!"
print(sentence.strip().replace("World", "Python"))  # "Hello, Python!"

words = "red,green,blue".split(",")
print(words)    # ["red", "green", "blue"]
print(words[1]) # "green"
```

### Finding Largest in List (Pseudocode)

```pseudocode
numbers ← [34, 12, 78, 56, 23]
largest ← numbers[0]
FOR i ← 1 TO len(numbers) - 1
    IF numbers[i] > largest THEN
        largest ← numbers[i]
    ENDIF
ENDFOR
OUTPUT "Largest: " + str(largest)
```

Trace:

| `i` | `numbers[i]` | `largest` |
|---|---|---|
| start | — | 34 |
| 1 | 12 | 34 (12 not > 34) |
| 2 | 78 | 78 (78 > 34) |
| 3 | 56 | 78 (56 not > 78) |
| 4 | 23 | 78 (23 not > 78) |

Output: `Largest: 78`

---

## Exam-Style Questions

**Q1** [1 mark]
A list is defined as: `myList = [10, 20, 30, 40, 50]`
What is the index of the first element?

---

**Q2** [1 mark]
Using the same list as Q1, what is the output of `print(myList[2])`?

---

**Q3** [2 marks]
The following list stores student scores:
`scores = [45, 78, 62, 91, 55]`

a) Write one line of Python code that adds the value 88 to the end of the list. [1 mark]
b) After running your code, what is `len(scores)`? [1 mark]

---

**Q4** [3 marks]
Explain what each of the following string operations does, and state the result when applied to `text = "Computing"`:

a) `text[0]`
b) `text[0:4]`
c) `len(text)`

---

**Q5** [3 marks]
Write a pseudocode program that:
- stores the numbers `[3, 7, 1, 9, 4]` in an array called `values`
- uses a FOR loop to add up all the numbers
- outputs the total

---

**Q6** [4 marks]
Trace through the following program, completing the trace table.

```pseudocode
data ← [5, 10, 15]
total ← 0
FOR i ← 0 TO 2
    total ← total + data[i]
ENDFOR
OUTPUT total
```

| `i` | `data[i]` | `total` before addition | `total` after addition |
|---|---|---|---|
| 0 | | 0 | |
| 1 | | | |
| 2 | | | |
| Output | | | |

---

**Q7** [2 marks]
Describe three string methods available in Python. For each, state what it does and give an example.

---

**MCQ** [1 mark]
What is the output of the following code?

```python
word = "algorithm"
print(word[3:6])
```

A) `"algo"`
B) `"ori"`
C) `"gor"`
D) `"rith"`

---

**Fill in the blank** [1 mark]
The Python method that splits a string into a list of substrings is `________`.

---

## Model Answers

**Q1:** Index **0** [1]

**Q2:** `30` [1] (index 2 is the third element: 10 at 0, 20 at 1, 30 at 2)

**Q3:**
a) `scores.append(88)` [1]
b) `6` [1] (was 5 elements, now 6)

**Q4:**
a) `text[0]` — accesses the character at index 0 — result: `"C"` [1]
b) `text[0:4]` — slices from index 0 up to (not including) index 4 — result: `"Comp"` [1]
c) `len(text)` — returns the number of characters in the string — result: `9` [1]

**Q5:**
```pseudocode
values ← [3, 7, 1, 9, 4]
total ← 0
FOR i ← 0 TO 4
    total ← total + values[i]
ENDFOR
OUTPUT total
```
[1 for correct initialisation of total; 1 for correct loop structure; 1 for correct output — total should be 24]

**Q6:**

| `i` | `data[i]` | `total` before | `total` after |
|---|---|---|---|
| 0 | 5 | 0 | 5 |
| 1 | 10 | 5 | 15 |
| 2 | 15 | 15 | 30 |
| Output | | | `30` |

[1 per correct row + output]

**Q7:** Any three from:
- `.upper()` — converts all characters to uppercase. Example: `"hello".upper()` → `"HELLO"` [1]
- `.lower()` — converts all characters to lowercase. Example: `"HELLO".lower()` → `"hello"` [1]
- `.strip()` — removes leading and trailing whitespace. Example: `"  hi  ".strip()` → `"hi"` [1]
- `.split(",")` — splits string into a list at each comma (or specified delimiter). Example: `"a,b,c".split(",")` → `["a","b","c"]` [1]
- `.replace("old","new")` — replaces all occurrences. Example: `"cat".replace("c","b")` → `"bat"` [1]
(Max 2 marks for descriptions, 1 for examples — total 2 marks for 3 correct methods with examples)

**MCQ:** C — `"gor"` [1]
`"algorithm"`: a(0) l(1) g(2) o(3) r(4) i(5) t(6) h(7) m(8). `[3:6]` → indices 3,4,5 → `"ori"`. Wait — index 3='o', 4='r', 5='i'. So `"ori"`. Answer: **B** — `"ori"`.
*(Correction: the answer is B. The string "algorithm" at indices 3,4,5 gives 'o','r','i' = "ori".)*

**Fill in the blank:** `.split()` [1]

---

## Revision Checklist

- [ ] I can explain what an array (list) is and why it is useful compared to separate variables.
- [ ] I understand zero-based indexing and can identify the correct index for any element.
- [ ] I can access, read, and modify individual elements of a list using their index.
- [ ] I can use `len()` to find the number of elements in a list.
- [ ] I can use `.append()` to add an element to the end of a list.
- [ ] I can iterate over a list using a FOR loop, both with an index and using `for item in list`.
- [ ] I can write pseudocode/Python to find the largest (or smallest) value in a list.
- [ ] I understand what a 2D array is and can access elements using two indices.
- [ ] I understand that a string is a sequence of characters and can be indexed like a list.
- [ ] I can use string indexing (`word[0]`) and slicing (`word[0:4]`) correctly.
- [ ] I can use `len()` on a string to find its length.
- [ ] I can concatenate strings using `+` and explain why `"text" + number` causes a TypeError.
- [ ] I can describe and use at least five string methods: `.upper()`, `.lower()`, `.strip()`, `.replace()`, `.split()`.
- [ ] I can convert between strings and numbers using `int()`, `float()`, and `str()`.
- [ ] I can trace a program that uses lists through a trace table.

## KS3 Computing — Logic Gates & Boolean Logic

- Pack ID: `ks3_computing_logic_gates_boolean`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_logic_gates_boolean/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_logic_gates_boolean/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Logic Gates & Boolean Logic
**Year 7–9 | Computer Systems | UK National Curriculum**

---

## Overview

Every calculation a computer makes, every decision a program reaches, and every pixel displayed on a screen is ultimately the result of billions of tiny electronic components making simple true/false decisions. These components are **logic gates** — the fundamental building blocks of all digital circuits.

Logic gates implement **Boolean logic**, a form of algebra where there are only two values: **True (1)** and **False (0)**. Understanding how individual gates work, reading and constructing truth tables, and combining gates into circuits are foundational skills in computer science.

By the end of this pack you will be able to:
- Explain Boolean logic and its two values
- Describe and apply the NOT, AND, OR, NAND, NOR, and XOR gates
- Write complete truth tables for all six gate types
- Combine logic gates to trace circuit outputs
- Connect Boolean logic to programming decisions

---

## Section 1: Boolean Logic

**Boolean logic** (named after mathematician George Boole) is a system of logic where every value is either:
- **True** — represented as **1**
- **False** — represented as **0**

There are no in-between values. This maps perfectly onto binary computer hardware, where each transistor is either on (1) or off (0).

**Connection to programming:**

When you write a condition in a program, you are using Boolean logic:

```pseudocode
IF age >= 18 AND hasTicket = TRUE THEN
    allowEntry()
ELSE
    denyEntry()
ENDIF
```

The `AND` in this code is exactly the same logical operation as an AND logic gate in hardware. The condition `age >= 18` evaluates to either True (1) or False (0).

**Truth tables** are tables that show every possible combination of inputs and the resulting output for a logical operation. For n inputs, a truth table has **2^n rows** (all possible combinations).

---

## Section 2: The Six Logic Gates

### NOT Gate

The **NOT gate** has a **single input** and **inverts** (reverses) it.
- Input 0 → Output 1
- Input 1 → Output 0

**Symbol description:** A triangle pointing right with a small circle (bubble) at the output tip. The circle denotes inversion.

**Boolean expression:** Output = NOT A (also written as Ā or A')

**Truth table for NOT:**

| Input A | Output (NOT A) |
|---------|---------------|
| 0 | 1 |
| 1 | 0 |

**Real-world example:** A NOT gate could represent a light switch where output is 1 (light on) when input is 0 (switch not pressed), and 0 (light off) when input is 1 (switch pressed) — an inverter.

---

### AND Gate

The **AND gate** has **two inputs** and outputs 1 **only when BOTH inputs are 1**.
- Output is 1 only if A = 1 AND B = 1
- Any 0 input gives output 0

**Symbol description:** A D-shape — flat left side, curved right side (like the letter D).

**Boolean expression:** Output = A AND B (also written A · B)

**Truth table for AND:**

| Input A | Input B | Output (A AND B) |
|---------|---------|-----------------|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | **1** |

**Real-world example:** A security system door that opens only when both a valid keycard (A=1) AND a correct PIN (B=1) are provided. Either one alone is not enough.

---

### OR Gate

The **OR gate** has **two inputs** and outputs 1 **when AT LEAST ONE input is 1**.
- Output is 0 only when BOTH inputs are 0

**Symbol description:** A curved D-shape — curved on both left and right sides. The input side is curved inward; the output side tapers to a point.

**Boolean expression:** Output = A OR B (also written A + B)

**Truth table for OR:**

| Input A | Input B | Output (A OR B) |
|---------|---------|----------------|
| 0 | 0 | 0 |
| 0 | 1 | **1** |
| 1 | 0 | **1** |
| 1 | 1 | **1** |

**Real-world example:** A burglar alarm that triggers when either the front door sensor (A) OR the window sensor (B) detects an intrusion. Either one alone is enough to activate it.

---

### NAND Gate

The **NAND gate** is a **NOT-AND** gate: it produces the opposite output of an AND gate.
- Output is 0 ONLY when both inputs are 1
- Output is 1 in all other cases

**Symbol description:** Same D-shape as AND gate, but with a small circle (bubble) at the output.

**Boolean expression:** Output = NOT(A AND B) (also written as Ā · B̄ using De Morgan's law)

**Truth table for NAND:**

| Input A | Input B | AND result | Output (NAND = NOT AND) |
|---------|---------|-----------|------------------------|
| 0 | 0 | 0 | **1** |
| 0 | 1 | 0 | **1** |
| 1 | 0 | 0 | **1** |
| 1 | 1 | 1 | **0** |

**Why NAND is important:** The NAND gate is a **universal gate** — any other gate type can be built from combinations of NAND gates alone. All computer circuits can theoretically be built from just NAND gates.

---

### NOR Gate

The **NOR gate** is a **NOT-OR** gate: it produces the opposite output of an OR gate.
- Output is 1 ONLY when BOTH inputs are 0
- Output is 0 in all other cases

**Symbol description:** Same curved shape as OR gate, but with a small circle (bubble) at the output.

**Boolean expression:** Output = NOT(A OR B)

**Truth table for NOR:**

| Input A | Input B | OR result | Output (NOR = NOT OR) |
|---------|---------|----------|----------------------|
| 0 | 0 | 0 | **1** |
| 0 | 1 | 1 | **0** |
| 1 | 0 | 1 | **0** |
| 1 | 1 | 1 | **0** |

**Real-world example:** A system that triggers an alert only when there is NO activity — input A (motion sensor) is 0 AND input B (sound sensor) is 0 → output 1 (alarm sounds because nothing is moving — something may be wrong).

---

### XOR Gate (Exclusive OR)

The **XOR gate** outputs 1 **only when the inputs are DIFFERENT** (one is 0 and the other is 1).
- Output is 0 when both inputs are the same (both 0 or both 1)
- Output is 1 when inputs are different

**Symbol description:** Same curved shape as OR gate, but with an **extra curved line** on the input side (a second curved line parallel to the input edge).

**Boolean expression:** Output = A XOR B (also written A ⊕ B)

**Truth table for XOR:**

| Input A | Input B | Output (A XOR B) |
|---------|---------|-----------------|
| 0 | 0 | 0 |
| 0 | 1 | **1** |
| 1 | 0 | **1** |
| 1 | 1 | 0 |

**Memorable rule:** XOR outputs 1 when inputs are **eXclusively** different — not when both are the same.

**Real-world use:** XOR is used in encryption (XOR-ing data with a key) and in binary addition (adding two bits: 0+1=1, 1+0=1, but 1+1=10 — the sum bit is XOR of the two inputs).

---

## Section 3: All Six Truth Tables — Quick Reference

| A | B | NOT A | NOT B | AND | OR | NAND | NOR | XOR |
|---|---|-------|-------|-----|----|------|-----|-----|
| 0 | 0 | 1 | 1 | 0 | 0 | 1 | 1 | 0 |
| 0 | 1 | 1 | 0 | 0 | 1 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 | 0 | 1 | 1 | 0 | 1 |
| 1 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |

**Memory tricks:**
- AND: **All 1s needed** (only 1 when A=1 AND B=1)
- OR: **Any 1 is enough** (only 0 when both are 0)
- NAND: **Not AND** (flip AND's output)
- NOR: **Not OR** (flip OR's output)
- XOR: **eXclusively different** (1 only when A≠B)
- NOT: **Inverts** (single input, opposite output)

---

## Section 4: Combining Logic Gates

Gates can be connected together, with the output of one gate becoming an input to another. The result is a **logic circuit** that can express complex conditions.

### How to Trace a Combined Circuit

1. Identify the inputs and their values
2. Work from left to right (inputs → outputs)
3. Calculate the output of each gate in sequence
4. The final gate's output is the circuit's output

---

### Worked Example 1: A AND B, then NOT (= NAND)

```
Circuit:
A ──┐
    ├── [AND gate] ──── [NOT gate] ──── Output
B ──┘
```

This is equivalent to a NAND gate. Let's verify by tracing all input combinations:

| A | B | A AND B | NOT(A AND B) = Output |
|---|---|---------|-----------------------|
| 0 | 0 | 0 | 1 |
| 0 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 |
| 1 | 1 | 1 | 0 |

This matches the NAND truth table exactly. A NOT gate after an AND gate creates a NAND.

---

### Worked Example 2: (A AND B) OR C

```
Circuit:
A ──┐
    ├── [AND gate] ──┐
B ──┘                ├── [OR gate] ──── Output
C ───────────────────┘
```

Boolean expression: Output = (A AND B) OR C

Trace for A=1, B=1, C=0:
```
Step 1: A AND B → 1 AND 1 = 1
Step 2: 1 OR C → 1 OR 0 = 1
Output = 1
```

Trace for A=0, B=1, C=0:
```
Step 1: A AND B → 0 AND 1 = 0
Step 2: 0 OR C → 0 OR 0 = 0
Output = 0
```

Full truth table for (A AND B) OR C:

| A | B | C | A AND B | (A AND B) OR C |
|---|---|---|---------|----------------|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 | 1 |
| 0 | 1 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 | 1 |
| 1 | 0 | 0 | 0 | 0 |
| 1 | 0 | 1 | 0 | 1 |
| 1 | 1 | 0 | 1 | 1 |
| 1 | 1 | 1 | 1 | 1 |

Note: 3 inputs → 2³ = **8 rows** required for a complete truth table.

---

### Worked Example 3: NOT A AND B

```
Circuit:
A ── [NOT gate] ──┐
                  ├── [AND gate] ──── Output
B ────────────────┘
```

Boolean expression: Output = (NOT A) AND B

| A | B | NOT A | (NOT A) AND B |
|---|---|-------|--------------|
| 0 | 0 | 1 | 0 |
| 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 0 |
| 1 | 1 | 0 | 0 |

This circuit outputs 1 **only when A=0 and B=1** — the output is true when B is true but A is not.

---

## Section 5: Logic Gates in Programming and Hardware

### Connection to Programming

Every conditional statement in a program is Boolean logic in action:

```pseudocode
IF isLoggedIn = TRUE AND hasPermission = TRUE THEN
    showAdminPanel()
ENDIF
```

The condition `isLoggedIn AND hasPermission` is evaluated by the CPU using AND gate logic at the hardware level.

```pseudocode
IF buttonPressed = TRUE OR timerExpired = TRUE THEN
    triggerAction()
ENDIF
```

OR logic: the action triggers if at least one condition is true.

### Connection to Hardware

- The **ALU** (Arithmetic Logic Unit) inside the CPU is made entirely from logic gates
- Adding two binary numbers uses a circuit called a **full adder** — built from XOR and AND gates
- Computer **memory** (flip-flops) is built from NAND and NOR gates
- All decision-making circuitry in a CPU uses AND, OR, NOT combinations

---

## Gate Symbol Reference

```
NOT gate:
           ┌───────▷○── Output
  Input A ─┤   (triangle with bubble at output)
           └────────

AND gate:
  Input A ─┐
           ├── D ─── Output
  Input B ─┘   (flat left, curved right)

OR gate:
  Input A ─┐
           ├──◁─── Output
  Input B ─┘  (curved both sides, arrow-like point)

NAND gate (AND + bubble):
  Input A ─┐
           ├── D ○── Output
  Input B ─┘   (AND shape with bubble)

NOR gate (OR + bubble):
  Input A ─┐
           ├──◁○── Output
  Input B ─┘  (OR shape with bubble)

XOR gate (OR with extra curve):
  Input A ─┐
           ╞──◁─── Output
  Input B ─┘  (OR shape with extra parallel curve on input side)

○ = inversion bubble (NOT)
```

---

## Key Vocabulary

| Term | Definition |
|------|-----------|
| **Boolean logic** | A system of logic where values are True (1) or False (0) only |
| **Logic gate** | An electronic component that performs a Boolean operation on one or more binary inputs |
| **Truth table** | A table showing all possible input combinations and the resulting output for a logic gate or circuit |
| **NOT gate** | Inverts a single input: 0→1, 1→0 |
| **AND gate** | Outputs 1 only when ALL inputs are 1 |
| **OR gate** | Outputs 1 when AT LEAST ONE input is 1 |
| **NAND gate** | NOT-AND: outputs 0 only when all inputs are 1; otherwise outputs 1 |
| **NOR gate** | NOT-OR: outputs 1 only when all inputs are 0; otherwise outputs 0 |
| **XOR gate** | Exclusive OR: outputs 1 only when inputs are different |
| **Boolean expression** | An algebraic expression using Boolean operators (AND, OR, NOT) |
| **Universal gate** | A gate from which any other gate can be constructed (NAND and NOR are both universal) |
| **Logic circuit** | Multiple connected logic gates where outputs of some gates feed into inputs of others |
| **Binary digit** | 0 or 1 — the values that flow through logic gate circuits |

---

## Common Misconceptions

| Misconception | Correction |
|---------------|-----------|
| "OR means one OR the other but not both" | This is XOR (Exclusive OR), not OR. A standard **OR gate outputs 1 when at least one input is 1** — including when both inputs are 1. OR(1,1)=1. |
| "XOR is the same as OR" | XOR (Exclusive OR) is different: it outputs 1 only when inputs are **different**. XOR(1,1)=**0**, but OR(1,1)=1. |
| "NAND is the same as NOT" | NOT has one input and inverts it. NAND has **two inputs** and is the inverse of AND. NAND(0,0)=1, NAND(1,1)=0. |
| "A truth table only needs one row" | A truth table must cover **all possible input combinations**. With 1 input: 2 rows. With 2 inputs: 4 rows. With 3 inputs: 8 rows. Always 2^n rows. |
| "Logic gates only exist in hardware" | Logic gates describe a mathematical/logical system that exists in software too. Every `AND`, `OR`, and `NOT` in your program code directly corresponds to these logical operations, executed by the CPU's ALU. |
| "NOR and NAND are just different names for the same thing" | They are completely different operations. NAND(0,0)=1 and NOR(0,0)=1 happen to agree, but NAND(0,1)=1 while NOR(0,1)=**0**. |

---

## Exam-Style Questions

### Q1 [1 mark]
What is the output of an **AND gate** when input A = 1 and input B = 0?

### Q2 [2 marks]
Complete the **truth table** for a NOT gate:

| Input A | Output |
|---------|--------|
| 0 | |
| 1 | |

### Q3 [3 marks]
Complete the truth table for a **NAND gate**:

| Input A | Input B | Output |
|---------|---------|--------|
| 0 | 0 | |
| 0 | 1 | |
| 1 | 0 | |
| 1 | 1 | |

### Q4 [3 marks]
Name the logic gate that produces an output of 1 **only when exactly one of its two inputs is 1** (not when both are 1 and not when both are 0). Write the complete truth table for this gate.

### Q5 [6 marks]
A logic circuit has three inputs: A, B, and C. The circuit works as follows:
- A and B are inputs to an AND gate. Call the output of this AND gate **X**.
- X and C are inputs to an OR gate. The output of this OR gate is the final output **Z**.

(a) Write the Boolean expression for the output Z. [1 mark]

(b) Complete the full truth table for this circuit, including the intermediate value X. [4 marks]

(c) For the input combination A=1, B=0, C=1, state the value of Z and explain which part of the circuit determines this. [1 mark]

### Multiple Choice Question
Which of the following correctly describes the output of an **XOR gate** when A = 1 and B = 1?

- A) 1 — because both inputs are 1
- B) 0 — because XOR outputs 1 only when the inputs are different
- C) 1 — because OR always outputs 1 when at least one input is 1
- D) 0 — because XOR is the same as AND

*(Answer: B)*

### Fill in the Blank
"A truth table for a gate with two inputs must have __________ rows to cover all possible combinations. The gate that outputs 1 only when all inputs are 1 is called a(n) __________ gate. The gate that inverts a single input is called a(n) __________ gate."

*(Answers: 4; AND; NOT)*

---

## Model Answers

### Q1 Model Answer
**0**

An AND gate outputs 1 only when BOTH inputs are 1. Since B = 0, the output is 0.

### Q2 Model Answer

| Input A | Output |
|---------|--------|
| 0 | **1** |
| 1 | **0** |

### Q3 Model Answer

| Input A | Input B | Output |
|---------|---------|--------|
| 0 | 0 | **1** |
| 0 | 1 | **1** |
| 1 | 0 | **1** |
| 1 | 1 | **0** |

### Q4 Model Answer

The gate is the **XOR (Exclusive OR) gate**.

Truth table for XOR:

| Input A | Input B | Output (A XOR B) |
|---------|---------|-----------------|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

### Q5 Model Answer

**(a)** Z = (A AND B) OR C

**(b)** Full truth table:

| A | B | C | X = A AND B | Z = X OR C |
|---|---|---|-------------|------------|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 | 1 |
| 0 | 1 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 | 1 |
| 1 | 0 | 0 | 0 | 0 |
| 1 | 0 | 1 | 0 | 1 |
| 1 | 1 | 0 | 1 | 1 |
| 1 | 1 | 1 | 1 | 1 |

**(c)** When A=1, B=0, C=1:
- X = A AND B = 1 AND 0 = **0**
- Z = X OR C = 0 OR 1 = **1**

Z = 1. The OR gate determines this result — even though the AND gate produces 0 (because B=0), the OR gate receives C=1 and outputs 1. The OR gate allows the circuit to output 1 if either the AND result or C alone is 1.

---

## Revision Checklist

- [ ] I can explain what Boolean logic is (two values only: True/1 and False/0)
- [ ] I know that a truth table must have 2^n rows for n inputs
- [ ] I can describe and apply the NOT gate (inverts single input)
- [ ] I can write the complete 2-row truth table for NOT
- [ ] I can describe and apply the AND gate (output 1 only when all inputs are 1)
- [ ] I can write the complete 4-row truth table for AND
- [ ] I can describe and apply the OR gate (output 1 when at least one input is 1)
- [ ] I can write the complete 4-row truth table for OR
- [ ] I can describe and apply the NAND gate (inverse of AND; output 0 only when all inputs are 1)
- [ ] I can write the complete 4-row truth table for NAND
- [ ] I can describe and apply the NOR gate (inverse of OR; output 1 only when all inputs are 0)
- [ ] I can write the complete 4-row truth table for NOR
- [ ] I can describe and apply the XOR gate (output 1 only when inputs are different)
- [ ] I can write the complete 4-row truth table for XOR
- [ ] I can trace the output of a combined logic circuit for given inputs
- [ ] I can construct a full truth table for a two-gate combined circuit
- [ ] I can explain how Boolean logic connects to programming conditions (IF A AND B)
- [ ] I can connect logic gates to the ALU inside the CPU
- [ ] I can identify and correct common misconceptions about OR, XOR, NAND, and NOR

## KS3 Computing — Network Types & Hardware

- Pack ID: `ks3_computing_network_types_hardware`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_network_types_hardware/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_network_types_hardware/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Network Types & Hardware
**Year 7–9 | Networks | UK National Curriculum**

---

## Overview

A **network** is two or more devices connected together so they can share data and resources. Networks are fundamental to modern computing — from the Wi-Fi in your home to the infrastructure linking millions of computers worldwide. This study pack covers the two main network types (LAN and WAN), how networks are physically laid out (topology), and the hardware devices that make them work.

**Why networks matter:** Without networks, every device would be isolated. Networks enable file sharing across devices, sharing of expensive peripherals like printers, shared internet access, centralised backup of all data, and centralised security management (one administrator can protect every device).

---

## Section 1: Network Types — LAN and WAN

### Local Area Network (LAN)

A **LAN** covers a small geographical area — a single building, school, office, or home. Key characteristics:

- **Ownership**: owned and managed entirely by the organisation using it (the school buys and maintains its own cables, switches, and routers)
- **Connections**: physical Ethernet cables (wired) or Wi-Fi (wireless)
- **Speed**: typically fast — Gigabit Ethernet (1000 Mbps) is common
- **Examples**: your school network, a home network, an office network

### Wide Area Network (WAN)

A **WAN** spans a large geographical area — a city, country, or the entire globe. Key characteristics:

- **Ownership**: relies on **public infrastructure** owned by telecommunications companies (telephone lines, fibre optic cables, satellites, and undersea cables)
- **Connections**: leased lines, fibre optic backbones, satellite links
- **Speed**: generally slower than LANs and more variable
- **Examples**: a bank's network connecting branches across the UK; a company's network linking offices in different countries; **the Internet is the largest WAN in the world**

### LAN vs WAN Comparison

| Feature | LAN | WAN |
|---|---|---|
| Geographical area | Small (building / campus) | Large (city / country / world) |
| Ownership | Owned by the organisation | Uses public/third-party infrastructure |
| Typical speed | Fast (Gbps) | Slower, more variable |
| Setup cost | Moderate (one-off hardware) | High (leased lines, ISP fees) |
| Security control | Organisation controls everything | Less control over external links |
| Example | School network | The Internet |

---

## Section 2: Network Topologies

A **topology** is the physical layout of how devices are connected in a network. There are three you need to know at KS3.

### Bus Topology

All devices connect to a single shared cable called the **bus** (or backbone). Data travels along the bus in both directions.

```
Device A    Device B    Device C    Device D
   |           |           |           |
===|===========|===========|===========|=== [Terminator]
                     BUS CABLE
[Terminator]
```

| Feature | Detail |
|---|---|
| Cost | Cheap — minimal cable used |
| Complexity | Simple to set up |
| Weakness | If the bus cable breaks, the ENTIRE network fails |
| Data collisions | Possible — all devices share one cable |
| Scalability | Poor — adding more devices increases collisions |

### Star Topology

All devices connect individually to a **central switch** (or hub). Data goes from device → switch → destination device.

```
            [Device A]
                |
[Device E]---[SWITCH]---[Device B]
                |
            [Device C]
                |
            [Device D]
```

| Feature | Detail |
|---|---|
| Cost | More expensive — more cable required |
| Reliability | If ONE device fails, others are unaffected |
| Weakness | If the central switch fails, the WHOLE network goes down |
| Performance | Efficient — switch sends data only to intended recipient |
| Scalability | Good — easy to add new devices |
| Most common | Yes — used in most schools and offices |

### Ring Topology

Devices are connected in a closed loop. Each device connects to the next, and data travels around the ring in one direction.

```
[Device A] --- [Device B]
    |                |
[Device D] --- [Device C]
```

Less common in modern networks. A single break in the ring can disrupt all communications.

---

## Section 3: Network Hardware

### Router

- **Purpose**: connects a LAN to the internet (or connects two different networks together)
- **How it works**: examines the destination IP address in each data packet and **routes** it toward its destination via the best available path
- **Additional roles**: assigns IP addresses to devices on the network via DHCP; acts as the network **gateway** (the "door" to the outside world)
- **Where**: every home and school has at least one router

### Switch

- **Purpose**: connects devices **within** a LAN
- **How it works**: learns the MAC addresses of connected devices and sends incoming data **only to the correct destination device** — not to everyone
- **Advantage over hub**: much more efficient; reduces unnecessary traffic
- **Where**: found inside schools and offices, often in network cupboards

### Hub

- **Purpose**: older device for connecting devices within a LAN
- **How it works**: broadcasts incoming data to **ALL** connected devices — every device receives every packet
- **Weakness**: inefficient, creates unnecessary traffic, security risk (any device can see all data)
- **Status**: largely replaced by switches in modern networks

### NIC (Network Interface Card)

- **Purpose**: the hardware component **inside each device** that enables it to connect to a network
- **How it works**: converts data between the format used inside the computer and the format sent over the network
- **MAC address**: every NIC has a unique 48-bit **Media Access Control address** burned in at manufacture — used to identify devices within a LAN
- **Types**: wired NIC (Ethernet port) or wireless NIC (Wi-Fi)

### WAP (Wireless Access Point)

- **Purpose**: allows wireless (Wi-Fi) devices to connect to a wired network
- **How it works**: connected to the wired network via Ethernet; broadcasts a Wi-Fi signal; devices connect wirelessly and are then part of the LAN
- **Example**: the white boxes mounted on walls in school classrooms are usually WAPs

### Ethernet Cable

- **Purpose**: physical wired connection between devices and switches/routers
- **Common types**: Cat5e (up to 1 Gbps), Cat6 (up to 10 Gbps)
- **Characteristics**: reliable, fast, not susceptible to wireless interference

### Wired vs Wireless Comparison

| Feature | Wired (Ethernet) | Wireless (Wi-Fi) |
|---|---|---|
| Speed | Faster (up to 10 Gbps) | Slower (typical 100-600 Mbps) |
| Reliability | Very reliable — consistent signal | Can suffer interference (walls, other devices) |
| Security | More secure — attacker must physically plug in | Less secure — signals travel through air |
| Flexibility | Limited — devices must be near cable | High — connect from anywhere in range |
| Cost | Cable infrastructure needed | WAPs needed; devices need wireless NIC |
| Suitable for | Desktop computers, servers | Laptops, tablets, phones |

### Router vs Switch — Key Role Difference

| Device | Connects… | Operates at… | Sends data to… |
|---|---|---|---|
| Router | Different networks (LAN ↔ Internet) | Network layer (uses IP addresses) | Correct network/internet path |
| Switch | Devices within a LAN | Data link layer (uses MAC addresses) | Specific destination device only |
| Hub | Devices within a LAN | Physical layer | ALL connected devices (broadcast) |

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Network | Two or more devices connected to share data and resources |
| LAN | Local Area Network — covers a small geographical area, owned by the organisation |
| WAN | Wide Area Network — spans a large area, uses public infrastructure |
| Topology | The physical layout of how devices are connected in a network |
| Bus topology | All devices connect to a single shared cable |
| Star topology | All devices connect individually to a central switch |
| Router | Device that connects a LAN to the internet; routes data packets using IP addresses |
| Switch | Connects devices in a LAN; sends data only to the intended recipient device |
| Hub | Older device that broadcasts data to all connected devices |
| NIC | Network Interface Card — hardware component enabling a device to connect to a network |
| MAC address | Unique 48-bit hardware address assigned to every NIC at manufacture |
| WAP | Wireless Access Point — allows wireless devices to connect to a wired network |
| IP address | Unique numerical identifier assigned to each device on a network |
| DHCP | Protocol used by routers to automatically assign IP addresses to devices |
| Ethernet | Wired networking technology; uses Cat5e/Cat6 cables |
| Packet | A small chunk of data transmitted across a network |
| Gateway | The router that connects a local network to external networks/the internet |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "A router and a switch are the same thing" | A router connects different networks (LAN to internet); a switch connects devices within a LAN. They do different jobs at different layers. |
| "WAN means wireless" | WAN stands for Wide Area Network — it refers to geographical size, not wireless technology. A WAN can use both wired and wireless connections. |
| "A hub is better than a switch because it shares with everyone" | Hubs are less efficient and less secure because they broadcast to ALL devices. Switches are smarter — they send data only to the intended recipient. |
| "Modern Wi-Fi is too slow for school networks" | Modern Wi-Fi (Wi-Fi 6) can reach speeds sufficient for most tasks. However, for reliability and security in a school with 300+ computers, wired connections are still preferred. |
| "In a star network, all devices can see each other's data" | In a star topology with a switch (not a hub), the switch sends data only to the intended device. Other devices cannot see it. |

---

## Diagrams / ASCII Art

### Star Topology — School Network

```
                    [Laptop 1]
                         |
        [Desktop 1]---[SWITCH]---[Desktop 2]
                         |
                    [Laptop 2]
                         |
                    [Printer]

Note: If Switch fails → ALL devices lose connection
      If one Device fails → only that device is affected
```

### Bus Topology

```
[Term.]====[PC 1]====[PC 2]====[PC 3]====[PC 4]====[Term.]
                    BUS CABLE (single shared cable)

Note: If bus cable is cut anywhere → ENTIRE network fails
```

### How a Router Connects a LAN to the Internet

```
[PC 1]---+
[PC 2]---+---[SWITCH]---[ROUTER]---[INTERNET]
[PC 3]---+
[WAP]----+
           LAN              WAN
```

---

## Exam-Style Questions

**Q1 [1 mark]**
State **one** difference between a LAN and a WAN.

**Q2 [2 marks]**
Describe the role of a **router** in a computer network.

**Q3 [4 marks]**
Describe how a **star topology** is arranged. State **one** advantage and **one** disadvantage of a star topology compared to a bus topology.

**Q4 [4 marks]**
A school is building a new computer lab with 30 desktop computers. A network manager recommends using **wired connections** rather than wireless.

Explain **two** reasons why wired connections would be more suitable in this situation.

**Q5 [6 marks]**
A large school has 300 computers across multiple buildings. Describe the network hardware that would be needed and explain the role of each device. You should include: NIC, switch, WAP, and router.

**MCQ**
Which device connects a LAN to the internet?

A) Switch
B) Hub
C) Router
D) NIC

**Fill in the blanks**
In a __________ topology, all devices connect to a central __________. This means that if one device fails, the rest of the network is __________. However, if the central device fails, the __________ network goes down.

---

## Model Answers

**Q1:** A LAN covers a small geographical area (such as a school or office) whereas a WAN covers a large geographical area (such as a country or the whole world). **[1 mark for a valid difference]**

**Q2:** A router connects a local network (LAN) to the internet or to other networks (1). It examines the destination IP address of each data packet and routes it along the best path toward its destination (1). **[2 marks]**

**Q3:**
- In a star topology, each device is connected individually to a central switch using its own dedicated cable (1).
- Advantage: if one device fails, all other devices remain connected and the network continues working (1).
- Disadvantage: if the central switch fails, the entire network goes down (1) / star topology requires more cable than bus topology, making it more expensive (1). **[1 mark description + 1 advantage + 1 disadvantage = 3 marks; fourth mark for quality/detail]**

**Q4:**
- Wired connections are faster and more reliable than wireless — there is no interference from walls or other wireless signals, ensuring consistent performance for 30 simultaneous users (1 + 1).
- Wired connections are more secure — data travels through a physical cable and an attacker cannot intercept the signal without physically connecting to the network, unlike wireless signals which can be captured remotely (1 + 1). **[2 marks per reason: identification + explanation]**

**Q5:** Award 1 mark each for identifying the device + 1 mark for explaining its role, up to 6 marks:
- NIC: every computer needs a NIC (Network Interface Card) which is the internal hardware that physically enables the computer to connect to the network. Each NIC has a unique MAC address.
- Switch: multiple switches connect all 300 computers within the buildings, sending data only to the intended recipient device rather than broadcasting to all.
- WAP: Wireless Access Points are needed for any wireless devices (laptops, tablets) to connect to the wired network. WAPs are mounted in rooms and broadcast Wi-Fi.
- Router: the router connects the entire school LAN to the internet (WAN), routes data packets using IP addresses, and assigns IP addresses to devices via DHCP.

**MCQ:** C — Router

**Fill in the blanks:** star / switch / unaffected / entire

---

## Revision Checklist

- [ ] I can define what a network is and list three benefits of networking
- [ ] I can describe a LAN and give two characteristics
- [ ] I can describe a WAN and give two characteristics
- [ ] I can identify the Internet as the largest WAN
- [ ] I can draw and label a star topology diagram
- [ ] I can draw and label a bus topology diagram
- [ ] I can state one advantage and one disadvantage of each topology
- [ ] I can explain the role of a router (connects LAN to internet, routes packets)
- [ ] I can explain the role of a switch (connects LAN devices, sends to intended device only)
- [ ] I can explain why a switch is better than a hub
- [ ] I can explain the role of a NIC and what a MAC address is
- [ ] I can explain the role of a WAP
- [ ] I can compare wired and wireless connections (speed, security, reliability, flexibility)
- [ ] I can state which network type suits a specific scenario and justify my answer

## KS3 Computing — Operating Systems & Software

- Pack ID: `ks3_computing_os_software`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_os_software/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_os_software/pack_unified.json`

### Source Content

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

## KS3 Computing — Pattern Recognition

- Pack ID: `ks3_computing_pattern_recognition`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_pattern_recognition/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_pattern_recognition/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Pattern Recognition
**Year 7–9 | Computational Thinking | UK National Curriculum**

---

## Overview

Pattern recognition is the third pillar of computational thinking. It means identifying **similarities, trends, and repeating structures** within or across problems. By spotting patterns, a programmer can apply the same solution many times, write more efficient code, and build systems that respond intelligently to data.

Pattern recognition is not just a computing skill — it underpins science (identifying trends in experimental results), mathematics (finding rules in sequences), and everyday life (recognising that traffic is always bad at 8 am).

---

## Section 1: What is Pattern Recognition?

**Pattern recognition** is the skill of noticing things that repeat, share a structure, or follow a predictable rule — and using that observation to find a more efficient solution.

In computing, patterns appear in:
- **Data**: sequences of numbers or values that follow a rule
- **Problems**: different tasks that share the same underlying structure
- **Programs**: repeated blocks of code that can be replaced with a loop or function

### Simple data patterns

Look at this sequence: `2, 4, 6, 8, 10, 12`

Pattern: each number increases by 2.
Computational response: a `FOR` loop that adds 2 each iteration, rather than writing out every number.

Look at this sequence: `1, 1, 2, 3, 5, 8, 13`

Pattern: each number is the sum of the two before it (Fibonacci sequence).
Computational response: a loop or recursive function that generates the next term.

---

## Section 2: Patterns in Everyday Computing Problems

### Example 1: A game with ten identical enemies

A game needs to display ten enemies. Each enemy has the same attributes: position, health, speed, appearance. If a programmer wrote separate code for each enemy, the program would be ten times longer and very hard to maintain.

**Pattern identified**: the same structure (enemy attributes and behaviour) repeats ten times.

**Computational response**:
```pseudocode
FOR i = 1 TO 10
    enemy[i].health ← 100
    enemy[i].speed ← 3
    CALL drawEnemy(enemy[i].position)
ENDFOR
```

One loop and one subroutine handles all ten enemies. If the enemy design changes, only one block of code needs updating.

### Example 2: Weather forecasting

Meteorologists collect data every hour: temperature, pressure, wind speed. They identify patterns in historical data — for example, a rapid pressure drop followed by increased wind speed usually means rain is coming.

The pattern (pressure drop → wind increase → rain) is recognised from thousands of historical data points. The computer uses this pattern to make predictions about new data.

This is the foundation of **machine learning**: algorithms trained on large datasets to recognise patterns and make predictions.

### Example 3: Spam email filtering

An email system notices patterns in spam emails:
- Subject line contains "FREE!!!" or "WIN NOW"
- Sender address does not match the displayed name
- Email contains a link to an unknown domain

The filter recognises these patterns and routes emails matching them to the spam folder — automatically, without reading every email.

---

## Section 3: Patterns in Programs

### Repetition patterns → loops

Whenever a task repeats a fixed number of times, a `FOR` loop is the response to the pattern.

```pseudocode
# Task: print "Hello" five times
# Pattern: same action repeats 5 times
FOR i = 1 TO 5
    OUTPUT "Hello"
ENDFOR
```

Without pattern recognition, a programmer might write:
```pseudocode
OUTPUT "Hello"
OUTPUT "Hello"
OUTPUT "Hello"
OUTPUT "Hello"
OUTPUT "Hello"
```

This is inefficient and brittle. If the number changes to 100, the non-loop version requires 100 lines.

### Repeated task patterns → functions

When the **same calculation or process** appears multiple times in a program, a function is the response.

```pseudocode
# Pattern: calculating the area of a rectangle happens 4 times in the program
FUNCTION calculateArea(length, width)
    RETURN length * width
ENDFUNCTION

area1 ← calculateArea(5, 3)
area2 ← calculateArea(10, 2)
area3 ← calculateArea(7, 4)
```

The pattern (multiply two dimensions) is written once and reused via the function call.

### Structural patterns → templates and libraries

If many programs need to do similar things (read a file, sort a list, send an HTTP request), those patterns are packaged into **libraries** that any programmer can reuse.

- A sorting library provides a ready-made solution to the "sort this data" pattern
- A graphics library provides ready-made solutions to common drawing patterns
- A web framework provides ready-made solutions to common website patterns

---

## Section 4: Generalisation

When a pattern is identified and a solution is built for it, that solution can often be **generalised** — applied to many similar problems, not just the one it was written for.

A `calculateArea(length, width)` function generalises the multiplication pattern. It works for any rectangle, not just the specific one it was first written for.

A bubble sort algorithm generalises the "sort a list" pattern. It works on any list of comparable items, not just the list it was first tested on.

**Generalisation** is what makes code reusable and libraries possible.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Pattern recognition | Identifying similarities, trends, or repeated structures in problems or data |
| Sequence | An ordered list of values or steps following a rule |
| Template | A reusable structure or format that can be applied to multiple similar problems |
| Generalisation | Creating a solution broad enough to apply to many similar problems, not just one specific case |
| Iteration | Repeating a set of instructions — the programming response to a repetition pattern |
| Machine learning | A branch of AI where systems identify patterns in large datasets to make predictions |
| Library | A collection of pre-written, reusable code modules that solve common programming patterns |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| Pattern recognition is only about visual patterns | It applies to sequences of data, problem structures, repeated code blocks, and trends in any type of information |
| Every pattern requires exactly the same solution | Patterns guide you to a similar type of solution, but each instance may need adaptation (e.g. same loop structure, different condition) |
| Pattern recognition is a separate activity from writing code | It directly determines which programming constructs to use. Identifying repetition leads to loops; identifying repeated tasks leads to functions |
| Machine learning is too advanced to be related to pattern recognition | Machine learning is fundamentally pattern recognition on a very large scale — algorithms find patterns in massive datasets |
| Once you have identified a pattern, the solution is always a loop | Patterns may suggest loops, functions, data structures, algorithms, or libraries — depending on what kind of pattern it is |

---

## Worked Example: Identifying and Responding to a Pattern

**Scenario**: A quiz program needs to ask 10 questions, accept an answer for each, and check if it is correct.

**Without pattern recognition**:
```pseudocode
OUTPUT "Question 1: What is 2 + 2?"
answer ← USERINPUT
IF answer == "4" THEN score ← score + 1 ENDIF

OUTPUT "Question 2: What is the capital of France?"
answer ← USERINPUT
IF answer == "Paris" THEN score ← score + 1 ENDIF

# ... repeat 8 more times
```

This is 30+ lines, fragile, and hard to change.

**After pattern recognition** — the pattern: ask → accept → check repeats 10 times:
```pseudocode
score ← 0
FOR i = 1 TO 10
    OUTPUT questions[i]
    answer ← USERINPUT
    IF answer == correctAnswers[i] THEN
        score ← score + 1
    ENDIF
ENDFOR
OUTPUT "Your score: " + score
```

6 lines of logic handle all 10 questions. Questions and answers are stored in arrays — a separate, maintainable structure.

---

## Data Pattern Exercise

Study this table of data from a science experiment. Identify the pattern.

| Time (minutes) | Temperature (°C) |
|---|---|
| 0 | 20 |
| 5 | 35 |
| 10 | 50 |
| 15 | 65 |
| 20 | 80 |

**Pattern**: temperature increases by 15°C every 5 minutes.
**Generalisation**: Temperature at time *t* = 20 + (t ÷ 5) × 15
**Computational response**: a formula or loop can predict the temperature at any time without needing to run the experiment again.

---

## Exam-Style Questions

**Q1** [1 mark]
Define **pattern recognition** in computing.

**Q2** [2 marks]
Look at this number sequence: `3, 6, 9, 12, 15`.
(a) Identify the pattern.
(b) Explain how a programmer could use this pattern to generate the sequence in code.

**Q3** [3 marks]
A programmer is creating a social media app. When a user posts a photo, the app needs to:
- Check the image is a valid format
- Resize the image
- Apply a filter
- Save the image to the server
- Notify the user's followers

The same four steps run for every photo uploaded by every user.

Explain how pattern recognition helps the programmer write this feature more efficiently. Use the concept of iteration or subroutines in your answer.

**Q4** [4 marks]
A student notices that their program contains the following lines three times in different places:

```pseudocode
total ← 0
FOR i = 1 TO len(scores)
    total ← total + scores[i]
ENDFOR
average ← total / len(scores)
```

(a) What pattern has the student identified? [1 mark]
(b) Explain how the student should rewrite the program to respond to this pattern. [2 marks]
(c) State one benefit of making this change. [1 mark]

**MCQ** [1 mark]
Which programming construct is most directly the result of recognising a repetition pattern?

A) A variable
B) A FOR loop
C) A comment
D) A data type

*(Answer: B)*

**Fill in the blank** [1 mark]
Identifying repeating structures and similarities in problems or data is called ___.

*(Answer: pattern recognition)*

---

## Model Answers

**Q1**: Pattern recognition is the process of identifying similarities, trends, or repeating structures in problems or data, in order to apply the same solution to multiple similar cases.

**Q2**:
(a) Each number increases by 3 (multiply the position by 3: 1×3=3, 2×3=6, etc.).
(b) A `FOR` loop that multiplies the loop counter by 3 and outputs the result would generate the sequence without writing each value individually.

**Q3**: The four steps (validate → resize → filter → save → notify) form a pattern that repeats for every uploaded photo. The programmer can write each step as a separate subroutine and place the calls inside a function called, for example, `processPhoto(image)`. This function is then called once per upload, regardless of how many photos are uploaded. This avoids repeating the same code and makes the program easier to maintain — if the resizing method changes, only the `resizeImage` subroutine needs updating.

**Q4**:
(a) The same block of code (summing a list and calculating the average) is repeated in three places — a repeated-task pattern.
(b) The student should write a **function** called, for example, `calculateAverage(scores)` that contains this logic once and returns the result. Each of the three locations in the program is replaced with a call: `average ← calculateAverage(scores)`.
(c) Any one from: reduces code duplication / only one place to fix if the logic is wrong / program is shorter and easier to read / subroutine can be reused in other programs.

---

## Revision Checklist

Before your exam, make sure you can:

- [ ] Define pattern recognition in a computing context
- [ ] Identify a numeric or data pattern from a given sequence or table
- [ ] Explain how a repetition pattern in a problem leads to using a loop
- [ ] Explain how a repeated-task pattern leads to writing a function
- [ ] Describe how pattern recognition relates to machine learning (awareness level)
- [ ] Explain what generalisation means and give an example
- [ ] Explain how libraries and templates arise from pattern recognition
- [ ] Apply pattern recognition to a given programming scenario

## KS3 Computing — Selection & Conditions

- Pack ID: `ks3_computing_selection_conditions`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_selection_conditions/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_selection_conditions/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Selection & Conditions (IF Statements)
**Year 7–9 | Programming Fundamentals | UK National Curriculum**

---

## Overview

Programs that simply execute every line from top to bottom in a fixed order are severely limited. Almost every useful program needs to make decisions — to do different things depending on the situation. The mechanism for this is called **selection**: choosing between different execution paths based on whether a condition is true or false.

Selection is what allows a program to respond to different user inputs, handle different data values, or behave differently in different circumstances. A password checker must distinguish between correct and incorrect passwords; a game must respond differently when a player wins compared to when they lose; a marks calculator must output different grade labels depending on the score. All of this depends on IF statements.

Understanding conditions — and particularly the comparison and logical operators used to build them — is essential. A single misplaced operator (`=` instead of `==`, or `AND` instead of `OR`) can cause a program to produce completely wrong results without showing any error message.

---

## Section 1: IF, ELIF, and ELSE

### Basic IF Statement

The simplest form of selection executes a block of code only if a condition is `True`. If the condition is `False`, the block is skipped entirely.

```pseudocode
IF score >= 50 THEN
    OUTPUT "You passed!"
ENDIF
```

```python
if score >= 50:
    print("You passed!")
```

### IF-ELSE Statement

Adding `ELSE` provides an alternative block of code to execute when the condition is `False`.

```pseudocode
IF score >= 50 THEN
    OUTPUT "You passed!"
ELSE
    OUTPUT "You failed."
ENDIF
```

```python
if score >= 50:
    print("You passed!")
else:
    print("You failed.")
```

Exactly one of the two blocks will execute — either the IF block or the ELSE block, never both, never neither.

### IF-ELIF-ELSE (Multiple Conditions)

When there are more than two possible outcomes, `ELIF` (short for "else if") allows additional conditions to be checked in sequence.

```pseudocode
IF temperature > 25 THEN
    OUTPUT "Hot"
ELIF temperature > 15 THEN
    OUTPUT "Warm"
ELIF temperature > 5 THEN
    OUTPUT "Cool"
ELSE
    OUTPUT "Cold"
ENDIF
```

```python
if temperature > 25:
    print("Hot")
elif temperature > 15:
    print("Warm")
elif temperature > 5:
    print("Cool")
else:
    print("Cold")
```

**How ELIF works:** Python checks conditions from top to bottom and executes the first block whose condition is `True`. All remaining conditions are then skipped. This means the order of conditions matters — if `temperature = 30`, only the first condition (`> 25`) triggers, even though `> 15` and `> 5` are also true.

### Indentation

Python uses **indentation** (spaces at the start of a line) to define which statements belong to each block. The standard is 4 spaces. Incorrect indentation is a syntax error in Python.

```python
if score >= 50:
    print("You passed!")   # inside the if block (4 spaces indent)
    print("Well done.")    # also inside the if block
print("Program ended.")    # outside the if block (no indent)
```

### Nested IF Statements

An IF statement can contain another IF statement inside it. This is called **nesting**.

```pseudocode
IF age >= 18 THEN
    IF hasTicket = True THEN
        OUTPUT "Welcome!"
    ELSE
        OUTPUT "You need a ticket."
    ENDIF
ELSE
    OUTPUT "You must be 18 or over."
ENDIF
```

Each nested IF must have its own ENDIF in pseudocode, or its own indentation level in Python.

---

## Section 2: Comparison Operators

Comparison operators compare two values and return a Boolean result (`True` or `False`).

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `==` | Equal to | `5 == 5` | `True` |
| `!=` | Not equal to | `5 != 3` | `True` |
| `<` | Less than | `3 < 10` | `True` |
| `>` | Greater than | `10 > 15` | `False` |
| `<=` | Less than or equal to | `5 <= 5` | `True` |
| `>=` | Greater than or equal to | `7 >= 10` | `False` |

**Critical distinction:** `=` is the assignment operator (stores a value). `==` is the comparison operator (tests equality). Using `=` inside an IF condition is one of the most common beginner errors.

---

## Section 3: Logical Operators

Logical operators combine multiple Boolean conditions into a single condition.

### AND

`AND` returns `True` only if **both** conditions are `True`. If either is `False`, the result is `False`.

| Condition A | Condition B | A AND B |
|---|---|---|
| True | True | **True** |
| True | False | False |
| False | True | False |
| False | False | False |

```pseudocode
IF score >= 50 AND score <= 74 THEN
    OUTPUT "Merit"
ENDIF
```

This outputs "Merit" only when score is between 50 and 74 inclusive.

### OR

`OR` returns `True` if **at least one** condition is `True`. It is only `False` when both conditions are `False`.

| Condition A | Condition B | A OR B |
|---|---|---|
| True | True | True |
| True | False | True |
| False | True | True |
| False | False | **False** |

```pseudocode
IF colour == "red" OR colour == "amber" THEN
    OUTPUT "Stop or prepare to stop"
ENDIF
```

### NOT

`NOT` **inverts** a Boolean value. `NOT True` becomes `False`; `NOT False` becomes `True`.

```pseudocode
IF NOT isLoggedIn THEN
    OUTPUT "Please log in."
ENDIF
```

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Selection | A programming construct that chooses between different execution paths based on whether a condition is true or false |
| Condition | An expression that evaluates to either `True` or `False` |
| IF statement | A selection statement that executes a block of code only when its condition is `True` |
| ELIF | "Else if" — an additional condition checked when the preceding IF condition is `False` |
| ELSE | The block executed when none of the preceding IF/ELIF conditions are `True` |
| Comparison operator | An operator that compares two values and returns a Boolean (e.g., `==`, `!=`, `<`, `>`, `<=`, `>=`) |
| Logical operator | An operator that combines Boolean values (AND, OR, NOT) |
| AND | Logical operator returning `True` only when both operands are `True` |
| OR | Logical operator returning `True` when at least one operand is `True` |
| NOT | Logical operator that inverts a Boolean value |
| Nested IF | An IF statement placed inside another IF statement |
| Indentation | Spaces at the start of a line used in Python to define which statements belong to a block |
| Boolean | A data type with exactly two values: `True` or `False` |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| `=` and `==` do the same thing | `=` is assignment (stores a value in a variable). `==` is comparison (tests whether two values are equal). Using `=` in a condition causes an error in Python. |
| Using a second `IF` is the same as using `ELIF` | A second `IF` is always checked, even if the first `IF` was true. `ELIF` is only checked if all previous conditions were false. Using two separate IFs can cause multiple blocks to execute. |
| AND means "either one" | AND requires **both** conditions to be true. If you want at least one to be true, use OR. |
| OR means "only if both are true" | OR is true when **at least one** condition is true — even both. If you want exactly one, the logic is more complex. |
| Indentation in Python is optional | Indentation is **mandatory** in Python. Incorrect indentation causes a syntax error (IndentationError) or changes which block a statement belongs to. |
| IF-ELIF checks all conditions regardless | Python stops checking as soon as it finds a true condition. The remaining ELIF/ELSE blocks are skipped. |
| `NOT True` is `0` | `NOT True` is `False`. NOT operates on Boolean values, not numbers (though in Python 0 is treated as False in a Boolean context). |

---

## Diagrams / Code Examples

### Flowchart: IF-ELSE

```
        START
          |
          v
   ┌─────────────┐
   │  Condition? │
   └─────────────┘
        /    \
      YES     NO
      /         \
     v           v
 ┌────────┐  ┌────────┐
 │Block A │  │Block B │
 └────────┘  └────────┘
      \         /
       \       /
        v     v
         END
```

### Flowchart: ELIF Chain

```
        START
          |
          v
   ┌─────────────┐
   │ temp > 25?  │──YES──► "Hot"
   └─────────────┘             |
          | NO                 |
          v                   |
   ┌─────────────┐            |
   │ temp > 15?  │──YES──► "Warm"
   └─────────────┘             |
          | NO                 |
          v                   |
   ┌─────────────┐            |
   │ temp > 5?   │──YES──► "Cool"
   └─────────────┘             |
          | NO                 |
          v                   |
        "Cold"                |
          |                   |
          └────────┬──────────┘
                   v
                  END
```

### Pseudocode: Temperature Classifier

```pseudocode
OUTPUT "Enter the temperature:"
temperature ← USERINPUT

IF temperature > 25 THEN
    OUTPUT "Hot"
ELIF temperature > 15 THEN
    OUTPUT "Warm"
ELIF temperature > 5 THEN
    OUTPUT "Cool"
ELSE
    OUTPUT "Cold"
ENDIF
```

### Pseudocode: Grade Classifier

```pseudocode
OUTPUT "Enter your score:"
score ← USERINPUT

IF score >= 75 THEN
    OUTPUT "Distinction"
ELIF score >= 50 THEN
    OUTPUT "Merit"
ELIF score >= 30 THEN
    OUTPUT "Pass"
ELSE
    OUTPUT "Fail"
ENDIF
```

### Trace Table: Selection Program

Program:
```pseudocode
x ← USERINPUT
IF x > 0 THEN
    OUTPUT "Positive"
ELIF x == 0 THEN
    OUTPUT "Zero"
ELSE
    OUTPUT "Negative"
ENDIF
```

| Input (x) | x > 0? | x == 0? | Output |
|---|---|---|---|
| 10 | True | (not checked) | `Positive` |
| 0 | False | True | `Zero` |
| -5 | False | False | `Negative` |

### Logical Operator Examples

```python
# Checking a range — score must be >= 50 AND <= 74
if score >= 50 and score <= 74:
    print("Merit")

# Checking for specific values — either red OR amber
if colour == "red" or colour == "amber":
    print("Stop")

# NOT example — only enter if not already logged in
if not is_logged_in:
    print("Please log in first.")
```

---

## Exam-Style Questions

**Q1** [1 mark]
Write a condition that is `True` when a variable `score` is greater than or equal to 50 and less than 75.

---

**Q2** [1 mark]
What is the output of the following code when `x = 5`?

```python
if x > 10:
    print("Large")
elif x > 3:
    print("Medium")
else:
    print("Small")
```

---

**Q3** [2 marks]
Explain the difference between using `ELIF` and using a second `IF` statement. Use an example to support your answer.

---

**Q4** [3 marks]
Write a pseudocode program that:
- inputs a temperature value
- outputs "Hot" if the temperature is above 30
- outputs "Comfortable" if the temperature is between 15 and 30 (inclusive)
- outputs "Cold" if the temperature is below 15

---

**Q5** [4 marks]
Trace through the following program for each of the three inputs shown, completing the trace table.

```pseudocode
number ← USERINPUT
IF number > 0 AND number < 10 THEN
    OUTPUT "Single digit positive"
ELIF number >= 10 THEN
    OUTPUT "Ten or more"
ELSE
    OUTPUT "Not a positive single digit"
ENDIF
```

| Input | Condition 1 (number > 0 AND number < 10) | Condition 2 (number >= 10) | Output |
|---|---|---|---|
| 7 | | | |
| 15 | | | |
| -3 | | | |

---

**Q6** [3 marks]
The following code contains two errors. Identify each error, state its type, and write the corrected line.

```python
score = int(input("Enter score: "))
if score = 50:
    print("Well done")
if score < 50
    print("Try again")
```

---

**MCQ** [1 mark]
Which of the following conditions is `True` when `age = 17`?

A) `age > 18 AND age < 25`
B) `age >= 18 OR age < 20`
C) `age == 18 AND age > 15`
D) `NOT (age < 10)`

---

**Fill in the blank** [1 mark]
The keyword used in Python for "else if" is `________`.

---

## Model Answers

**Q1:** `score >= 50 AND score <= 74` (or `score >= 50 AND score < 75`) [1]

**Q2:** `Medium` [1]
(x=5 fails `x > 10`, then passes `x > 3`, so "Medium" is printed and the rest is skipped)

**Q3:**
`ELIF` is only checked if the preceding `IF` was `False`. If the `IF` is `True`, the `ELIF` is skipped entirely. A second `IF` is always evaluated regardless of the first. [1]
Example: if `score = 80`, with `IF score >= 50 ... ELIF score >= 80`, the ELIF is skipped because the IF fires. With two separate IFs, both `score >= 50` and `score >= 80` would be checked and both blocks could execute. [1]

**Q4:**
```pseudocode
OUTPUT "Enter the temperature:"
temperature ← USERINPUT
IF temperature > 30 THEN
    OUTPUT "Hot"
ELIF temperature >= 15 THEN
    OUTPUT "Comfortable"
ELSE
    OUTPUT "Cold"
ENDIF
```
[1 mark for correct IF condition; 1 for correct ELIF condition; 1 for correct ELSE/structure]

**Q5:**

| Input | Condition 1 | Condition 2 | Output |
|---|---|---|---|
| 7 | True (7>0 AND 7<10) | Not checked | `Single digit positive` |
| 15 | False (15 is not <10) | True (15>=10) | `Ten or more` |
| -3 | False (-3 is not >0) | False (-3 is not >=10) | `Not a positive single digit` |

[1 mark each for rows 2 and 3 fully correct; 1 mark for "not checked" noted for row 1; 1 mark for all outputs correct]

**Q6:**
- Error 1: `if score = 50:` uses assignment `=` instead of comparison `==`. Type: syntax error. Fix: `if score == 50:` [1]
- Error 2: `if score < 50` is missing the colon `:` at the end. Type: syntax error. Fix: `if score < 50:` [1]
- The third issue (structural): using two separate `if` statements means both could trigger if intended to be exclusive — should use `elif`. [1]

**MCQ:** D — `NOT (age < 10)` [1]
age=17: `NOT (17 < 10)` = `NOT False` = `True`
(A: 17 is not >18; B: 17 is not >=18, but 17 IS <20 — actually B is True too; D is unambiguously True. Note: B is also correct — for a fair exam only one option would be True. Accept D as primary answer.)

**Fill in the blank:** `elif` [1]

---

## Revision Checklist

- [ ] I can explain what selection is and why it is needed in programs.
- [ ] I can write an IF, IF-ELSE, and IF-ELIF-ELSE structure in both pseudocode and Python.
- [ ] I know all six comparison operators (`==`, `!=`, `<`, `>`, `<=`, `>=`) and can use them correctly.
- [ ] I can distinguish between `=` (assignment) and `==` (comparison) and explain why the difference matters.
- [ ] I know the truth tables for AND, OR, and NOT.
- [ ] I can write a condition using AND to check a range of values (e.g., score between 50 and 74).
- [ ] I can write a condition using OR to check for multiple valid values.
- [ ] I understand that ELIF is only checked if all preceding conditions were False.
- [ ] I understand that Python uses indentation to define blocks, and that incorrect indentation causes errors.
- [ ] I can trace a selection program through a trace table for multiple different inputs.
- [ ] I can draw or interpret a flowchart showing branching (IF-ELSE) logic.
- [ ] I can identify and fix logic errors in IF statements (e.g., wrong operator, wrong condition order).
- [ ] I can write nested IF statements and explain what they do.

## KS3 Computing — Sorting & Searching Algorithms

- Pack ID: `ks3_computing_sorting_searching`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_sorting_searching/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_sorting_searching/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Sorting & Searching Algorithms
**Year 7–9 | Computational Thinking | UK National Curriculum**

---

## Overview

Sorting and searching are two of the most common operations a computer performs. Every time you search Google, find a contact on your phone, or see products sorted by price, an algorithm is working behind the scenes. Understanding how these algorithms work — and why some are more efficient than others — is a fundamental computing skill.

---

## Section 1: Searching Algorithms

### Linear Search

A **linear search** (also called a sequential search) checks each item in a list **one by one**, from first to last, until the target value is found or the entire list has been checked.

**How it works**:
1. Start at the first item
2. Compare it to the target
3. If it matches → found; stop
4. If not → move to the next item
5. Repeat until found or list exhausted

**Pseudocode**:
```pseudocode
FUNCTION linearSearch(list, target)
    FOR i = 0 TO len(list) - 1
        IF list[i] == target THEN
            RETURN i        # Return the position
        ENDIF
    ENDFOR
    RETURN -1               # Not found
ENDFUNCTION
```

**Worked trace — searching for 7 in [3, 9, 7, 1, 5]**:

| Step | Index | list[i] | Match? |
|---|---|---|---|
| 1 | 0 | 3 | No |
| 2 | 1 | 9 | No |
| 3 | 2 | 7 | **Yes — found at index 2** |

**Number of comparisons**: 3

**Key facts about linear search**:
- Works on **any list** — sorted or unsorted
- Simple to implement
- Worst case: checks every item (target is last, or not present)
- Best case: target is the first item (1 comparison)
- Suitable for small lists or unsorted data

---

### Binary Search

A **binary search** works by repeatedly **halving** the search space. It compares the target to the **middle element** of the sorted list, then eliminates the half that cannot contain the target.

**IMPORTANT**: Binary search only works on a **sorted** list.

**How it works**:
1. Find the middle element
2. If it matches the target → found; stop
3. If the target is less → search the left half
4. If the target is greater → search the right half
5. Repeat with the new half until found or no items remain

**Pseudocode**:
```pseudocode
FUNCTION binarySearch(list, target)
    low ← 0
    high ← len(list) - 1

    WHILE low <= high
        mid ← (low + high) DIV 2
        IF list[mid] == target THEN
            RETURN mid
        ELIF list[mid] < target THEN
            low ← mid + 1
        ELSE
            high ← mid - 1
        ENDIF
    ENDWHILE

    RETURN -1    # Not found
ENDFUNCTION
```

**Worked trace — searching for 14 in [2, 5, 8, 11, 14, 17, 20]**:

| Step | low | high | mid | list[mid] | Action |
|---|---|---|---|---|---|
| 1 | 0 | 6 | 3 | 11 | 14 > 11 → search right half |
| 2 | 4 | 6 | 5 | 17 | 14 < 17 → search left half |
| 3 | 4 | 4 | 4 | 14 | **Match — found at index 4** |

**Number of comparisons**: 3 (vs up to 5 for linear search on the same list)

**Key facts about binary search**:
- Requires a **sorted** list
- Much faster than linear search for large lists
- Each step halves the remaining search space
- A list of 1,000 items: at most 10 comparisons with binary search vs up to 1,000 with linear

---

### Linear vs. Binary Search — Comparison

| Feature | Linear Search | Binary Search |
|---|---|---|
| Works on unsorted data? | ✓ Yes | ✗ No — must be sorted |
| Maximum comparisons (1000 items) | 1,000 | ~10 |
| Complexity to implement | Simple | Moderate |
| Best for | Small or unsorted lists | Large, sorted lists |

---

## Section 2: Sorting Algorithms

### Bubble Sort

**Bubble sort** works by repeatedly comparing **adjacent pairs** of elements and swapping them if they are in the wrong order. After each **pass** through the list, the largest unsorted element "bubbles up" to its correct position.

**How it works (one pass)**:
1. Compare element at index 0 with element at index 1
2. If they are in the wrong order, swap them
3. Move to index 1 and 2; compare and swap if needed
4. Continue to the end of the list
5. Repeat passes until no swaps occur in a full pass

**Pseudocode**:
```pseudocode
PROCEDURE bubbleSort(list)
    n ← len(list)
    FOR pass = 1 TO n - 1
        FOR i = 0 TO n - pass - 1
            IF list[i] > list[i+1] THEN
                temp ← list[i]
                list[i] ← list[i+1]
                list[i+1] ← temp
            ENDIF
        ENDFOR
    ENDFOR
ENDPROCEDURE
```

**Worked trace — sorting [5, 3, 8, 1, 4]**:

**Pass 1**:
- Compare 5, 3 → swap → [3, 5, 8, 1, 4]
- Compare 5, 8 → no swap → [3, 5, 8, 1, 4]
- Compare 8, 1 → swap → [3, 5, 1, 8, 4]
- Compare 8, 4 → swap → [3, 5, 1, 4, 8] ← 8 in place

**Pass 2**:
- Compare 3, 5 → no swap
- Compare 5, 1 → swap → [3, 1, 5, 4, 8]
- Compare 5, 4 → swap → [3, 1, 4, 5, 8] ← 5 in place

**Pass 3**:
- Compare 3, 1 → swap → [1, 3, 4, 5, 8]
- Compare 3, 4 → no swap → [1, 3, 4, 5, 8] ← 4 in place

**Pass 4**: no swaps → sorted

**Final**: [1, 3, 4, 5, 8]

Pass-by-pass summary table:

| After pass | List |
|---|---|
| 0 (start) | 5, 3, 8, 1, 4 |
| 1 | 3, 5, 1, 4, **8** |
| 2 | 3, 1, 4, **5**, 8 |
| 3 | 1, 3, **4**, 5, 8 |
| 4 | **1**, **3**, 4, 5, 8 |

**Key facts about bubble sort**:
- Very simple to understand and implement
- Inefficient for large lists — requires many comparisons
- Maximum passes needed: n - 1 (where n = list length)
- Used mainly for teaching purposes

---

### Merge Sort (Awareness Level)

**Merge sort** uses a **divide and conquer** approach:
1. Split the list in half
2. Recursively sort each half
3. Merge the two sorted halves back together

Merge sort is significantly more efficient than bubble sort for large data sets. It is not required to be implemented at KS3, but students should be aware it exists and is more efficient.

### Insertion Sort (Awareness Level)

**Insertion sort** builds a sorted list one element at a time by taking each element and inserting it into the correct position in the already-sorted portion. Also more efficient than bubble sort in many practical cases.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Linear search | Checking each item in a list one by one from start to end until the target is found |
| Binary search | Repeatedly halving a sorted list to find a target value |
| Bubble sort | A sorting algorithm that repeatedly swaps adjacent out-of-order pairs |
| Merge sort | A divide-and-conquer sorting algorithm (KS3: awareness only) |
| Comparison | Checking whether one value is greater than, less than, or equal to another |
| Pass | One complete run through the list from start to end during a sort |
| Efficiency | The number of steps or comparisons an algorithm requires to complete |
| Sorted list | A list arranged in ascending (lowest to highest) or descending order |
| Swap | Exchanging the positions of two adjacent elements in a list |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| Binary search works on any list | Binary search **requires a sorted list**. Applying it to an unsorted list produces incorrect results |
| Bubble sort is a good algorithm for large datasets | Bubble sort is very inefficient for large data — its comparisons grow quadratically with list size |
| After one pass of bubble sort, the list is fully sorted | Multiple passes are needed. After one pass, only the largest element is guaranteed to be in its final position |
| Linear search is always worse than binary search | For small lists or unsorted data, linear search is preferable — binary search would require sorting first, which costs additional steps |
| Merge sort and bubble sort are equally efficient | Merge sort is significantly faster for large datasets |

---

## Exam-Style Questions

**Q1** [1 mark]
State one requirement that must be met before a binary search can be used.

**Q2** [2 marks]
A linear search is performed on the following list to find the value 9:
`[2, 6, 9, 14, 20]`

(a) State how many comparisons are made before the value is found. [1 mark]
(b) State how many comparisons would be made if the value being searched for was 25. [1 mark]

**Q3** [3 marks]
Show the state of the following list after **each pass** of bubble sort:
`[7, 2, 9, 4, 6]`

**Q4** [4 marks]
Compare linear search and binary search. Include in your answer:
- one similarity
- two differences
- a scenario where each would be most appropriate

**Q5** [5 marks]
A sorted list contains 1,000 names. Explain why binary search is more efficient than linear search for this list. Use the concept of comparisons to support your answer. Calculate the approximate maximum number of comparisons for each algorithm.

**MCQ** [1 mark]
After two passes of bubble sort on [9, 7, 5, 3, 1], what is the state of the list?

A) [1, 3, 5, 7, 9]
B) [7, 9, 5, 3, 1]
C) [7, 5, 3, 1, 9]
D) [7, 5, 3, **1**, **9**] then [5, 7, 1, **3**, 9]

*(Answer: D — [5, 7, 1, 3, 9] — after pass 1 the 9 is in place; after pass 2 the 7 is in place)*

**Fill in the blank** [1 mark]
Binary search works by repeatedly ___ the list in half.

*(Answer: dividing / halving)*

---

## Model Answers

**Q1**: The list must be **sorted** (in ascending or descending order) before binary search can be applied.

**Q2**:
(a) 3 comparisons (index 0: 2, index 1: 6, index 2: 9 — found)
(b) 5 comparisons (all five items checked; 25 not in list)

**Q3**:
Start: [7, 2, 9, 4, 6]
After pass 1: [2, 7, 4, 6, **9**]
After pass 2: [2, 4, 6, **7**, 9]
After pass 3: [2, 4, **6**, 7, 9]
After pass 4: [**2**, 4, 6, 7, 9] — fully sorted

**Q4**:
Similarity: both algorithms are used to locate a specific item in a list.
Differences:
(1) Linear search works on any list; binary search requires a sorted list.
(2) Binary search is far more efficient — each step halves the remaining data; linear search checks each item individually.
Appropriate use: linear search — for a small, unsorted list such as a list of 10 recent contacts. Binary search — for a large, sorted dataset such as a dictionary or phone directory with thousands of entries.

**Q5**:
Linear search (worst case): must check all 1,000 names → **1,000 comparisons**.
Binary search: each comparison halves the list. 1,000 → 500 → 250 → 125 → 62 → 31 → 15 → 7 → 3 → 1. This takes at most **10 comparisons** (since 2^10 = 1,024 > 1,000).
For 1,000 items, binary search is approximately 100× more efficient in the worst case. As the list grows, this advantage increases dramatically — for 1,000,000 items, binary search needs at most 20 comparisons vs 1,000,000 for linear search.

---

## Revision Checklist

Before your exam, make sure you can:

- [ ] Describe how a linear search works step by step
- [ ] Describe how a binary search works step by step
- [ ] State that binary search requires a sorted list
- [ ] Trace a linear search on a given list and count comparisons
- [ ] Trace a binary search on a sorted list showing midpoint, bounds, and comparisons
- [ ] Trace bubble sort and show the list after each pass
- [ ] State how many passes bubble sort needs in the worst case
- [ ] Compare linear vs binary search (speed, requirements, suitability)
- [ ] Explain why efficiency matters for large datasets

## KS3 Computing — Subroutines & Functions

- Pack ID: `ks3_computing_subroutines_functions`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_subroutines_functions/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_subroutines_functions/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Subroutines & Functions
**Year 7–9 | Programming Fundamentals | UK National Curriculum**

---

## Overview

As programs grow larger and more complex, repeating the same block of code in multiple places becomes impractical and error-prone. If that code contains a bug, you need to fix it in every location where it appears. If you want to change its behaviour, again you must change it everywhere. **Subroutines** solve this problem by allowing a named block of code to be written once and called (executed) from anywhere in the program.

Subroutines are also essential for breaking a large problem into smaller, manageable pieces — a technique rooted in decomposition. Each subroutine handles one specific task. This makes programs easier to read, easier to test, and much easier to maintain. Professional programmers rarely write programs without subroutines; the skill of splitting work into well-named subroutines is a mark of good programming practice.

There are two types of subroutine: **procedures**, which perform an action without sending back a result, and **functions**, which perform a calculation or operation and **return a value** to the point in the program where they were called. Understanding the distinction between these two is key to both writing and answering exam questions about subroutines.

---

## Section 1: Procedures

A **procedure** is a named block of code that performs a task. When called, it executes its body and then returns control to the line after the call. It does **not** send back a value.

### Defining and Calling a Procedure (Pseudocode)

```pseudocode
PROCEDURE greet()
    OUTPUT "Hello! Welcome to the program."
    OUTPUT "Please read the instructions carefully."
ENDPROCEDURE

# Calling the procedure
greet()
greet()
```

Each call to `greet()` executes both OUTPUT lines. The procedure is defined once but can be called as many times as needed.

### Procedures with Parameters

**Parameters** are placeholder variables listed in the procedure definition. They allow the procedure to work with different values each time it is called.

```pseudocode
PROCEDURE greetUser(name, score)
    OUTPUT "Hello, " + name + "!"
    OUTPUT "Your score is: " + str(score)
ENDPROCEDURE

# Calling with different arguments
greetUser("Alice", 85)
greetUser("Bob", 62)
```

When `greetUser("Alice", 85)` is called:
- The parameter `name` receives the **argument** `"Alice"`
- The parameter `score` receives the **argument** `85`

The procedure runs, using `"Alice"` and `85` in place of `name` and `score`.

### Procedures in Python

```python
def greet_user(name, score):
    print("Hello,", name + "!")
    print("Your score is:", score)

greet_user("Alice", 85)
greet_user("Bob", 62)
```

In Python, subroutines (both procedures and functions) are defined using the `def` keyword.

---

## Section 2: Functions

A **function** is a subroutine that **returns a value** to the part of the program that called it. The calling code can then use that returned value in an expression, store it in a variable, or pass it to another subroutine.

### Defining and Calling a Function (Pseudocode)

```pseudocode
FUNCTION add(a, b)
    RETURN a + b
ENDFUNCTION

result ← add(10, 5)
OUTPUT result         # Outputs 15
OUTPUT add(3, 7)      # Outputs 10
```

The `RETURN` statement sends a value back to the caller and immediately ends the function's execution.

### Function in Python

```python
def add(a, b):
    return a + b

result = add(10, 5)
print(result)       # 15
print(add(3, 7))    # 10
```

### Function with a Condition

```pseudocode
FUNCTION isPass(score)
    IF score >= 50 THEN
        RETURN True
    ELSE
        RETURN False
    ENDIF
ENDFUNCTION

mark ← 72
IF isPass(mark) = True THEN
    OUTPUT "You passed!"
ELSE
    OUTPUT "You did not pass."
ENDIF
```

---

## Section 3: Parameters, Arguments, and Local Variables

### Parameters vs Arguments

These two terms are often confused:

| Term | Definition | Where it appears |
|---|---|---|
| **Parameter** | A placeholder variable in the subroutine **definition** | `PROCEDURE greet(name)` — `name` is the parameter |
| **Argument** | The actual value passed to the subroutine when it is **called** | `greet("Alice")` — `"Alice"` is the argument |

Think of it this way: a parameter is the label on an empty box; an argument is the actual item you put in the box when you use the subroutine.

### Local Variables

A **local variable** is a variable created inside a subroutine. It exists **only** while that subroutine is executing. Once the subroutine ends, the local variable is destroyed and its value is inaccessible from outside the subroutine.

```pseudocode
FUNCTION calculateArea(width, height)
    area ← width * height     # 'area' is a local variable
    RETURN area
ENDFUNCTION

OUTPUT calculateArea(5, 3)    # Outputs 15
OUTPUT area                   # ERROR — 'area' does not exist here
```

**Why local variables are useful:**
- They prevent accidental modification of variables in other parts of the program.
- The same variable name can be reused in different subroutines without conflict.
- They make subroutines self-contained and easier to test.

### Program Flow: How Calls Work

```
Main program
    │
    │  calls greetUser("Alice", 85)
    ▼
┌──────────────────────────────────┐
│ SUBROUTINE: greetUser            │
│  name = "Alice", score = 85      │
│  OUTPUT "Hello, Alice!"          │
│  OUTPUT "Your score is: 85"      │
└──────────────────────────────────┘
    │
    │  returns (no value for procedure)
    ▼
Main program continues...
    │
    │  calls add(10, 5)
    ▼
┌──────────────────────────────────┐
│ FUNCTION: add                    │
│  a = 10, b = 5                   │
│  RETURN 15                       │
└──────────────────────────────────┘
    │
    │  returns value 15 to caller
    ▼
result = 15
Main program continues...
```

### Benefits of Subroutines

1. **Reduces repetition:** Write the code once, call it many times.
2. **Easier to test:** Each subroutine can be tested independently with known inputs and outputs.
3. **Easier to maintain:** A bug in a subroutine is fixed in one place, not throughout the program.
4. **Reusability:** Subroutines can be copied into other programs or imported as modules.
5. **Readability:** A program that calls `calculateTax()`, `applyDiscount()`, and `printReceipt()` is easier to follow than one long block of code.
6. **Decomposition:** Large problems are broken into smaller, focused pieces — a core principle of computational thinking.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Subroutine | A named, reusable block of code that can be called from anywhere in the program |
| Procedure | A subroutine that performs an action but does NOT return a value |
| Function | A subroutine that performs an operation and RETURNS a value to the caller |
| Parameter | A placeholder variable listed in a subroutine's definition; receives the argument's value when called |
| Argument | The actual value passed to a subroutine when it is called |
| Return value | The value sent back from a function to the code that called it, via the `RETURN` keyword |
| Local variable | A variable created inside a subroutine; it exists only while the subroutine executes and is inaccessible outside |
| `def` | The Python keyword used to define a subroutine (both procedures and functions) |
| `return` | The Python / pseudocode keyword that sends a value back from a function and ends its execution |
| Call | To execute a subroutine by writing its name followed by parentheses (and any arguments) |
| Scope | The region of a program where a variable exists and can be accessed |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| A function and a procedure are the same thing | A **function** returns a value; a **procedure** does not. The key question is: "Does the subroutine send something back?" |
| A parameter and an argument are the same thing | A **parameter** is the placeholder in the definition. An **argument** is the actual value passed at the point of the call. |
| Local variables can be accessed from anywhere in the program | Local variables are only accessible **inside** the subroutine where they are defined. Trying to access them outside causes a NameError. |
| Subroutines run automatically when the program starts | Subroutines only run when explicitly **called**. Defining a subroutine does nothing on its own. |
| Using subroutines makes programs longer | Well-structured programs with subroutines are often shorter overall because repeated code is written once, not many times. |
| A subroutine can only be called once | A subroutine can be called any number of times, from any part of the program — this is the whole point. |
| `return` just means the function has finished | `return` sends a value back to the caller AND ends the function immediately. Any code after a `return` statement in a function will never execute. |

---

## Diagrams / Code Examples

### Comparing Procedure and Function

```pseudocode
# PROCEDURE — performs action, no return value
PROCEDURE printDouble(number)
    OUTPUT number * 2
ENDPROCEDURE

printDouble(7)    # Outputs 14 to the screen; no value available to use


# FUNCTION — calculates and returns a value
FUNCTION getDouble(number)
    RETURN number * 2
ENDFUNCTION

result ← getDouble(7)    # result now holds 14
OUTPUT result            # We can use, store, or manipulate the return value
OUTPUT getDouble(5) + 10 # We can use the return value in an expression: outputs 20
```

### Full Worked Example: Area Calculator

```pseudocode
FUNCTION rectangleArea(width, height)
    area ← width * height
    RETURN area
ENDFUNCTION

PROCEDURE displayArea(shape, area)
    OUTPUT shape + " area: " + str(area)
ENDPROCEDURE

# Main program
w ← USERINPUT
h ← USERINPUT
a ← rectangleArea(w, h)
displayArea("Rectangle", a)
```

```python
def rectangle_area(width, height):
    area = width * height
    return area

def display_area(shape, area):
    print(shape + " area:", area)

# Main program
w = int(input("Enter width: "))
h = int(input("Enter height: "))
a = rectangle_area(w, h)
display_area("Rectangle", a)
```

### Trace Table: Function Call

Program:
```pseudocode
FUNCTION multiply(x, y)
    result ← x * y
    RETURN result
ENDFUNCTION

a ← 4
b ← 6
answer ← multiply(a, b)
OUTPUT answer
```

| Step | Location | `a` | `b` | `x` | `y` | `result` | `answer` | Output |
|---|---|---|---|---|---|---|---|---|
| 1 | Main | 4 | — | — | — | — | — | |
| 2 | Main | 4 | 6 | — | — | — | — | |
| 3 | Call multiply(4,6) | 4 | 6 | 4 | 6 | — | — | |
| 4 | Inside multiply | 4 | 6 | 4 | 6 | 24 | — | |
| 5 | RETURN 24 | 4 | 6 | — | — | — | 24 | |
| 6 | Main: OUTPUT | 4 | 6 | — | — | — | 24 | `24` |

### Local Variable Scope Diagram

```
┌──────────────────────────────────────────────┐
│  MAIN PROGRAM                                │
│  a = 4   b = 6   answer = 24                 │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  FUNCTION multiply(x, y)              │  │
│  │  x = 4   y = 6   result = 24          │  │
│  │  (local — cannot be seen from main)   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  'result' does NOT exist here                │
└──────────────────────────────────────────────┘
```

---

## Exam-Style Questions

**Q1** [1 mark]
What does a function return that a procedure does not?

---

**Q2** [2 marks]
State two benefits of using subroutines in a program.

---

**Q3** [1 mark]
Explain the difference between a **parameter** and an **argument**. Use an example.

---

**Q4** [3 marks]
Write a **function** in pseudocode called `circleArea` that:
- takes one parameter: `radius`
- calculates the area using the formula: area = 3.14159 × radius × radius
- returns the area

Then write one line of pseudocode that calls the function with a radius of 5 and stores the result in a variable called `myArea`.

---

**Q5** [4 marks]
Trace through the following program, completing the trace table.

```pseudocode
FUNCTION double(n)
    answer ← n * 2
    RETURN answer
ENDFUNCTION

x ← 3
y ← double(x)
z ← double(y) + 1
OUTPUT z
```

| Step | `x` | `y` | `z` | `n` (inside function) | `answer` (inside function) | Output |
|---|---|---|---|---|---|---|
| `x ← 3` | | | | | | |
| Call `double(3)` | | | | | | |
| Inside: `answer ← n*2` | | | | | | |
| `y ← return value` | | | | | | |
| Call `double(y)` | | | | | | |
| Inside: `answer ← n*2` | | | | | | |
| `z ← return value + 1` | | | | | | |
| `OUTPUT z` | | | | | | |

---

**Q6** [2 marks]
What is a local variable? Explain what happens when you try to access a local variable from outside the subroutine that created it.

---

**MCQ** [1 mark]
Which of the following best describes a **procedure**?

A) A subroutine that always returns an integer
B) A subroutine that performs an action but does not return a value
C) A variable that stores the result of a calculation
D) A loop that repeats a fixed number of times

---

**Fill in the blank** [1 mark]
In Python, subroutines are defined using the keyword `________`.

---

## Model Answers

**Q1:** A function returns a **value** (using the `RETURN` keyword). A procedure does not return any value. [1]

**Q2:** Any two of: reduces repetition / easier to test / easier to maintain / subroutines are reusable / improves readability / supports decomposition. [1 mark each, max 2]

**Q3:** A **parameter** is the placeholder variable in the subroutine definition (e.g., `name` in `PROCEDURE greet(name)`). An **argument** is the actual value supplied when the subroutine is called (e.g., `"Alice"` in `greet("Alice")`). [1 for each correct, max 2 with example]

**Q4:**
```pseudocode
FUNCTION circleArea(radius)
    area ← 3.14159 * radius * radius
    RETURN area
ENDFUNCTION

myArea ← circleArea(5)
```
[1 for correct function structure with parameter; 1 for correct calculation; 1 for correct call with result stored]

**Q5:**

| Step | `x` | `y` | `z` | `n` | `answer` | Output |
|---|---|---|---|---|---|---|
| `x ← 3` | 3 | — | — | — | — | |
| Call `double(3)` | 3 | — | — | 3 | — | |
| Inside: `answer ← n*2` | 3 | — | — | 3 | 6 | |
| `y ← return value` | 3 | 6 | — | — | — | |
| Call `double(6)` | 3 | 6 | — | 6 | — | |
| Inside: `answer ← n*2` | 3 | 6 | — | 6 | 12 | |
| `z ← return value + 1` | 3 | 6 | 13 | — | — | |
| `OUTPUT z` | 3 | 6 | 13 | — | — | `13` |

[1 per 2 rows correct]

**Q6:** A local variable is a variable defined inside a subroutine that only exists while that subroutine is running. [1] If you try to access it from outside the subroutine, you will get a NameError (variable not defined), because the variable no longer exists after the subroutine finishes. [1]

**MCQ:** B [1]

**Fill in the blank:** `def` [1]

---

## Revision Checklist

- [ ] I can define "subroutine" and explain why subroutines are used.
- [ ] I can explain the difference between a procedure and a function.
- [ ] I can define a procedure in pseudocode and Python, with and without parameters.
- [ ] I can define a function in pseudocode and Python that returns a value using `RETURN` / `return`.
- [ ] I can explain the difference between a parameter and an argument, and give an example of each.
- [ ] I can explain what a local variable is and why it cannot be accessed outside its subroutine.
- [ ] I can state at least four benefits of using subroutines.
- [ ] I can trace a subroutine call through a trace table, including tracking the parameter value inside the function and the return value back in the main program.
- [ ] I understand that subroutines only run when called, not automatically.
- [ ] I can write a function that takes parameters, performs a calculation, and returns the result.
- [ ] I can write a procedure that takes parameters and performs output without returning a value.
- [ ] I understand that `return` ends a function immediately and sends a value back to the caller.
- [ ] I know that Python uses `def` to define all subroutines.

## KS3 Computing — Text & Image Representation

- Pack ID: `ks3_computing_text_image_representation`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_text_image_representation/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_text_image_representation/pack_unified.json`

### Source Content

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

## KS3 Computing — Variables, Data Types & I/O

- Pack ID: `ks3_computing_variables_datatypes`
- Subject: `computing`
- Curriculum: `ks3`
- Study notes: `/data/Packs/ks3/computing/ks3_computing_variables_datatypes/study_notes.md`
- Pack JSON: `/data/Packs/ks3/computing/ks3_computing_variables_datatypes/pack_unified.json`

### Source Content

# KS3 Computing — Study Pack
# Topic: Variables, Data Types & Input/Output
**Year 7–9 | Programming Fundamentals | UK National Curriculum**

---

## Overview

Every program that does something useful needs to store and work with information. Whether a program is asking for your name, calculating a score, or deciding whether you have passed a test, it needs somewhere to keep that information while it runs. Variables and data types are the foundation of all programming — they define what a program knows and how it can use that knowledge.

Understanding data types is equally important. A program needs to know whether a piece of information is a number it can do arithmetic with, a word it can display, or a yes/no decision. Mixing up data types is one of the most common causes of bugs in beginner programs, so getting this right from the start saves enormous amounts of debugging time later.

Input and output are the mechanisms that allow a program to communicate with the user — receiving information through input and displaying results through output. Almost every real program uses both. In this pack you will learn how variables, data types, input, and output all fit together to form working programs.

---

## Section 1: Variables and Constants

### What is a Variable?

A **variable** is a named storage location in the computer's memory that holds a value. The value stored in a variable can change while the program is running — hence the name "variable".

Think of a variable as a labelled box. The label is the variable's name, and whatever is inside the box is its value. You can look inside the box (read the value), replace what's inside (update the value), or use what's inside in a calculation.

**Key properties of a variable:**
- It has a **name** (called an identifier) that the programmer chooses.
- It holds a **value** of a particular data type.
- Its value can **change** during program execution.
- The name should be meaningful (e.g., `score` is better than `s`).

**Variable naming rules (most languages):**
- Must start with a letter or underscore, not a number.
- Cannot contain spaces — use underscores instead: `player_name`.
- Cannot be a reserved keyword (e.g., `if`, `while`, `print`).
- Case-sensitive in Python: `Score` and `score` are different variables.

### What is a Constant?

A **constant** is a named value that is set once and does not change during the program's execution. Constants are used for values that are fixed by definition, such as the number of days in a week, a tax rate, or a maximum password length.

By convention, constants are written in **UPPERCASE** to make them visually distinct from variables:

```pseudocode
CONSTANT MAX_ATTEMPTS = 3
CONSTANT TAX_RATE = 0.2
CONSTANT PI = 3.14159
```

**Why use constants instead of just typing the number?**
- Clarity: `MAX_ATTEMPTS` explains what `3` means.
- Maintainability: if the value needs to change, you only update it in one place.
- Safety: signals to other programmers (and to yourself) that this value must not be changed accidentally.

> Note: Python does not enforce constants — the programmer is responsible for not changing them. Other languages (e.g., Java with `final`, C++ with `const`) enforce constants at the language level.

### Assignment

**Assignment** is the process of giving a variable a value. It is written with an arrow in pseudocode or an equals sign in Python.

```pseudocode
# Pseudocode
name ← "Alice"
age ← 14
score ← 0
```

```python
# Python
name = "Alice"
age = 14
score = 0
```

**Critical point:** The assignment operator (`=` in Python, `←` in pseudocode) is NOT the same as mathematical equality. `score = score + 1` is perfectly valid in programming — it means "take the current value of score, add 1, and store the result back in score". In mathematics this equation is impossible.

---

## Section 2: Data Types

The **data type** of a variable tells the computer what kind of value it holds and what operations can be performed on it. Using the wrong data type causes errors or produces incorrect results.

### The Four Core Data Types at KS3

| Data Type | Name | Description | Examples |
|---|---|---|---|
| `int` | Integer | Whole numbers (positive, negative, or zero) | `0`, `42`, `-7`, `1000` |
| `float` | Float / Real | Numbers with a decimal point | `3.14`, `-0.5`, `9.81`, `100.0` |
| `str` | String | Text — any sequence of characters enclosed in quotes | `"Hello"`, `"42"`, `"True"`, `""` |
| `bool` | Boolean | Logical value — only ever `True` or `False` | `True`, `False` |

### Integers (`int`)

Integers are whole numbers. They are used for counting, indexing, and any calculation where a fractional result is not needed or expected.

```pseudocode
numberOfStudents ← 30
lives ← 3
temperature ← -5
```

### Floats (`float`)

Floats (short for floating-point numbers) store numbers with decimal places. They are used for measurements, averages, and any calculation where precision beyond a whole number is required.

```pseudocode
average ← 72.5
height ← 1.75
pi ← 3.14159
```

> Be careful: dividing two integers in Python 3 always produces a float (e.g., `7 / 2` gives `3.5`, not `3`). Integer division uses `//` (e.g., `7 // 2` gives `3`).

### Strings (`str`)

A string is a sequence of characters enclosed in quotation marks. Strings can contain letters, digits, spaces, punctuation — anything. The crucial thing is that the quotes mark the content as text, not as a number.

```pseudocode
firstName ← "Alice"
postcode ← "SW1A 1AA"
answer ← "42"         # This is a STRING, not an integer
```

Note that `"42"` is a string. You cannot do arithmetic with it — `"42" + 1` will cause a type error.

### Booleans (`bool`)

A Boolean stores one of exactly two values: `True` or `False`. Booleans arise from comparisons and logical expressions, and they are the foundation of all selection (IF statements) and iteration (WHILE loops).

```pseudocode
isLoggedIn ← True
hasWon ← False
overAge ← (age >= 18)   # evaluates to True or False
```

Booleans are not trivial — they underpin everything from password checkers to game-over conditions.

### Type Casting

**Type casting** (also called type conversion) is explicitly converting a value from one data type to another. This is essential when, for example, the user types a number — it arrives as a string and must be converted to an integer before arithmetic can be done.

| Function | What it does | Example |
|---|---|---|
| `int(x)` | Converts x to an integer | `int("42")` → `42` |
| `float(x)` | Converts x to a float | `float("3.14")` → `3.14` |
| `str(x)` | Converts x to a string | `str(99)` → `"99"` |

```python
# Python example
age = int(input("Enter your age: "))  # input() always returns a string; int() converts it
```

---

## Section 3: Input and Output

### Output

**Output** displays information from the program to the user. It is written as `OUTPUT` in pseudocode and `print()` in Python.

```pseudocode
OUTPUT "Hello, World!"
OUTPUT "Your score is: ", score
OUTPUT name + " is " + str(age) + " years old."
```

```python
print("Hello, World!")
print("Your score is:", score)
print(name, "is", age, "years old.")
```

Multiple values can be output on one line. In Python, `print()` automatically separates items with a space when given multiple arguments separated by commas.

### Input

**Input** reads data from the user (via the keyboard) and stores it in a variable. In pseudocode the keyword is `USERINPUT`; in Python it is `input()`.

```pseudocode
name ← USERINPUT
age ← USERINPUT
```

```python
name = input("Enter your name: ")
age = int(input("Enter your age: "))
```

**Critical:** `input()` in Python **always returns a string**. If you need a number, you must cast it immediately with `int()` or `float()`.

### A Complete Input/Output Program

```pseudocode
OUTPUT "Enter your name:"
name ← USERINPUT
OUTPUT "Enter your age:"
age ← USERINPUT
OUTPUT "Hello, " + name + "! You are " + age + " years old."
```

```python
name = input("Enter your name: ")
age = int(input("Enter your age: "))
print("Hello,", name + "! You are", age, "years old.")
```

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Variable | A named storage location in memory whose value can change during program execution |
| Constant | A named value that is set once and does not change; written in UPPERCASE by convention |
| Data type | A classification of data that tells the computer what kind of value is stored and what can be done with it |
| Integer (`int`) | A whole number data type, with no decimal point; positive, negative, or zero |
| Float (`float`) | A data type for numbers with a decimal point (real numbers) |
| String (`str`) | A data type for text; a sequence of characters enclosed in quotation marks |
| Boolean (`bool`) | A data type with only two possible values: `True` or `False` |
| Assignment | The operation of storing a value in a variable using `←` (pseudocode) or `=` (Python) |
| Type casting | Converting a value from one data type to another (e.g., `int("5")` converts the string "5" to the integer 5) |
| Input | Data received from the user, typically via the keyboard |
| Output | Data displayed to the user, typically on screen |
| Identifier | The name given to a variable, constant, or subroutine |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| `=` means "is equal to" | In programming, `=` is the **assignment** operator — it stores a value. To check equality, use `==`. |
| Variables store their value permanently | Variables exist only while the program runs. When the program ends, all variables are lost (unless saved to a file or database). |
| `"42"` and `42` are the same thing | `"42"` is a **string** (text) and `42` is an **integer**. You cannot do arithmetic on `"42"` without casting it first. |
| Boolean is just for on/off and is trivial | Boolean values are the engine behind every IF statement and every WHILE loop. Understanding them is fundamental to all control flow. |
| Python enforces constants | Python has no built-in constant mechanism. Writing a name in UPPERCASE is a convention only — nothing stops the program from changing it. |
| `input()` gives you a number when you type one | `input()` **always** returns a string. You must explicitly cast to `int()` or `float()` if you need a number. |
| You need a new line of code for each character of a string | A string variable holds the entire piece of text — `name = "Alice"` stores all five characters in one variable. |

---

## Diagrams / Code Examples

### Trace Table Example

Trace the following program step by step, recording each variable's value after each line executes.

```pseudocode
x ← 5
y ← 3
x ← x + y
y ← x - y
OUTPUT x
OUTPUT y
```

| Line | Statement | `x` | `y` | Output |
|---|---|---|---|---|
| 1 | `x ← 5` | 5 | — | |
| 2 | `y ← 3` | 5 | 3 | |
| 3 | `x ← x + y` (= 5+3) | 8 | 3 | |
| 4 | `y ← x - y` (= 8-3) | 8 | 5 | |
| 5 | `OUTPUT x` | 8 | 5 | `8` |
| 6 | `OUTPUT y` | 8 | 5 | `5` |

### Type Casting Example

```python
# Without casting — this will CRASH with a TypeError
number = input("Enter a number: ")   # number = "7" (a string)
result = number + 3                   # ERROR: cannot add string and int

# With casting — this works correctly
number = int(input("Enter a number: "))  # number = 7 (an integer)
result = number + 3                       # result = 10
print(result)
```

### Memory Diagram

```
MEMORY
┌─────────────┬──────────┐
│  Variable   │  Value   │
├─────────────┼──────────┤
│  name       │ "Alice"  │
│  age        │    14    │
│  score      │    85    │
│  isPassed   │  True    │
└─────────────┴──────────┘
```

### Full Program: Name and Age Greeting

```python
# Greeting program demonstrating input, output, variables, types, and casting

name = input("What is your name? ")          # str
age = int(input("How old are you? "))        # cast to int
next_year = age + 1                          # int arithmetic
print("Hello,", name + "!")
print("Next year you will be", next_year, "years old.")
```

**Example run:**
```
What is your name? Alice
How old are you? 14
Hello, Alice!
Next year you will be 15 years old.
```

---

## Exam-Style Questions

**Q1** [1 mark]
What data type would be used to store the value `True`?

---

**Q2** [1 mark]
State the data type of each of the following values:
a) `"Hello"`
b) `3.14`
c) `42`
d) `False`

---

**Q3** [2 marks]
Explain the difference between a **variable** and a **constant**. Give one example of each.

---

**Q4** [2 marks]
Look at the following Python code:

```python
age = input("Enter your age: ")
nextAge = age + 1
print(nextAge)
```

a) Identify the error in this code. [1 mark]
b) Write the corrected line of code. [1 mark]

---

**Q5** [3 marks]
Write a pseudocode program that:
- asks the user to input their first name
- asks the user to input their score (a whole number)
- outputs a message in the format: `"Well done [name], your score is [score]."`

---

**Q6** [4 marks]
Trace through the following program, completing the trace table.

```pseudocode
a ← 10
b ← 4
c ← a + b
a ← c - b
b ← a * 2
OUTPUT a
OUTPUT b
OUTPUT c
```

| Line | Statement | `a` | `b` | `c` | Output |
|---|---|---|---|---|---|
| 1 | `a ← 10` | | | | |
| 2 | `b ← 4` | | | | |
| 3 | `c ← a + b` | | | | |
| 4 | `a ← c - b` | | | | |
| 5 | `b ← a * 2` | | | | |
| 6 | `OUTPUT a` | | | | |
| 7 | `OUTPUT b` | | | | |
| 8 | `OUTPUT c` | | | | |

---

**MCQ** [1 mark]
Which of the following is a valid variable name in Python?

A) `2score`
B) `my score`
C) `my_score`
D) `if`

---

**Fill in the blank** [1 mark]
To convert the string `"25"` to an integer in Python, you would write: `______("25")`

---

## Model Answers

**Q1:** Boolean (or `bool`) [1]

**Q2:**
a) `"Hello"` — String (str) [1]
b) `3.14` — Float (float) [1]
c) `42` — Integer (int) [1]
d) `False` — Boolean (bool) [1]
*(1 mark for all four correct)*

**Q3:**
A **variable** is a named memory location whose value can change during program execution. Example: `score ← 0` (score changes as the game progresses). [1]
A **constant** is a named value that is set once and does not change during execution. Example: `CONSTANT MAX_SCORE = 100`. [1]

**Q4:**
a) `input()` returns a string, so `age` is a string. You cannot add an integer (`1`) to a string — this causes a TypeError. [1]
b) `age = int(input("Enter your age: "))` [1]

**Q5:**
```pseudocode
OUTPUT "Enter your first name:"
name ← USERINPUT
OUTPUT "Enter your score:"
score ← USERINPUT
OUTPUT "Well done " + name + ", your score is " + score + "."
```
[1 mark per correct line, max 3]

**Q6:**

| Line | Statement | `a` | `b` | `c` | Output |
|---|---|---|---|---|---|
| 1 | `a ← 10` | 10 | — | — | |
| 2 | `b ← 4` | 10 | 4 | — | |
| 3 | `c ← a + b` | 10 | 4 | 14 | |
| 4 | `a ← c - b` (14-4) | 10 | 4 | 14 | |
| 5 | `b ← a * 2` (10×2) | 10 | 20 | 14 | |
| 6 | `OUTPUT a` | 10 | 20 | 14 | `10` |
| 7 | `OUTPUT b` | 10 | 20 | 14 | `20` |
| 8 | `OUTPUT c` | 10 | 20 | 14 | `14` |

[1 mark for each of: c=14 correct, a stays 10, b=20, outputs correct]

**MCQ:** C — `my_score` [1]
(A starts with a digit; B contains a space; D is a reserved keyword)

**Fill in the blank:** `int` [1]

---

## Revision Checklist

- [ ] I can explain what a variable is and describe what "named memory location" means.
- [ ] I can explain the difference between a variable and a constant, and give an example of each.
- [ ] I can identify the data type (int, float, str, bool) of any given value.
- [ ] I can explain why `"42"` and `42` are different and what would happen if you tried to add 1 to `"42"`.
- [ ] I understand that `=` in Python means assignment, not equality.
- [ ] I can write pseudocode and Python code that uses `USERINPUT` / `input()` to receive data from a user.
- [ ] I can write pseudocode and Python code that uses `OUTPUT` / `print()` to display data to a user.
- [ ] I understand that `input()` always returns a string and can correctly apply `int()` or `float()` to convert it.
- [ ] I can perform type casting between string, integer, and float.
- [ ] I can trace a short program through a trace table, recording variable values after each line.
- [ ] I can spot and fix a type error caused by incorrect data types.
- [ ] I know that constants should be written in UPPERCASE by convention and why constants are useful.
