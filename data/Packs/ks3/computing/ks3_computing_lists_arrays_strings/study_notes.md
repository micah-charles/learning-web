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
