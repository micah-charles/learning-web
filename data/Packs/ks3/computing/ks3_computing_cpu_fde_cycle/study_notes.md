# KS3 Computing — Study Pack
# Topic: The CPU & Fetch-Decode-Execute Cycle
**Year 7–9 | Computer Systems | UK National Curriculum**

---

## Overview

The CPU (Central Processing Unit) is the most important component of any computer. But the CPU is itself made up of several internal sub-components, each with a specific role. Understanding how these parts work together — and following the precise sequence of steps called the **Fetch-Decode-Execute cycle** — is the key to understanding how any computer program actually runs.

This pack also explores the factors that determine how fast a CPU can process instructions: clock speed, number of cores, and cache size.

By the end of this pack you will be able to:
- Name and describe the CPU's internal components (ALU, Control Unit, Cache, Registers)
- Describe each stage of the Fetch-Decode-Execute cycle in detail
- Explain how clock speed, core count, and cache size affect CPU performance
- Explain the Von Neumann architecture concept
- Apply your knowledge to compare CPUs and predict performance

---

## Section 1: CPU Internal Components

The CPU is not a single simple chip — it contains several specialised sub-components that each handle a different part of the instruction processing task.

### Control Unit (CU)

The **Control Unit** is the "manager" or "coordinator" of the CPU. It:
- Directs the flow of data between the CPU's components and RAM
- Manages and coordinates the Fetch-Decode-Execute cycle
- Does **not** perform calculations itself — it organises and controls everything else
- Sends control signals to other components telling them what to do and when

### Arithmetic and Logic Unit (ALU)

The **ALU** is where all actual computation happens. It performs:
- **Arithmetic operations:** Addition, subtraction, multiplication, division
- **Logical operations:** AND, OR, NOT, XOR (Boolean logic comparisons)
- **Comparison operations:** Is A greater than B? Are A and B equal?

The ALU is the component that executes mathematical instructions. The result is temporarily held in a register.

### Registers

**Registers** are extremely small but ultra-fast memory locations **inside the CPU itself**. They hold data and instructions that the CPU is working with right now — they are faster than cache or RAM.

Key registers:

| Register | Purpose |
|----------|---------|
| **Program Counter (PC)** | Holds the **memory address** of the next instruction to be fetched from RAM |
| **Accumulator** | Holds the result of the most recent ALU operation |
| **Memory Address Register (MAR)** | Holds the address in RAM that data/instructions are being read from or written to |
| **Memory Data Register (MDR)** | Temporarily holds data that has just been fetched from, or is about to be written to, RAM |

At KS3 level, you need to know the Program Counter and Accumulator. The MAR and MDR become more important at GCSE.

### Cache

**Cache** is a small amount of very high-speed memory located **inside or very close to the CPU**. It stores copies of the most frequently used instructions and data.

