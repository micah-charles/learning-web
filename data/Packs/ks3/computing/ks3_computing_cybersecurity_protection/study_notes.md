# KS3 Computing — Study Pack
# Topic: Cybersecurity Protection & Safe Practices
**Year 7–9 | Cybersecurity | UK National Curriculum**

---

## Overview

Understanding threats is only half the battle. This pack focuses on the **protective measures** that individuals, schools, and organisations use to defend against cybersecurity attacks. Effective cybersecurity relies on **multiple layers** of protection — no single measure is sufficient on its own. This approach is called **defence in depth**.

---

## Section 1: Technical Protections

### Firewall

A **firewall** monitors all incoming and outgoing network traffic and compares it against a set of rules. Traffic that does not match the rules is **blocked**.

**How it works:**
- Examines each data packet (source IP, destination IP, port number, protocol)
- Compares against a ruleset (e.g. "block all traffic from IP addresses in this list", "allow only HTTP and HTTPS traffic")
- Allows permitted traffic through; blocks everything else

**Types:**

| Type | What it protects | Where it sits |
|---|---|---|
| Hardware firewall | The entire network | Between the internet and the internal network (in the router) |
| Software firewall | Individual device | Installed on a specific computer or server |

**Network diagram:**

```
[INTERNET]
     |
  [ROUTER with FIREWALL]  <-- Blocks unwanted incoming connections
     |                        and suspicious outgoing traffic
[INTERNAL NETWORK]
  |       |       |
[PC1]  [PC2]  [Server]
```

**What firewalls protect against:** unauthorised access to the network; many types of DoS attack; connections to malicious remote servers (from malware trying to "phone home")

**Limitations:** a firewall alone cannot stop phishing (the user willingly gives away data); cannot stop malware already installed inside the network; cannot inspect encrypted HTTPS traffic without special configuration

### Antivirus / Anti-malware

Antivirus software **scans files and processes** on a device and compares them against a **database of known malware signatures**.

**How it works:**
1. Maintains a constantly updated database of malware signatures (unique patterns of code belonging to known malware)
2. Scans files when they are opened or downloaded
3. If a match is found, the file is **quarantined** (isolated) or deleted
4. Can also monitor running processes for suspicious behaviour (**heuristic detection**)

**Must be kept updated:** new malware is created every day; the signature database must be updated regularly to recognise new threats

**Limitation — zero-day attacks:** a **zero-day** vulnerability is one that was unknown until attackers started exploiting it. Antivirus cannot detect malware it has never seen before — there is no signature yet. Heuristic detection helps but is imperfect.

### Encryption

**Encryption** converts plaintext (readable data) into **ciphertext** (scrambled data) using an algorithm and a key. Only someone with the correct key can decrypt and read the data.

**Two important uses:**

**Encryption in transit (data moving over a network):**
- HTTPS uses SSL/TLS to encrypt all data between browser and web server
- Even if an attacker performs a Man-in-the-Middle attack and intercepts the data, they see only meaningless ciphertext
- Essential for login pages, banking, shopping, any personal data

**Encryption at rest (data stored on a device):**
- A laptop's hard drive can be encrypted (e.g. BitLocker on Windows)
- If the laptop is stolen, the attacker cannot read the files without the decryption key
- Even physically removing the hard drive and connecting it to another computer yields only encrypted, unreadable data

**Analogy:** encryption is like sending a letter in a locked box — the postal workers (routers) carry it, but only the recipient with the key can open it and read it.

### Software Updates and Patches

Software companies regularly release **updates** that fix **security vulnerabilities** — weaknesses in the code that attackers could exploit.

**Why updates are critical:**
- When a vulnerability is discovered, attackers immediately begin scanning the internet for unpatched systems
- Once a patch is released, the vulnerability is publicly known — meaning even more attackers know to exploit systems that have not been patched
- Unpatched systems are therefore at **greater** risk after a patch is released if you do not apply it promptly

**Real-world example:** WannaCry ransomware (2017) exploited a vulnerability in Windows. Microsoft had released a patch two months earlier. Organisations that had not applied the patch were attacked; those that had were unaffected.

**Best practice:** enable **automatic updates** so patches are applied as soon as they are released.

### Two-Factor Authentication (2FA)

**2FA** requires users to provide **two separate forms of identity verification** before access is granted.

**The three factors of authentication:**

| Factor | Type | Examples |
|---|---|---|
| Something you **know** | Knowledge | Password, PIN, security question |
| Something you **have** | Possession | SMS code, authenticator app, hardware token, smart card |
| Something you **are** | Biometric | Fingerprint, face recognition, iris scan |

