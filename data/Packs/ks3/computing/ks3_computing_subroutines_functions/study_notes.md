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
