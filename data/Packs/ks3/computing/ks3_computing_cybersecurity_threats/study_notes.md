# KS3 Computing — Study Pack
# Topic: Cybersecurity Threats & Attacks
**Year 7–9 | Cybersecurity | UK National Curriculum**

---

## Overview

Cybersecurity threats fall into two broad categories: **technical attacks** (which target vulnerabilities in software and systems) and **social engineering** (which target the weakest link — human psychology). Understanding both is essential for protecting yourself and others online. This pack covers the main types of malware, social engineering attacks, and network-based threats.

**Why this matters:** Cybercrime costs the global economy hundreds of billions of pounds each year. The NHS was severely disrupted by the WannaCry ransomware attack in 2017. Personal accounts, banking details, and sensitive photos can all be compromised through attacks described in this pack.

---

## Section 1: Malware (Malicious Software)

**Malware** is any software specifically designed to disrupt, damage, or gain unauthorised access to a computer system. It is an umbrella term — viruses, worms, and ransomware are all types of malware.

### Virus

- **What it does**: attaches itself to a legitimate file; when the infected file is shared or opened, the virus spreads; can corrupt or delete data, slow the system, or give attackers access
- **How it spreads**: requires **human action** — a user must open an infected file (email attachment, downloaded file, infected USB drive)
- **Analogy**: like a biological virus — it cannot replicate on its own; it needs a host cell (a file) and a carrier (a human to share the file)
- **Example**: a virus hidden inside a Word document sent as an email attachment

### Worm

- **What it does**: similar damaging effects to a virus, but spreads differently
- **How it spreads**: **self-replicating** — spreads automatically across networks **without any user action**; exploits vulnerabilities in operating systems or network services
- **Key difference from virus**: does NOT need to attach to a file; does NOT need a human to share it
- **Danger**: can spread across an entire organisation's network in minutes; can overload networks with self-replication traffic
- **Example**: the WannaCry ransomware worm spread automatically across NHS networks in 2017 without staff clicking anything

### Trojan (Trojan Horse)

- **What it does**: disguises itself as legitimate, useful software (a game, a free tool, a codec); once installed, it opens a **backdoor** allowing attackers remote access to the system
- **How it spreads**: requires human to deliberately install it (thinking it is something useful)
- **Does NOT self-replicate**: unlike viruses and worms, Trojans do not spread themselves
- **What attackers do with backdoor access**: steal files, install more malware, use the device in a botnet, access webcam/microphone
- **Example**: "Free video player" download that secretly gives an attacker control of your computer

### Ransomware

- **What it does**: **encrypts** all the victim's files so they cannot be opened; displays a ransom demand — pay (usually cryptocurrency) to receive the decryption key
- **How it spreads**: typically via phishing emails, infected downloads, or (like WannaCry) as a worm
- **Impact**: particularly devastating to hospitals, businesses, local councils — patient records inaccessible, operations cancelled, business halted
- **Paying the ransom**: not recommended — no guarantee the key will be provided; funds further attacks
- **Example**: WannaCry (2017) — affected 200,000+ computers in 150 countries including NHS

### Spyware

- **What it does**: secretly monitors user activity — records keystrokes (keylogger), captures screenshots, monitors browsing history; sends stolen data to attacker
- **What is stolen**: passwords, banking details, credit card numbers, personal messages
- **How it spreads**: often bundled with free software (same as adware)
- **Key word**: operates **secretly** — victim usually has no idea it is running

### Adware

- **What it does**: displays unwanted advertisements; redirects browser searches to advertising websites; can slow the system significantly
- **How it spreads**: often bundled with free software (user installs free application, adware installs alongside it)
- **Least harmful**: of the malware types — no data theft, no encryption, but annoying and potentially covers for more harmful software

### Malware Types Summary Table

| Malware | How It Spreads | Main Effect | Prevention |
|---|---|---|---|
| Virus | Human shares infected file | Corrupts/deletes data, spreads to other files | Antivirus, avoid opening unknown attachments |
| Worm | Self-replicating across network, no user action | Overloads networks, installs further malware | Firewall, keep software patched/updated |
| Trojan | User installs thinking it is legitimate software | Opens backdoor for attacker remote access | Only install software from trusted sources |
| Ransomware | Phishing emails, infected downloads, worm-based | Encrypts files, demands ransom payment | Regular backups, software updates, antivirus |
| Spyware | Bundled with free software, malicious downloads | Steals passwords, banking details, keystrokes | Antivirus, trusted software sources |
| Adware | Bundled with free software | Unwanted adverts, browser redirects, slow system | Careful about what free software you install |

