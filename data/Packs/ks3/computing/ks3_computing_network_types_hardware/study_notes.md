# KS3 Computing — Study Pack
# Topic: Network Types & Hardware
**Year 7–9 | Networks | UK National Curriculum**

---

## Overview

A **network** is two or more devices connected together so they can share data and resources. Networks are fundamental to modern computing — from the Wi-Fi in your home to the infrastructure linking millions of computers worldwide. This study pack covers the two main network types (LAN and WAN), how networks are physically laid out (topology), and the hardware devices that make them work.

**Why networks matter:** Without networks, every device would be isolated. Networks enable file sharing across devices, sharing of expensive peripherals like printers, shared internet access, centralised backup of all data, and centralised security management (one administrator can protect every device).

---

## Section 1: Network Types — LAN and WAN

### Local Area Network (LAN)

A **LAN** covers a small geographical area — a single building, school, office, or home. Key characteristics:

- **Ownership**: owned and managed entirely by the organisation using it (the school buys and maintains its own cables, switches, and routers)
- **Connections**: physical Ethernet cables (wired) or Wi-Fi (wireless)
- **Speed**: typically fast — Gigabit Ethernet (1000 Mbps) is common
- **Examples**: your school network, a home network, an office network

### Wide Area Network (WAN)

A **WAN** spans a large geographical area — a city, country, or the entire globe. Key characteristics:

- **Ownership**: relies on **public infrastructure** owned by telecommunications companies (telephone lines, fibre optic cables, satellites, and undersea cables)
- **Connections**: leased lines, fibre optic backbones, satellite links
- **Speed**: generally slower than LANs and more variable
- **Examples**: a bank's network connecting branches across the UK; a company's network linking offices in different countries; **the Internet is the largest WAN in the world**

### LAN vs WAN Comparison

| Feature | LAN | WAN |
|---|---|---|
| Geographical area | Small (building / campus) | Large (city / country / world) |
| Ownership | Owned by the organisation | Uses public/third-party infrastructure |
| Typical speed | Fast (Gbps) | Slower, more variable |
| Setup cost | Moderate (one-off hardware) | High (leased lines, ISP fees) |
| Security control | Organisation controls everything | Less control over external links |
| Example | School network | The Internet |

---

## Section 2: Network Topologies

A **topology** is the physical layout of how devices are connected in a network. There are three you need to know at KS3.

### Bus Topology

All devices connect to a single shared cable called the **bus** (or backbone). Data travels along the bus in both directions.

```
Device A    Device B    Device C    Device D
   |           |           |           |
===|===========|===========|===========|=== [Terminator]
                     BUS CABLE
[Terminator]
```

| Feature | Detail |
|---|---|
| Cost | Cheap — minimal cable used |
| Complexity | Simple to set up |
| Weakness | If the bus cable breaks, the ENTIRE network fails |
| Data collisions | Possible — all devices share one cable |
| Scalability | Poor — adding more devices increases collisions |

### Star Topology

All devices connect individually to a **central switch** (or hub). Data goes from device → switch → destination device.

```
            [Device A]
                |
[Device E]---[SWITCH]---[Device B]
                |
            [Device C]
                |
            [Device D]
```

| Feature | Detail |
|---|---|
| Cost | More expensive — more cable required |
| Reliability | If ONE device fails, others are unaffected |
| Weakness | If the central switch fails, the WHOLE network goes down |
| Performance | Efficient — switch sends data only to intended recipient |
| Scalability | Good — easy to add new devices |
| Most common | Yes — used in most schools and offices |

### Ring Topology

Devices are connected in a closed loop. Each device connects to the next, and data travels around the ring in one direction.

```
[Device A] --- [Device B]
    |                |
[Device D] --- [Device C]
```

Less common in modern networks. A single break in the ring can disrupt all communications.

---

## Section 3: Network Hardware

### Router

- **Purpose**: connects a LAN to the internet (or connects two different networks together)
- **How it works**: examines the destination IP address in each data packet and **routes** it toward its destination via the best available path
- **Additional roles**: assigns IP addresses to devices on the network via DHCP; acts as the network **gateway** (the "door" to the outside world)
- **Where**: every home and school has at least one router

### Switch

- **Purpose**: connects devices **within** a LAN
- **How it works**: learns the MAC addresses of connected devices and sends incoming data **only to the correct destination device** — not to everyone
- **Advantage over hub**: much more efficient; reduces unnecessary traffic
- **Where**: found inside schools and offices, often in network cupboards

