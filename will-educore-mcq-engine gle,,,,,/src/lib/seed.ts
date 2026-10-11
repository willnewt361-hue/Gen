import { db } from "@/db";
import {
  subjects,
  topics,
  questions,
  questionOptions,
} from "@/db/schema";
import { eq } from "drizzle-orm";

// ── Seed Data ──────────────────────────────────────────────────────────────

const SUBJECTS_DATA = [
  { name: "Biology", slug: "biology", icon: "🧬", color: "emerald" },
  { name: "Chemistry", slug: "chemistry", icon: "⚗️", color: "purple" },
  { name: "Physics", slug: "physics", icon: "⚡", color: "blue" },
  { name: "Mathematics", slug: "mathematics", icon: "📐", color: "indigo" },
  { name: "English", slug: "english", icon: "📖", color: "amber" },
];

const TOPICS_DATA: Record<string, { name: string; slug: string; classLevel: string }[]> = {
  biology: [
    { name: "Cell Biology", slug: "cell-biology", classLevel: "senior_1" },
    { name: "Genetics", slug: "genetics", classLevel: "senior_2" },
    { name: "Human Physiology", slug: "human-physiology", classLevel: "senior_3" },
    { name: "Ecology", slug: "ecology", classLevel: "senior_2" },
    { name: "Plant Biology", slug: "plant-biology", classLevel: "senior_1" },
    { name: "Evolution", slug: "evolution", classLevel: "senior_4" },
    { name: "Microbiology", slug: "microbiology", classLevel: "senior_3" },
    { name: "Reproduction", slug: "reproduction", classLevel: "senior_4" },
  ],
  chemistry: [
    { name: "Atomic Structure", slug: "atomic-structure", classLevel: "senior_1" },
    { name: "Chemical Bonding", slug: "chemical-bonding", classLevel: "senior_2" },
    { name: "Organic Chemistry", slug: "organic-chemistry", classLevel: "senior_4" },
    { name: "Stoichiometry", slug: "stoichiometry", classLevel: "senior_2" },
    { name: "Acids and Bases", slug: "acids-bases", classLevel: "senior_3" },
    { name: "Electrochemistry", slug: "electrochemistry", classLevel: "senior_4" },
    { name: "Thermodynamics", slug: "thermodynamics", classLevel: "senior_3" },
    { name: "Periodic Table", slug: "periodic-table", classLevel: "senior_1" },
  ],
  physics: [
    { name: "Mechanics", slug: "mechanics", classLevel: "senior_1" },
    { name: "Waves", slug: "waves", classLevel: "senior_2" },
    { name: "Electricity", slug: "electricity", classLevel: "senior_3" },
    { name: "Magnetism", slug: "magnetism", classLevel: "senior_3" },
    { name: "Thermal Physics", slug: "thermal-physics", classLevel: "senior_2" },
    { name: "Optics", slug: "optics", classLevel: "senior_4" },
    { name: "Nuclear Physics", slug: "nuclear-physics", classLevel: "senior_5" },
    { name: "Kinematics", slug: "kinematics", classLevel: "senior_1" },
  ],
  mathematics: [
    { name: "Algebra", slug: "algebra", classLevel: "senior_1" },
    { name: "Geometry", slug: "geometry", classLevel: "senior_2" },
    { name: "Trigonometry", slug: "trigonometry", classLevel: "senior_3" },
    { name: "Calculus", slug: "calculus", classLevel: "senior_5" },
    { name: "Statistics", slug: "statistics", classLevel: "senior_4" },
    { name: "Probability", slug: "probability", classLevel: "senior_3" },
    { name: "Vectors", slug: "vectors", classLevel: "senior_4" },
    { name: "Number Theory", slug: "number-theory", classLevel: "senior_2" },
  ],
  english: [
    { name: "Grammar", slug: "grammar", classLevel: "senior_1" },
    { name: "Comprehension", slug: "comprehension", classLevel: "senior_2" },
    { name: "Essay Writing", slug: "essay-writing", classLevel: "senior_3" },
    { name: "Literature", slug: "literature", classLevel: "senior_4" },
    { name: "Vocabulary", slug: "vocabulary", classLevel: "senior_1" },
    { name: "Summary Writing", slug: "summary-writing", classLevel: "senior_2" },
    { name: "Poetry", slug: "poetry", classLevel: "senior_4" },
    { name: "Oral Communication", slug: "oral-communication", classLevel: "senior_3" },
  ],
};