---

## Section 2: Social Engineering

**Social engineering** attacks exploit **human psychology** rather than technical vulnerabilities. Attackers manipulate people into doing something they should not — revealing passwords, clicking a link, or transferring money. Even the most technically secure system can be defeated if the people using it can be tricked.

### Phishing

- **Method**: fake email, website, or message that **mimics a trusted organisation** (bank, HMRC, Apple, Netflix, a school, a government department)
- **Goal**: trick the user into clicking a malicious link (which installs malware or leads to a fake login page) or directly entering their credentials
- **Channel**: primarily email
- **Scale**: sent to thousands or millions of people at once — untargeted

**Warning signs in a phishing email:**
1. Sender email address does not match the organisation (e.g. `noreply@apple-security-alert.com` instead of `@apple.com`)
2. Urgent/threatening language: "Your account will be suspended in 24 hours!"
3. Generic greeting: "Dear Customer" instead of your actual name
4. Suspicious link: hover over the link — the real URL is different from the displayed text
5. Requests sensitive information: no legitimate organisation asks for full passwords by email
6. Poor spelling and grammar (though modern AI-written phishing is increasingly polished)

### Spear Phishing

- **Method**: highly **targeted** phishing; the attacker researches the specific individual (from LinkedIn, social media, company websites, previous data breaches)
- **Personalised**: uses victim's real name, job title, manager's name, recent projects
- **Why more dangerous**: much harder to recognise as fake because it appears credible and specific
- **Example**: "Hi Sarah, as discussed in yesterday's meeting with [your manager's real name], please review the attached budget spreadsheet and enter your login to submit it."

### Smishing

- **Method**: phishing via **SMS text messages**
- **Example**: "Your parcel could not be delivered. Pay the £2.99 redelivery fee here: [malicious link]"
- **Why effective**: people tend to trust text messages more than emails; links are harder to inspect on mobile

### Vishing

- **Method**: phishing via **voice call/phone** — the attacker calls the victim and impersonates a bank, HMRC, police, or technical support
- **Example**: "This is your bank's fraud department. We've detected suspicious activity on your account. I'll need to verify your details to protect you."
- **Manipulation techniques**: create urgency, play on trust of authority, keep victim talking to prevent them from checking

### Pretexting

- **Method**: attacker creates a **fabricated backstory (pretext)** to manipulate the target into providing information or access
- **Example**: calling an employee pretending to be an IT support technician who needs the employee's password to "fix a problem with their account"
- **Difference from phishing**: usually involves building a longer, more elaborate fictional narrative rather than a simple email trick

### Shouldering (Shoulder Surfing)

- **Method**: **physically watching** a victim enter their password, PIN, or other sensitive information
- **Where it happens**: ATMs, offices, trains, cafes, shared screens
- **Low-tech but effective**: no computer skills required; purely observational
- **Prevention**: shield the keypad/screen when entering PINs; be aware of surroundings in public

### Social Engineering Summary Table

| Attack | Method | Channel | Example |
|---|---|---|---|
| Phishing | Fake communication from trusted org | Email | Fake Apple security alert email |
| Spear phishing | Targeted, personalised phishing | Email | Email using victim's name, manager, real project |
| Smishing | Phishing via SMS | Text message | "Pay parcel redelivery fee" text |
| Vishing | Phishing via voice call | Phone | Fake bank fraud department call |
| Pretexting | Fabricated backstory | Phone / in-person | Fake IT support asking for password |
| Shouldering | Physically watching credentials entered | Physical | Watching someone type PIN at ATM |

---

## Section 3: Network Attacks

### DoS (Denial of Service)

- **What it does**: floods a web server or network service with so many requests that it cannot respond to legitimate users — effectively taking the service offline
- **How**: attacker sends millions of fake requests per second from one machine
- **Targets**: websites, online services, banks, gaming platforms
- **Effect**: customers cannot access the service; lost revenue, reputational damage

### DDoS (Distributed Denial of Service)

- **What it does**: same as DoS but coordinated across **thousands or millions of compromised devices** (a **botnet** — a network of infected devices the attacker controls)
- **Why harder to stop**: traffic comes from thousands of different IP addresses worldwide; blocking one IP does nothing; traffic volumes can reach Tbps (terabits per second)
- **Botnet**: created by infecting ordinary devices (home routers, webcams, computers) with Trojan malware; owners often have no idea their device is in a botnet

