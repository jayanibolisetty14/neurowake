"""
Rule-based Recommendation Engine.
Produces sleep, wake-up, habit, and productivity recommendations
personalized from the user's latest habit-score breakdown.
"""
from typing import List


def build_recommendations(wake_up_consistency: float, challenge_completion: float,
                           snooze_reduction: float, sleep_schedule_adherence: float,
                           total_score: float) -> List[str]:
    recs: List[str] = []

    if wake_up_consistency < 60:
        recs.append("Try setting your alarm for the same time every day, including weekends, to strengthen your wake-up rhythm.")
    else:
        recs.append("Great job keeping a consistent wake-up time — keep it up!")

    if challenge_completion < 60:
        recs.append("Consider lowering your challenge difficulty temporarily to rebuild confidence, then ramp back up.")
    else:
        recs.append("Your cognitive challenge accuracy is strong. Try a harder difficulty to keep your mind engaged.")

    if snooze_reduction < 60:
        recs.append("You're snoozing often. Move your phone across the room so you have to get up to dismiss the alarm.")
    else:
        recs.append("Your snooze habit is well controlled — this is a big driver of better mornings.")

    if sleep_schedule_adherence < 60:
        recs.append("Your actual wake-up time drifts from your target. Try a 15-minute earlier bedtime this week.")
    else:
        recs.append("You're waking up close to your target time — your sleep schedule is well aligned.")

    if total_score >= 85:
        recs.append("Outstanding habit score! You're a model of consistent, productive mornings.")
    elif total_score < 40:
        recs.append("Your habit score suggests mornings are a struggle right now. Start with one small change — a 10 minute earlier alarm — rather than everything at once.")

    return recs
