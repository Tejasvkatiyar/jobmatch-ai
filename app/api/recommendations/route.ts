import { NextResponse } from "next/server";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  mode: string;
  tags: string[];
  description: string;
};

const jobs: Job[] = [
  {
    id: "job-1",
    title: "Software Engineering Intern",
    company: "Northstar Labs",
    location: "Bengaluru",
    mode: "On-site",
    tags: [
      "React",
      "Node.js",
      "TypeScript",
      "SQL",
      "LLMs",
      "Git",
    ],
    description:
      "Build AI-powered products using React, TypeScript, Node.js, REST APIs, SQL, Git and LLM integrations.",
  },
  {
    id: "job-2",
    title: "Backend Engineering Intern",
    company: "Orbit Systems",
    location: "Pune",
    mode: "Hybrid",
    tags: [
      "Node.js",
      "Express",
      "PostgreSQL",
      "REST APIs",
      "Docker",
      "Git",
    ],
    description:
      "Build backend services using Node.js, Express, PostgreSQL, REST APIs and Docker.",
  },
  {
    id: "job-3",
    title: "Machine Learning Intern",
    company: "VectorForge",
    location: "Remote",
    mode: "Remote",
    tags: [
      "Python",
      "Machine Learning",
      "Embeddings",
      "Vector Databases",
      "APIs",
    ],
    description:
      "Build ML product features using Python, embeddings, vector databases and APIs.",
  },
  {
    id: "job-4",
    title: "Frontend Engineering Intern",
    company: "PixelGrid",
    location: "Remote",
    mode: "Remote",
    tags: [
      "React",
      "TypeScript",
      "Next.js",
      "Git",
      "Testing",
    ],
    description:
      "Build modern interfaces using React, TypeScript, Next.js and reusable components.",
  },
  {
    id: "job-5",
    title: "Full Stack Product Intern",
    company: "Launchpad Tech",
    location: "Mumbai",
    mode: "Hybrid",
    tags: [
      "React",
      "Node.js",
      "Express",
      "SQL",
      "REST APIs",
      "Git",
    ],
    description:
      "Ship full-stack product features using React, Node.js, Express, SQL and REST APIs.",
  },
  {
    id: "job-6",
    title: "AI Product Intern",
    company: "SignalWorks",
    location: "Delhi",
    mode: "On-site",
    tags: [
      "Python",
      "LLMs",
      "Machine Learning",
      "SQL",
      "Testing",
    ],
    description:
      "Work on AI product evaluation using Python, SQL, machine learning and LLM testing.",
  },
];

const aliases: Record<string, string[]> = {
  React: ["react", "react.js", "reactjs"],
  "Node.js": ["node.js", "nodejs", "node"],
  Express: ["express", "express.js", "expressjs"],
  TypeScript: ["typescript"],
  JavaScript: ["javascript"],
  Python: ["python"],
  "C++": ["c++", "cpp"],
  SQL: ["sql"],
  PostgreSQL: ["postgresql", "postgres"],
  "REST APIs": [
    "rest api",
    "rest apis",
    "restful api",
  ],
  APIs: ["api", "apis"],
  Docker: ["docker"],
  Git: ["git", "github"],
  "Machine Learning": [
    "machine learning",
  ],
  LLMs: [
    "llm",
    "llms",
    "large language model",
  ],
  Embeddings: ["embedding", "embeddings"],
  "Vector Databases": [
    "vector database",
    "vector databases",
    "vector db",
  ],
  "Next.js": ["next.js", "nextjs"],
  Testing: [
    "testing",
    "unit testing",
    "jest",
    "vitest",
  ],
};

function normalize(text: string) {
  return text.toLowerCase();
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
  const regex = new RegExp(
    `(^|[^a-z0-9+#])${escapeRegex(
      phrase.toLowerCase()
    )}([^a-z0-9+#]|$)`,
    "i"
  );

  return regex.test(normalize(text));
}

function detectSkills(text: string) {
  return Object.entries(aliases)
    .filter(([, values]) =>
      values.some((alias) =>
        containsPhrase(text, alias)
      )
    )
    .map(([skill]) => skill);
}

function calculateFit(
  profile: string,
  job: Job
) {
  const profileSkills =
    detectSkills(profile);

  const matched = job.tags.filter((skill) =>
    profileSkills.includes(skill)
  );

  const skillScore =
    job.tags.length === 0
      ? 0
      : (matched.length /
          job.tags.length) *
        100;

  const profileWords = new Set(
    normalize(profile)
      .split(/\W+/)
      .filter(Boolean)
  );

  const jobWords = new Set(
    normalize(job.description)
      .split(/\W+/)
      .filter(Boolean)
  );

  let overlap = 0;

  for (const word of jobWords) {
    if (profileWords.has(word)) {
      overlap++;
    }
  }

  const textScore =
    jobWords.size === 0
      ? 0
      : (overlap / jobWords.size) * 100;

  const finalScore = Math.round(
    skillScore * 0.8 +
      textScore * 0.2
  );

  return {
    score: Math.min(
      100,
      Math.max(0, finalScore)
    ),
    matchedSkills: matched,
  };
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const profile =
      typeof body.profile === "string"
        ? body.profile
        : "";

    if (!profile.trim()) {
      return NextResponse.json(
        {
          error:
            "Profile is required.",
        },
        { status: 400 }
      );
    }

    const recommendations =
      jobs
        .map((job) => {
          const result =
            calculateFit(profile, job);

          return {
            ...job,
            score: result.score,
            matchedSkills:
              result.matchedSkills,
          };
        })
        .sort(
          (a, b) =>
            b.score - a.score
        );

    return NextResponse.json({
      recommendations,
    });
  } catch (error) {
    console.error(
      "RECOMMENDATIONS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to generate recommendations.",
      },
      { status: 500 }
    );
  }
}