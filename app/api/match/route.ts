import { NextResponse } from "next/server";

type Skill = {
  name: string;
  aliases: string[];
  category: string;
};

const skills: Skill[] = [
  {
    name: "React",
    aliases: ["react", "react.js", "reactjs"],
    category: "Frontend",
  },
  {
    name: "Next.js",
    aliases: ["next.js", "nextjs"],
    category: "Frontend",
  },
  {
    name: "TypeScript",
    aliases: ["typescript"],
    category: "Languages",
  },
  {
    name: "JavaScript",
    aliases: ["javascript", "ecmascript"],
    category: "Languages",
  },
  {
    name: "Python",
    aliases: ["python"],
    category: "Languages",
  },
  {
    name: "C++",
    aliases: ["c++", "cpp"],
    category: "Languages",
  },
  {
    name: "Node.js",
    aliases: ["node.js", "nodejs", "node"],
    category: "Backend",
  },
  {
    name: "Express",
    aliases: ["express", "express.js", "expressjs"],
    category: "Backend",
  },
  {
    name: "REST APIs",
    aliases: [
      "rest api",
      "rest apis",
      "restful api",
    ],
    category: "Backend",
  },
  {
    name: "SQL",
    aliases: ["sql"],
    category: "Data",
  },
  {
    name: "PostgreSQL",
    aliases: ["postgresql", "postgres"],
    category: "Data",
  },
  {
    name: "MongoDB",
    aliases: ["mongodb", "mongo"],
    category: "Data",
  },
  {
    name: "Docker",
    aliases: ["docker"],
    category: "Tools",
  },
  {
    name: "Git",
    aliases: ["git", "github"],
    category: "Tools",
  },
  {
    name: "Machine Learning",
    aliases: ["machine learning"],
    category: "AI",
  },
  {
    name: "LLMs",
    aliases: [
      "llm",
      "llms",
      "large language model",
      "large language models",
    ],
    category: "AI",
  },
  {
    name: "Embeddings",
    aliases: ["embedding", "embeddings"],
    category: "AI",
  },
  {
    name: "Vector Databases",
    aliases: [
      "vector database",
      "vector databases",
      "vector db",
    ],
    category: "AI",
  },
  {
    name: "Testing",
    aliases: [
      "testing",
      "unit testing",
      "jest",
      "vitest",
    ],
    category: "Engineering",
  },
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "using",
  "we",
  "will",
  "with",
  "you",
  "your",
]);

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function containsPhrase(
  text: string,
  phrase: string
) {
  const pattern = new RegExp(
    `(^|[^a-z0-9+#])${escapeRegex(
      phrase.toLowerCase()
    )}([^a-z0-9+#]|$)`,
    "i"
  );

  return pattern.test(normalize(text));
}

function detectSkills(text: string) {
  return skills
    .filter((skill) =>
      skill.aliases.some((alias) =>
        containsPhrase(text, alias)
      )
    )
    .map((skill) => skill.name);
}

/* -----------------------------
   TEXT SIMILARITY
----------------------------- */

function tokenize(text: string): string[] {
  return normalize(text)
    .replace(/[^a-z0-9+#.]/g, " ")
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 1 &&
        !STOP_WORDS.has(token)
    );
}

function termFrequency(tokens: string[]) {
  const counts = new Map<string, number>();

  for (const token of tokens) {
    counts.set(
      token,
      (counts.get(token) ?? 0) + 1
    );
  }

  const total = tokens.length || 1;

  const tf = new Map<string, number>();

  for (const [token, count] of counts) {
    tf.set(token, count / total);
  }

  return tf;
}

function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
) {
  const vocabulary = new Set([
    ...a.keys(),
    ...b.keys(),
  ]);

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const word of vocabulary) {
    const valueA = a.get(word) ?? 0;
    const valueB = b.get(word) ?? 0;

    dot += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }

  if (
    magnitudeA === 0 ||
    magnitudeB === 0
  ) {
    return 0;
  }

  return (
    dot /
    (Math.sqrt(magnitudeA) *
      Math.sqrt(magnitudeB))
  );
}

function textSimilarity(
  profile: string,
  jobDescription: string
) {
  const profileTokens = tokenize(profile);
  const jobTokens = tokenize(jobDescription);

  const profileTF =
    termFrequency(profileTokens);

  const jobTF =
    termFrequency(jobTokens);

  return cosineSimilarity(
    profileTF,
    jobTF
  );
}