**How 2FA works:**
1. User enters username and password (first factor — something you know)
2. System sends a one-time code to the user's phone or authenticator app (second factor — something you have)
3. User enters the code to complete login

**Why 2FA is powerful:** even if an attacker obtains your password (via phishing, data breach, or brute force), they **cannot log in without the second factor**. They would need to also physically possess your phone.

**Limitation:** if the attacker has access to your phone (e.g. SIM swapping attack), SMS-based 2FA can be defeated. Authenticator apps and hardware tokens are more secure.

---

## Section 2: Password Security

A password is the most basic form of authentication. Weak passwords are one of the most common causes of account compromise.

### What Makes a Strong Password?

| Characteristic | Guidance |
|---|---|
| Length | At least 12 characters; longer is better |
| Complexity | Mix of uppercase, lowercase, numbers, and symbols |
| Unpredictability | Avoid dictionary words, names, dates, or patterns |
| Uniqueness | Never reuse the same password across multiple accounts |
| Personal info | Never include your name, birthday, or pet's name |

### Password Managers

A **password manager** is software that:
- Generates truly random, unique, complex passwords for every account
- Stores all passwords in an encrypted vault
- Fills them in automatically when you visit a website
- You only need to remember one strong **master password**

**Why reusing passwords is dangerous:** if one website is breached and your password is stolen, attackers try that same password on every other website (called **credential stuffing**). Using unique passwords for every account means a breach of one site does not affect others.

---

## Section 3: Network Security Measures

### SSL/TLS

SSL (Secure Sockets Layer) and TLS (Transport Layer Security) are encryption protocols used by HTTPS. When a website has a valid SSL/TLS certificate, the connection is encrypted and the padlock appears in the browser.

### VPN (Virtual Private Network)

A VPN creates an **encrypted tunnel** for all internet traffic from a device, even over public Wi-Fi.

