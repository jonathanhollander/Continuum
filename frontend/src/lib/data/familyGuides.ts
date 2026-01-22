// Family Conversation Guides & Scripts
// Compassionate resources for difficult conversations

export interface GuideSection {
    title: string;
    content: string;
}

export interface Guide {
    id: string;
    title: string;
    subtitle: string;
    introduction: string;
    sections: GuideSection[];
    closingNote: string;
}

export const conversationGuides: Guide[] = [
    {
        id: "conv-1",
        title: "Starting the Conversation",
        subtitle: "Gentle scripts for beginning difficult conversations about end-of-life wishes",
        introduction: "These conversations are never easy, but they're among the most loving things you can do for your family. There's no perfect time or perfect words. What matters is that you try.",
        sections: [
            {
                title: "Finding the Right Moment",
                content: "Look for a quiet time when you won't be rushed or interrupted. After a family gathering, during a peaceful afternoon, or when a health event (not necessarily your own) naturally opens the door can all work well. You might say:\n\n\"I've been thinking about something important, and I'd love to talk with you about it when you have some time.\"\n\n\"I want to make sure the people I love know my wishes. Could we find some time to talk?\""
            },
            {
                title: "Opening Lines That Work",
                content: "Here are some gentle ways to begin:\n\n\"I've been doing some planning lately, and I realized I've never told you what matters most to me.\"\n\n\"I read something recently that made me think about how I'd want things handled if something happened to me.\"\n\n\"I know this isn't easy to talk about, but I'd feel better knowing you understand my wishes.\"\n\n\"I want to make things easier for you someday, not harder. Can we talk about that?\""
            },
            {
                title: "If They Seem Uncomfortable",
                content: "It's normal for loved ones to resist these conversations. They may change the subject, make jokes, or say \"Let's not talk about that.\" Respond with patience:\n\n\"I understand this is hard. It's hard for me too. But I love you, and that's why I want to have this conversation.\"\n\n\"We don't have to figure everything out today. I just wanted to start the conversation.\"\n\n\"I'm not trying to be morbid. I'm trying to take care of you.\""
            },
            {
                title: "Keeping It Going",
                content: "Once you've started, keep the momentum gentle:\n\n\"What would be most helpful for you to know?\"\n\n\"Is there anything you've wondered about but didn't want to ask?\"\n\n\"I don't have all the answers yet, but I wanted you to know I'm thinking about these things.\""
            }
        ],
        closingNote: "Remember: This isn't a one-time conversation. It's the beginning of an ongoing dialogue. Give yourself and your loved ones grace as you navigate this together."
    },
    {
        id: "conv-2",
        title: "When They Don't Want to Talk",
        subtitle: "How to honor someone's reluctance while keeping the door open",
        introduction: "Sometimes the people we love most aren't ready to face these conversations. This doesn't mean they don't care. It often means they care so much that the topic feels overwhelming. Here's how to respect their boundaries while gently keeping the door open.",
        sections: [
            {
                title: "Understanding Their Resistance",
                content: "People avoid end-of-life conversations for many reasons:\n\n- Fear of death or dying\n- Superstition that talking about it might \"make it happen\"\n- Denial as a coping mechanism\n- Past trauma or unresolved grief\n- Cultural or religious beliefs\n- Simply not knowing what to say\n\nNone of these reasons make them wrong. They're human responses to something genuinely difficult."
            },
            {
                title: "Validating Their Feelings",
                content: "Before trying again, acknowledge their perspective:\n\n\"I know you don't want to talk about this, and I understand why. It's hard for me too.\"\n\n\"I respect that you're not ready. I just want you to know I'm here when you are.\"\n\n\"I'm not trying to upset you. I'm trying to love you well.\""
            },
            {
                title: "Alternative Approaches",
                content: "Sometimes a direct conversation isn't the right path. Consider:\n\n**Writing a letter**: \"I know you're not comfortable talking about this, so I wrote down some of my thoughts. You can read it whenever you're ready.\"\n\n**Sharing a resource**: \"I found this helpful. No pressure to discuss it, but I wanted to share.\"\n\n**Using a third party**: A family friend, counselor, or clergy member might help facilitate.\n\n**Starting smaller**: Begin with less intense topics like charitable wishes or family keepsakes."
            },
            {
                title: "Planting Seeds",
                content: "Even if they won't engage fully, you can still plant seeds:\n\n\"I'm going to write down my wishes so you'll have them someday. No need to discuss it now.\"\n\n\"I love you, and I want things to be as easy as possible for you when the time comes. That's why this matters to me.\"\n\n\"I'll drop it for now, but I hope we can revisit this someday.\""
            }
        ],
        closingNote: "You cannot force someone to be ready. But you can do your own work, document your wishes clearly, and trust that your preparation is itself an act of love."
    },
    {
        id: "conv-3",
        title: "Questions That Open Hearts",
        subtitle: "Thoughtful prompts that invite meaningful sharing",
        introduction: "The best conversations often start with the right question. These prompts are designed to gently invite sharing without feeling like an interrogation. Use them over time, in different settings, as natural conversation starters.",
        sections: [
            {
                title: "Questions About Values",
                content: "\"What's the most important thing you want people to remember about you?\"\n\n\"If you could give one piece of advice to the next generation, what would it be?\"\n\n\"What moments in your life have meant the most to you?\"\n\n\"What do you wish you had learned earlier in life?\""
            },
            {
                title: "Questions About Legacy",
                content: "\"Is there anything you've always wanted to tell me but haven't?\"\n\n\"What family stories do you hope get passed down?\"\n\n\"Are there any family recipes, traditions, or rituals you want to make sure we keep?\"\n\n\"Who were the people who shaped you most, and what did they teach you?\""
            },
            {
                title: "Questions About Wishes",
                content: "\"Where have you felt most at peace in your life?\"\n\n\"What kind of gathering would feel right to celebrate your life?\"\n\n\"Is there music, poetry, or scripture that's meaningful to you?\"\n\n\"Are there any places that hold special meaning for you?\""
            },
            {
                title: "Questions About Relationships",
                content: "\"Is there anyone you'd want me to reach out to on your behalf?\"\n\n\"Are there any relationships you wish had gone differently?\"\n\n\"Who do you want to make sure is taken care of?\"\n\n\"Is there anything you want to make right before it's too late?\""
            },
            {
                title: "Lighter Questions That Still Matter",
                content: "\"What's the best meal you've ever had?\"\n\n\"What's a place you've always wanted to visit?\"\n\n\"What's a song that always makes you think of a specific time in your life?\"\n\n\"What's the funniest thing that ever happened to you?\""
            }
        ],
        closingNote: "Not every question needs an answer right away. Some are seeds that bloom later. The act of asking shows you care about their story."
    },
    {
        id: "conv-4",
        title: "After a Diagnosis",
        subtitle: "Finding words when someone you love receives difficult medical news",
        introduction: "When someone you love receives a serious diagnosis, words can feel impossible. You want to say the right thing, but there is no right thing. What matters most is showing up.",
        sections: [
            {
                title: "What to Say (and What Not to)",
                content: "**Do say:**\n\"I love you. I'm here.\"\n\"I don't know what to say, but I want you to know I care.\"\n\"What do you need right now?\"\n\"I'm not going anywhere.\"\n\n**Avoid saying:**\n\"Everything happens for a reason.\"\n\"Stay positive!\"\n\"My aunt had that and she was fine.\"\n\"Have you tried [alternative treatment]?\"\n\"Let me know if you need anything.\" (Be specific instead.)"
            },
            {
                title: "Being Present Without Fixing",
                content: "Your instinct may be to solve, research, or encourage. But sometimes the most loving thing is simply to witness their pain without trying to fix it.\n\n\"I can't imagine how hard this is. I'm so sorry.\"\n\n\"You don't have to be brave with me.\"\n\n\"I'm here to listen if you want to talk. Or we can just sit together.\""
            },
            {
                title: "Practical Support That Helps",
                content: "Instead of asking \"What do you need?\", offer specifics:\n\n\"I'm bringing dinner Tuesday. Any preferences?\"\n\"I can drive you to your appointment Thursday.\"\n\"I'm going to the grocery store. I'll pick up your list.\"\n\"I'll sit with you during treatment if you'd like company.\"\n\"I can take the kids this weekend so you can rest.\""
            },
            {
                title: "Navigating Ongoing Conversations",
                content: "As time goes on, check in without making them repeat their status:\n\n\"I've been thinking about you. How are you feeling today?\"\n\n\"I don't need an update unless you want to share. I just wanted you to know you're on my mind.\"\n\n\"Can I bring you some joy today? A movie, a walk, a silly story?\""
            }
        ],
        closingNote: "You will say imperfect things. You will feel helpless. That's okay. Your presence matters more than your words. Just keep showing up."
    }
];