### Man-in-the-Middle (MITM)

- **What it does**: attacker secretly **intercepts communications** between two parties who believe they are communicating directly with each other
- **What attacker can do**: read private messages, steal credentials, alter data in transit (e.g. change a bank account number in a transfer)
- **Where it happens**: unencrypted Wi-Fi networks (public cafes, hotels); HTTP (not HTTPS) connections
- **Prevention**: always use HTTPS; avoid sensitive activity on public Wi-Fi; use a VPN

### Brute Force Attack

- **What it does**: systematically tries **every possible combination** of characters until the correct password is found
- **Speed**: modern computers can try billions of combinations per second
- **Defeated by**:
  - Long, complex passwords (12+ characters with symbols, numbers, mixed case)
  - Account lockout after a number of failed attempts
  - Multi-factor authentication (even if password is found, a second factor is needed)

### SQL Injection (Awareness)

- **What it does**: attacker enters **malicious SQL code** into a web form (login field, search box) that gets executed by the database behind the website
- **Effect**: can retrieve all data from the database, bypass login authentication, delete data
- **Example**: entering `' OR '1'='1` into a login form to bypass password checking
- **Prevention**: input validation; parameterised queries (not required to know at KS3)

### Unpatched Software

- **What it is**: software that has not been updated with the latest **security patches**
- **Why dangerous**: when vulnerabilities are discovered in software, attackers actively target unpatched systems; patches fix the vulnerability
- **Example**: WannaCry exploited a vulnerability in Windows that had been patched months earlier — organisations that had not applied the patch were attacked

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Malware | Malicious software designed to disrupt, damage, or gain unauthorised access to systems |
| Virus | Malware that attaches to files and spreads when infected files are shared (requires human action) |
| Worm | Self-replicating malware that spreads automatically across networks without user action |
| Trojan | Malware disguised as legitimate software that opens a backdoor for attackers |
| Ransomware | Malware that encrypts files and demands payment for the decryption key |
| Spyware | Malware that secretly monitors user activity and steals personal data/passwords |
| Adware | Malware that displays unwanted advertisements |
| Social engineering | Manipulating people psychologically to reveal information or perform actions |
| Phishing | Fake emails/websites mimicking trusted organisations to steal credentials |
| Spear phishing | Targeted, personalised phishing using specific details about the victim |
| Smishing | Phishing via SMS text messages |
| Vishing | Phishing via voice/phone call |
| Pretexting | Creating a fabricated backstory to manipulate someone into revealing information |
| Shouldering | Physically watching someone enter credentials or a PIN |
| DoS | Denial of Service — flooding a server with requests to make it unavailable |
| DDoS | Distributed DoS — coordinated from thousands of devices (botnet) |
| Botnet | Network of compromised devices controlled by an attacker |
| MITM | Man-in-the-Middle — attacker secretly intercepts communications between two parties |
| Brute force | Systematically trying every possible password combination |
| SQL injection | Entering malicious SQL code into a web form to manipulate the database |
| Patch | Software update that fixes known security vulnerabilities |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "Virus means all malware" | Virus is one specific type of malware. Worms, Trojans, ransomware, and spyware are different types of malware, not all of which are viruses. |
| "Phishing emails are easy to spot — they're always obviously fake" | Modern phishing attacks are increasingly sophisticated, using genuine company logos, correct grammar, and personalised details. Spear phishing in particular can be very convincing. |
| "DoS attacks only affect big companies" | Any internet-connected server can be targeted, including school websites, small businesses, and personal servers. |
| "Malware must be downloaded from the internet" | Malware can also spread via infected USB drives, physical media, email attachments, and self-replicating worms that need no user action at all. |
| "A strong password prevents all attacks" | Passwords protect against brute force, but not phishing (where you hand over the password), keyloggers (which record it), or MITM attacks (which intercept it). Multiple layers of security are needed. |

---

## Simulated Phishing Email — 5 Warning Signs

```
FROM: security-alert@apple-accounts-verify.net        <-- (1) WRONG DOMAIN
TO: user@email.com
SUBJECT: URGENT: Your Apple ID has been compromised

Dear Apple Customer,                                   <-- (2) GENERIC GREETING

We have detected suspicious activity on your Apple    
account. Your account will be PERMANENTLY DISABLED    <-- (3) URGENT/THREATENING
within 24 hours unless you verify your identity.               LANGUAGE

Please click the link below to verify your account:

http://apple-id-verify-secure.ru/login                <-- (4) SUSPICIOUS LINK
                                                               (wrong domain, .ru)

You will need to enter your:                          <-- (5) REQUESTS
 - Apple ID email address                                      CREDENTIALS
 - Password
 - Credit card number (for identity verification)

Apple Support Team
```

