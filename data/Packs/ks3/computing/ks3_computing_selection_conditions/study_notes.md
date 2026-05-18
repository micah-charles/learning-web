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