export const familyGuides: Guide[] = [
    {
        id: "talk-1",
        title: "Talking to Young Children (Ages 3-6)",
        subtitle: "Simple, honest language for little ones",
        introduction: "Young children understand more than we often give them credit for, but they process information differently than adults. They need simple, concrete language and lots of reassurance about their own safety and routine.",
        sections: [
            {
                title: "Using Clear, Simple Language",
                content: "Avoid euphemisms that can confuse children:\n\n**Instead of**: \"We lost Grandma\" or \"Grandpa went to sleep\"\n**Say**: \"Grandma died. Her body stopped working.\"\n\nThis may feel harsh, but it prevents confusion. \"Lost\" makes children think someone might be found. \"Went to sleep\" can create fear of bedtime.\n\n**Simple explanations**:\n\"When someone dies, their body completely stops working. They can't breathe, eat, or feel anything anymore.\"\n\n\"Death is not like being sick or sleeping. It's permanent, which means Grandpa won't come back.\""
            },
            {
                title: "Answering Their Questions",
                content: "Children this age often ask the same questions repeatedly. This is normal and helps them process.\n\n**\"Where is Grandma now?\"**\nBe honest about what you believe, but keep it simple: \"Her body is buried in a special place called a cemetery\" or \"We believe her spirit is in heaven.\"\n\n**\"Will you die too?\"**\n\"Everyone dies someday, but I plan to be here for a very long time. I'm healthy, and I'm going to take good care of myself.\"\n\n**\"Did I cause it?\"**\nChildren often believe their thoughts or actions can cause events. Reassure them directly: \"Nothing you did or said or thought made this happen. This is not your fault.\""
            },
            {
                title: "Maintaining Routine and Safety",
                content: "Young children feel safe through routine. Even during grief:\n\n- Keep mealtimes and bedtimes consistent\n- Continue familiar activities like daycare or playdates\n- Reassure them that the adults who care for them are okay\n- Let them know who will take care of them\n\n\"I know things feel different right now. But you're safe, I love you, and I'm going to keep taking care of you just like always.\""
            },
            {
                title: "Including Them Appropriately",
                content: "Children can participate in mourning in age-appropriate ways:\n\n- Drawing a picture for the person who died\n- Attending part of a service if prepared in advance\n- Choosing a flower or item to place at a grave\n- Looking at photos and sharing memories\n\nLet them lead. Some children want to be involved; others prefer distance. Both are okay."
            }
        ],
        closingNote: "Children grieve in short bursts. They may cry one moment and play happily the next. This is healthy and normal. Follow their lead, answer honestly, and keep loving them through it."
    },
    {
        id: "talk-2",
        title: "Talking to School-Age Children (Ages 7-12)",
        subtitle: "Balancing honesty with reassurance",
        introduction: "Children in this age range understand that death is permanent and universal, but they may struggle with the emotional complexity. They often want more details and may have fears about their own mortality or that of other loved ones.",
        sections: [
            {
                title: "Being Honest About What Happened",
                content: "At this age, children can handle more information and will often seek it out. It's better they hear truth from you than piece it together elsewhere.\n\n\"Your grandfather had a disease called cancer. The doctors tried many treatments, but his body wasn't able to fight it anymore.\"\n\n\"Grandma's heart stopped working suddenly. Sometimes this happens to older people, even when we don't expect it.\"\n\nIf the death involved difficult circumstances (suicide, overdose), seek guidance from a counselor on age-appropriate ways to explain while preserving their sense of safety."
            },
            {
                title: "Addressing Their Fears",
                content: "School-age children often develop fears after a death:\n\n**Fear of more deaths**: \"It makes sense that you're worried about other people dying. Most people live long lives, and the people who take care of you are healthy.\"\n\n**Fear of their own death**: \"Children very rarely die. Your body is strong and healthy.\"\n\n**Fear of forgetting**: \"We're going to keep talking about [person] and looking at photos. You won't forget them, and neither will I.\"\n\n**Fear of crying at school**: \"It's okay to feel sad at school. You can talk to your teacher or go to the counselor's office if you need a break.\""
            },
            {
                title: "Helping Them Express Grief",
                content: "Children this age may not want to \"talk about feelings\" directly. Alternative outlets:\n\n- Journaling or writing letters to the deceased\n- Creating art or scrapbooks\n- Physical activity to process emotions\n- Reading books about loss together\n- Watching movies that deal with death (Coco, The Lion King)\n- Memory projects like planting a garden"
            },
            {
                title: "School and Social Considerations",
                content: "- Notify their teacher and school counselor\n- Prepare them for questions from classmates\n- Role-play responses if they want: \"My grandma died. I don't really want to talk about it.\"\n- Watch for changes in grades, behavior, or friendships\n- Know that grief may resurface at milestones (birthdays, holidays, graduations)"
            }
        ],
        closingNote: "Children this age are developing their own understanding of mortality. Your honest, calm presence helps them feel safe processing these big questions."
    },
    {
        id: "talk-3",
        title: "Talking to Teenagers",
        subtitle: "Respecting their need for independence while staying connected",
        introduction: "Teenagers grieve with all the intensity of adults but often lack the coping skills or support systems. They may pull away, act out, or seem unaffected. All of these are normal responses. Your job is to remain a steady, available presence.",
        sections: [
            {
                title: "Giving Them Space While Staying Close",
                content: "Teens may not want to talk, especially to parents. Respect this while making clear you're available:\n\n\"I know you might not want to talk to me about this, and that's okay. But I'm here if you change your mind.\"\n\n\"I'm going to keep checking in on you, not because I'm worried, but because I love you.\"\n\n\"If you'd rather talk to someone else, like a counselor or another adult you trust, I can help arrange that.\"\n\nCreate opportunities for organic conversation: car rides, walks, late-night kitchen encounters."
            },
            {
                title: "Including Them in Decisions",
                content: "Teenagers want agency. Where appropriate, include them:\n\n- \"Would you like to speak at the service or write something?\"\n- \"Should we include any of their music or photos you'd choose?\"\n- \"What do you think [person] would have wanted?\"\n- \"How would you like to remember them?\"\n\nIf they decline involvement, accept it gracefully. They may change their mind later."
            },
            {
                title: "Watching for Warning Signs",
                content: "While many grief responses are normal, watch for:\n\n- Significant changes in sleep or eating\n- Social withdrawal lasting more than a few weeks\n- Decline in academic performance\n- Risk-taking behavior (substance use, reckless driving)\n- Expressions of hopelessness or self-harm\n\nIf you see these signs, seek professional support. Many schools have grief counselors, and your pediatrician can provide referrals."
            },
            {
                title: "Modeling Healthy Grief",
                content: "Teenagers learn from watching you:\n\n- Let them see you cry (appropriately)\n- Share your own memories and feelings\n- Demonstrate healthy coping: talking, exercising, seeking support\n- Avoid numbing through substances or overwork\n- Show that grief doesn't have a timeline"
            }
        ],
        closingNote: "Your teenager may seem like they don't need you. They do. Stay present, stay patient, and trust that your relationship will carry you through this together."
    },
    {
        id: "talk-4",
        title: "When a Parent Has a Terminal Illness",
        subtitle: "Guidance for families navigating anticipatory grief together",
        introduction: "Living with a terminal diagnosis is its own kind of grief. You're mourning while the person is still present, planning for an ending while trying to live in the now. This guide offers support for the journey.",
        sections: [
            {
                title: "Breaking the News",
                content: "There's no good way to share this news, only honest ways.\n\n**To a partner**: \"I have something difficult to tell you, and I need you to sit with me. The doctors have told me...\"\n\n**To adult children**: \"I need to share something hard. I want you to know the truth so we can face this together.\"\n\n**To young children**: Keep it simple and honest. \"Mommy is very sick. The doctors are trying to help, but this sickness might not get better.\"\n\nAllow time for reactions. Don't rush to reassurance. Let people feel what they feel."
            },
            {
                title: "Living in Two Realities",
                content: "Anticipatory grief means holding two truths:\n\n1. This person is still here, still living, still themselves\n2. They are leaving, and we must prepare\n\n**Honor both realities**:\n- Make memories while you can\n- Have practical conversations about wishes\n- Say the things that need saying\n- Continue normal life where possible\n- Allow sadness without letting it consume everything"
            },
            {
                title: "Conversations to Have",
                content: "While time remains, consider discussing:\n\n**Practical matters**: Finances, wills, passwords, funeral preferences\n\n**Relational matters**: \"Is there anything you want to tell me?\" \"Is there anyone you want to reconnect with?\" \"Is there anything you need to hear from me?\"\n\n**Legacy matters**: \"What do you want us to remember?\" \"What values do you hope we carry forward?\" \"Is there anything you want to create or leave behind?\"\n\nNot every conversation needs to be heavy. Joy and laughter are still allowed. Encouraged, even."
            },
            {
                title: "Supporting Each Other",
                content: "Family members grieve differently. Some want to talk constantly; others need silence. Some become caregivers; others withdraw. Try to:\n\n- Accept different coping styles without judgment\n- Communicate needs clearly: \"I need some time alone\" or \"I need to talk\"\n- Divide responsibilities fairly\n- Seek outside support (friends, counselors, support groups)\n- Care for your own health so you can be present"
            }
        ],
        closingNote: "This is sacred time. It's painful and precious and unfair and holy. Be gentle with yourself and each other. You are doing something incredibly hard, and you don't have to do it perfectly."
    },
    {
        id: "talk-5",
        title: "Telling Elderly Parents",
        subtitle: "How to share news of a loss with aging parents, including those with dementia",
        introduction: "Sharing news of a death with elderly parents presents unique challenges. They may be fragile, isolated, or cognitively impaired. This guide helps you navigate these difficult conversations with compassion.",
        sections: [
            {
                title: "Sharing News with Cognitively Intact Parents",
                content: "Even elderly parents who are sharp deserve the full truth, delivered with care:\n\n**Do:**\n- Tell them in person if possible\n- Have someone present for support\n- Give them time to process\n- Expect a range of reactions\n- Follow up in the days after\n\n**Sample language**:\n\"Mom, I have some very sad news. [Name] passed away [yesterday/this morning]. I'm so sorry to have to tell you this.\"\n\nAllow silence. Allow tears. Allow whatever comes."
            },
            {
                title: "When They Have Dementia",
                content: "This is one of the cruelest aspects of dementia: the person may forget the loss and grieve fresh each time they're reminded.\n\n**There are different approaches**:\n\n**Telling the truth each time**: Some families believe in honesty, accepting that the grief will recur. This respects the person's right to know but causes repeated pain.\n\n**Therapeutic fibbing**: Some families avoid re-traumatizing by deflecting: \"Dad isn't able to visit right now\" or \"Mom is resting.\" This protects emotional wellbeing but may feel dishonest.\n\n**Meeting them in their reality**: If they believe someone is still alive, sometimes the kindest response is to be present without correcting: \"Tell me about Dad\" instead of \"Dad died years ago.\"\n\nThere is no universally right answer. Consult with their care team and choose what feels most loving for your specific situation."
            },
            {
                title: "Supporting Their Grief Process",
                content: "Elderly parents may grieve differently:\n\n- They may seem numb or stoic (generational differences in emotional expression)\n- They may be reminded of earlier losses\n- They may worry about being \"next\"\n- They may become anxious about their own mortality or care\n\nProvide extra reassurance:\n\"I'm here with you.\"\n\"We're going to get through this together.\"\n\"You're not alone.\""
            },
            {
                title: "Practical Considerations",
                content: "After sharing the news:\n\n- Can they attend the funeral? Would they want to?\n- Do they need extra care or companionship in the days following?\n- Who should check on them regularly?\n- Have they updated their own documents recently?\n\nUse this moment, if appropriate, to gently revisit their own wishes. Not immediately, but in the weeks that follow."
            }
        ],
        closingNote: "Protecting elderly parents from hard truths may seem kind, but isolation and exclusion can also cause harm. When possible, include them in family grief. They deserve to mourn with those they love."
    },
    {
        id: "talk-6",
        title: "Sibling Conversations",
        subtitle: "Navigating family dynamics and differing grief styles",
        introduction: "Siblings share history, but they often grieve very differently. Old dynamics, unresolved conflicts, and different relationships with the deceased can make this time complicated. Here's how to navigate it with grace.",
        sections: [
            {
                title: "Understanding Different Relationships",
                content: "Each sibling had their own relationship with the person who died:\n\n- The caregiver sibling may feel relieved and then guilty about the relief\n- The distant sibling may feel regret or unresolved grief\n- The favored sibling may feel acute loss\n- The estranged sibling may have complicated emotions\n\nAcknowledge these differences: \"I know your relationship with Dad was different from mine. I want to hear about your experience if you want to share.\""
            },
            {
                title: "Dividing Responsibilities Fairly",
                content: "Death often surfaces old family patterns. The \"responsible\" sibling may end up doing everything while others seem absent.\n\n**Proactive steps**:\n- Create a shared list of tasks\n- Ask for specific help: \"Can you handle notifying the insurance companies?\"\n- Use a group text or document to coordinate\n- Accept that \"fair\" doesn't always mean \"equal\"\n- Be honest about capacity: \"I can do X, but I need someone else to handle Y\"\n\nIf conflicts arise, try: \"I'm feeling overwhelmed. Can we talk about how to share this more evenly?\""
            },
            {
                title: "When Conflicts Arise",
                content: "Grief can intensify old wounds or create new ones. Common conflicts:\n\n- Disagreements about funeral arrangements\n- Disputes about inheritance or belongings\n- Resentment about who did/didn't help during illness\n- Different opinions about honoring the deceased\n\n**Strategies**:\n- Focus on shared values: \"We all want to honor Mom well\"\n- Pick your battles: Some things aren't worth the rift\n- Take breaks when emotions run high\n- Consider a mediator for serious disputes\n- Remember: the relationship with your sibling matters more than most objects"
            },
            {
                title: "Staying Connected",
                content: "Grief can either fracture or forge sibling bonds. To stay connected:\n\n- Check in on each other, not just about logistics\n- Share memories: \"Remember when Dad used to...\"\n- Create new rituals together\n- Forgive imperfect responses in the acute grief period\n- Plan time together outside of grief tasks\n\n\"I know we're all handling this differently. But you're my [brother/sister], and I want to go through this with you, not against you.\""
            }
        ],
        closingNote: "Your siblings are among the few people who share your history and will carry the memory of your parents forward. The relationship is worth protecting, even when grief makes it hard."
    }
];

// Helper to get a guide by ID
export function getGuideById(id: string): Guide | undefined {
    return [...conversationGuides, ...familyGuides].find(g => g.id === id);
}

// Helper to get all guides by category
export function getGuidesByCategory(category: "Conversations" | "Talking to Family"): Guide[] {
    return category === "Conversations" ? conversationGuides : familyGuides;
}
