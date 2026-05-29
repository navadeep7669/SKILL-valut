import logging

logger = logging.getLogger("quiz_system")

class QuizSystem:
    @staticmethod
    def evaluate_quiz(questions, user_answers):
        """
        Helper method to evaluate answers and compute a baseline raw score.
        This provides an immediate client-side validation format in case of API delays.
        """
        correct_count = 0
        total_questions = len(questions)
        concept_breakdown = {}

        for q in questions:
            qid = q["id"]
            topic = q["topic"]
            correct_ans = q["correct_answer"]
            user_ans = user_answers.get(str(qid)) or user_answers.get(int(qid))

            is_correct = (user_ans == correct_ans)
            if is_correct:
                correct_count += 1
            
            if topic not in concept_breakdown:
                concept_breakdown[topic] = {
                    "total": 0,
                    "correct": 0
                }
            
            concept_breakdown[topic]["total"] += 1
            if is_correct:
                concept_breakdown[topic]["correct"] += 1

        score = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
        
        # Determine weak and strong concepts
        strong_concepts = []
        weak_concepts = []
        for topic, stats in concept_breakdown.items():
            success_rate = stats["correct"] / stats["total"]
            if success_rate >= 0.7:
                strong_concepts.append(topic)
            else:
                weak_concepts.append(topic)

        # Fallback if list is empty
        if not strong_concepts and weak_concepts:
            strong_concepts = ["General Concepts"]
        elif not weak_concepts and strong_concepts:
            weak_concepts = ["Advanced Performance Profiling"]

        return {
            "score": score,
            "strong_concepts": strong_concepts,
            "weak_concepts": weak_concepts,
            "confidence_rating": "high" if score >= 80 else "medium" if score >= 50 else "low",
            "learning_speed_estimate": "fast" if score >= 80 else "normal" if score >= 50 else "steady",
            "summary": f"Scored {score}% overall. Strong in {', '.join(strong_concepts)}. Needs enhancement in {', '.join(weak_concepts)}."
        }