- **Much faster** than RAM to access
- **Much smaller** than RAM (typically a few MB compared to RAM's many GB)
- Organised in levels: **L1 cache** (smallest, fastest, inside CPU), **L2 cache** (larger, slightly slower), **L3 cache** (largest, shared between cores)
- When the CPU needs data, it checks cache first. If found (a **cache hit**), it reads fast. If not found (a **cache miss**), it must fetch from RAM (slower).

**Why cache matters:** RAM access takes many more clock cycles than cache access. If frequently used instructions are already in cache, the CPU wastes fewer cycles waiting — execution is much faster.

---

## Section 2: The Fetch-Decode-Execute Cycle

Every instruction that every program ever runs goes through the same three-stage process, repeated continuously, billions of times per second.

### The Three Stages

#### Stage 1: FETCH

1. The **Control Unit** reads the memory address stored in the **Program Counter (PC)**
2. It sends this address to RAM via the address bus
3. The instruction stored at that address in RAM is retrieved
4. The instruction is copied into the **Memory Data Register (MDR)**, then into the **Current Instruction Register**
5. The **Program Counter is incremented** (updated to point to the address of the next instruction)

**In plain English:** The CPU finds out where the next instruction is, goes to that location in RAM, brings the instruction back into the CPU, and updates its "bookmark" to remember where to go next.

#### Stage 2: DECODE

1. The **Control Unit** examines the instruction that has just been fetched
2. It interprets what operation is required (e.g. "add these two numbers", "move this value to that location", "jump to this address")
3. It determines what data is needed and where to find it
4. It prepares the appropriate signals to carry out the operation

**In plain English:** The Control Unit reads the instruction and works out exactly what needs to happen and who needs to do it.

#### Stage 3: EXECUTE

1. The relevant component carries out the instruction:
   - If it is a calculation: the **ALU** performs the arithmetic or logic operation
   - If it is a memory access: data is read from or written to RAM
   - If it is a control instruction (e.g. jump/branch): the **Program Counter** is updated to a new address
2. The result may be stored in a **register** (Accumulator) or written back to RAM

**In plain English:** The instruction is actually carried out by the appropriate part of the CPU (or involves RAM).

After Execute, the cycle immediately **returns to Fetch** for the next instruction.

---

### FDE Cycle Flow Diagram

```
                    ┌─────────────────┐
                    │     FETCH       │
                    │                 │
                    │ • Read Program  │
                    │   Counter       │
                    │ • Retrieve      │
                    │   instruction   │
                    │   from RAM      │
                    │ • Increment PC  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     DECODE      │
                    │                 │
                    │ • Control Unit  │
                    │   interprets    │
                    │   instruction   │
                    │ • Determines    │
                    │   operation &   │
                    │   data needed   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     EXECUTE     │
                    │                 │
                    │ • ALU performs  │
                    │   calculation   │
                    │ • OR RAM is     │
                    │   read/written  │
                    │ • Result stored │◄─────┐
                    └────────┬────────┘      │
                             │               │
                             └───────────────┘
                           (repeat continuously)
```

---

### Worked FDE Example

Imagine a program instruction: **"Add the value 5 to the value stored in the Accumulator"**

```
FETCH:
  Program Counter says: "Next instruction is at address 0042"
  CPU retrieves the instruction from RAM address 0042
  PC is updated to 0043 (ready for next instruction)

DECODE:
  Control Unit reads: "ADD 5"
  It recognises this as an addition operation
  It identifies that the number 5 must be added to the Accumulator

EXECUTE:
  ALU takes the current value in the Accumulator (say, 10)
  ALU adds 5 to it: 10 + 5 = 15
  Result (15) is stored in the Accumulator
  
  → Cycle repeats: FETCH next instruction from address 0043
```

---

## Section 3: CPU Performance Factors

### 1. Clock Speed

The **clock** is an electronic signal that synchronises all operations in the CPU. Each "tick" is one clock cycle, and the CPU performs a set amount of work per cycle.

- **Clock speed** is measured in **GHz** (gigahertz = billions of cycles per second)
- A 3.2 GHz CPU performs 3,200,000,000 cycles every second
- Higher clock speed → more instructions processed per second → faster execution

**Limitation:** Higher clock speed generates more heat. There is a physical limit to how fast transistors can switch reliably.

```
Clock speed comparison:
  2.0 GHz  →  2 billion cycles/second
  3.2 GHz  →  3.2 billion cycles/second  (60% faster)
  5.0 GHz  →  5 billion cycles/second   (150% faster than 2.0 GHz)
```

### 2. Number of Cores

A **core** is a complete, independent processing unit. A modern CPU chip typically contains multiple cores on a single piece of silicon.

- **Dual-core:** 2 independent cores
- **Quad-core:** 4 independent cores
- **Octa-core:** 8 independent cores

Each core can fetch, decode, and execute instructions independently, allowing **genuinely parallel execution** of multiple tasks simultaneously.

**Example:** A quad-core CPU can run four separate threads simultaneously — so while one core runs your web browser, another runs your music app, another handles background updates, and another processes a download.

**Limitation:** Not all software is written to use multiple cores (parallelised code). A single-threaded program can only use one core at a time, no matter how many the CPU has.

### 3. Cache Size

As explained earlier, cache is the ultra-fast memory inside the CPU. A **larger cache** means:
- More frequently used instructions and data can be stored close to the CPU
- Fewer **cache misses** (situations where the CPU has to wait for slower RAM)
- Faster execution overall

**Limitation:** Cache is extremely expensive to manufacture. There is a practical limit to how much cache fits on a CPU chip.

---

### Performance Factors Comparison Table

| Factor | How it improves performance | Limitation |
|--------|-----------------------------|-----------|
| **Higher clock speed** | More instruction cycles per second | Generates more heat; physical switch speed limit |
| **More cores** | Multiple tasks execute truly in parallel | Requires software written to use multiple cores |
| **Larger cache** | More frequently used data available instantly; fewer slow RAM accesses | Expensive; limited physical space on chip |

---

### Comparing Two CPUs: Which is Faster?

```
CPU A: 1 core  @ 2.0 GHz, 1 MB cache
CPU B: 4 cores @ 3.2 GHz, 8 MB cache

For a single-threaded task (e.g. running one program):
  CPU B's 3.2 GHz clock speed wins over CPU A's 2.0 GHz — 60% more cycles/second.

For heavy multitasking (e.g. video editing while gaming):
  CPU B's 4 cores massively outperform CPU A's 1 core — 4 tasks can run in parallel.
  CPU A would have to rapidly switch between tasks (slower apparent multitasking).

For cache benefit:
  CPU B's 8 MB cache means far fewer RAM accesses needed.
  CPU A's 1 MB cache fills quickly; frequent cache misses slow execution.

Overall: CPU B is significantly faster in virtually all scenarios.
```

---

## Section 4: Von Neumann Architecture

**Von Neumann architecture** is the design principle that underlies virtually all modern general-purpose computers. Its key idea:

> Both **program instructions** and **data** are stored together in the same memory (RAM), using the same format (binary numbers).

This is why the same RAM that holds your document text also holds the word-processor program's instructions. The CPU cannot tell from a binary value alone whether it is data or an instruction — the position in memory and the context of the program determines this.

```
Von Neumann Architecture (simplified):

        ┌───────────────────────────────────┐
        │              CPU                  │
        │  ┌──────────┐  ┌───────────────┐ │
        │  │ Control  │  │     ALU       │ │
        │  │  Unit    │  │ (calculations)│ │
        │  └──────────┘  └───────────────┘ │
        │  ┌──────────┐  ┌───────────────┐ │
        │  │ Registers│  │    Cache      │ │
        │  │ (PC, Acc)│  │ (fast store)  │ │
        │  └──────────┘  └───────────────┘ │
        └──────────────┬────────────────────┘
                       │ (buses: data, address, control)
                       ▼
        ┌───────────────────────────────────┐
        │              RAM                  │
        │  ┌─────────────┐ ┌─────────────┐ │
        │  │  Program    │ │    Data     │ │
        │  │ Instructions│ │  (values,   │ │
        │  │  (binary)   │ │  results)   │ │
        │  └─────────────┘ └─────────────┘ │
        └───────────────────────────────────┘
```

---

## Key Vocabulary

| Term | Definition |
|------|-----------|
| **CPU** | Central Processing Unit; executes all program instructions |
| **ALU** | Arithmetic and Logic Unit; performs all calculations and logical comparisons |
| **Control Unit** | Manages the FDE cycle; coordinates data flow between CPU components and RAM |
| **Register** | Tiny, ultra-fast memory storage inside the CPU |
| **Program Counter (PC)** | Register that holds the memory address of the next instruction to be fetched |
| **Accumulator** | Register that holds the result of the most recent ALU operation |
| **Cache** | Small, fast memory inside/near the CPU; stores frequently used instructions to reduce RAM accesses |
| **FDE cycle** | Fetch-Decode-Execute; the continuous three-stage process by which a CPU executes instructions |
| **Clock speed** | The number of cycles per second a CPU performs; measured in GHz |
| **Core** | An independent processing unit within a CPU; multiple cores allow parallel execution |
| **Von Neumann architecture** | Design where program instructions and data share the same RAM |
| **Cache hit** | When requested data is found in cache (fast) |
| **Cache miss** | When data is not in cache and must be fetched from RAM (slower) |
| **GHz** | Gigahertz; billions of cycles per second; unit for clock speed |

---

## Common Misconceptions

| Misconception | Correction |
|---------------|-----------|
| "The CPU stores programs" | The CPU **executes** programs. Programs are stored in RAM (while running) and on secondary storage (HDD/SSD) permanently. The CPU only holds the current instruction in a register. |
| "More cores always means faster performance" | More cores improve performance for tasks that can run in parallel. A single-threaded program that cannot be parallelised uses only one core and sees no benefit from additional cores. |
| "Cache is the same as RAM" | Cache is a **smaller, faster** type of memory located inside/near the CPU. RAM is much larger but slower. Cache stores a copy of frequently accessed data from RAM. |
| "Higher clock speed always means a faster computer" | Clock speed is one factor. A 4-core 3.2 GHz CPU will often outperform a single-core 4.0 GHz CPU for typical multitasking workloads. Cache size and core count also matter significantly. |
| "The FDE cycle has only two steps" | There are exactly **three** distinct stages: Fetch, Decode, and Execute. Decode is a separate stage where the Control Unit interprets the instruction — it is not part of Fetch or Execute. |
| "The ALU controls the FDE cycle" | The **Control Unit** manages and coordinates the FDE cycle. The ALU only executes arithmetic and logical operations during the Execute stage. |

---

## Exam-Style Questions

### Q1 [1 mark]
What does **ALU** stand for?

### Q2 [2 marks]
Describe what happens during the **Fetch** stage of the Fetch-Decode-Execute cycle. Include reference to the Program Counter in your answer.

### Q3 [2 marks]
Explain how a **larger cache** improves the performance of a CPU.

### Q4 [4 marks]
A student is choosing between two computers:

- **Computer X:** Single-core CPU running at 2.0 GHz with 2 MB cache
- **Computer Y:** Quad-core CPU running at 3.2 GHz with 8 MB cache

Explain which computer would perform better for (a) running a single program and (b) heavy multitasking. Justify your answers.

### Q5 [6 marks]
Describe the complete Fetch-Decode-Execute cycle. Your answer should clearly describe what happens at each of the three stages, name the components involved, and explain what happens to the Program Counter.

### Multiple Choice Question
Which component of the CPU is responsible for coordinating the Fetch-Decode-Execute cycle and managing the flow of data between components?

- A) ALU
- B) Accumulator
- C) Control Unit
- D) Cache