/* -----------------------------
   CATEGORY SCORE
----------------------------- */

function calculateCategoryScores(
  jobSkills: string[],
  profileSkills: string[]
) {
  const categories = [
    "Languages",
    "Frontend",
    "Backend",
    "Data",
    "AI",
    "Tools",
    "Engineering",
  ];

  return categories
    .map((category) => {
      const roleSkills =
        jobSkills.filter((skill) => {
          const found = skills.find(
            (item) => item.name === skill
          );

          return found?.category === category;
        });

      if (roleSkills.length === 0) {
        return null;
      }

      const matched =
        roleSkills.filter((skill) =>
          profileSkills.includes(skill)
        );

      return {
        category,
        score: Math.round(
          (matched.length /
            roleSkills.length) *
            100
        ),
      };
    })
    .filter(Boolean) as {
    category: string;
    score: number;
  }[];
}

/* -----------------------------
   MAIN MATCH API
----------------------------- */

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const profile =
      typeof body.profile === "string"
        ? body.profile
        : "";

    const jobDescription =
      typeof body.jobDescription ===
      "string"
        ? body.jobDescription
        : "";

    if (
      !profile.trim() ||
      !jobDescription.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Profile and job description are required.",
        },
        { status: 400 }
      );
    }

    /* Detect skills */

    const profileSkills =
      [...new Set(detectSkills(profile))];

    const jobSkills =
      [...new Set(
        detectSkills(jobDescription)
      )];

    const matchedSkills =
      jobSkills.filter((skill) =>
        profileSkills.includes(skill)
      );

    const missingSkills =
      jobSkills.filter(
        (skill) =>
          !profileSkills.includes(skill)
      );

    /* Exact skill coverage */

    const skillCoverage =
      jobSkills.length === 0
        ? 0
        : (matchedSkills.length /
            jobSkills.length) *
          100;

    /* Text similarity */

    const similarity =
      textSimilarity(
        profile,
        jobDescription
      );

    const textSimilarityScore =
      similarity * 100;

    /*
      Hybrid score

      65% explicit skills
      35% textual similarity
    */

    const score = Math.round(
      skillCoverage * 0.65 +
        textSimilarityScore * 0.35
    );

    const categoryScores =
      calculateCategoryScores(
        jobSkills,
        profileSkills
      );

    /* -----------------------------
       EXPLANATIONS
    ----------------------------- */

    const reasons: string[] = [];

    if (matchedSkills.length > 0) {
      reasons.push(
        `Strong overlap in ${matchedSkills
          .slice(0, 4)
          .join(", ")}${
          matchedSkills.length > 4
            ? " and more."
            : "."
        }`
      );
    }

    if (missingSkills.length > 0) {
      reasons.push(
        `${
          missingSkills.length
        } job-relevant skill${
          missingSkills.length === 1
            ? ""
            : "s"
        } were detected in the role but not in your profile.`
      );
    }

    if (textSimilarityScore >= 40) {
      reasons.push(
        "Your profile language shows useful overlap with the responsibilities and requirements of this role."
      );
    } else if (
      textSimilarityScore >= 20
    ) {
      reasons.push(
        "Some of your experience overlaps with the role, although the wording and requirements differ in several areas."
      );
    } else {
      reasons.push(
        "The profile and role have limited textual overlap beyond the detected skills."
      );
    }

    if (score >= 80) {
      reasons.push(
        "Your profile covers most of the signals detected for this opportunity."
      );
    } else if (score >= 60) {
      reasons.push(
        "You have a useful foundation, with a few gaps worth closing."
      );
    } else {
      reasons.push(
        "There is a meaningful gap between the current profile and this role."
      );
    }

    /* -----------------------------
       ACTION PLAN
    ----------------------------- */

    const actionPlan =
      missingSkills.length > 0
        ? missingSkills
            .slice(0, 3)
            .map(
              (skill) =>
                `Build one small, demonstrable feature using ${skill}.`
            )
        : [
            "Add measurable project outcomes to strengthen your profile.",
          ];

    return NextResponse.json({
      score,

      // Useful for the future UI.
      skillCoverage: Math.round(
        skillCoverage
      ),

      textSimilarity: Math.round(
        textSimilarityScore
      ),

      matchedSkills,

      missingSkills,

      reasons,

      actionPlan,

      categoryScores,
    });
  } catch (error) {
    console.error(
      "MATCH API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to analyze this match.",
      },
      { status: 500 }
    );
  }
}