interface QuestionSeed {
  questionText: string;
  options: { key: string; text: string; isCorrect: boolean }[];
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  markValue: number;
}

const QUESTIONS_DATA: Record<string, Record<string, QuestionSeed[]>> = {
  biology: {
    "cell-biology": [
      {
        questionText: "Which organelle is known as the 'powerhouse of the cell'?",
        options: [
          { key: "A", text: "Nucleus", isCorrect: false },
          { key: "B", text: "Mitochondria", isCorrect: true },
          { key: "C", text: "Ribosome", isCorrect: false },
          { key: "D", text: "Golgi apparatus", isCorrect: false },
        ],
        explanation: "Mitochondria are called the powerhouse of the cell because they produce ATP through oxidative phosphorylation.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "What is the primary function of the cell membrane?",
        options: [
          { key: "A", text: "Protein synthesis", isCorrect: false },
          { key: "B", text: "Energy production", isCorrect: false },
          { key: "C", text: "Selective permeability and transport", isCorrect: true },
          { key: "D", text: "DNA replication", isCorrect: false },
        ],
        explanation: "The cell membrane acts as a selectively permeable barrier, controlling the movement of substances in and out of the cell.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "Which structure is found in plant cells but NOT in animal cells?",
        options: [
          { key: "A", text: "Cell wall", isCorrect: true },
          { key: "B", text: "Mitochondria", isCorrect: false },
          { key: "C", text: "Cell membrane", isCorrect: false },
          { key: "D", text: "Ribosomes", isCorrect: false },
        ],
        explanation: "Plant cells have a rigid cell wall made of cellulose that provides structural support. Animal cells lack this feature.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "During which phase of mitosis do chromosomes align at the cell equator?",
        options: [
          { key: "A", text: "Prophase", isCorrect: false },
          { key: "B", text: "Metaphase", isCorrect: true },
          { key: "C", text: "Anaphase", isCorrect: false },
          { key: "D", text: "Telophase", isCorrect: false },
        ],
        explanation: "During metaphase, chromosomes line up at the metaphase plate (cell equator) before being pulled apart in anaphase.",
        difficulty: "medium",
        markValue: 2,
      },
      {
        questionText: "What is the role of the rough endoplasmic reticulum?",
        options: [
          { key: "A", text: "Lipid synthesis", isCorrect: false },
          { key: "B", text: "Protein synthesis and modification", isCorrect: true },
          { key: "C", text: "Carbohydrate storage", isCorrect: false },
          { key: "D", text: "Waste disposal", isCorrect: false },
        ],
        explanation: "The rough ER has ribosomes attached to its surface, making it the site of protein synthesis and initial protein folding/modification.",
        difficulty: "medium",
        markValue: 2,
      },
      {
        questionText: "Which type of transport requires ATP to move substances against their concentration gradient?",
        options: [
          { key: "A", text: "Osmosis", isCorrect: false },
          { key: "B", text: "Diffusion", isCorrect: false },
          { key: "C", text: "Facilitated diffusion", isCorrect: false },
          { key: "D", text: "Active transport", isCorrect: true },
        ],
        explanation: "Active transport uses ATP to pump substances against their concentration gradient, unlike passive transport methods.",
        difficulty: "medium",
        markValue: 2,
      },
      {
        questionText: "If a cell has 24 chromosomes at the start of mitosis, how many chromosomes will each daughter cell have?",
        options: [
          { key: "A", text: "12", isCorrect: false },
          { key: "B", text: "24", isCorrect: true },
          { key: "C", text: "48", isCorrect: false },
          { key: "D", text: "6", isCorrect: false },
        ],
        explanation: "Mitosis produces genetically identical daughter cells with the same chromosome number as the parent cell. Each daughter cell gets 24 chromosomes.",
        difficulty: "hard",
        markValue: 3,
      },
      {
        questionText: "Which statement about the fluid mosaic model is correct?",
        options: [
          { key: "A", text: "The membrane is a rigid protein layer", isCorrect: false },
          { key: "B", text: "Phospholipids form a fixed bilayer with embedded proteins", isCorrect: false },
          { key: "C", text: "Proteins and lipids can move laterally within the membrane", isCorrect: true },
          { key: "D", text: "The membrane contains only phospholipids", isCorrect: false },
        ],
        explanation: "The fluid mosaic model describes the membrane as a fluid structure where phospholipids and proteins can move laterally, creating a mosaic pattern.",
        difficulty: "hard",
        markValue: 3,
      },
    ],
    genetics: [
      {
        questionText: "What is the genotype of an individual who is heterozygous for a trait?",
        options: [
          { key: "A", text: "AA", isCorrect: false },
          { key: "B", text: "Aa", isCorrect: true },
          { key: "C", text: "aa", isCorrect: false },
          { key: "D", text: "BB", isCorrect: false },
        ],
        explanation: "A heterozygous individual has two different alleles for a gene (Aa), one dominant and one recessive.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "In a cross between AA and aa, what percentage of offspring will be heterozygous?",
        options: [
          { key: "A", text: "0%", isCorrect: false },
          { key: "B", text: "25%", isCorrect: false },
          { key: "C", text: "50%", isCorrect: false },
          { key: "D", text: "100%", isCorrect: true },
        ],
        explanation: "Crossing AA × aa produces all Aa offspring (100% heterozygous), as each parent contributes one allele.",
        difficulty: "medium",
        markValue: 2,
      },
      {
        questionText: "Which process involves the exchange of genetic material between homologous chromosomes?",
        options: [
          { key: "A", text: "DNA replication", isCorrect: false },
          { key: "B", text: "Crossing over", isCorrect: true },
          { key: "C", text: "Independent assortment", isCorrect: false },
          { key: "D", text: "Mitosis", isCorrect: false },
        ],
        explanation: "Crossing over occurs during prophase I of meiosis, exchanging segments between homologous chromosomes to create genetic variation.",
        difficulty: "medium",
        markValue: 2,
      },
      {
        questionText: "A color-blind male (XcY) marries a carrier female (XCXc). What is the probability their son will be color-blind?",
        options: [
          { key: "A", text: "0%", isCorrect: false },
          { key: "B", text: "25%", isCorrect: false },
          { key: "C", text: "50%", isCorrect: true },
          { key: "D", text: "100%", isCorrect: false },
        ],
        explanation: "Sons inherit the Y chromosome from the father and one X from the mother. The mother is XCXc, so 50% chance of passing Xc (color-blind).",
        difficulty: "hard",
        markValue: 3,
      },
    ],
    "human-physiology": [
      {
        questionText: "Which blood type is considered the universal donor?",
        options: [
          { key: "A", text: "Type A", isCorrect: false },
          { key: "B", text: "Type B", isCorrect: false },
          { key: "C", text: "Type AB", isCorrect: false },
          { key: "D", text: "Type O", isCorrect: true },
        ],
        explanation: "Type O blood has no A or B antigens, making it safe for transfusion to any blood type — hence universal donor.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "Where does gas exchange occur in the human respiratory system?",
        options: [
          { key: "A", text: "Trachea", isCorrect: false },
          { key: "B", text: "Bronchi", isCorrect: false },
          { key: "C", text: "Alveoli", isCorrect: true },
          { key: "D", text: "Nasal cavity", isCorrect: false },
        ],
        explanation: "Gas exchange occurs in the alveoli, where thin walls allow oxygen to diffuse into the blood and CO2 to diffuse out.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "Which hormone lowers blood glucose levels?",
        options: [
          { key: "A", text: "Glucagon", isCorrect: false },
          { key: "B", text: "Adrenaline", isCorrect: false },
          { key: "C", text: "Insulin", isCorrect: true },
          { key: "D", text: "Cortisol", isCorrect: false },
        ],
        explanation: "Insulin, produced by beta cells in the pancreas, promotes glucose uptake by cells, lowering blood glucose levels.",
        difficulty: "medium",
        markValue: 2,
      },
    ],
  },
  chemistry: {
    "atomic-structure": [
      {
        questionText: "What is the atomic number of an element?",
        options: [
          { key: "A", text: "Number of neutrons", isCorrect: false },
          { key: "B", text: "Number of protons", isCorrect: true },
          { key: "C", text: "Number of protons plus neutrons", isCorrect: false },
          { key: "D", text: "Number of electrons in the outer shell", isCorrect: false },
        ],
        explanation: "The atomic number is the number of protons in the nucleus, which uniquely identifies the element.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "Which subatomic particle has no charge?",
        options: [
          { key: "A", text: "Proton", isCorrect: false },
          { key: "B", text: "Electron", isCorrect: false },
          { key: "C", text: "Neutron", isCorrect: true },
          { key: "D", text: "Positron", isCorrect: false },
        ],
        explanation: "Neutrons have no electric charge (they are neutral). Protons are positive and electrons are negative.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "An atom of ²³Na has how many electrons?",
        options: [
          { key: "A", text: "11", isCorrect: true },
          { key: "B", text: "12", isCorrect: false },
          { key: "C", text: "23", isCorrect: false },
          { key: "D", text: "34", isCorrect: false },
        ],
        explanation: "Sodium (Na) has atomic number 11, meaning 11 protons and, in a neutral atom, 11 electrons.",
        difficulty: "medium",
        markValue: 2,
      },
    ],
    "chemical-bonding": [
      {
        questionText: "What type of bond involves the sharing of electrons between two non-metals?",
        options: [
          { key: "A", text: "Ionic bond", isCorrect: false },
          { key: "B", text: "Covalent bond", isCorrect: true },
          { key: "C", text: "Metallic bond", isCorrect: false },
          { key: "D", text: "Hydrogen bond", isCorrect: false },
        ],
        explanation: "Covalent bonds form when two non-metals share electron pairs to achieve stable electron configurations.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "What is the shape of a methane (CH₄) molecule?",
        options: [
          { key: "A", text: "Linear", isCorrect: false },
          { key: "B", text: "Trigonal planar", isCorrect: false },
          { key: "C", text: "Tetrahedral", isCorrect: true },
          { key: "D", text: "Octahedral", isCorrect: false },
        ],
        explanation: "Methane has a tetrahedral shape with bond angles of 109.5° due to sp³ hybridization of the carbon atom.",
        difficulty: "hard",
        markValue: 3,
      },
    ],
    "organic-chemistry": [
      {
        questionText: "What is the general formula for alkanes?",
        options: [
          { key: "A", text: "CₙH₂ₙ", isCorrect: false },
          { key: "B", text: "CₙH₂ₙ₊₂", isCorrect: true },
          { key: "C", text: "CₙH₂ₙ₋₂", isCorrect: false },
          { key: "D", text: "CₙHₙ", isCorrect: false },
        ],
        explanation: "Alkanes are saturated hydrocarbons with the general formula CₙH₂ₙ₊₂, containing only single carbon-carbon bonds.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "Which functional group is present in alcohols?",
        options: [
          { key: "A", text: "-COOH", isCorrect: false },
          { key: "B", text: "-OH", isCorrect: true },
          { key: "C", text: "-CHO", isCorrect: false },
          { key: "D", text: "-NH₂", isCorrect: false },
        ],
        explanation: "Alcohols contain the hydroxyl functional group (-OH) bonded to a carbon atom.",
        difficulty: "easy",
        markValue: 1,
      },
    ],
  },
  physics: {
    mechanics: [
      {
        questionText: "What is the SI unit of force?",
        options: [
          { key: "A", text: "Joule", isCorrect: false },
          { key: "B", text: "Newton", isCorrect: true },
          { key: "C", text: "Watt", isCorrect: false },
          { key: "D", text: "Pascal", isCorrect: false },
        ],
        explanation: "The Newton (N) is the SI unit of force, defined as the force needed to accelerate 1 kg at 1 m/s².",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "A 5 kg object is accelerated at 3 m/s². What is the force applied?",
        options: [
          { key: "A", text: "8 N", isCorrect: false },
          { key: "B", text: "15 N", isCorrect: true },
          { key: "C", text: "2 N", isCorrect: false },
          { key: "D", text: "1.67 N", isCorrect: false },
        ],
        explanation: "Using F = ma: F = 5 kg × 3 m/s² = 15 N.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "Which law states that for every action there is an equal and opposite reaction?",
        options: [
          { key: "A", text: "Newton's First Law", isCorrect: false },
          { key: "B", text: "Newton's Second Law", isCorrect: false },
          { key: "C", text: "Newton's Third Law", isCorrect: true },
          { key: "D", text: "Law of Conservation of Energy", isCorrect: false },
        ],
        explanation: "Newton's Third Law states that for every action force, there is an equal and opposite reaction force.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "A car of mass 1000 kg moving at 20 m/s has what kinetic energy?",
        options: [
          { key: "A", text: "10,000 J", isCorrect: false },
          { key: "B", text: "20,000 J", isCorrect: false },
          { key: "C", text: "200,000 J", isCorrect: true },
          { key: "D", text: "400,000 J", isCorrect: false },
        ],
        explanation: "KE = ½mv² = ½ × 1000 × 20² = ½ × 1000 × 400 = 200,000 J.",
        difficulty: "medium",
        markValue: 2,
      },
    ],
    electricity: [
      {
        questionText: "What is Ohm's Law?",
        options: [
          { key: "A", text: "V = IR", isCorrect: true },
          { key: "B", text: "V = I/R", isCorrect: false },
          { key: "C", text: "V = I + R", isCorrect: false },
          { key: "D", text: "V = I × R²", isCorrect: false },
        ],
        explanation: "Ohm's Law states that voltage (V) equals current (I) multiplied by resistance (R): V = IR.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "Two resistors of 4Ω and 6Ω are connected in series. What is the total resistance?",
        options: [
          { key: "A", text: "2.4 Ω", isCorrect: false },
          { key: "B", text: "10 Ω", isCorrect: true },
          { key: "C", text: "24 Ω", isCorrect: false },
          { key: "D", text: "5 Ω", isCorrect: false },
        ],
        explanation: "In series, resistances add: R_total = 4 + 6 = 10 Ω.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "A circuit has a 12V battery and a 3Ω resistor. What current flows?",
        options: [
          { key: "A", text: "36 A", isCorrect: false },
          { key: "B", text: "4 A", isCorrect: true },
          { key: "C", text: "0.25 A", isCorrect: false },
          { key: "D", text: "15 A", isCorrect: false },
        ],
        explanation: "Using Ohm's Law: I = V/R = 12/3 = 4 A.",
        difficulty: "medium",
        markValue: 2,
      },
    ],
    waves: [
      {
        questionText: "What is the relationship between frequency (f), wavelength (λ), and wave speed (v)?",
        options: [
          { key: "A", text: "v = f + λ", isCorrect: false },
          { key: "B", text: "v = f × λ", isCorrect: true },
          { key: "C", text: "v = f / λ", isCorrect: false },
          { key: "D", text: "v = λ / f", isCorrect: false },
        ],
        explanation: "The wave equation is v = fλ, where v is wave speed, f is frequency, and λ is wavelength.",
        difficulty: "easy",
        markValue: 1,
      },
    ],
  },
  mathematics: {
    algebra: [
      {
        questionText: "Solve for x: 2x + 6 = 14",
        options: [
          { key: "A", text: "x = 4", isCorrect: true },
          { key: "B", text: "x = 10", isCorrect: false },
          { key: "C", text: "x = 3", isCorrect: false },
          { key: "D", text: "x = 8", isCorrect: false },
        ],
        explanation: "2x + 6 = 14 → 2x = 8 → x = 4.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "Factorize: x² - 9",
        options: [
          { key: "A", text: "(x - 3)²", isCorrect: false },
          { key: "B", text: "(x - 3)(x + 3)", isCorrect: true },
          { key: "C", text: "(x - 9)(x + 1)", isCorrect: false },
          { key: "D", text: "(x + 3)²", isCorrect: false },
        ],
        explanation: "x² - 9 is a difference of squares: a² - b² = (a-b)(a+b). So x² - 9 = (x-3)(x+3).",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "If f(x) = 3x² - 2x + 1, what is f(2)?",
        options: [
          { key: "A", text: "7", isCorrect: false },
          { key: "B", text: "9", isCorrect: true },
          { key: "C", text: "13", isCorrect: false },
          { key: "D", text: "11", isCorrect: false },
        ],
        explanation: "f(2) = 3(2)² - 2(2) + 1 = 3(4) - 4 + 1 = 12 - 4 + 1 = 9.",
        difficulty: "medium",
        markValue: 2,
      },
      {
        questionText: "Solve: x² - 5x + 6 = 0",
        options: [
          { key: "A", text: "x = 1 and x = 6", isCorrect: false },
          { key: "B", text: "x = -2 and x = -3", isCorrect: false },
          { key: "C", text: "x = 2 and x = 3", isCorrect: true },
          { key: "D", text: "x = -1 and x = -6", isCorrect: false },
        ],
        explanation: "Factoring: x² - 5x + 6 = (x-2)(x-3) = 0, so x = 2 or x = 3.",
        difficulty: "medium",
        markValue: 2,
      },
    ],
    geometry: [
      {
        questionText: "What is the area of a circle with radius 7 cm? (Use π ≈ 22/7)",
        options: [
          { key: "A", text: "44 cm²", isCorrect: false },
          { key: "B", text: "154 cm²", isCorrect: true },
          { key: "C", text: "22 cm²", isCorrect: false },
          { key: "D", text: "308 cm²", isCorrect: false },
        ],
        explanation: "A = πr² = (22/7) × 7² = (22/7) × 49 = 22 × 7 = 154 cm².",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "In a right-angled triangle with legs 3 and 4, what is the hypotenuse?",
        options: [
          { key: "A", text: "5", isCorrect: true },
          { key: "B", text: "7", isCorrect: false },
          { key: "C", text: "6", isCorrect: false },
          { key: "D", text: "25", isCorrect: false },
        ],
        explanation: "By Pythagoras' theorem: c² = 3² + 4² = 9 + 16 = 25, so c = 5.",
        difficulty: "easy",
        markValue: 1,
      },
    ],
    trigonometry: [
      {
        questionText: "What is sin 30°?",
        options: [
          { key: "A", text: "1", isCorrect: false },
          { key: "B", text: "½", isCorrect: true },
          { key: "C", text: "√3/2", isCorrect: false },
          { key: "D", text: "0", isCorrect: false },
        ],
        explanation: "sin 30° = ½ is a standard trigonometric value.",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "What is the value of tan 45°?",
        options: [
          { key: "A", text: "0", isCorrect: false },
          { key: "B", text: "1", isCorrect: true },
          { key: "C", text: "√2", isCorrect: false },
          { key: "D", text: "½", isCorrect: false },
        ],
        explanation: "tan 45° = 1, since sin 45° = cos 45° = √2/2.",
        difficulty: "easy",
        markValue: 1,
      },
    ],
  },
  english: {
    grammar: [
      {
        questionText: "Which of the following sentences is grammatically correct?",
        options: [
          { key: "A", text: "She don't like coffee.", isCorrect: false },
          { key: "B", text: "She doesn't likes coffee.", isCorrect: false },
          { key: "C", text: "She doesn't like coffee.", isCorrect: true },
          { key: "D", text: "She not like coffee.", isCorrect: false },
        ],
        explanation: "With a singular subject, we use 'doesn't' + base form of the verb: 'She doesn't like coffee.'",
        difficulty: "easy",
        markValue: 1,
      },
      {
        questionText: "Identify the correct passive voice of: 'The teacher gave the students homework.'",
        options: [
          { key: "A", text: "Homework was given to the students by the teacher.", isCorrect: true },
          { key: "B", text: "Homework is given to the students by the teacher.", isCorrect: false },
          { key: "C", text: "The students was given homework by the teacher.", isCorrect: false },
          { key: "D", text: "Homework were given to the students by the teacher.", isCorrect: false },
        ],
        explanation: "The passive of 'gave' (past simple) is 'was given'. The object 'homework' becomes the subject: 'Homework was given to the students by the teacher.'",
        difficulty: "medium",
        markValue: 2,
      },
    ],
    vocabulary: [
      {
        questionText: "What does the word 'ubiquitous' mean?",
        options: [
          { key: "A", text: "Rare and unusual", isCorrect: false },
          { key: "B", text: "Present everywhere", isCorrect: true },
          { key: "C", text: "Very small", isCorrect: false },
          { key: "D", text: "Extremely fast", isCorrect: false },
        ],
        explanation: "Ubiquitous means present, appearing, or found everywhere.",
        difficulty: "medium",
        markValue: 1,
      },
      {
        questionText: "Which word is a synonym for 'benevolent'?",
        options: [
          { key: "A", text: "Hostile", isCorrect: false },
          { key: "B", text: "Kind", isCorrect: true },
          { key: "C", text: "Confused", isCorrect: false },
          { key: "D", text: "Wealthy", isCorrect: false },
        ],
        explanation: "Benevolent means well-meaning and kindly. A synonym is 'kind'.",
        difficulty: "easy",
        markValue: 1,
      },
    ],
    comprehension: [
      {
        questionText: "In the phrase 'the wind howled through the trees', which literary device is used?",
        options: [
          { key: "A", text: "Simile", isCorrect: false },
          { key: "B", text: "Personification", isCorrect: true },
          { key: "C", text: "Alliteration", isCorrect: false },
          { key: "D", text: "Hyperbole", isCorrect: false },
        ],
        explanation: "Personification gives human qualities (howling) to something non-human (the wind).",
        difficulty: "easy",
        markValue: 1,
      },
    ],
  },
};

