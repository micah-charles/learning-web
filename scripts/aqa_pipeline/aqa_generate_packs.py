"""
aqa_generate_packs.py — Generate COMPLETE Learning Web pack_unified.json files
from AQA June 2024 GCSE Religious Studies papers.

Each pack completely covers its source paper (every question, no skips). One
original exam question may be split into several pack items, but nothing is
dropped. Every pack contains all four Smart Test section types:

  vocab          — MCQ (Q*.1) + knowledge items (Q*.2 / Q*.3 / Q*.4)
  sentenceBuilder — tile-arrange model answers (>=3)
  passage        — one reading passage + comprehension questions
  vocab FOR:/AGAINST: — evaluate-question argument scaffold (Q*.5)

Output:
  data/Packs/gcse/religion/<pack_id>/pack_unified.json
  data/generated/manifest.json (manifest.packs upsert, capabilities:["revision"])

Usage:
  PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_generate_packs --learning-web-dir "/path/to/learning-web"
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

LEVEL = "GCSE Year 10-11"


# ─── Item helper builders ─────────────────────────────────────────────────────

def vocab(item_id, source, target, topic, tags, example=""):
    data = {"partOfSpeech": "keyword", "sourceWord": source, "targetWord": target}
    if example:
        data["examples"] = {"en-GB": example}
    return {
        "id": item_id, "type": "vocab", "level": LEVEL,
        "topics": [topic], "tags": tags, "data": data,
    }


def mcq(item_id, question, answer, topic, tags, distractors):
    """MCQ stored as a vocab item: sourceWord = question, targetWord = answer."""
    example = "AQA MCQ (1 mark) — Answer: " + answer
    if distractors:
        example += " | Distractors: " + "; ".join(distractors)
    return vocab(item_id, f"MCQ: {question}", answer, topic, tags + ["MCQ"], example)


def sb(item_id, prompt, answer, topic, tags):
    """sentenceBuilder item — tiles are the words of the model answer."""
    return {
        "id": item_id, "type": "sentenceBuilder", "level": LEVEL,
        "topics": [topic], "tags": tags + ["sentence-builder"],
        "data": {
            "cardType": "model_answer",
            "prompt": prompt,
            "answer": answer,
            "tiles": answer.split(),
        },
    }


def arg(item_id, side, claim, detail, topic, tags):
    """Argument scaffold item: sourceWord prefixed FOR:/AGAINST:."""
    prefix = "FOR" if side == "for" else "AGAINST"
    return vocab(item_id, f"{prefix}: {claim}", detail, topic, tags + ["evaluate", "12-mark"])


def passage(item_id, title, text, topic, tags, questions):
    return {
        "id": item_id, "type": "passage", "level": LEVEL,
        "topics": [topic], "tags": tags + ["reading"],
        "data": {
            "title": title,
            "sourceTitle": title,
            "sourcePassage": text,
            "targetPassage": text,
            "speechLanguage": "en-GB",
            "questions": questions,
        },
    }


def pq(qid, question, options, correct_index):
    return {
        "id": qid, "questionType": "multiple_choice", "difficulty": "medium",
        "question": question, "options": options, "correctOptionIndex": correct_index,
    }


# ══════════════════════════════════════════════════════════════════════════════
# PACK 1 — Paper 1 Section A Option 2: Christianity (8061/2) — complete 5 Q
# ══════════════════════════════════════════════════════════════════════════════

CHRISTIANITY = {
    "packId": "gcse_rs_2024_christianity",
    "displayName": "AQA GCSE RS 2024 — Christianity",
    "paper": "Paper 1 Section A Option 2",
    "topic_root": "Christianity",
    "items": [
        # Q1.1 MCQ
        mcq("ch_q1_mcq", "Which one of the following is a means of salvation in Christianity?",
            "Grace", "Christianity: Salvation", ["GCSE", "religion", "Christianity", "AQA-2024"],
            ["Ascension", "Sin", "Trinity"]),
        # Q1.2 Give two beliefs about heaven
        vocab("ch_heaven_1", "Heaven — place of God's presence",
              "Christians believe heaven is where God dwells, a place of perfect goodness, peace and joy with no pain or suffering, granted to those whose sins are forgiven.",
              "Christianity: Afterlife", ["GCSE", "religion", "Christianity", "AQA-2024"],
              "AQA Q1.2 (2 marks) — Give two Christian beliefs about heaven"),
        vocab("ch_heaven_2", "Heaven — eternal reunion",
              "Heaven offers eternal life and reunion with family and friends in a spiritual state, often pictured as being in God's presence with the angels.",
              "Christianity: Afterlife", ["GCSE", "religion", "Christianity", "AQA-2024"],
              "AQA Q1.2 (2 marks) — Give two Christian beliefs about heaven"),
        # Q1.3 Explain two influences of belief in the Oneness of God
        vocab("ch_oneness_1", "Oneness of God — exclusive worship",
              "Belief in one God leads Christians to direct all worship to him alone, building a personal relationship through prayer and pilgrimage and giving him their full faith.",
              "Christianity: God", ["GCSE", "religion", "Christianity", "AQA-2024"],
              "AQA Q1.3 (4 marks) — influence of the Oneness of God"),
        vocab("ch_oneness_2", "Oneness of God — Trinity and mission",
              "Monotheism strengthens belief in the Trinity as three aspects of one God, and may motivate Christians to do mission and evangelism so others come to know the one God.",
              "Christianity: Trinity", ["GCSE", "religion", "Christianity", "AQA-2024"],
              "AQA Q1.3 (4 marks) — influence of the Oneness of God"),
        # Q1.4 Explain two reasons the Crucifixion is important + scripture
        vocab("ch_crucifixion_1", "Crucifixion — atonement for sin",
              "Jesus' crucifixion atoned for the original sin of Adam and Eve, removing the barrier between humanity and God and offering forgiveness and eternal life to those who repent.",
              "Christianity: Jesus", ["GCSE", "religion", "Christianity", "AQA-2024"],
              "'For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.' (Romans 6:23)"),
        vocab("ch_crucifixion_2", "Crucifixion — shared suffering",
              "By suffering on the cross Jesus enables Christians to accept suffering in their own lives, knowing he understood human pain and that death is not the end.",
              "Christianity: Jesus", ["GCSE", "religion", "Christianity", "AQA-2024"],
              "AQA Q1.4 (5 marks) — importance of the Crucifixion"),
        vocab("ch_crucifixion_scripture", "Scripture: the atoning sacrifice",
              "'He is the atoning sacrifice for our sins, and not only for ours but also for the sins of the whole world.' (1 John 2:2) — showing the universal scope of Christ's saving death.",
              "Christianity: Scripture", ["GCSE", "religion", "Christianity", "AQA-2024"],
              "AQA Q1.4 (5 marks) — scripture reference"),
        # Q1.5 Evaluate: 'God is always loving' — FOR / AGAINST
        arg("ch_loving_for_1", "for", "God's love shown in Creation",
            "God created the world and all living things out of love and wants the best for his creation, which gives strong grounds for believing he is always loving.",
            "Christianity: God", ["GCSE", "religion", "Christianity"]),
        arg("ch_loving_for_2", "for", "God's love shown in the Incarnation",
            "God's most loving act was sending his Son to die for humanity: 'God so loved the world that he gave his one and only Son.' (John 3:16) — the supreme demonstration of love.",
            "Christianity: God", ["GCSE", "religion", "Christianity"]),
        arg("ch_loving_for_3", "for", "God's love extends to all through forgiveness",
            "God's perfect love extends to all who ask for forgiveness; no one is excluded, and Christians are commanded to love even their enemies as God loves all.",
            "Christianity: Forgiveness", ["GCSE", "religion", "Christianity"]),
        arg("ch_loving_against_1", "against", "The problem of evil",
            "The existence of suffering and evil is hard to reconcile with an all-loving God; if God were always loving he would prevent unnecessary suffering, yet it continues.",
            "Christianity: Evil and Suffering", ["GCSE", "religion", "Christianity"]),
        arg("ch_loving_against_2", "against", "Old Testament wrath",
            "In the Old Testament God does not always appear loving — the drowning of the Egyptian army and the destruction of Jericho suggest a wrathful, judgemental God.",
            "Christianity: Old Testament", ["GCSE", "religion", "Christianity"]),
        arg("ch_loving_against_3", "against", "Beyond human comprehension",
            "Applying the human idea of 'always loving' to an infinite God may be misleading; what seems unloving to us may serve a divine purpose we cannot understand.",
            "Christianity: Philosophy", ["GCSE", "religion", "Christianity"]),
        # Sentence-builder items (short factual model answers)
        sb("ch_sb_1", "Build a sentence: what did Jesus' crucifixion atone for?",
           "The crucifixion atoned for the sins of all humanity.",
           "Christianity: Jesus", ["GCSE", "religion", "Christianity"]),
        sb("ch_sb_2", "Build a sentence: what do Christians believe about heaven?",
           "Heaven is a place of peace and joy in the presence of God.",
           "Christianity: Afterlife", ["GCSE", "religion", "Christianity"]),
        sb("ch_sb_3", "Build a sentence: what does belief in one God mean for worship?",
           "Christians worship only one God with their full faith.",
           "Christianity: God", ["GCSE", "religion", "Christianity"]),
        # Passage (reading) + comprehension
        passage("ch_passage", "Christian Beliefs about Salvation",
                "Salvation is central to Christian belief. Christians teach that human beings are separated from God by sin, beginning with the original sin of Adam and Eve. Through the crucifixion of Jesus, this barrier is removed: Jesus' death is understood as an atoning sacrifice that pays the debt of sin for all humanity. Salvation is offered as a free gift of God's grace, not earned by good works alone, and is received through faith and repentance. Christians believe that those who accept Jesus' sacrifice can be reconciled with God and receive eternal life in heaven. The resurrection of Jesus three days after the crucifixion confirms, for believers, that death is not the end and that God's love is more powerful than sin and death.",
                "Christianity: Salvation", ["GCSE", "religion", "Christianity"],
                [
                    pq("ch_pq1", "According to Christian belief, what removes the barrier between humanity and God?",
                       ["Good works alone", "The crucifixion of Jesus", "Following the law of Moses", "Baptism only"], 1),
                    pq("ch_pq2", "Salvation is described as a free gift of God's…",
                       ["grace", "wrath", "judgement", "creation"], 0),
                    pq("ch_pq3", "What event confirms for Christians that death is not the end?",
                       ["The Last Supper", "The Sermon on the Mount", "The resurrection of Jesus", "The Ascension of Moses"], 2),
                ]),
    ],
}


# ══════════════════════════════════════════════════════════════════════════════
# PACK 2 — Paper 1 Section A Option 3: Islam (8061/3) — complete 5 Q
# ══════════════════════════════════════════════════════════════════════════════

ISLAM = {
    "packId": "gcse_rs_2024_islam",
    "displayName": "AQA GCSE RS 2024 — Islam",
    "paper": "Paper 1 Section A Option 3",
    "topic_root": "Islam",
    "items": [
        mcq("is_q1_mcq", "Which one of the following was the first prophet in Islam?",
            "Adam", "Islam: Prophets", ["GCSE", "religion", "Islam", "AQA-2024"],
            ["Ismail", "Musa", "Nuh"]),
        vocab("is_ibrahim_1", "Ibrahim — friend of Allah",
              "Muslims believe Ibrahim was sent by God to establish monotheism, is known as the friend of Allah, broke the idols, and rebuilt the Ka'aba with his son Ismail.",
              "Islam: Prophets", ["GCSE", "religion", "Islam", "AQA-2024"],
              "AQA Q1.2 (2 marks) — beliefs about the Prophet Ibrahim"),
        vocab("is_ibrahim_2", "Ibrahim — tested and obedient",
              "Muslims believe Ibrahim was tested by God, willing to sacrifice his son in obedience, making him a supreme role model of faith and trust in Allah.",
              "Islam: Prophets", ["GCSE", "religion", "Islam", "AQA-2024"],
              "AQA Q1.2 (2 marks) — beliefs about the Prophet Ibrahim"),
        vocab("is_predest_1", "Predestination — comfort in hardship",
              "Many Sunni Muslims believe Allah has decreed all that happens, recorded on the Tablet of Decrees; this gives comfort in hardship, trusting all comes from Allah.",
              "Islam: Predestination", ["GCSE", "religion", "Islam", "AQA-2024"],
              "'Only what God has decreed will happen to us.' (9:51)"),
        vocab("is_predest_2", "Predestination — moral responsibility",
              "Muslims also believe they have free will and are judged on their choices, so belief in predestination encourages them to perform good, creditworthy actions.",
              "Islam: Free Will", ["GCSE", "religion", "Islam", "AQA-2024"],
              "AQA Q1.3 (4 marks) — influence of predestination"),
        vocab("is_justice_1", "God's justice — Day of Judgement",
              "Justice (Adl) is one of Allah's 99 names and a Root of Shi'a faith; Muslims believe God will hold everyone to account on the Day of Judgement so fairness prevails.",
              "Islam: Allah", ["GCSE", "religion", "Islam", "AQA-2024"],
              "'Surely Allah wrongs not even of the weight of an atom.' (4:40)"),
        vocab("is_justice_2", "God's justice — human duty",
              "Because God is just, Muslims must mirror this by giving to charity, helping the poor and standing up for just causes, hoping for God's justice in the hereafter.",
              "Islam: Ethics", ["GCSE", "religion", "Islam", "AQA-2024"],
              "AQA Q1.4 (5 marks) — beliefs about God's justice"),
        vocab("is_justice_scripture", "Scripture: command for justice",
              "'O you who believe, be upright for God, and be bearers of witness with justice.' (5:8) — commanding Muslims to stand firmly for justice as a witness to God.",
              "Islam: Scripture", ["GCSE", "religion", "Islam", "AQA-2024"],
              "AQA Q1.4 (5 marks) — scripture reference"),
        arg("is_quran_for_1", "for", "Qur'an is the direct word of Allah",
            "The Qur'an is the direct, unaltered word of Allah, protected by him: 'Verily we have revealed it and we are the protectors of it.' (15:9), making it uniquely authoritative.",
            "Islam: Qur'an", ["GCSE", "religion", "Islam"]),
        arg("is_quran_for_2", "for", "Qur'an is a complete guide for life",
            "The Qur'an is a comprehensive code of life and the main source of Shari'ah; those who do not judge by it are warned in 5:44, so it stands above other sources.",
            "Islam: Shari'ah", ["GCSE", "religion", "Islam"]),
        arg("is_quran_against_1", "against", "Hadith is needed for practice",
            "The Qur'an does not detail how to perform Salah or Zakah; the Hadith is essential to show how rituals are carried out, suggesting it is equally vital.",
            "Islam: Hadith", ["GCSE", "religion", "Islam"]),
        arg("is_quran_against_2", "against", "Modern life needs more guidance",
            "Revealed over 1400 years ago, the Qur'an does not directly address modern issues like IVF or the internet; for Shi'a Muslims the Imam also holds great authority.",
            "Islam: Authority", ["GCSE", "religion", "Islam"]),
        sb("is_sb_1", "Build a sentence: who was the first prophet in Islam?",
           "Adam was the first prophet in Islam.",
           "Islam: Prophets", ["GCSE", "religion", "Islam"]),
        sb("is_sb_2", "Build a sentence: what do Muslims believe about the Qur'an?",
           "The Qur'an is the direct word of Allah.",
           "Islam: Qur'an", ["GCSE", "religion", "Islam"]),
        sb("is_sb_3", "Build a sentence: what is one of Allah's qualities?",
           "Allah is just and brings everyone to justice.",
           "Islam: Allah", ["GCSE", "religion", "Islam"]),
        passage("is_passage", "Tawhid: The Oneness of God in Islam",
                "Tawhid, the oneness of God, is the most important belief in Islam. Muslims believe in one God, Allah, who is the creator and sustainer of everything and has no partners or equals. This absolute monotheism shapes the whole of Muslim life. Because Allah alone is worshipped, Muslims reject any form of idolatry (shirk), which is considered the gravest sin. Allah is described through the 99 Names, which include the Just, the Merciful and the All-Knowing. Belief in Tawhid means Muslims trust that everything happens according to Allah's will, while still holding that humans have free will and will be judged for their actions on the Day of Judgement. The Qur'an, believed to be the direct word of Allah revealed to the Prophet Muhammad, is the central source of authority for understanding and living out Tawhid.",
                "Islam: Allah", ["GCSE", "religion", "Islam"],
                [
                    pq("is_pq1", "What does Tawhid mean?",
                       ["The five pillars", "The oneness of God", "The day of judgement", "The holy book"], 1),
                    pq("is_pq2", "What is considered the gravest sin in Islam?",
                       ["Shirk (idolatry)", "Missing a prayer", "Eating pork", "Working on Friday"], 0),
                    pq("is_pq3", "The Qur'an is believed to be the direct word of…",
                       ["Muhammad", "the angel Jibril", "Allah", "the imams"], 2),
                ]),
    ],
}


# ══════════════════════════════════════════════════════════════════════════════
# PACK 3 — Paper 2A Thematic Studies (8062/2A) — COMPLETE: 6 themes × 5 Q = 30
# ══════════════════════════════════════════════════════════════════════════════
# Compact theme data → expanded into items below.

THEMES_2A = [
    {
        "key": "a", "name": "Relationships and Families", "topic": "Thematic: Relationships and Families",
        "mcq_q": "Which one of the following describes an extended family?",
        "mcq_a": "Parents living with children and grandparents",
        "mcq_d": ["A couple living without children", "A person living with their pets", "Children living with parents"],
        "give_two": ("Give two religious beliefs about human sexuality.", [
            ("Sexuality as God-given", "Many religions teach that sexuality is a fundamental, God-given part of being human and should be expressed responsibly."),
            ("Heterosexuality as norm", "Most traditional teachings view heterosexuality as the norm, though many believers accept that sexuality may be expressed in different ways."),
        ]),
        "contrast": ("Explain two contrasting religious beliefs about polygamy.",
            ("Islam permits limited polygamy", "Islam permits up to four wives under Shari'ah if a man treats them equally — originally to protect war widows."),
            ("Christianity opposes polygamy", "Christians believe marriage is between two people only: 'they shall become one flesh' (Genesis 2:24).")),
        "explain": ("Explain two religious beliefs about gender discrimination.",
            ("Equality in creation", "Many believers teach that all people are created equal by God, so discriminating by gender is wrong."),
            ("Different but complementary roles", "Some traditions teach men and women have different, complementary God-given roles while still being equal in worth."),
            "'So God created mankind in his own image… male and female he created them.' (Genesis 1:27)"),
        "evaluate": ("'Marriage is not important in today's world.'", [
            ("Changing social norms", "Many couples cohabit and raise families successfully without marrying, and legal rights for cohabitees have grown."),
        ], [
            ("Marriage as sacred covenant", "For believers, marriage is a sacred covenant before God providing stability for family and community life."),
        ]),
        "sb": ("Build a sentence: what does Genesis teach about human equality?",
               "God created male and female in his image."),
    },
    {
        "key": "b", "name": "Religion and Life", "topic": "Thematic: Religion and Life",
        "mcq_q": "Which term expresses the belief that human life is sacred and special?",
        "mcq_a": "Sanctity of life",
        "mcq_d": ["Meaning of life", "Purpose of life", "Quality of life"],
        "give_two": ("Give two reasons why some religious believers support animal experimentation.", [
            ("Human stewardship", "Some believers hold that humans have dominion over animals and may use them responsibly for medical benefit."),
            ("Reducing human suffering", "Experiments that lead to medicines reduce human suffering, which many see as a compassionate, God-pleasing goal."),
        ]),
        "contrast": ("Explain two contrasting religious beliefs about the origins of human life.",
            ("Creationism", "Some believers hold that God created human life directly, as described in scripture such as Genesis."),
            ("Theistic evolution", "Many believers accept evolution as the method God used to bring about human life over time.")),
        "explain": ("Explain two reasons why religious believers should help to reduce pollution.",
            ("Stewardship of creation", "Believers are given responsibility to care for the earth as God's creation, so reducing pollution honours that duty."),
            ("Justice for the poor", "Pollution harms the poorest most, so reducing it is an act of justice and compassion."),
            "'The earth is the Lord's, and everything in it.' (Psalm 24:1)"),
        "evaluate": ("'Religious believers should be against abortion.'", [
            ("Sanctity of life", "Life is sacred from conception and made in God's image, so taking unborn life violates the sanctity of life."),
        ], [
            ("Compassion for the mother", "Some traditions permit abortion out of compassion, e.g. where the mother's life is at risk."),
        ]),
        "sb": ("Build a sentence: why should believers care for the environment?",
               "Believers must care for the earth as stewards of creation."),
    },
    {
        "key": "c", "name": "The Existence of God and Revelation", "topic": "Thematic: Existence of God",
        "mcq_q": "Which one of the following is NOT an example of General Revelation?",
        "mcq_a": "Seeing a vision of God",
        "mcq_d": ["Being told about God by other people", "Feeling awe when seeing a sunset", "Learning about a miraculous event"],
        "give_two": ("Give two reasons why many religious believers think that God is impersonal.", [
            ("God beyond human form", "Some believe God is a transcendent force or being beyond human personality and emotion."),
            ("God as the ground of being", "Some hold God is the impersonal source and sustainer of all existence rather than a person."),
        ]),
        "contrast": ("Explain two similar reasons why enlightenment is important for religious believers.",
            ("Liberation from ignorance", "Enlightenment frees believers from ignorance and delusion, bringing wisdom and peace."),
            ("End of suffering", "For Buddhists, enlightenment (nibbana) ends the cycle of suffering and rebirth.")),
        "explain": ("Explain two religious beliefs about scripture as a source of revelation about God.",
            ("Inspired word of God", "Many believers hold that scripture is inspired by God and reveals his will and nature to humanity."),
            ("Guidance for living", "Scripture reveals God by giving guidance on how to live, so studying it brings believers closer to him."),
            "'All Scripture is God-breathed.' (2 Timothy 3:16)"),
        "evaluate": ("'The Design argument does not prove that God exists.'", [
            ("Evolution explains design", "Natural selection explains apparent design without a designer, so the argument fails to prove God."),
        ], [
            ("Fine-tuning points to God", "The fine-tuning of the universe and the order of nature strongly suggest an intelligent designer."),
        ]),
        "sb": ("Build a sentence: what do many believers say scripture is?",
               "Scripture is the inspired word of God."),
    },
    {
        "key": "d", "name": "Religion, Peace and Conflict", "topic": "Thematic: Peace and Conflict",
        "mcq_q": "Which term describes the belief that all violence is wrong?",
        "mcq_a": "Pacifism",
        "mcq_d": ["Deterrence", "Justice", "Terrorism"],
        "give_two": ("Give two ways in which religious believers might act as peacemakers.", [
            ("Mediation and dialogue", "Believers may bring opposing sides together through dialogue and reconciliation."),
            ("Campaigning for peace", "Believers may pray, protest and campaign against war and for peaceful solutions."),
        ]),
        "contrast": ("Explain two contrasting religious beliefs about nuclear deterrents.",
            ("Deterrence prevents war", "Some believers accept nuclear weapons as a deterrent that protects the innocent and prevents war."),
            ("Weapons are immoral", "Others argue weapons of mass destruction can never be justified as they threaten God's creation indiscriminately.")),
        "explain": ("Explain two religious beliefs that encourage people to help victims of war.",
            ("Compassion for the suffering", "Believers are taught to show compassion to all who suffer, including refugees and the wounded."),
            ("Love your neighbour", "The command to love one's neighbour motivates believers to aid victims regardless of side."),
            "'Love your neighbour as yourself.' (Mark 12:31)"),
        "evaluate": ("'Self-defence is the only good reason for going to war.'", [
            ("Just War self-defence", "Just War theory and many traditions accept war only in genuine self-defence as a last resort."),
        ], [
            ("Protecting the innocent", "War may also be just to protect innocent people from genocide or oppression (humanitarian intervention)."),
        ]),
        "sb": ("Build a sentence: what does pacifism teach?",
               "Pacifism teaches that all violence is wrong."),
    },
    {
        "key": "e", "name": "Religion, Crime and Punishment", "topic": "Thematic: Crime and Punishment",
        "mcq_q": "Which term names a crime involving violence because of race or religion?",
        "mcq_a": "Hate crime",
        "mcq_d": ["Drug crime", "Financial crime", "Property crime"],
        "give_two": ("Give two reasons why religious people might oppose an unjust law.", [
            ("It breaks God's law", "Believers may oppose a law that conflicts with God's law or harms citizens unfairly."),
            ("It obstructs justice", "A law that disadvantages the poor or encourages prejudice obstructs social justice and may be resisted."),
        ]),
        "contrast": ("Explain two contrasting religious views about sending criminals to prison.",
            ("Prison can reform", "Some believe prison protects society and gives offenders time to reflect, learn skills and reform."),
            ("Prison fails to reform", "Others argue prison breeds resentment, punishes families and leads to high reoffending, favouring alternatives.")),
        "explain": ("Explain two religious views about theft (stealing).",
            ("Theft is forbidden", "Most religions forbid theft as it harms others and breaks divine command, e.g. 'You shall not steal.'"),
            ("Rooted in greed", "Theft is seen as rooted in greed and a lack of trust in God to provide, so believers are taught contentment."),
            "'You shall not steal.' (Exodus 20:15)"),
        "evaluate": ("'Religious believers should never support the use of the death penalty.'", [
            ("Life belongs to God", "Life is sacred and belongs to God, and an innocent person could be wrongly executed, so it should never be supported."),
        ], [
            ("Justice and protection", "Some traditions permit it for the gravest crimes, citing 'life for life' (Qur'an 5:32) and protection of society."),
        ]),
        "sb": ("Build a sentence: what is a hate crime?",
               "A hate crime targets people because of their identity."),
    },
    {
        "key": "f", "name": "Religion, Human Rights and Social Justice", "topic": "Thematic: Human Rights",
        "mcq_q": "Which one best describes the meaning of prejudice?",
        "mcq_a": "Judging someone without knowing them",
        "mcq_d": ["An action that treats someone unfairly", "Telling lies about someone", "Using violence against someone"],
        "give_two": ("Give two ways in which religious believers work for social justice.", [
            ("Charity and volunteering", "Believers volunteer, fundraise and donate to organisations working for social justice."),
            ("Campaigning and awareness", "Believers protest against injustice and raise awareness through campaigns and the media."),
        ]),
        "contrast": ("Explain two similar religious beliefs about racial prejudice.",
            ("All created equal", "Many faiths teach all people are created equal by God, so racial prejudice is wrong."),
            ("One human family", "Believers teach that humanity is one family — 'neither Jew nor Greek… all one in Christ Jesus' (Galatians 3:28).")),
        "explain": ("Explain two religious beliefs about attitudes to wealth.",
            ("Wealth as a trust", "Wealth is seen as a trust from God to be used responsibly and shared with those in need."),
            ("Danger of greed", "Many traditions warn that love of money is dangerous and can turn people away from God."),
            "'Love of money is the root of all kinds of evil.' (1 Timothy 6:10)"),
        "evaluate": ("'The right to follow a religion is the most important human right.'", [
            ("Foundational to identity", "Religious freedom concerns the deepest convictions about meaning and morality, underpinning all other freedoms."),
        ], [
            ("Other rights are prior", "Rights to life, food and freedom from torture may be more fundamental, since one cannot practise religion without them."),
        ]),
        "sb": ("Build a sentence: what does prejudice mean?",
               "Prejudice means judging people without knowing them."),
    },
]


def build_paper2a_items():
    items = []
    tags = ["GCSE", "religion", "thematic", "AQA-2024"]
    sb_items = []
    for th in THEMES_2A:
        k, topic = th["key"], th["topic"]
        # Q*.1 MCQ
        items.append(mcq(f"th_{k}_mcq", th["mcq_q"], th["mcq_a"], topic, tags, th["mcq_d"]))
        # Q*.2 give two → 2 vocab
        gq, gpts = th["give_two"]
        for i, (src, tgt) in enumerate(gpts, 1):
            items.append(vocab(f"th_{k}_give_{i}", src, tgt, topic, tags, f"AQA {th['name']} Q*.2 (2 marks)"))
        # Q*.3 contrast → 2 vocab
        cq, c1, c2 = th["contrast"]
        items.append(vocab(f"th_{k}_contrast_1", c1[0], c1[1], topic, tags, "AQA Q*.3 (4 marks) — contrasting view"))
        items.append(vocab(f"th_{k}_contrast_2", c2[0], c2[1], topic, tags, "AQA Q*.3 (4 marks) — contrasting view"))
        # Q*.4 explain two + scripture → 2 vocab + 1 scripture vocab
        eq, e1, e2, scripture = th["explain"]
        items.append(vocab(f"th_{k}_explain_1", e1[0], e1[1], topic, tags, "AQA Q*.4 (5 marks)"))
        items.append(vocab(f"th_{k}_explain_2", e2[0], e2[1], topic, tags, "AQA Q*.4 (5 marks)"))
        items.append(vocab(f"th_{k}_explain_scripture", f"Scripture: {th['name']}", scripture, topic, tags, "AQA Q*.4 (5 marks) — source of authority"))
        # Q*.5 evaluate → FOR / AGAINST
        stmt, fors, againsts = th["evaluate"]
        for i, (claim, detail) in enumerate(fors, 1):
            items.append(arg(f"th_{k}_for_{i}", "for", claim, detail, topic, tags))
        for i, (claim, detail) in enumerate(againsts, 1):
            items.append(arg(f"th_{k}_against_{i}", "against", claim, detail, topic, tags))
        # sentence builder
        sbq, sba = th["sb"]
        sb_items.append(sb(f"th_{k}_sb", sbq, sba, topic, tags))
    items.extend(sb_items)
    # One reading passage covering the themes
    items.append(passage("th_passage", "Religious Approaches to Ethical Issues",
        "GCSE Religious Studies thematic studies examines how religious believers respond to major ethical issues in modern life. Across themes such as relationships, life and death, peace and conflict, crime and punishment, and human rights, common principles recur. Believers appeal to the sanctity of life — the idea that life is sacred because it is created by God — when discussing abortion, war and the death penalty. They appeal to stewardship when discussing the environment, and to justice and equality when discussing prejudice and human rights. Sacred texts and teachings, such as 'love your neighbour', guide believers to show compassion to the suffering, the poor and the marginalised. At the same time, believers within and between religions often disagree: contrasting views exist on issues like polygamy, nuclear weapons and capital punishment. Examiners expect students to give reasoned arguments for more than one point of view and to reach a justified conclusion.",
        "Thematic: Overview", tags,
        [
            pq("th_pq1", "Which principle is used when discussing abortion, war and the death penalty?",
               ["Stewardship", "The sanctity of life", "Predestination", "The Trinity"], 1),
            pq("th_pq2", "Which principle is used when discussing the environment?",
               ["Stewardship", "Atonement", "Deterrence", "Revelation"], 0),
            pq("th_pq3", "In a 12-mark evaluation answer, students are expected to…",
               ["give only one point of view", "give reasoned arguments for more than one view and a justified conclusion",
                "avoid referring to religion", "list as many facts as possible"], 1),
        ]))
    return items


PAPER_2A = {
    "packId": "gcse_rs_2024_thematic_paper2a",
    "displayName": "AQA GCSE RS 2024 — Thematic Studies (Paper 2A)",
    "paper": "Paper 2A Thematic Studies",
    "topic_root": "Thematic",
    "items": build_paper2a_items(),
}


PACKS = [CHRISTIANITY, ISLAM, PAPER_2A]

# Packs that previously existed but are now superseded / removed (incomplete).
REMOVED_PACK_IDS = ["gcse_rs_2024_thematic_section_b"]


# ─── Manifest + file writers ───────────────────────────────────────────────────

def build_pack_json(pack):
    return {
        "schemaVersion": "1.1",
        "packId": pack["packId"],
        "subject": "religion",
        "sourceLanguageCode": "en-GB",
        "targetLanguageCode": "en-GB",
        "speechLanguage": "en-GB",
        "items": pack["items"],
    }


def make_manifest_entry(pack):
    has_passages = any(i["type"] == "passage" for i in pack["items"])
    caps = ["revision"] + (["passages"] if has_passages else [])
    word_count = sum(1 for i in pack["items"] if i["type"] == "vocab")
    return {
        "id": pack["packId"],
        "subject": "religion",
        "curriculum": "gcse",
        "displayName": pack["displayName"],
        "topic": pack["packId"],
        "sourceLanguageCode": "en-GB",
        "targetLanguageCode": "en-GB",
        "sourceLanguageLabel": "English",
        "targetLanguageLabel": "English",
        "speechLanguage": "en-GB",
        "stageOptions": [],
        "unifiedPath": f"data/Packs/gcse/religion/{pack['packId']}/pack_unified.json",
        "wordCount": word_count,
        "sentenceCount": sum(1 for i in pack["items"] if i["type"] == "sentenceBuilder"),
        "supportsSentences": any(i["type"] == "sentenceBuilder" for i in pack["items"]),
        "capabilities": caps,
        "examSeries": "June 2024",
        "paper": pack["paper"],
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Generate complete AQA RS 2024 packs")
    parser.add_argument("--learning-web-dir", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    lw = Path(args.learning_web_dir)
    if not lw.exists():
        print(f"ERROR: {lw} does not exist", file=sys.stderr)
        sys.exit(1)

    # Write pack files + report item-type breakdown
    for pack in PACKS:
        pack_dir = lw / "data" / "Packs" / "gcse" / "religion" / pack["packId"]
        out_path = pack_dir / "pack_unified.json"
        from collections import Counter
        types = Counter(i["type"] for i in pack["items"])
        if not args.dry_run:
            pack_dir.mkdir(parents=True, exist_ok=True)
            out_path.write_text(json.dumps(build_pack_json(pack), indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"  {pack['packId']}: {dict(types)} (total {len(pack['items'])})")

    # Update manifest.packs
    manifest_path = lw / "data" / "generated" / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    entries = [make_manifest_entry(p) for p in PACKS]
    pack_ids = {e["id"] for e in entries} | set(REMOVED_PACK_IDS)

    # Clean both arrays of our ids first
    manifest["revisionPacks"] = [e for e in manifest.get("revisionPacks", []) if e["id"] not in pack_ids]
    manifest["packs"] = [e for e in manifest.get("packs", []) if e["id"] not in pack_ids]

    for entry in entries:
        manifest.setdefault("packs", []).append(entry)
        print(f"  manifest.packs ← {entry['id']} (caps={entry['capabilities']})")

    # Remove obsolete pack dirs
    for rid in REMOVED_PACK_IDS:
        d = lw / "data" / "Packs" / "gcse" / "religion" / rid
        if d.exists() and not args.dry_run:
            import shutil
            shutil.rmtree(d)
            print(f"  removed obsolete pack dir: {rid}")

    if not args.dry_run:
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nManifest updated — {len(entries)} packs in manifest.packs.")
    else:
        print("\n[DRY RUN] no files written.")


if __name__ == "__main__":
    main()
