# KS3 Computing — Study Pack
# Topic: Sorting & Searching Algorithms
**Year 7–9 | Computational Thinking | UK National Curriculum**

---

## Overview

Sorting and searching are two of the most common operations a computer performs. Every time you search Google, find a contact on your phone, or see products sorted by price, an algorithm is working behind the scenes. Understanding how these algorithms work — and why some are more efficient than others — is a fundamental computing skill.

---

## Section 1: Searching Algorithms

### Linear Search

A **linear search** (also called a sequential search) checks each item in a list **one by one**, from first to last, until the target value is found or the entire list has been checked.

**How it works**:
1. Start at the first item
2. Compare it to the target
3. If it matches → found; stop
4. If not → move to the next item
5. Repeat until found or list exhausted

**Pseudocode**:
```pseudocode
FUNCTION linearSearch(list, target)
    FOR i = 0 TO len(list) - 1
        IF list[i] == target THEN
            RETURN i        # Return the position
        ENDIF
    ENDFOR
    RETURN -1               # Not found
ENDFUNCTION
```

**Worked trace — searching for 7 in [3, 9, 7, 1, 5]**:

| Step | Index | list[i] | Match? |
|---|---|---|---|
| 1 | 0 | 3 | No |
| 2 | 1 | 9 | No |
| 3 | 2 | 7 | **Yes — found at index 2** |

**Number of comparisons**: 3

**Key facts about linear search**:
- Works on **any list** — sorted or unsorted
- Simple to implement
- Worst case: checks every item (target is last, or not present)
- Best case: target is the first item (1 comparison)
- Suitable for small lists or unsorted data

---

### Binary Search

A **binary search** works by repeatedly **halving** the search space. It compares the target to the **middle element** of the sorted list, then eliminates the half that cannot contain the target.

**IMPORTANT**: Binary search only works on a **sorted** list.

**How it works**:
1. Find the middle element
2. If it matches the target → found; stop
3. If the target is less → search the left half
4. If the target is greater → search the right half
5. Repeat with the new half until found or no items remain

**Pseudocode**:
```pseudocode
FUNCTION binarySearch(list, target)
    low ← 0
    high ← len(list) - 1

    WHILE low <= high
        mid ← (low + high) DIV 2
        IF list[mid] == target THEN
            RETURN mid
        ELIF list[mid] < target THEN
            low ← mid + 1
        ELSE
            high ← mid - 1
        ENDIF
    ENDWHILE

    RETURN -1    # Not found
ENDFUNCTION
```

**Worked trace — searching for 14 in [2, 5, 8, 11, 14, 17, 20]**:

| Step | low | high | mid | list[mid] | Action |
|---|---|---|---|---|---|
| 1 | 0 | 6 | 3 | 11 | 14 > 11 → search right half |
| 2 | 4 | 6 | 5 | 17 | 14 < 17 → search left half |
| 3 | 4 | 4 | 4 | 14 | **Match — found at index 4** |

**Number of comparisons**: 3 (vs up to 5 for linear search on the same list)

**Key facts about binary search**:
- Requires a **sorted** list
- Much faster than linear search for large lists
- Each step halves the remaining search space
- A list of 1,000 items: at most 10 comparisons with binary search vs up to 1,000 with linear

---

### Linear vs. Binary Search — Comparison

| Feature | Linear Search | Binary Search |
|---|---|---|
| Works on unsorted data? | ✓ Yes | ✗ No — must be sorted |
| Maximum comparisons (1000 items) | 1,000 | ~10 |
| Complexity to implement | Simple | Moderate |
| Best for | Small or unsorted lists | Large, sorted lists |

---

## Section 2: Sorting Algorithms

### Bubble Sort

**Bubble sort** works by repeatedly comparing **adjacent pairs** of elements and swapping them if they are in the wrong order. After each **pass** through the list, the largest unsorted element "bubbles up" to its correct position.

**How it works (one pass)**:
1. Compare element at index 0 with element at index 1
2. If they are in the wrong order, swap them
3. Move to index 1 and 2; compare and swap if needed
4. Continue to the end of the list
5. Repeat passes until no swaps occur in a full pass

**Pseudocode**:
```pseudocode
PROCEDURE bubbleSort(list)
    n ← len(list)
    FOR pass = 1 TO n - 1
        FOR i = 0 TO n - pass - 1
            IF list[i] > list[i+1] THEN
                temp ← list[i]
                list[i] ← list[i+1]
                list[i+1] ← temp
            ENDIF
        ENDFOR
    ENDFOR
ENDPROCEDURE
```

**Worked trace — sorting [5, 3, 8, 1, 4]**:

**Pass 1**:
- Compare 5, 3 → swap → [3, 5, 8, 1, 4]
- Compare 5, 8 → no swap → [3, 5, 8, 1, 4]
- Compare 8, 1 → swap → [3, 5, 1, 8, 4]
- Compare 8, 4 → swap → [3, 5, 1, 4, 8] ← 8 in place

**Pass 2**:
- Compare 3, 5 → no swap
- Compare 5, 1 → swap → [3, 1, 5, 4, 8]
- Compare 5, 4 → swap → [3, 1, 4, 5, 8] ← 5 in place

**Pass 3**:
- Compare 3, 1 → swap → [1, 3, 4, 5, 8]
- Compare 3, 4 → no swap → [1, 3, 4, 5, 8] ← 4 in place

**Pass 4**: no swaps → sorted

**Final**: [1, 3, 4, 5, 8]

Pass-by-pass summary table:

| After pass | List |
|---|---|
| 0 (start) | 5, 3, 8, 1, 4 |
| 1 | 3, 5, 1, 4, **8** |
| 2 | 3, 1, 4, **5**, 8 |
| 3 | 1, 3, **4**, 5, 8 |
| 4 | **1**, **3**, 4, 5, 8 |