export async function seedDatabase() {
  console.log("🌱 Seeding database...");

  // Check if subjects already exist
  const existingSubjects = await db.select().from(subjects);
  if (existingSubjects.length > 0) {
    console.log("⏭️  Database already seeded, skipping...");
    return;
  }

  // Insert subjects
  const subjectMap = new Map<string, string>(); // slug -> id
  for (const s of SUBJECTS_DATA) {
    const [inserted] = await db
      .insert(subjects)
      .values({ name: s.name, slug: s.slug, icon: s.icon, color: s.color })
      .returning();
    subjectMap.set(s.slug, inserted.id);
    console.log(`  ✓ Subject: ${s.name}`);
  }

  // Insert topics
  const topicMap = new Map<string, string>(); // slug -> id
  for (const [subjectSlug, topicList] of Object.entries(TOPICS_DATA)) {
    const subjectId = subjectMap.get(subjectSlug)!;
    for (const t of topicList) {
      const [inserted] = await db
        .insert(topics)
        .values({
          subjectId,
          name: t.name,
          slug: t.slug,
          classLevel: t.classLevel as any,
        })
        .returning();
      topicMap.set(`${subjectSlug}:${t.slug}`, inserted.id);
      console.log(`  ✓ Topic: ${t.name} (${subjectSlug})`);
    }
  }

  // Insert questions
  let questionCount = 0;
  for (const [subjectSlug, topicQuestions] of Object.entries(QUESTIONS_DATA)) {
    for (const [topicSlug, qList] of Object.entries(topicQuestions)) {
      const topicId = topicMap.get(`${subjectSlug}:${topicSlug}`);
      if (!topicId) {
        console.log(`  ⚠️  No topic found for ${subjectSlug}:${topicSlug}, skipping`);
        continue;
      }

      for (const q of qList) {
        const [insertedQuestion] = await db
          .insert(questions)
          .values({
            topicId,
            difficulty: q.difficulty as any,
            questionText: q.questionText,
            markValue: q.markValue,
            explanation: q.explanation,
            isActive: true,
            isDemo: true,
          })
          .returning();

        for (const opt of q.options) {
          await db.insert(questionOptions).values({
            questionId: insertedQuestion.id,
            optionKey: opt.key,
            optionText: opt.text,
            isCorrect: opt.isCorrect,
            displayOrder: opt.key.charCodeAt(0) - 65, // A=0, B=1, C=2, D=3
          });
        }
        questionCount++;
      }
    }
  }

  console.log(`  ✓ Inserted ${questionCount} demo questions`);
  console.log("✅ Seeding complete!");
}
