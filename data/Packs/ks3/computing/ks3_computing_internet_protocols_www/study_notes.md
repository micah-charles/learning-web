# KS3 Computing — Study Pack
# Topic: The Internet, Protocols & the World Wide Web
**Year 7–9 | Networks | UK National Curriculum**

---

## Overview

People frequently use "the internet" and "the World Wide Web" as if they mean the same thing — they do not. Understanding this distinction is one of the most important concepts in this topic. This pack also covers how data travels across networks in **packets**, how addresses work, and the **protocols** (agreed rules) that allow billions of different devices to communicate reliably.

---

## Section 1: The Internet vs the World Wide Web

### The Internet

The **Internet** is the global **infrastructure** — the physical and logical network of interconnected networks spanning the entire planet. It consists of:

- Undersea fibre optic cables crossing oceans
- Overland cables connecting countries
- Routers directing traffic across the network
- Servers providing services
- The physical connections between billions of devices

Think of the internet as the **road network** — the roads, motorways, and junctions that exist everywhere.

### The World Wide Web (WWW)

The **WWW** is a **service** that runs **on top of** the internet. It is the collection of web pages, websites, images, and other media that are linked together using **hyperlinks** and accessed using the **HTTP/HTTPS protocol** via a web browser.

Think of the WWW as the **cars and lorries** that travel on the road network — they use the roads (internet) but are not the same thing as the roads.

### Other Services That Run on the Internet

The internet carries many services — the WWW is just one of them:

| Service | Protocol used | What it does |
|---|---|---|
| World Wide Web | HTTP / HTTPS | Browsing web pages |
| Email | SMTP, IMAP, POP3 | Sending and receiving emails |
| File transfer | FTP | Uploading/downloading files |
| Video streaming | RTSP / HTTP | Netflix, YouTube |
| Online gaming | TCP/UDP | Real-time game data |
| Video calls | WebRTC / SIP | Zoom, Teams |

**Key point**: When you send an email, you are using the internet but NOT the WWW. When you browse Wikipedia, you are using both the internet (to carry the data) and the WWW (the web page itself).

---

## Section 2: Addressing — IP Addresses, Domain Names, and DNS

### IP Addresses

Every device connected to the internet has a unique **IP (Internet Protocol) address** — a numerical identifier that allows routers to direct data to the correct destination.

**IPv4**: The original format. Written as four groups of numbers separated by dots, each 0–255.
- Example: `192.168.1.1` or `66.220.149.25`
- Uses 32 bits → approximately **4.3 billion** unique addresses
- Problem: the world has run out of IPv4 addresses (more devices than addresses)

**IPv6**: The replacement format, designed to solve address exhaustion.
- Example: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`
- Uses 128 bits → approximately **340 undecillion** (3.4 × 10³⁸) unique addresses
- Gradually being adopted alongside IPv4

### Domain Names

IP addresses like `172.217.169.68` are difficult for humans to remember. **Domain names** provide human-readable addresses:

- `www.bbc.co.uk`
- `www.google.com`
- `www.educationwebsite.org`

**Anatomy of a domain name:**
```
   www    .    bbc    .    co    .    uk
   |           |           |          |
subdomain    second-    domain    country-
             level      type      code
```

### DNS — Domain Name System

The **DNS** is the system that translates domain names into IP addresses. It acts like a **phone book** for the internet — you provide a name and it gives you the number (IP address).

Without DNS, you would need to memorise the IP address of every website you want to visit.

**DNS Resolution — Step by Step:**

```
Step 1: User types "www.bbc.co.uk" in browser

Step 2: Browser checks its LOCAL CACHE
        → Has it looked up this address recently?
        → If yes: use cached IP address (fast)
        → If no: proceed to Step 3

Step 3: Browser contacts the DNS SERVER
        (provided by ISP or configured manually e.g. 8.8.8.8 = Google DNS)
        → "What is the IP address for www.bbc.co.uk?"

Step 4: DNS SERVER responds
        → "www.bbc.co.uk is at 151.101.0.81"

Step 5: Browser contacts the WEB SERVER at that IP address
        → "Please send me the home page"

Step 6: Web server sends the HTML, CSS, images back to browser

Step 7: Browser renders and displays the web page
```

### ASCII DNS Resolution Flow Diagram

```
[USER]
  |
  | Types: www.bbc.co.uk
  v
