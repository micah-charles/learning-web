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
