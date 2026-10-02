"use client";

import React, {
  useMemo,
  useRef,
  useState,
} from "react";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  mode: "Remote" | "Hybrid" | "On-site";
  tags: string[];
  description: string;
};

type MatchResult = {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  actionPlan: string[];
  categoryScores: {
    category: string;
    score: number;
  }[];
};

type Recommendation = Job & {
  score: number;
  matchedSkills: string[];
};

const jobs: Job[] = [
  {
    id: "job-1",
    title: "Software Engineering Intern",
    company: "Northstar Labs",
    location: "Bengaluru",
    mode: "On-site",
    tags: ["React", "Node.js", "TypeScript", "SQL", "LLMs", "Git"],
    description:
      "We are looking for a Software Engineering Intern to build AI-powered product experiences. Work across React, TypeScript, Node.js and REST APIs. You will work with SQL and Git and get opportunities to integrate LLMs, embeddings and semantic search into production prototypes.",
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
      "Join our platform team to build Node.js and Express backend services. You will design PostgreSQL schemas, create REST APIs, improve reliability, work with Docker and collaborate using Git.",
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
      "Build machine learning features using Python. Work with embeddings, semantic search, vector databases and APIs. You will help turn ML experiments into practical product prototypes.",
  },
  {
    id: "job-4",
    title: "Frontend Engineering Intern",
    company: "PixelGrid",
    location: "Remote",
    mode: "Remote",
    tags: ["React", "TypeScript", "Next.js", "Git", "Testing"],
    description:
      "Build modern product interfaces using React, TypeScript and Next.js. Work closely with product and backend teams, create reusable components and improve user experience.",
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
      "Help ship end-to-end product features across a React frontend and Node.js backend. Build REST APIs, work with SQL and third-party services and collaborate through Git.",
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
      "Support AI product development with Python and SQL. Work on evaluation workflows, test LLM outputs and turn model insights into useful product features.",
  },
];

const aliases: Record<string, string[]> = {
  React: ["react", "react.js", "reactjs"],
  "Node.js": ["node.js", "nodejs", "node"],
  Express: ["express", "express.js", "expressjs"],
  TypeScript: ["typescript"],
  JavaScript: ["javascript", "ecmascript"],
  Python: ["python"],
  "C++": ["c++", "cpp"],
  SQL: ["sql"],
  PostgreSQL: ["postgresql", "postgres"],
  MongoDB: ["mongodb", "mongo"],
  "REST APIs": ["rest api", "rest apis", "restful api"],
  APIs: ["api", "apis"],
  Docker: ["docker"],
  Git: ["git"],
  "Machine Learning": ["machine learning", "ml"],
  LLMs: ["llm", "llms", "large language model"],
  Embeddings: ["embedding", "embeddings"],
  "Vector Databases": [
    "vector database",
    "vector databases",
    "vector db",
  ],
  "Vector Search": ["vector search", "semantic search"],
  "Next.js": ["next.js", "nextjs"],
  Testing: ["testing", "unit testing", "jest", "vitest"],
};

const demoProfile = `BTech CSE student with experience in C++, Python, JavaScript and SQL.
Built web applications using React, Node.js and Express.js.
Comfortable with REST APIs and Git/GitHub.
Currently learning Machine Learning and exploring LLMs and embeddings.`;

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(text: string, phrase: string) {
  const pattern = new RegExp(
    `(^|[^a-z0-9+#])${escapeRegex(
      phrase.toLowerCase()
    )}([^a-z0-9+#]|$)`,
    "i"
  );

  return pattern.test(normalize(text));
}

export default function Home() {
  const [profile, setProfile] =
    useState(demoProfile);

  const [selectedJobId, setSelectedJobId] =
    useState("job-1");

  const [search, setSearch] = useState("");

  const [mode, setMode] =
    useState<"All" | "Remote" | "Hybrid" | "On-site">(
      "All"
    );

  React.useEffect(() => {
  try {
    const savedJobs =
      localStorage.getItem(
        "jobmatch_saved_jobs"
      );

    const history =
      localStorage.getItem(
        "jobmatch_history"
      );

    if (savedJobs) {
      const parsed = JSON.parse(savedJobs);

      if (Array.isArray(parsed)) {
        setSaved(parsed);
      }
    }

    if (history) {
      const parsed = JSON.parse(history);

      if (Array.isArray(parsed)) {
        setMatchHistory(parsed);
      }
    }

    setProfileLoaded(true);
  } catch {
    setProfileLoaded(true);
  }
}, []);

  const [saved, setSaved] = useState<string[]>([]);

  const [result, setResult] =
    useState<MatchResult | null>(null);

  const [recommendations, setRecommendations] =
  useState<Recommendation[]>([]);

const [recommendationLoading, setRecommendationLoading] =
  useState(false);

const [recommendationError, setRecommendationError] =
  useState("");

  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);