[BROWSER]
  |
  |---(1) Is it in cache?---> YES ---> [IP known, skip to step 5]
  |
  | NO
  v
[DNS SERVER]  <---(2) "What IP for www.bbc.co.uk?"
  |
  |---(3) Returns: 151.101.0.81
  v
[BROWSER]
  |
  |---(4) HTTP request to 151.101.0.81
  v
[WEB SERVER at bbc.co.uk]
  |
  |---(5) Returns HTML, CSS, images
  v
[BROWSER renders page for USER]
```

---

## Section 3: Packets and Packet Switching

### What are Packets?

When you send a file, email, or load a web page, the data is **not sent as one continuous stream**. Instead, it is broken into small chunks called **packets**.

**Each packet contains:**

```
+------------------------------------------+
|  HEADER                                  |
|  - Source IP address (where it came from)|
|  - Destination IP address (where to go)  |
|  - Sequence number (packet 3 of 10)      |
|  - Protocol information                  |
+------------------------------------------+
|  PAYLOAD                                 |
|  - The actual chunk of data              |
|  (e.g. part of a web page, part of file) |
+------------------------------------------+
|  TRAILER                                 |
|  - Error checking (checksum)             |
+------------------------------------------+
```

### Packet Switching

**Packet switching** is the method used to send packets across the internet. Key characteristics:

1. **Different routes**: each packet in a message may travel via a completely different route through the network
2. **Independent decisions**: each router decides the best path for each packet at that moment, based on network conditions
3. **Reassembly**: at the destination, packets are reassembled into the correct order using the sequence numbers

### Packet Switching Diagram

```
SOURCE (sending a 3-packet message A, B, C)
|
|  Packet A ---> Router 1 ---> Router 3 ---> DESTINATION
|  Packet B ---> Router 1 ---> Router 2 ---> Router 4 --> DESTINATION
|  Packet C ---> Router 2 ---> Router 4 ---> DESTINATION

All three packets arrive at DESTINATION:
Packet A (arrived 1st), Packet C (arrived 2nd), Packet B (arrived 3rd)

