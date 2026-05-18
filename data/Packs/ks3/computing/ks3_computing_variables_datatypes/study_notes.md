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