**Key facts about bubble sort**:
- Very simple to understand and implement
- Inefficient for large lists — requires many comparisons
- Maximum passes needed: n - 1 (where n = list length)
- Used mainly for teaching purposes

---

### Merge Sort (Awareness Level)

**Merge sort** uses a **divide and conquer** approach:
1. Split the list in half
2. Recursively sort each half
3. Merge the two sorted halves back together

Merge sort is significantly more efficient than bubble sort for large data sets. It is not required to be implemented at KS3, but students should be aware it exists and is more efficient.

### Insertion Sort (Awareness Level)

**Insertion sort** builds a sorted list one element at a time by taking each element and inserting it into the correct position in the already-sorted portion. Also more efficient than bubble sort in many practical cases.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Linear search | Checking each item in a list one by one from start to end until the target is found |
| Binary search | Repeatedly halving a sorted list to find a target value |
| Bubble sort | A sorting algorithm that repeatedly swaps adjacent out-of-order pairs |
| Merge sort | A divide-and-conquer sorting algorithm (KS3: awareness only) |
| Comparison | Checking whether one value is greater than, less than, or equal to another |
| Pass | One complete run through the list from start to end during a sort |
| Efficiency | The number of steps or comparisons an algorithm requires to complete |
| Sorted list | A list arranged in ascending (lowest to highest) or descending order |
| Swap | Exchanging the positions of two adjacent elements in a list |

---

## Common Misconceptions — Corrected

| Misconception | Correction |
|---|---|
| Binary search works on any list | Binary search **requires a sorted list**. Applying it to an unsorted list produces incorrect results |
| Bubble sort is a good algorithm for large datasets | Bubble sort is very inefficient for large data — its comparisons grow quadratically with list size |
| After one pass of bubble sort, the list is fully sorted | Multiple passes are needed. After one pass, only the largest element is guaranteed to be in its final position |
| Linear search is always worse than binary search | For small lists or unsorted data, linear search is preferable — binary search would require sorting first, which costs additional steps |
| Merge sort and bubble sort are equally efficient | Merge sort is significantly faster for large datasets |

---

## Exam-Style Questions

**Q1** [1 mark]
State one requirement that must be met before a binary search can be used.

**Q2** [2 marks]
A linear search is performed on the following list to find the value 9:
`[2, 6, 9, 14, 20]`

(a) State how many comparisons are made before the value is found. [1 mark]
(b) State how many comparisons would be made if the value being searched for was 25. [1 mark]

**Q3** [3 marks]
Show the state of the following list after **each pass** of bubble sort:
`[7, 2, 9, 4, 6]`

**Q4** [4 marks]
Compare linear search and binary search. Include in your answer:
- one similarity
- two differences
- a scenario where each would be most appropriate

**Q5** [5 marks]
A sorted list contains 1,000 names. Explain why binary search is more efficient than linear search for this list. Use the concept of comparisons to support your answer. Calculate the approximate maximum number of comparisons for each algorithm.

**MCQ** [1 mark]
After two passes of bubble sort on [9, 7, 5, 3, 1], what is the state of the list?

A) [1, 3, 5, 7, 9]
B) [7, 9, 5, 3, 1]
C) [7, 5, 3, 1, 9]
D) [7, 5, 3, **1**, **9**] then [5, 7, 1, **3**, 9]

*(Answer: D — [5, 7, 1, 3, 9] — after pass 1 the 9 is in place; after pass 2 the 7 is in place)*

**Fill in the blank** [1 mark]
Binary search works by repeatedly ___ the list in half.

*(Answer: dividing / halving)*

---

## Model Answers

**Q1**: The list must be **sorted** (in ascending or descending order) before binary search can be applied.

**Q2**:
(a) 3 comparisons (index 0: 2, index 1: 6, index 2: 9 — found)
(b) 5 comparisons (all five items checked; 25 not in list)

**Q3**:
Start: [7, 2, 9, 4, 6]
After pass 1: [2, 7, 4, 6, **9**]
After pass 2: [2, 4, 6, **7**, 9]
After pass 3: [2, 4, **6**, 7, 9]
After pass 4: [**2**, 4, 6, 7, 9] — fully sorted

**Q4**:
Similarity: both algorithms are used to locate a specific item in a list.
Differences:
(1) Linear search works on any list; binary search requires a sorted list.
(2) Binary search is far more efficient — each step halves the remaining data; linear search checks each item individually.
Appropriate use: linear search — for a small, unsorted list such as a list of 10 recent contacts. Binary search — for a large, sorted dataset such as a dictionary or phone directory with thousands of entries.

**Q5**:
Linear search (worst case): must check all 1,000 names → **1,000 comparisons**.
Binary search: each comparison halves the list. 1,000 → 500 → 250 → 125 → 62 → 31 → 15 → 7 → 3 → 1. This takes at most **10 comparisons** (since 2^10 = 1,024 > 1,000).
For 1,000 items, binary search is approximately 100× more efficient in the worst case. As the list grows, this advantage increases dramatically — for 1,000,000 items, binary search needs at most 20 comparisons vs 1,000,000 for linear search.

---

## Revision Checklist

Before your exam, make sure you can:

- [ ] Describe how a linear search works step by step
- [ ] Describe how a binary search works step by step
- [ ] State that binary search requires a sorted list
- [ ] Trace a linear search on a given list and count comparisons
- [ ] Trace a binary search on a sorted list showing midpoint, bounds, and comparisons
- [ ] Trace bubble sort and show the list after each pass
- [ ] State how many passes bubble sort needs in the worst case
- [ ] Compare linear vs binary search (speed, requirements, suitability)
- [ ] Explain why efficiency matters for large datasets