const [uploadError, setUploadError] =
  useState("");

const [resumeFileName, setResumeFileName] =
  useState("");

const fileInputRef =
  useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");

  const [matchHistory, setMatchHistory] =
  useState<
    {
      jobId: string;
      title: string;
      company: string;
      score: number;
      date: string;
    }[]
  >([]);

const [profileLoaded, setProfileLoaded] =
  useState(false);

  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) ??
    jobs[0];

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const text = `${job.title} ${job.company} ${job.location} ${job.tags.join(
        " "
      )}`.toLowerCase();

      const matchesSearch =
        !search.trim() ||
        text.includes(search.toLowerCase());

      const matchesMode =
        mode === "All" || job.mode === mode;

      return matchesSearch && matchesMode;
    });
  }, [search, mode]);

  const quickFit = (job: Job) => {
    if (!profile.trim()) return 0;

    const matched = job.tags.filter((skill) =>
      (aliases[skill] ?? [skill]).some((alias) =>
        containsPhrase(profile, alias)
      )
    );

    return Math.round(
      (matched.length / job.tags.length) * 100
    );
  };

  const detectedProfileSkills =
  Object.keys(aliases).filter((skill) =>
    (aliases[skill] ?? [skill]).some(
      (alias) =>
        containsPhrase(profile, alias)
    )
  );

const profileCompleteness =
  Math.min(
    100,
    Math.round(
      (detectedProfileSkills.length /
        10) *
        100
    )
  );

  const uploadResume = async (
  file: File | undefined
) => {
  if (!file) return;

  setUploading(true);
  setUploadError("");

  try {
    if (file.type !== "application/pdf") {
      throw new Error(
        "Please upload a PDF resume."
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        "Resume must be smaller than 5 MB."
      );
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      "/api/resume/parse",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to process resume."
      );
    }

    setProfile(data.text);
    setResumeFileName(data.filename);

    // Previous match is no longer valid.
    setResult(null);
  } catch (error) {
    setUploadError(
      error instanceof Error
        ? error.message
        : "Unable to process resume."
    );
  } finally {
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
};

const getRecommendations = async () => {
  if (!profile.trim()) {
    setRecommendationError(
      "Add your profile before generating recommendations."
    );

    return;
  }

  setRecommendationLoading(true);
  setRecommendationError("");

  try {
    const response = await fetch(
      "/api/recommendations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to generate recommendations."
      );
    }

    setRecommendations(
      data.recommendations
        .slice(0, 3)
    );
  } catch (error) {
    setRecommendationError(
      error instanceof Error
        ? error.message
        : "Unable to generate recommendations."
    );
  } finally {
    setRecommendationLoading(false);
  }
};

  const analyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          jobDescription:
            selectedJob.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to analyze match."
        );
      }

      setResult(data);

      const historyItem = {
  jobId: selectedJob.id,
  title: selectedJob.title,
  company: selectedJob.company,
  score: data.score,
  date: new Date().toLocaleDateString(
    "en-IN"
  ),
};