**How it works:**
1. All traffic from your device is encrypted and sent to a VPN server
2. The VPN server forwards the traffic to its destination
3. The destination sees the VPN server's IP address, not yours
4. Interceptors on the local network (e.g. a coffee shop's Wi-Fi) see only encrypted data

**Use cases:** secure use of public Wi-Fi; employees accessing company networks remotely; privacy from ISP monitoring.

### MAC Address Filtering

A network administrator configures the switch/router to **only allow connections from devices with pre-approved MAC addresses**. Any device with an unrecognised MAC address is denied network access, even with correct Wi-Fi credentials.

**Limitation:** MAC addresses can be "spoofed" (faked) by a determined attacker.

### SSID Hiding

The **SSID** (Service Set Identifier) is the name of a Wi-Fi network. By default, it is broadcast publicly. Hiding the SSID means it does not appear in the list of available networks. Users must know the exact name to connect.

**Limitation:** this provides **security through obscurity** — it is not genuine encryption. Tools can still detect hidden networks. It may deter casual intruders but not determined attackers.

---

## Section 4: User Practices and Policies

### Recognising Phishing

Train users to:
- Check the sender's email address carefully (not just the display name)
- Hover over links before clicking to see the real URL
- Never enter credentials on a page you arrived at from an email — go directly to the website instead
- Be suspicious of urgency, threats, or unexpected prizes
- Report suspected phishing to the IT/security team

### The 3-2-1 Backup Rule

Regular backups protect against ransomware, hardware failure, and accidental deletion.

**3-2-1 Rule:**
- **3** copies of your data (original + 2 backups)
- **2** different storage media (e.g. external hard drive + cloud)
- **1** copy stored offsite/off-network (so ransomware cannot encrypt it)

### Principle of Least Privilege

Users should only be granted the **minimum level of access** they need to do their job. If their account is compromised, the attacker can only access what that user was permitted to access — limiting the damage.

**Examples:**
- A reception staff member does not need access to the payroll database
- A student account cannot install new software
- A department manager can see their department's files but not other departments'

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Firewall | Software or hardware that monitors network traffic and blocks unauthorised connections |
| Antivirus | Software that scans for known malware using a signature database |
| Signature database | Database of unique code patterns belonging to known malware, used by antivirus |
| Quarantine | Isolation of a suspected malicious file so it cannot cause harm while being investigated |
| Zero-day | A previously unknown vulnerability (or attack exploiting it) for which no patch yet exists |
| Encryption | Converting plaintext to ciphertext so only someone with the key can read it |
| Plaintext | Data in its original, readable form |
| Ciphertext | Data after encryption — appears as meaningless characters without the key |
| Encryption in transit | Encrypting data while it moves over a network (e.g. HTTPS) |
| Encryption at rest | Encrypting data while stored on a device (e.g. encrypted hard drive) |
| Patch | A software update that fixes a known security vulnerability |
| 2FA | Two-Factor Authentication — requires two forms of identity verification |
| VPN | Virtual Private Network — creates an encrypted tunnel for all internet traffic |
| MAC address filtering | Only allowing network access to devices with pre-approved MAC addresses |
| SSL/TLS | Encryption protocols used by HTTPS to secure data in transit |
| 3-2-1 backup rule | Three copies of data, two media types, one stored offsite |
| Principle of least privilege | Users are granted only the minimum access required for their role |
| Credential stuffing | Using stolen username/password pairs to attempt logins on other websites |
| Password manager | Software that generates, stores, and auto-fills unique passwords securely |
| Heuristic detection | Antivirus technique that identifies malware by suspicious behaviour rather than known signatures |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "A firewall blocks all attacks" | Firewalls filter traffic based on rules but cannot stop phishing (the user willingly provides data), social engineering, malware already inside the network, or zero-day attacks. |
| "Antivirus software detects all malware" | Antivirus relies on a signature database of known malware. Brand-new (zero-day) malware has no signature yet and may not be detected. Heuristic detection helps but is not perfect. |
| "Encryption makes data completely impossible to access" | Encryption makes data practically unreadable without the key. However, if the key is weak, stolen, or the encryption algorithm is outdated, it can potentially be broken. Good encryption is extremely strong but not theoretically absolute. |
| "HTTPS means a website is safe and trustworthy" | HTTPS means the data between you and the server is encrypted. It does not mean the website itself is legitimate — phishing sites can and do use HTTPS with valid certificates. |
| "If you back up your data, you prevent all data loss" | Backups protect against ransomware and hardware failure but not data theft (the data is still stolen) or breaches where data was never backed up in a useful way. |

---

## Protection Methods Table

| Protection | Guards Against | How It Works | Key Limitation |
|---|---|---|---|
| Firewall | Unauthorised access, many network attacks | Blocks traffic not matching permitted rules | Cannot stop attacks from inside the network or phishing |
| Antivirus | Known malware | Scans against signature database; quarantines threats | Cannot detect zero-day (unknown) malware |
| Encryption | Data theft in transit or from stolen device | Scrambles data; only decryptable with correct key | Key management is critical; weak keys can be broken |
| Patches/updates | Exploitation of software vulnerabilities | Fixes known security flaws in software | Cannot fix vulnerabilities that have not yet been discovered |
| 2FA | Account compromise even if password stolen | Requires second verification factor to log in | SIM swapping can defeat SMS-based 2FA |
| Strong passwords | Brute force attacks | Makes systematic guessing computationally infeasible | No protection against phishing or keyloggers |
| VPN | Data interception on public Wi-Fi | Encrypts all traffic to VPN server | VPN provider can see your traffic |
| Backups (3-2-1) | Ransomware, hardware failure, accidental deletion | Maintains multiple copies of data in separate locations | Does not prevent data theft |

---

## Scenario: Company Security Review

**Scenario:** TechStore Ltd stores customer names, addresses, and credit card numbers on their servers. They currently have no security measures in place.

**Identify and explain four security measures they should implement:**

1. **Firewall**: Install a hardware firewall between their servers and the internet to block unauthorised incoming connections and suspicious outbound traffic from compromised servers.

2. **Encryption**: Encrypt all stored customer data (encryption at rest) and use HTTPS (encryption in transit) for all customer interactions. This means that even if data is stolen, it cannot be read without the key.

3. **Two-Factor Authentication**: Require 2FA for all staff accounts, particularly those with access to customer data. Even if a staff member's password is phished, attackers cannot log in without the second factor.

4. **Regular Backups (3-2-1 Rule)**: Maintain three copies of customer data across two media types with one copy offsite. This protects against ransomware (which encrypted the primary copy) and hardware failure.

5. **Software Updates**: Apply all security patches promptly to all servers and workstations to remove known vulnerabilities.

6. **Principle of Least Privilege**: Ensure only staff who genuinely need access to customer credit card data have it, limiting the blast radius if any account is compromised.

---

## Exam-Style Questions

**Q1 [1 mark]**
State **one** purpose of a firewall.

**Q2 [3 marks]**
A company employee's laptop containing customer data is stolen. Explain how **encryption** could protect the data on the laptop.

**Q3 [3 marks]**
Explain why it is important for individuals and organisations to install software **updates** promptly. Use an example in your answer.

**Q4 [6 marks]**
A small healthcare company stores patient records on their computer systems. Describe **four** security measures the company should implement. For each measure, state what threat it addresses and how it works.

**Q5 [6 marks]**
Evaluate the use of **Two-Factor Authentication (2FA)**. In your answer, explain:
- how 2FA works
- what threat it addresses
- one advantage
- one limitation

**MCQ**
What is the main purpose of a software patch?

A) To add new features to software
B) To fix known security vulnerabilities in software
C) To make software run faster
D) To back up user data

