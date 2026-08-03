# Word unlock engine

## Active rule

The runtime indexes all canonical words for dependency evaluation, including words not placed in a generated lesson because of lesson-capacity limits. A character attempt evaluates only words in the reverse character index and records sparse learner projection state.

Unlock eligibility is separate from learner-facing semantic approval. The current canonical word dataset has 10,000 records and the preview curriculum maps 5,972 to lessons; all 10,000 are unlock-eligible for testing, while definitions and pronunciation remain labelled pending until their source review fields are approved.

Word discovery is not mastery. Character prerequisites can move a word to `discovered`; meaning, reading, order and full-word typing attempts update separate mastery dimensions.
