export interface SentenceOrderingItem {
  id: string;
  skill: string;
  exerciseType: "sentence_ordering";
  difficulty: "easy" | "medium" | "hard";
  words: string[];
  correctSentence: string;
  subskill: string;
  explanation: string;
}

export interface FillMissingWordsItem {
  id: string;
  skill: string;
  exerciseType: "fill_missing_words";
  difficulty: "easy" | "medium" | "hard";
  sentence: string;
  choices: string[];
  correctAnswer: string;
  subskill: string;
  explanation: string;
}

export interface CreateSentenceItem {
  id: string;
  skill: string;
  exerciseType: "create_sentence";
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  targetConcepts: string[];
  exampleAnswer: string;
  subskill: string;
}

export type SentenceConstructionItem = 
  | SentenceOrderingItem 
  | FillMissingWordsItem 
  | CreateSentenceItem;

export const sentenceConstructionData: SentenceConstructionItem[] = [
  {
    "id": "SC-ORD-001",
    "skill": "sentence_construction",
    "exerciseType": "sentence_ordering",
    "difficulty": "easy",
    "words": ["Binasa", "niya", "ang", "aklat", "kahapon"],
    "correctSentence": "Binasa niya ang aklat kahapon.",
    "subskill": "word_order",
    "explanation": "Ang pandiwa ay nauuna, sinusundan ng paksa at layon, at karaniwang nasa hulihan ang pananda ng panahon."
  },
  {
    "id": "SC-ORD-002",
    "skill": "sentence_construction",
    "exerciseType": "sentence_ordering",
    "difficulty": "easy",
    "words": ["Masigasig", "na", "mag-aaral", "siya"],
    "correctSentence": "Masigasig na mag-aaral siya.",
    "subskill": "pang-angkop",
    "explanation": "Ginagamit ang 'na' bilang pang-angkop kapag nagtatapos sa katinig ang unang salita."
  },
  {
    "id": "SC-ORD-003",
    "skill": "sentence_construction",
    "exerciseType": "sentence_ordering",
    "difficulty": "medium",
    "words": ["Dahil", "nag-aral", "siya", "nang", "mabuti", "pumasa", "siya"],
    "correctSentence": "Dahil nag-aral siya nang mabuti, pumasa siya.",
    "subskill": "ugnayan_ng_pangungusap",
    "explanation": "Ang pangatnig na 'dahil' ay nagpapakita ng sanhi at dapat sundan ng bunga."
  },
  {
    "id": "SC-FILL-001",
    "skill": "sentence_construction",
    "exerciseType": "fill_missing_words",
    "difficulty": "easy",
    "sentence": "_____ nagsikap siya, natupad ang kanyang pangarap.",
    "choices": ["Dahil", "Ngunit", "Kung", "Samantala"],
    "correctAnswer": "Dahil",
    "subskill": "pang-ugnay",
    "explanation": "Ang 'dahil' ay ginagamit upang ipakita ang sanhi ng isang pangyayari."
  },
  {
    "id": "SC-FILL-002",
    "skill": "sentence_construction",
    "exerciseType": "fill_missing_words",
    "difficulty": "medium",
    "sentence": "Hindi siya pumasok _____ siya ay may sakit.",
    "choices": ["dahil", "ngunit", "kaya", "habang"],
    "correctAnswer": "dahil",
    "subskill": "pang-ugnay",
    "explanation": "Ipinapakita ng 'dahil' ang dahilan kung bakit hindi siya pumasok."
  },
  {
    "id": "SC-FILL-003",
    "skill": "sentence_construction",
    "exerciseType": "fill_missing_words",
    "difficulty": "medium",
    "sentence": "_____ matapos ang klase, umuwi na ang mga mag-aaral.",
    "choices": ["Kapag", "Pagkatapos", "Habang", "Bagaman"],
    "correctAnswer": "Pagkatapos",
    "subskill": "panandang_pangyayari",
    "explanation": "Ang 'pagkatapos' ay ginagamit upang ipakita ang sunod na pangyayari."
  },
  {
    "id": "SC-COMP-001",
    "skill": "sentence_construction",
    "exerciseType": "create_sentence",
    "difficulty": "easy",
    "prompt": "Gumawa ng pangungusap gamit ang salitang masipag.",
    "targetConcepts": ["pang-uri", "pang-angkop"],
    "exampleAnswer": "Masipag na mag-aaral si Ana.",
    "subskill": "pang-uri"
  },
  {
    "id": "SC-COMP-002",
    "skill": "sentence_construction",
    "exerciseType": "create_sentence",
    "difficulty": "medium",
    "prompt": "Gumawa ng pangungusap na nagpapakita ng sanhi at bunga.",
    "targetConcepts": ["pang-ugnay", "lohikal_na_ugnayan"],
    "exampleAnswer": "Dahil sa kanyang pagsisikap, siya ay nagtagumpay.",
    "subskill": "ugnayan_ng_pangungusap"
  },
  {
    "id": "SC-COMP-003",
    "skill": "sentence_construction",
    "exerciseType": "create_sentence",
    "difficulty": "medium",
    "prompt": "Gumawa ng pangungusap gamit ang pandiwang nasa aspektong naganap.",
    "targetConcepts": ["aspekto_ng_pandiwa"],
    "exampleAnswer": "Natapos niya ang proyekto kahapon.",
    "subskill": "aspekto_ng_pandiwa"
  },
  {
    "id": "SC-COMP-004",
    "skill": "sentence_construction",
    "exerciseType": "create_sentence",
    "difficulty": "hard",
    "prompt": "Gumawa ng pangungusap na may dalawang sugnay at gumagamit ng wastong pang-ugnay.",
    "targetConcepts": ["sugnay", "pang-ugnay", "kaayusan"],
    "exampleAnswer": "Bagaman mahirap ang pagsusulit, nagsikap siyang tapusin ito.",
    "subskill": "kompleks_na_pangungusap"
  }
] as const;