*(Answer: C)*

### Fill in the Blank
"The __________ holds the memory address of the next instruction to be fetched. After fetching, it is automatically __________ to point to the next instruction. During the Execute stage, calculations are performed by the __________."

*(Answers: Program Counter; incremented; ALU)*

---

## Model Answers

### Q1 Model Answer
Arithmetic and Logic Unit

### Q2 Model Answer
During the Fetch stage, the Control Unit reads the memory address stored in the Program Counter (PC). It uses this address to retrieve the instruction from that location in RAM. The instruction is copied into the CPU. The Program Counter is then incremented (increased) so that it points to the address of the next instruction to be fetched.

### Q3 Model Answer
A larger cache can store more frequently used instructions and data close to the CPU. When the CPU needs data, it checks the cache first. If the data is found (a cache hit), the CPU reads it very quickly without having to access the much slower RAM. With a larger cache, more data can be stored — resulting in more cache hits and fewer time-consuming RAM accesses, so the CPU processes instructions faster overall.

### Q4 Model Answer
**(a) Running a single program:**
Computer Y would still perform better because its 3.2 GHz clock speed is significantly faster than Computer X's 2.0 GHz, allowing it to complete more instruction cycles per second. Its larger 8 MB cache also means fewer RAM accesses. For a single-threaded program that can only use one core, clock speed and cache size are the decisive factors.

