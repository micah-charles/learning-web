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