### Hub

- **Purpose**: older device for connecting devices within a LAN
- **How it works**: broadcasts incoming data to **ALL** connected devices — every device receives every packet
- **Weakness**: inefficient, creates unnecessary traffic, security risk (any device can see all data)
- **Status**: largely replaced by switches in modern networks

### NIC (Network Interface Card)

- **Purpose**: the hardware component **inside each device** that enables it to connect to a network
- **How it works**: converts data between the format used inside the computer and the format sent over the network
- **MAC address**: every NIC has a unique 48-bit **Media Access Control address** burned in at manufacture — used to identify devices within a LAN
- **Types**: wired NIC (Ethernet port) or wireless NIC (Wi-Fi)

### WAP (Wireless Access Point)

- **Purpose**: allows wireless (Wi-Fi) devices to connect to a wired network
- **How it works**: connected to the wired network via Ethernet; broadcasts a Wi-Fi signal; devices connect wirelessly and are then part of the LAN
- **Example**: the white boxes mounted on walls in school classrooms are usually WAPs

### Ethernet Cable

- **Purpose**: physical wired connection between devices and switches/routers
- **Common types**: Cat5e (up to 1 Gbps), Cat6 (up to 10 Gbps)
- **Characteristics**: reliable, fast, not susceptible to wireless interference

### Wired vs Wireless Comparison

| Feature | Wired (Ethernet) | Wireless (Wi-Fi) |
|---|---|---|
| Speed | Faster (up to 10 Gbps) | Slower (typical 100-600 Mbps) |
| Reliability | Very reliable — consistent signal | Can suffer interference (walls, other devices) |
| Security | More secure — attacker must physically plug in | Less secure — signals travel through air |
| Flexibility | Limited — devices must be near cable | High — connect from anywhere in range |
| Cost | Cable infrastructure needed | WAPs needed; devices need wireless NIC |
| Suitable for | Desktop computers, servers | Laptops, tablets, phones |

### Router vs Switch — Key Role Difference

| Device | Connects… | Operates at… | Sends data to… |
|---|---|---|---|
| Router | Different networks (LAN ↔ Internet) | Network layer (uses IP addresses) | Correct network/internet path |
| Switch | Devices within a LAN | Data link layer (uses MAC addresses) | Specific destination device only |
| Hub | Devices within a LAN | Physical layer | ALL connected devices (broadcast) |

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Network | Two or more devices connected to share data and resources |
| LAN | Local Area Network — covers a small geographical area, owned by the organisation |
| WAN | Wide Area Network — spans a large area, uses public infrastructure |
| Topology | The physical layout of how devices are connected in a network |
| Bus topology | All devices connect to a single shared cable |
| Star topology | All devices connect individually to a central switch |
| Router | Device that connects a LAN to the internet; routes data packets using IP addresses |
| Switch | Connects devices in a LAN; sends data only to the intended recipient device |
| Hub | Older device that broadcasts data to all connected devices |
| NIC | Network Interface Card — hardware component enabling a device to connect to a network |
| MAC address | Unique 48-bit hardware address assigned to every NIC at manufacture |
| WAP | Wireless Access Point — allows wireless devices to connect to a wired network |
| IP address | Unique numerical identifier assigned to each device on a network |
| DHCP | Protocol used by routers to automatically assign IP addresses to devices |
| Ethernet | Wired networking technology; uses Cat5e/Cat6 cables |
| Packet | A small chunk of data transmitted across a network |
| Gateway | The router that connects a local network to external networks/the internet |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "A router and a switch are the same thing" | A router connects different networks (LAN to internet); a switch connects devices within a LAN. They do different jobs at different layers. |
| "WAN means wireless" | WAN stands for Wide Area Network — it refers to geographical size, not wireless technology. A WAN can use both wired and wireless connections. |
| "A hub is better than a switch because it shares with everyone" | Hubs are less efficient and less secure because they broadcast to ALL devices. Switches are smarter — they send data only to the intended recipient. |
| "Modern Wi-Fi is too slow for school networks" | Modern Wi-Fi (Wi-Fi 6) can reach speeds sufficient for most tasks. However, for reliability and security in a school with 300+ computers, wired connections are still preferred. |
| "In a star network, all devices can see each other's data" | In a star topology with a switch (not a hub), the switch sends data only to the intended device. Other devices cannot see it. |

---

## Diagrams / ASCII Art

### Star Topology — School Network

