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