---

## Exam-Style Questions

**Q1 [2 marks]**
State **one** difference between a virus and a worm.

**Q2 [3 marks]**
Explain what is meant by **phishing**. Give an example of how a phishing attack might try to steal someone's banking password.

**Q3 [4 marks]**
Describe how a ransomware attack progresses from initial infection to the demand for payment.

**Q4 [3 marks]**
The email below is a phishing attempt. Identify **three** warning signs that suggest this email is not genuine.

*[Students would be shown a phishing email — use the annotated example above]*

**Q5 [6 marks]**
Compare **three** different types of malware. For each type, describe how it spreads, what it does, and how users can protect themselves against it.

**MCQ**
Which type of malware spreads automatically across a network without any user action?

A) Virus
B) Trojan
C) Worm
D) Adware

**Fill in the blanks**
A __________ attack involves flooding a server with requests from one machine, making it unavailable to real users. A __________ attack is similar but uses thousands of compromised devices called a __________. __________ is a form of social engineering where attackers physically watch someone enter their credentials. An email pretending to be from a bank in order to steal login details is an example of __________.

---

## Model Answers

**Q1:** A virus requires human action to spread — it attaches to files and spreads when an infected file is shared (1). A worm is self-replicating and spreads automatically across networks without any user action (1). **[2 marks]**

**Q2:** Phishing is when an attacker sends a fake email (or creates a fake website) that appears to come from a trusted organisation, such as a bank (1). The attacker's goal is to trick the user into clicking a link or entering their personal details (1). Example: an email claiming to be from Barclays Bank says "unusual activity has been detected — click here to verify your account" and links to a fake website where the victim enters their username and password, which the attacker then steals (1). **[3 marks]**

**Q3:**
1. Victim receives a phishing email containing a malicious attachment or link, and opens/clicks it (1)
2. The ransomware installs itself and begins encrypting all files on the device (and any network drives it can reach) (1)
3. A message appears on screen informing the victim that their files are encrypted and demanding payment — typically in cryptocurrency such as Bitcoin — in exchange for the decryption key (1)
4. If the victim pays, they may or may not receive the key; there is no guarantee, and paying funds further attacks (1) **[4 marks]**

**Q4:** Any three of: incorrect/suspicious sender email domain; urgent/threatening language; generic greeting (not the user's real name); suspicious URL that does not match the real organisation; requests for passwords or financial information by email; poor spelling/grammar. **[1 mark each, 3 marks total]**

**Q5:** Award 2 marks per malware type (1 for spread/effect, 1 for prevention), up to 6 marks. Example:
- Virus: spreads when a user opens or shares an infected file; corrupts or deletes data; prevented by antivirus software and not opening unknown email attachments.
- Ransomware: spreads via phishing emails or as a worm; encrypts all files and demands payment; prevented by regular backups, keeping software updated, and antivirus.
- Spyware: spreads bundled with free software; secretly records keystrokes and steals passwords; prevented by downloading software only from trusted sources and running antivirus scans.

**MCQ:** C — Worm

**Fill in the blanks:** DoS (Denial of Service) / DDoS (Distributed Denial of Service) / botnet / Shouldering (shoulder surfing) / phishing

---

## Revision Checklist

- [ ] I can define malware and list six types
- [ ] I can explain how a virus spreads and what it does
- [ ] I can explain the difference between a virus and a worm (self-replication)
- [ ] I can describe what a Trojan is and how it differs from a virus/worm
- [ ] I can explain what ransomware does and describe a real-world example (WannaCry)
- [ ] I can explain what spyware does and how it differs from adware
- [ ] I can define social engineering and explain why it is effective
- [ ] I can describe phishing, spear phishing, smishing, and vishing
- [ ] I can identify at least four warning signs in a phishing email
- [ ] I can explain what a DoS attack is and how a DDoS differs
- [ ] I can explain what a botnet is
- [ ] I can describe a Man-in-the-Middle attack
- [ ] I can explain how a brute force attack works and how to defend against it
- [ ] I can explain why keeping software updated is important for security