**Fill in the blanks**
Antivirus software works by comparing files against a __________ of known malware signatures. If a match is found, the file is placed in __________. A weakness of antivirus software is that it may not detect __________ attacks where the malware has never been seen before. Encrypting data converts it from __________ into __________ so that it cannot be read without the correct key.

---

## Model Answers

**Q1:** A firewall monitors incoming and outgoing network traffic and blocks any traffic that does not match the permitted rules / blocks unauthorised connections to the network. **[1 mark]**

**Q2:** Encryption converts the data on the laptop's hard drive from readable plaintext into ciphertext (1). If the thief attempts to access the files — even by removing the hard drive and connecting it to another computer — they will only see meaningless encrypted data (1). Without the decryption key, the customer data cannot be read, protecting the individuals whose data is stored (1). **[3 marks]**

**Q3:** Software updates include security **patches** that fix known vulnerabilities in the software (1). Once a patch is released, the vulnerability becomes publicly known, meaning attackers actively target systems that have not yet applied it (1). For example, the WannaCry ransomware in 2017 attacked Windows computers that had not applied a patch Microsoft released two months earlier; organisations that had applied it were unaffected (1). **[3 marks]**

**Q4:** Award 1 mark for correctly identifying each measure and 1 mark for explaining how it works/what it protects against, up to 6 marks (any four of):
- **Firewall**: guards against unauthorised network access; monitors all traffic and blocks connections that do not match permitted rules.
- **Encryption**: guards against data theft; encrypts patient records so that even if data is stolen, it cannot be read without the key.
- **2FA**: guards against account compromise even if a password is stolen; requires staff to provide a password and a second factor (e.g. SMS code) to log in.
- **Regular backups**: guards against ransomware and hardware failure; maintaining offsite/cloud copies means data can be restored even if the primary system is encrypted.
- **Software updates**: guards against exploitation of known vulnerabilities; applying patches promptly removes security flaws before attackers can exploit them.
- **Principle of least privilege**: limits damage if an account is compromised; ensures staff can only access the patient data they need for their specific role.

**Q5:** How 2FA works: the user enters their password (first factor) and then must also provide a second factor — typically a one-time code sent to their phone or generated by an authenticator app — before access is granted (2 marks). Threat addressed: even if an attacker steals or guesses the user's password (via phishing, data breach, or brute force), they cannot log in without also possessing the user's phone (1 mark). Advantage: significantly increases the security of accounts without requiring a more complex password (1 mark). Limitation: if an attacker gains access to the user's phone (e.g. SIM swapping, phone theft), SMS-based 2FA can be bypassed; authenticator apps are more secure but still dependent on device security (1 mark). Award 1 additional mark for a well-structured, coherent evaluation. **[6 marks]**

**MCQ:** B — To fix known security vulnerabilities in software

**Fill in the blanks:** signature database / quarantine / zero-day / plaintext / ciphertext

---

## Revision Checklist

- [ ] I can explain what a firewall does and state one limitation
- [ ] I can describe the difference between a hardware and software firewall
- [ ] I can explain how antivirus software works (signature database, quarantine)
- [ ] I can explain what a zero-day attack is and why antivirus may not detect it
- [ ] I can explain encryption in transit (HTTPS) and encryption at rest (hard drive)
- [ ] I can explain how encryption protects a stolen laptop
- [ ] I can explain why software updates and patches are important, with an example
- [ ] I can describe how 2FA works and identify the three types of authentication factor
- [ ] I can explain why 2FA protects against stolen passwords
- [ ] I can describe characteristics of a strong password
- [ ] I can explain the 3-2-1 backup rule
- [ ] I can explain the principle of least privilege with an example
- [ ] I can describe what a VPN is and when it should be used
- [ ] I can recommend and justify security measures for a given scenario
