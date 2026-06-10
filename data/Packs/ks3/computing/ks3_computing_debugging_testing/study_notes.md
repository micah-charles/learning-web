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