```
                    [Laptop 1]
                         |
        [Desktop 1]---[SWITCH]---[Desktop 2]
                         |
                    [Laptop 2]
                         |
                    [Printer]

Note: If Switch fails → ALL devices lose connection
      If one Device fails → only that device is affected
```

### Bus Topology

```
[Term.]====[PC 1]====[PC 2]====[PC 3]====[PC 4]====[Term.]
                    BUS CABLE (single shared cable)

Note: If bus cable is cut anywhere → ENTIRE network fails
```

### How a Router Connects a LAN to the Internet

```
[PC 1]---+
[PC 2]---+---[SWITCH]---[ROUTER]---[INTERNET]
[PC 3]---+
[WAP]----+
           LAN              WAN
```

---

## Exam-Style Questions

**Q1 [1 mark]**
State **one** difference between a LAN and a WAN.

**Q2 [2 marks]**
Describe the role of a **router** in a computer network.

**Q3 [4 marks]**
Describe how a **star topology** is arranged. State **one** advantage and **one** disadvantage of a star topology compared to a bus topology.

**Q4 [4 marks]**
A school is building a new computer lab with 30 desktop computers. A network manager recommends using **wired connections** rather than wireless.

Explain **two** reasons why wired connections would be more suitable in this situation.

**Q5 [6 marks]**
A large school has 300 computers across multiple buildings. Describe the network hardware that would be needed and explain the role of each device. You should include: NIC, switch, WAP, and router.

**MCQ**
Which device connects a LAN to the internet?

A) Switch
B) Hub
C) Router
D) NIC

**Fill in the blanks**
In a __________ topology, all devices connect to a central __________. This means that if one device fails, the rest of the network is __________. However, if the central device fails, the __________ network goes down.

---

## Model Answers

**Q1:** A LAN covers a small geographical area (such as a school or office) whereas a WAN covers a large geographical area (such as a country or the whole world). **[1 mark for a valid difference]**

**Q2:** A router connects a local network (LAN) to the internet or to other networks (1). It examines the destination IP address of each data packet and routes it along the best path toward its destination (1). **[2 marks]**

**Q3:**
- In a star topology, each device is connected individually to a central switch using its own dedicated cable (1).
- Advantage: if one device fails, all other devices remain connected and the network continues working (1).
- Disadvantage: if the central switch fails, the entire network goes down (1) / star topology requires more cable than bus topology, making it more expensive (1). **[1 mark description + 1 advantage + 1 disadvantage = 3 marks; fourth mark for quality/detail]**

**Q4:**
- Wired connections are faster and more reliable than wireless — there is no interference from walls or other wireless signals, ensuring consistent performance for 30 simultaneous users (1 + 1).
- Wired connections are more secure — data travels through a physical cable and an attacker cannot intercept the signal without physically connecting to the network, unlike wireless signals which can be captured remotely (1 + 1). **[2 marks per reason: identification + explanation]**

**Q5:** Award 1 mark each for identifying the device + 1 mark for explaining its role, up to 6 marks:
- NIC: every computer needs a NIC (Network Interface Card) which is the internal hardware that physically enables the computer to connect to the network. Each NIC has a unique MAC address.
- Switch: multiple switches connect all 300 computers within the buildings, sending data only to the intended recipient device rather than broadcasting to all.
- WAP: Wireless Access Points are needed for any wireless devices (laptops, tablets) to connect to the wired network. WAPs are mounted in rooms and broadcast Wi-Fi.
- Router: the router connects the entire school LAN to the internet (WAN), routes data packets using IP addresses, and assigns IP addresses to devices via DHCP.

**MCQ:** C — Router

**Fill in the blanks:** star / switch / unaffected / entire

---

## Revision Checklist

- [ ] I can define what a network is and list three benefits of networking
- [ ] I can describe a LAN and give two characteristics
- [ ] I can describe a WAN and give two characteristics
- [ ] I can identify the Internet as the largest WAN
- [ ] I can draw and label a star topology diagram
- [ ] I can draw and label a bus topology diagram
- [ ] I can state one advantage and one disadvantage of each topology
- [ ] I can explain the role of a router (connects LAN to internet, routes packets)
- [ ] I can explain the role of a switch (connects LAN devices, sends to intended device only)
- [ ] I can explain why a switch is better than a hub
- [ ] I can explain the role of a NIC and what a MAC address is
- [ ] I can explain the role of a WAP
- [ ] I can compare wired and wireless connections (speed, security, reliability, flexibility)
- [ ] I can state which network type suits a specific scenario and justify my answer
