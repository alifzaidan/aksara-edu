<?php

namespace App\Services;

class QuizSequenceService
{
    public function applySequenceToQuestions($questions, $sequence)
    {
        $questionSequence = $sequence->question_sequence ?? [];
        $optionSequences = $sequence->option_sequences ?? [];

        $orderedQuestions = collect();
        foreach ($questionSequence as $questionId) {
            $question = $questions->firstWhere('id', $questionId);
            if ($question) {
                $questionIdStr = (string) $questionId;
                if (isset($optionSequences[$questionIdStr])) {
                    $optionSequence = $optionSequences[$questionIdStr];
                    $orderedOptions = collect();

                    foreach ($optionSequence as $optionIndex) {
                        $optionIndex = (int) $optionIndex;
                        if (isset($question->questionOptions[$optionIndex])) {
                            $orderedOptions->push($question->questionOptions[$optionIndex]);
                        }
                    }

                    $question->setRelation('options', $orderedOptions);
                }

                $orderedQuestions->push($question);
            }
        }

        return $orderedQuestions;
    }
}