REASSEMBLED in correct order using sequence numbers: A, B, C
```

### Benefits of Packet Switching

| Benefit | Explanation |
|---|---|
| Efficient use of network | No dedicated line is reserved between sender and receiver — many users share the same network infrastructure simultaneously |
| Fault tolerant | If a router fails, packets automatically reroute around the problem — the message still arrives |
| Scalable | Works for billions of simultaneous connections |
| No wasted bandwidth | Lines are only used when actually carrying a packet |

---

## Section 4: Protocols

A **protocol** is a set of agreed rules that define how data is formatted, transmitted, and received. Protocols allow different devices (different manufacturers, different operating systems) to communicate reliably.

### Key Protocols Reference Table

| Protocol | Full Name | Port | Purpose |
|---|---|---|---|
| HTTP | HyperText Transfer Protocol | 80 | Transfers web pages from server to browser; data sent in plain text (unsecured) |
| HTTPS | HTTP Secure | 443 | HTTP with SSL/TLS encryption; data encrypted in transit; padlock shown in browser |
| TCP | Transmission Control Protocol | — | Splits data into packets; ensures all packets arrive; requests retransmission of lost packets; reliable |
| IP | Internet Protocol | — | Handles routing of packets across networks using IP addresses |
| TCP/IP | Combined protocol suite | — | Foundation of internet communication; TCP + IP working together |
| DNS | Domain Name System | 53 | Translates domain names to IP addresses |
| SMTP | Simple Mail Transfer Protocol | 25/587 | Sends email from client to mail server or between servers |
| IMAP | Internet Message Access Protocol | 143/993 | Receives email; messages stay on server; accessible from multiple devices |
| POP3 | Post Office Protocol v3 | 110/995 | Receives email; messages downloaded to device and deleted from server |
| FTP | File Transfer Protocol | 20/21 | Transfers files between computers |

### HTTP vs HTTPS — The Critical Difference

**HTTP (port 80):**
- Data is transmitted as **plain text**
- Anyone intercepting the data can read it
- Suitable only for public, non-sensitive content
- No padlock in the browser address bar

**HTTPS (port 443):**
- Data is **encrypted** using SSL/TLS before transmission
- Even if intercepted, the data appears as meaningless ciphertext
- Required for any login page, banking, shopping, or personal data
- Shows a **padlock** icon in the browser
- The server has an SSL/TLS **certificate** proving its identity

### TCP/IP — The Internet's Foundation

**TCP** (Transmission Control Protocol) handles the reliable delivery of data:
1. Breaks data into packets
2. Numbers each packet (sequence numbers)
3. Ensures all packets arrive at the destination
4. Requests retransmission of any lost packets
5. Reassembles packets in the correct order

**IP** (Internet Protocol) handles routing:
1. Each packet has a source and destination IP address
2. Routers read the IP address and forward the packet toward its destination
3. Each router makes an independent decision about the next hop

Together, **TCP/IP** ensures that data gets from A to B accurately, regardless of the route taken or the hardware involved.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Internet | The global physical and logical infrastructure — the network of interconnected networks |
| WWW (World Wide Web) | A service running on the internet — the collection of linked web pages accessed via HTTP/HTTPS |
| IP address | A unique numerical identifier assigned to every device on a network |
| IPv4 | 32-bit IP address format; approximately 4.3 billion unique addresses (now largely exhausted) |
| IPv6 | 128-bit IP address format; designed to replace IPv4 with vastly more addresses |
| Domain name | A human-readable address for a website (e.g. www.bbc.co.uk) |
| DNS | Domain Name System — translates domain names into IP addresses |
| Packet | A small chunk of data (with header, payload, and trailer) sent across a network |
| Packet switching | Method of sending packets independently via different routes; reassembled at destination |
| Protocol | A set of agreed rules for how data is formatted and transmitted between devices |
| HTTP | Protocol for transferring web pages; data is unencrypted |
| HTTPS | Secure version of HTTP; data is encrypted using SSL/TLS |
| TCP | Protocol that splits data into packets, ensures reliable delivery, and reassembles them |
| IP | Protocol that handles routing of packets across networks using IP addresses |
| SMTP | Protocol for sending email |
| IMAP | Protocol for receiving email; keeps messages on the server |
| FTP | Protocol for transferring files between computers |
| SSL/TLS | Encryption protocols used by HTTPS to secure data in transit |
| Cache | Temporary storage of previously accessed data (e.g. DNS records) to speed up future requests |
| Sequence number | Number in each packet's header that allows correct reassembly at the destination |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "The internet and the World Wide Web are the same thing" | The internet is the physical infrastructure (cables, routers, servers). The WWW is a service — just one of many — that runs on the internet. Email also uses the internet but is not part of the WWW. |
| "HTTP and HTTPS are completely different protocols" | HTTPS is HTTP with SSL/TLS encryption added on top. The underlying protocol is the same; HTTPS simply encrypts the data before sending it. |
| "All packets in a message travel the same route" | In packet switching, each packet may take a completely different route through the network, depending on traffic and router decisions. They are reassembled in the correct order at the destination. |
| "DNS stores the actual web page content" | DNS only stores the mapping between domain names and IP addresses — a "phone book" entry. The actual web content is stored on web servers. |
| "IPv4 and IPv6 work the same way — IPv6 is just bigger" | While both are IP addressing schemes, IPv6 was redesigned with a much larger address space (128-bit vs 32-bit) and includes additional features. They are not directly compatible without translation mechanisms. |
| "A web browser is the internet" | A browser (Chrome, Firefox, Safari) is a program that accesses the WWW. The internet exists independently of any browser. |

---

## Diagrams / ASCII Art

### The Internet vs WWW — Conceptual Model

```
+---------------------------------------------------------------+
|                        THE INTERNET                           |
|  (Physical cables, routers, servers, fibre, satellites)       |
|                                                               |
|   +------------------+  +-----------+  +------------------+  |
|   |  WORLD WIDE WEB  |  |   EMAIL   |  | VIDEO STREAMING  |  |
|   |  (HTTP/HTTPS)    |  |   (SMTP   |  |   (RTSP/HTTP)    |  |
|   |  Web pages,      |  |    IMAP)  |  |   Netflix,       |  |
|   |  hyperlinks      |  |           |  |   YouTube        |  |
|   +------------------+  +-----------+  +------------------+  |
|                                                               |
|   +------------------+  +-----------+                        |
|   |   FILE TRANSFER  |  |  GAMING   |                        |
|   |      (FTP)       |  |  (UDP)    |                        |
|   +------------------+  +-----------+                        |
+---------------------------------------------------------------+
```

### Packet Header Structure

```
PACKET 3 of 7:
+---------------------------+
| Source IP: 192.168.1.5    |  <- Where did this packet come from?
| Dest. IP:  151.101.0.81   |  <- Where is it going?
| Seq. No:   3              |  <- This is packet number 3
| Checksum:  A4F2           |  <- Error checking
+---------------------------+
| PAYLOAD: ...data chunk... |  <- The actual content
+---------------------------+
| TRAILER: error check bits |
+---------------------------+
```

---

## Exam-Style Questions

**Q1 [2 marks]**
State **one** similarity and **one** difference between the internet and the World Wide Web.

**Q2 [3 marks]**
Explain how DNS resolves a domain name. Your answer should include what information is sent and what is returned.

**Q3 [4 marks]**
Explain what is meant by **packet switching**. In your answer, explain:
- what a packet is
- what packet switching means
- one benefit of packet switching

**Q4 [2 marks]**
Explain why a website that handles bank account details should use **HTTPS** rather than **HTTP**.

**Q5 [6 marks]**
Trace the steps that occur from a user typing `www.example.com` into their browser to the web page appearing on screen. You should include: DNS, IP address, HTTP request, web server, and packet delivery.

**MCQ**
Which protocol is used to send email?

A) HTTP
B) FTP
C) SMTP
D) DNS

**Fill in the blanks**
Data sent across the internet is broken into small chunks called __________. Each chunk contains a __________, which includes the source and destination __________ addresses, and a sequence number used for __________. This method, where each chunk may travel via a different __________, is called packet switching.

---

## Model Answers

**Q1:**
- Similarity: both the internet and the WWW involve transferring data between computers (1).
- Difference: the internet is the physical global infrastructure (cables, routers, servers), whereas the WWW is a service (collection of web pages) that runs on top of the internet (1). **[2 marks]**

**Q2:** The user's browser sends a request to a DNS server containing the domain name (1). The DNS server looks up the domain name in its database and finds the matching IP address (1). The DNS server returns the IP address to the browser, which then contacts the web server at that IP address (1). **[3 marks]**

**Q3:**
- A packet is a small chunk of data that includes a header (containing source IP, destination IP, and sequence number), a payload (the actual data), and a trailer (error checking) (1).
- Packet switching is a method where the data is broken into packets and each packet may travel via a different route through the network (1).
- Packets are reassembled in the correct order at the destination using sequence numbers (1).
- Benefit: if one router fails, packets can be rerouted automatically around the failure, making the system fault tolerant / the network is used efficiently because no dedicated line is reserved (1). **[4 marks]**

**Q4:** HTTPS encrypts the data using SSL/TLS before it is transmitted (1). This means that even if an attacker intercepts the data, they cannot read the account details — it appears as meaningless ciphertext (1). HTTP sends data as plain text, which anyone intercepting the connection could read. **[2 marks]**

**Q5:** Award 1 mark per correct step, up to 6 marks:
1. User types `www.example.com` — browser checks local DNS cache for the IP address
2. If not cached, browser sends a DNS query to the DNS server asking for the IP address of `www.example.com`
3. DNS server returns the IP address (e.g. `93.184.216.34`) to the browser
4. Browser sends an HTTP/HTTPS request (a packet) to the web server at that IP address, asking for the web page
5. The request and response are broken into packets; each packet travels via routers across the internet, potentially via different routes, and is reassembled at the destination
6. The web server at `www.example.com` sends back the HTML, CSS, and image files; the browser renders these and displays the page

**MCQ:** C — SMTP

**Fill in the blanks:** packets / header / IP / reassembly / route

---

## Revision Checklist

- [ ] I can explain the difference between the internet and the WWW with an example
- [ ] I can name three services that use the internet other than the WWW
- [ ] I can describe what an IP address is and why it is needed
- [ ] I can state one difference between IPv4 and IPv6
- [ ] I can explain what DNS does and why it is needed
- [ ] I can describe the DNS resolution process step by step
- [ ] I can explain what a packet is and name three parts of a packet
- [ ] I can explain what packet switching means
- [ ] I can state two benefits of packet switching
- [ ] I can state the purpose of HTTP and HTTPS and explain the difference
- [ ] I can explain why HTTPS is more secure than HTTP
- [ ] I can state the purpose of TCP/IP, SMTP, IMAP, and FTP
- [ ] I can explain what a protocol is and why protocols are needed
