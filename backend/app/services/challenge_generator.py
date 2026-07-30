"""
Dynamic cognitive challenge generator.
Generates math, logic, memory, pattern, riddle, quiz and word challenges
scaled to a difficulty level.
"""
import random
import json
from ..models import ChallengeTypeEnum, DifficultyEnum

DIFFICULTY_RANGES = {
    DifficultyEnum.beginner: (1, 10),
    DifficultyEnum.easy: (1, 25),
    DifficultyEnum.medium: (10, 100),
    DifficultyEnum.hard: (50, 500),
    DifficultyEnum.expert: (100, 999),
}

RIDDLES = [
    ("What has keys but can't open locks?", "keyboard"),
    ("What has a face and two hands but no arms or legs?", "clock"),
    ("What gets wetter the more it dries?", "towel"),
    ("What has to be broken before you can use it?", "egg"),
    ("What has one eye but cannot see?", "needle"),
    ("What month of the year has 28 days?", "all of them"),
    ("What can travel around the world while staying in a corner?", "stamp"),
    ("What has many teeth but cannot bite?", "comb"),
    ("What runs but never walks, has a mouth but never talks?", "river"),
    ("The more you take, the more you leave behind. What am I?", "footsteps"),
]

QUIZ_BANK = [
    ("How many continents are there on Earth?", "7"),
    ("What is the capital of France?", "paris"),
    ("What planet is known as the Red Planet?", "mars"),
    ("How many days are in a leap year?", "366"),
    ("What is the chemical symbol for water?", "h2o"),
    ("How many minutes are in a full day?", "1440"),
    ("What is the largest ocean on Earth?", "pacific"),
    ("How many sides does a hexagon have?", "6"),
    ("What is the freezing point of water in Celsius?", "0"),
    ("How many bones are in the adult human body?", "206"),
]

WORD_BANK = [
    ("Unscramble the letters: NRIGMO (a time of day)", "morning"),
    ("Unscramble the letters: SEELP (what you do at night)", "sleep"),
    ("Unscramble the letters: MRALA (this wakes you up)", "alarm"),
    ("Unscramble the letters: TIVYCUPRODIT (getting things done)", "productivity"),
    ("Unscramble the letters: TIBAH (a routine you repeat)", "habit"),
]


def _scramble(word: str) -> str:
    letters = list(word.upper())
    random.shuffle(letters)
    return "".join(letters)


def generate_math_challenge(difficulty: DifficultyEnum):
    lo, hi = DIFFICULTY_RANGES[difficulty]
    ops_by_level = {
        DifficultyEnum.beginner: ["+", "-"],
        DifficultyEnum.easy: ["+", "-", "*"],
        DifficultyEnum.medium: ["+", "-", "*"],
        DifficultyEnum.hard: ["+", "-", "*", "/"],
        DifficultyEnum.expert: ["+", "-", "*", "/"],
    }
    op = random.choice(ops_by_level[difficulty])
    a = random.randint(lo, hi)
    b = random.randint(lo, hi)

    if op == "+":
        answer = a + b
    elif op == "-":
        a, b = max(a, b), min(a, b)
        answer = a - b
    elif op == "*":
        b = random.randint(2, min(12, hi))
        answer = a * b
    else:  # division - construct clean division
        b = random.randint(2, min(12, hi))
        answer = random.randint(lo, hi)
        a = answer * b

    # multi-step for harder levels
    if difficulty in (DifficultyEnum.hard, DifficultyEnum.expert):
        c = random.randint(2, 20)
        prompt = f"What is ({a} {op} {b}) + {c} ?"
        answer = answer + c
    else:
        prompt = f"What is {a} {op} {b} ?"

    return prompt, str(answer)


def generate_logic_challenge(difficulty: DifficultyEnum):
    templates = [
        ("If all Bloops are Razzles and all Razzles are Lorches, are all Bloops Lorches?", "yes"),
        ("A is taller than B. B is taller than C. Is A taller than C?", "yes"),
        ("If today is Monday, what day will it be in 3 days?", "thursday"),
        ("Tom is older than Jerry. Jerry is older than Sam. Who is the youngest?", "sam"),
        ("If it takes 5 machines 5 minutes to make 5 widgets, how many minutes for 100 machines to make 100 widgets?", "5"),
        ("A farmer has 17 sheep, all but 9 die. How many are left?", "9"),
        ("If two's company and three's a crowd, what are four and five?", "9"),
    ]
    prompt, answer = random.choice(templates)
    return prompt, answer


def generate_memory_challenge(difficulty: DifficultyEnum):
    length_by_level = {
        DifficultyEnum.beginner: 3,
        DifficultyEnum.easy: 4,
        DifficultyEnum.medium: 5,
        DifficultyEnum.hard: 6,
        DifficultyEnum.expert: 8,
    }
    length = length_by_level[difficulty]
    sequence = [random.randint(0, 9) for _ in range(length)]
    prompt = "Memorize this sequence, then type it back exactly."
    answer = "".join(str(d) for d in sequence)
    return prompt, answer, sequence


def generate_pattern_challenge(difficulty: DifficultyEnum):
    start = random.randint(1, 10)
    step = random.randint(2, 9 if difficulty in (DifficultyEnum.hard, DifficultyEnum.expert) else 5)
    length = 5
    seq = [start + step * i for i in range(length)]
    shown = seq[:-1]
    answer = seq[-1]
    prompt = f"What is the next number in the pattern: {', '.join(map(str, shown))}, ... ?"
    return prompt, str(answer)


def generate_riddle_challenge(difficulty: DifficultyEnum):
    prompt, answer = random.choice(RIDDLES)
    return prompt, answer


def generate_quiz_challenge(difficulty: DifficultyEnum):
    prompt, answer = random.choice(QUIZ_BANK)
    return prompt, answer


def generate_word_challenge(difficulty: DifficultyEnum):
    prompt_template, answer = random.choice(WORD_BANK)
    scrambled = _scramble(answer)
    prompt = prompt_template.replace(_scramble(answer), scrambled)
    prompt = f"Unscramble the letters: {scrambled.upper()}"
    return prompt, answer


GENERATORS = {
    ChallengeTypeEnum.math: generate_math_challenge,
    ChallengeTypeEnum.logic: generate_logic_challenge,
    ChallengeTypeEnum.memory: generate_memory_challenge,
    ChallengeTypeEnum.pattern: generate_pattern_challenge,
    ChallengeTypeEnum.riddle: generate_riddle_challenge,
    ChallengeTypeEnum.quiz: generate_quiz_challenge,
    ChallengeTypeEnum.word: generate_word_challenge,
}


def generate_challenge(challenge_type: ChallengeTypeEnum, difficulty: DifficultyEnum):
    """Returns (prompt, correct_answer, meta_dict)"""
    generator = GENERATORS[challenge_type]
    result = generator(difficulty)
    if challenge_type == ChallengeTypeEnum.memory:
        prompt, answer, sequence = result
        meta = {"sequence": sequence, "show_seconds": 4}
    else:
        prompt, answer = result
        meta = {}
    return prompt, answer, meta


def pick_random_challenge_type():
    return random.choice(list(ChallengeTypeEnum))


def check_answer(challenge_type: ChallengeTypeEnum, correct_answer: str, user_answer: str) -> bool:
    if user_answer is None:
        return False
    a = str(correct_answer).strip().lower()
    b = str(user_answer).strip().lower()
    if challenge_type in (ChallengeTypeEnum.riddle, ChallengeTypeEnum.quiz, ChallengeTypeEnum.word):
        return a == b or a in b or b in a
    return a == b