setMatchHistory((current) => {
  const filtered = current.filter(
    (item) =>
      item.jobId !== selectedJob.id
  );

  const next = [
    historyItem,
    ...filtered,
  ].slice(0, 6);

  localStorage.setItem(
    "jobmatch_history",
    JSON.stringify(next)
  );

  return next;
});

      setTimeout(() => {
        document
          .getElementById("report")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const chooseJob = (job: Job) => {
    setSelectedJobId(job.id);
    setResult(null);

    setTimeout(() => {
      document
        .getElementById("workspace")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 50);
  };

  const toggleSaved = (id: string) => {
  setSaved((current) => {
    const next = current.includes(id)
      ? current.filter(
          (item) => item !== id
        )
      : [...current, id];

    localStorage.setItem(
      "jobmatch_saved_jobs",
      JSON.stringify(next)
    );

    return next;
  });
};

  return (
    <main className="page">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-logo">✦</div>

          <div>
            <div className="brand-name">
              JobMatch<span>AI</span>
            </div>

            <div className="brand-subtitle">
              Explainable career matching
            </div>
          </div>
        </div>

        <div className="nav-links">
          <a href="#explore">Explore jobs</a>
          <a href="#workspace">Match</a>
          <a href="#how">How it works</a>
        </div>

        <a
          className="github-link"
          href="https://github.com"
          target="_blank"
        >
          GitHub ↗
        </a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            ✦ AI-ASSISTED JOB DISCOVERY
          </div>

          <h1>
            Stop guessing
            <br />
            if a role fits.
            <br />
            <span>See the match.</span>
          </h1>

          <p className="hero-description">
            Compare your skills with real job
            requirements, understand why the match
            changes, and turn missing skills into
            your next action.
          </p>

          <div className="hero-actions">
            <a
              href="#explore"
              className="primary-button"
            >
              Explore opportunities →
            </a>

            <a
              href="#workspace"
              className="secondary-button"
            >
              Analyze a role
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <strong>Skills</strong>
              <span>signals</span>
            </div>

            <div>
              <strong>Reasons</strong>
              <span>not black-box</span>
            </div>

            <div>
              <strong>Next steps</strong>
              <span>actionable</span>
            </div>
          </div>
        </div>

        {/* HERO PREVIEW */}
        <div className="hero-preview">
          <div className="preview-top">
            <span>LIVE MATCH PREVIEW</span>
            <span className="live-dot">
              ● live
            </span>
          </div>

          <div className="preview-score-row">
            <div>
              <span className="preview-score">
                82
              </span>
              <span className="preview-percent">
                %
              </span>
            </div>

            <div className="preview-label">
              Strong alignment
              <small>
                Engineering Intern
              </small>
            </div>
          </div>

          <div className="big-progress">
            <i />
          </div>

          <div className="preview-skill">
            <span>React</span>
            <b>✓ strong</b>
          </div>

          <div className="preview-skill">
            <span>Node.js</span>
            <b>✓ strong</b>
          </div>

          <div className="preview-skill">
            <span>TypeScript</span>
            <em>gap</em>
          </div>

          <div className="preview-skill">
            <span>Vector Databases</span>
            <em>gap</em>
          </div>

          <div className="preview-footer">
            <span>Why this score?</span>
            <span>→</span>
          </div>
        </div>
      </section>

<section
  className="section recommendations"
  id="recommendations"
>
  <div className="section-header">
    <div>
      <div className="section-number">
        01 / RECOMMENDED FOR YOU
      </div>

      <h2>
        Roles closest to your profile.
      </h2>

      <p>
        Let JobMatch AI compare your profile
        against available opportunities and rank
        the strongest matches.
      </p>
    </div>
  </div>

  <div className="recommendation-intro">
    <div>
      <span className="recommendation-icon">
        ✦
      </span>

      <div>
        <strong>
          Personalised job discovery
        </strong>

        <p>
          Your recommendations are based on
          skills detected in your current profile.
        </p>
      </div>
    </div>

    <button
      className="secondary-button"
      onClick={getRecommendations}
      disabled={recommendationLoading}
    >
      {recommendationLoading
        ? "Finding matches..."
        : "Find my best matches →"}
    </button>
  </div>

  {recommendationError && (
    <div className="error">
      ⚠ {recommendationError}
    </div>
  )}

  {recommendationLoading && (
    <div className="recommendation-loading">
      Analyzing your profile against available
      opportunities...
    </div>
  )}

  {!recommendationLoading &&
    recommendations.length > 0 && (
      <div className="recommendations-grid">
        {recommendations.map((job) => (
          <article
            className="recommendation-card"
            key={job.id}
          >
            <div className="recommendation-top">
              <div className="recommendation-company-logo">
                {job.company
                  .split(" ")
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join("")}
              </div>

              <span className="recommendation-score">
                {job.score}% match
              </span>
            </div>

            <h3>{job.title}</h3>

            <div className="recommendation-company">
              {job.company}
            </div>

            <div className="recommendation-location">
              {job.location} · {job.mode}
            </div>

            <p className="recommendation-match-text">
              {job.matchedSkills.length > 0
                ? `Strongest overlap: ${job.matchedSkills
                    .slice(0, 3)
                    .join(", ")}.`
                : "No direct skill overlap detected yet."}
            </p>

            <div className="recommendation-skills">
              {job.tags
                .slice(0, 5)
                .map((tag) => (
                  <span key={tag}>
                    {tag}
                  </span>
                ))}
            </div>

            <div className="recommendation-footer">
              <span>
                Ranked from your profile
              </span>

              <button
                onClick={() => {
                  const selected =
                    jobs.find(
                      (item) =>
                        item.id === job.id
                    );

                  if (selected) {
                    chooseJob(selected);
                  }
                }}
              >
                Analyze fit →
              </button>
            </div>
          </article>
        ))}
      </div>
    )}
</section>

<section className="section dashboard">
  <div className="section-header">
    <div>
      <div className="section-number">
        01.5 / YOUR SIGNAL
      </div>

      <h2>
        Understand your career signal.
      </h2>

      <p>
        A quick view of how much useful
        information JobMatch AI can currently
        extract from your profile.
      </p>
    </div>
  </div>

  <div className="dashboard-grid">
    <div className="profile-card">
      <div className="dashboard-top">
        <div>
          <span>PROFILE COMPLETENESS</span>
          <strong>
            {profileCompleteness}%
          </strong>
        </div>

        <div className="dashboard-icon">
          ✦
        </div>
      </div>

      <div className="dashboard-progress">
        <i
          style={{
            width: `${profileCompleteness}%`,
          }}
        />
      </div>

      <p>
        {profileCompleteness >= 80
          ? "Your profile contains strong technical signals."
          : profileCompleteness >= 50
          ? "Add more projects and technical skills to strengthen your signal."
          : "Add more technical experience to improve recommendations."}
      </p>
    </div>

    <div className="stat-card">
      <span>SAVED JOBS</span>
      <strong>{saved.length}</strong>
      <small>
        Opportunities you're keeping an eye on
      </small>
    </div>

    <div className="stat-card">
      <span>JOBS ANALYZED</span>
      <strong>{matchHistory.length}</strong>
      <small>
        Recent match analyses
      </small>
    </div>

    <div className="stat-card">
      <span>STRONG MATCHES</span>
      <strong>
        {
          matchHistory.filter(
            (item) => item.score >= 75
          ).length
        }
      </strong>
      <small>
        Matches above 75%
      </small>
    </div>
  </div>

  {matchHistory.length > 0 && (
    <div className="history-card">
      <div className="history-title">
        <div>
          <span className="section-number">
            RECENT MATCH HISTORY
          </span>

          <h3>
            Roles you've already explored.
          </h3>
        </div>
      </div>

      <div className="history-list">
        {matchHistory.map((item) => (
          <div
            className="history-row"
            key={item.jobId}
          >
            <div>
              <strong>
                {item.title}
              </strong>

              <span>
                {item.company} ·{" "}
                {item.date}
              </span>
            </div>

            <strong
              className={
                item.score >= 75
                  ? "history-good"
                  : "history-normal"
              }
            >
              {item.score}%
            </strong>
          </div>
        ))}
      </div>
    </div>
  )}
</section>

      {/* EXPLORE JOBS */}
      <section
        className="section"
        id="explore"
      >
        <div className="section-header">
          <div>
            <div className="section-number">
              01 / EXPLORE OPPORTUNITIES
            </div>

            <h2>
              Find a role worth measuring.
            </h2>

            <p>
              Start with opportunities and discover
              which ones are closest to your current
              skill set.
            </p>
          </div>

          <div className="job-count">
            <strong>{filteredJobs.length}</strong>
            <span>roles shown</span>
          </div>
        </div>

        <div className="toolbar">
          <div className="search">
            <span>⌕</span>

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search roles, companies or skills..."
            />
          </div>

          <div className="mode-filter">
            {[
              "All",
              "Remote",
              "Hybrid",
              "On-site",
            ].map((item) => (
              <button
                key={item}
                className={
                  mode === item ? "active" : ""
                }
                onClick={() =>
                  setMode(
                    item as
                      | "All"
                      | "Remote"
                      | "Hybrid"
                      | "On-site"
                  )
                }
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="job-grid">
          {filteredJobs.map((job) => {
            const fit = quickFit(job);

            const isSaved =
              saved.includes(job.id);

            return (
              <article
                className="job-card"
                key={job.id}
              >
                <div className="job-card-top">
                  <div className="company-logo">
                    {job.company
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")}
                  </div>

                  <button
                    className={`save ${
                      isSaved ? "saved" : ""
                    }`}
                    onClick={() =>
                      toggleSaved(job.id)
                    }
                  >
                    {isSaved ? "★" : "☆"}
                  </button>
                </div>

                <div className="job-type">
                  {job.mode.toUpperCase()}
                </div>

                <h3>{job.title}</h3>

                <div className="company">
                  {job.company}
                </div>

                <div className="location">
                  ◉ {job.location}
                </div>

                <div className="tags">
                  {job.tags
                    .slice(0, 5)
                    .map((tag) => (
                      <span key={tag}>
                        {tag}
                      </span>
                    ))}
                </div>

                <div className="job-bottom">
                  <div className="quick-fit">
                    <strong>{fit}%</strong>

                    <div>
                      <span>
                        Quick skill fit
                      </span>

                      <small>
                        Based on your profile
                      </small>
                    </div>
                  </div>

                  <button
                    className="analyze-link"
                    onClick={() =>
                      chooseJob(job)
                    }
                  >
                    Analyze fit →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* WORKSPACE */}
      <section
        className="section"
        id="workspace"
      >
        <div className="section-header">
          <div>
            <div className="section-number">
              02 / BUILD YOUR MATCH
            </div>

            <h2>
              Give the matcher a signal.
            </h2>

            <p>
              Use your current profile and compare
              it against any selected opportunity.
            </p>
          </div>
        </div>

        <div className="selected-role">
          <div>
            <span>SELECTED ROLE</span>

            <strong>
              {selectedJob.title}
            </strong>

            <small>
              {selectedJob.company} ·{" "}
              {selectedJob.location} ·{" "}
              {selectedJob.mode}
            </small>
          </div>

          <div className="selected-tags">
            {selectedJob.tags
              .slice(0, 4)
              .map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
          </div>
        </div>

        <div className="workspace-grid">
          <div className="editor-card">
            <div className="editor-header">
              <div>
                <div className="editor-icon">
                  CV
                </div>
              </div>

              <div>
                <h3>Your profile</h3>
                <p>
                  Resume, skills or LinkedIn
                  summary
                </p>
              </div>
            </div>

            <textarea
              value={profile}
              onChange={(e) =>
                setProfile(e.target.value)
              }
              placeholder="Paste your profile here..."
            />

            <div className="upload-area">
  <input
    ref={fileInputRef}
    type="file"
    accept=".pdf,application/pdf"
    hidden
    onChange={(event) =>
      uploadResume(
        event.target.files?.[0]
      )
    }
  />

  <button
    className="upload-button"
    onClick={() =>
      fileInputRef.current?.click()
    }
    disabled={uploading}
  >
    <span className="upload-icon">
      ↑
    </span>

    {uploading
      ? "Reading resume..."
      : "Upload PDF resume"}
  </button>

  <span className="upload-meta">
    PDF · max 5 MB
  </span>
</div>

<div className="editor-footer">
  <span>
    {resumeFileName
      ? `✓ ${resumeFileName}`
      : `${profile
          .trim()
          .split(/\s+/)
          .filter(Boolean).length} words detected`}
  </span>

  <button
    onClick={() =>
      setProfile(demoProfile)
    }
  >
    Use demo profile
  </button>
</div>

{uploadError && (
  <div className="upload-error">
    ⚠ {uploadError}
  </div>
)}

            <div className="editor-footer">
              <span>
                {profile
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length}{" "}
                words detected
              </span>

              <button
                onClick={() =>
                  setProfile(demoProfile)
                }
              >
                Use demo profile
              </button>
            </div>
          </div>

          <div className="editor-card role-editor">
            <div className="editor-header">
              <div>
                <div className="editor-icon role">
                  JOB
                </div>
              </div>

              <div>
                <h3>Target opportunity</h3>
                <p>
                  Requirements from the selected
                  role
                </p>
              </div>
            </div>

            <div className="role-description">
              {selectedJob.description}
            </div>

            <div className="role-requirements">
              {selectedJob.tags.map((tag) => (
                <span key={tag}>✓ {tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="analyze-bar">
          <div>
            <span className="engine-dot" />
            <strong>Hybrid matcher</strong>
            <small>
              Skills + text similarity
            </small>
          </div>

          <button
            className="primary-button large"
            onClick={analyze}
            disabled={loading}
          >
            {loading
              ? "Analyzing..."
              : "Analyze my match →"}
          </button>
        </div>

        {error && (
          <div className="error">
            ⚠ {error}
          </div>
        )}
      </section>

      {/* REPORT */}
      {result && (
        <section
          className="section"
          id="report"
        >
          <div className="section-header">
            <div>
              <div className="section-number">
                03 / MATCH REPORT
              </div>

              <h2>
                Your fit at a glance.
              </h2>
            </div>

          <div className="method">
            ● Hybrid matcher
          </div>
          </div>

          <div className="report-top">
            <div className="score-card">
              <div
                className="score-circle"
                style={{
                  background: `conic-gradient(var(--accent) ${result.score * 3.6}deg, #e8e8ef 0deg)`,
                }}
              >
                <div className="score-inner">
                  <strong>
                    {result.score}
                  </strong>
                  <span>%</span>
                </div>
              </div>

              <h3>
                {result.score >= 80
                  ? "Strong alignment"
                  : result.score >= 60
                  ? "Promising alignment"
                  : "Room to improve"}
              </h3>

              <p>
                Based on detected role signals
                and your current profile.
              </p>
            </div>

            <div className="why-card">
              <div className="card-title">
                <span>✦</span>
                Why this score?
              </div>

              <div className="reasons">
                {result.reasons.map(
                  (reason) => (
                    <div
                      className="reason"
                      key={reason}
                    >
                      <span>✓</span>
                      <p>{reason}</p>
                    </div>
                  )
                )}
              </div>

              <div className="category-list">
                {result.categoryScores.map(
                  (item) => (
                    <div
                      className="category"
                      key={item.category}
                    >
                      <div>
                        <span>
                          {item.category}
                        </span>
                        <strong>
                          {item.score}%
                        </strong>
                      </div>

                      <div className="category-bar">
                        <i
                          style={{
                            width: `${item.score}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="skills-report">
            <div>
              <h3>
                <span className="green-dot" />
                Matched skills
              </h3>

              <div className="chips">
                {result.matchedSkills.map(
                  (skill) => (
                    <span
                      className="chip matched"
                      key={skill}
                    >
                      ✓ {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            <div>
              <h3>
                <span className="yellow-dot" />
                Skill gaps
              </h3>

              <div className="chips">
                {result.missingSkills.length >
                0 ? (
                  result.missingSkills.map(
                    (skill) => (
                      <span
                        className="chip missing"
                        key={skill}
                      >
                        ⚠ {skill}
                      </span>
                    )
                  )
                ) : (
                  <span className="empty">
                    No major detected gaps.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="action-card">
            <div>
              <div className="section-number">
                NEXT MOVES
              </div>

              <h3>
                Close the highest-value gaps.
              </h3>
            </div>

            <div className="actions">
              {result.actionPlan.map(
                (action, index) => (
                  <div
                    className="action-item"
                    key={action}
                  >
                    <span>
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <p>{action}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section
        className="section how"
        id="how"
      >
        <div className="section-number">
          04 / HOW IT WORKS
        </div>

        <h2>
          A match score is useful only when
          you can <span>act on it.</span>
        </h2>

        <div className="how-grid">
          <div className="how-card">
            <div className="how-number">
              01
            </div>

            <h3>
              Discover opportunities
            </h3>

            <p>
              Search roles based on company,
              location, work mode and skills.
            </p>
          </div>

          <div className="how-card">
            <div className="how-number">
              02
            </div>

            <h3>
              Understand your fit
            </h3>

            <p>
              See exactly which skills matched
              and which requirements are missing.
            </p>
          </div>

          <div className="how-card">
            <div className="how-number">
              03
            </div>

            <h3>
              Improve your profile
            </h3>

            <p>
              Turn skill gaps into small projects,
              learning goals and better applications.
            </p>
          </div>
        </div>
      </section>

      <footer>
        <span>
          JobMatch AI — Full-stack career matching
          prototype
        </span>

        <span>
          Built with Next.js · TypeScript
        </span>
      </footer>
    </main>
  );
}