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
