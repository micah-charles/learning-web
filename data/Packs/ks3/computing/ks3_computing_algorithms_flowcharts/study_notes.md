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