**(b) Heavy multitasking:**
Computer Y would perform dramatically better. Its 4 cores can execute 4 tasks truly simultaneously — for example, running a game, a browser, a music app, and background updates all at the same time, each on a separate core. Computer X's single core can only execute one instruction stream at a time, having to rapidly switch between all the tasks (context switching), which creates delays and makes all tasks run slower.

### Q5 Model Answer

**Fetch:**
The Control Unit reads the value stored in the Program Counter (PC), which contains the memory address of the next instruction. The CPU sends this address to RAM and retrieves the instruction stored there. The instruction is brought into the CPU and held in a register. The Program Counter is then incremented — updated to the address of the next instruction — so the CPU knows where to fetch from next.

**Decode:**
The Control Unit examines the fetched instruction. It interprets what operation is required (e.g. an addition, a data move, a jump) and determines what data is needed and where it is. The Control Unit then sends the appropriate control signals to the relevant components to prepare them to carry out the operation.

**Execute:**
The instruction is carried out by the relevant component. If it involves a calculation, the ALU performs the arithmetic or logical operation and stores the result in the Accumulator register. If it involves reading or writing memory, data is transferred between RAM and a register. If it is a branch/jump instruction, the Program Counter may be updated to a new address.

After Execute, the cycle immediately begins again with the next Fetch. This cycle repeats billions of times per second for every program running on the computer.

---

## Revision Checklist

- [ ] I can name the four key internal components of the CPU (Control Unit, ALU, Registers, Cache)
- [ ] I can describe what the Control Unit does (manages FDE cycle, coordinates data flow)
- [ ] I can describe what the ALU does (arithmetic and logical operations)
- [ ] I can explain what registers are and name the Program Counter and Accumulator
- [ ] I can explain the purpose of cache and why it is faster than RAM
- [ ] I can describe all three stages of the FDE cycle (Fetch, Decode, Execute)
- [ ] I know the role of the Program Counter in the Fetch stage (address of next instruction; incremented after fetch)
- [ ] I can explain how clock speed affects CPU performance (GHz = cycles per second)
- [ ] I can explain how having more cores improves multitasking
- [ ] I can explain how larger cache improves performance (fewer RAM accesses, more cache hits)
- [ ] I can compare two CPUs across clock speed, cores, and cache and predict which is faster
- [ ] I know the key idea of Von Neumann architecture (data and instructions stored in same RAM)
- [ ] I can identify and correct common misconceptions about CPU components and performance
