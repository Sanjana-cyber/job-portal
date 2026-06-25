/**
 * roleSkillsMap.js
 *
 * Maps common job role titles (lowercase, normalized) to a list of
 * expected/required skills for ATS scoring.
 *
 * Used when a job seeker types a role name (e.g. "Full Stack Developer")
 * instead of pasting a full job description.
 */

const ROLE_SKILLS_MAP = {
  // ── Full Stack ─────────────────────────────────────────────────────────
  "full stack developer": [
    "react", "node", "mongodb", "express", "html", "css", "javascript",
    "typescript", "rest api", "git", "sql", "docker", "redux", "tailwind",
    "jwt", "authentication", "api", "database", "frontend", "backend",
  ],
  "full stack web developer": [
    "react", "node", "mongodb", "express", "html", "css", "javascript",
    "typescript", "rest api", "git", "sql", "docker", "redux", "tailwind",
    "jwt", "authentication", "api", "database", "frontend", "backend",
  ],
  "mern stack developer": [
    "mongodb", "express", "react", "node", "javascript", "rest api",
    "html", "css", "git", "jwt", "redux", "mongoose", "api",
    "authentication", "deployment",
  ],
  "mean stack developer": [
    "mongodb", "express", "angular", "node", "javascript", "typescript",
    "rest api", "html", "css", "git", "rxjs", "jwt", "api",
  ],

  // ── Frontend ───────────────────────────────────────────────────────────
  "frontend developer": [
    "html", "css", "javascript", "react", "typescript", "redux", "git",
    "responsive design", "tailwind", "bootstrap", "webpack", "figma",
    "accessibility", "sass", "vite", "api integration",
  ],
  "frontend engineer": [
    "html", "css", "javascript", "react", "typescript", "redux", "git",
    "responsive design", "tailwind", "bootstrap", "webpack", "figma",
    "accessibility", "sass", "vite",
  ],
  "react developer": [
    "react", "javascript", "typescript", "redux", "hooks", "html", "css",
    "rest api", "git", "jest", "tailwind", "vite", "context api",
    "component design", "state management",
  ],
  "react.js developer": [
    "react", "javascript", "typescript", "redux", "hooks", "html", "css",
    "rest api", "git", "jest", "tailwind",
  ],
  "vue developer": [
    "vue", "javascript", "typescript", "vuex", "html", "css", "nuxt",
    "rest api", "git", "webpack",
  ],
  "angular developer": [
    "angular", "typescript", "javascript", "rxjs", "html", "css", "git",
    "rest api", "ngrx", "webpack", "sass",
  ],

  // ── Backend ────────────────────────────────────────────────────────────
  "backend developer": [
    "node", "express", "python", "java", "rest api", "sql", "mongodb",
    "postgresql", "git", "docker", "api design", "authentication",
    "microservices", "redis", "database",
  ],
  "backend engineer": [
    "node", "express", "python", "java", "rest api", "sql", "mongodb",
    "postgresql", "git", "docker", "api design", "authentication",
    "microservices", "redis",
  ],
  "node.js developer": [
    "node", "express", "javascript", "typescript", "mongodb", "rest api",
    "sql", "git", "jwt", "authentication", "docker", "api", "redis",
    "mongoose", "microservices",
  ],
  "nodejs developer": [
    "node", "express", "javascript", "typescript", "mongodb", "rest api",
    "sql", "git", "jwt", "authentication", "docker",
  ],

  // ── Python ─────────────────────────────────────────────────────────────
  "python developer": [
    "python", "django", "flask", "rest api", "sql", "postgresql", "git",
    "docker", "pandas", "numpy", "celery", "redis", "api", "linux",
    "scripting",
  ],
  "django developer": [
    "python", "django", "rest api", "sql", "postgresql", "git", "docker",
    "celery", "redis", "html", "css",
  ],

  // ── Data / ML / AI ─────────────────────────────────────────────────────
  "data scientist": [
    "python", "machine learning", "pandas", "numpy", "scikit-learn",
    "tensorflow", "sql", "data visualization", "statistics", "matplotlib",
    "jupyter", "deep learning", "nlp", "git", "r",
  ],
  "machine learning engineer": [
    "python", "machine learning", "tensorflow", "pytorch", "deep learning",
    "scikit-learn", "pandas", "numpy", "sql", "mlops", "docker",
    "nlp", "computer vision", "git", "statistics",
  ],
  "ai engineer": [
    "python", "machine learning", "deep learning", "llm", "pytorch",
    "tensorflow", "nlp", "api", "docker", "git", "openai", "langchain",
    "vector database", "prompt engineering",
  ],
  "data analyst": [
    "sql", "python", "excel", "power bi", "tableau", "data visualization",
    "pandas", "statistics", "r", "git", "reporting", "dashboard",
  ],

  // ── DevOps / Cloud ─────────────────────────────────────────────────────
  "devops engineer": [
    "docker", "kubernetes", "aws", "ci/cd", "jenkins", "terraform",
    "linux", "git", "ansible", "monitoring", "bash", "nginx",
    "github actions", "azure", "gcp",
  ],
  "cloud engineer": [
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd",
    "linux", "git", "networking", "iam", "s3", "ec2", "serverless",
  ],
  "site reliability engineer": [
    "kubernetes", "docker", "aws", "monitoring", "prometheus", "grafana",
    "linux", "bash", "terraform", "ci/cd", "git", "incident management",
  ],

  // ── Mobile ─────────────────────────────────────────────────────────────
  "android developer": [
    "android", "kotlin", "java", "xml", "jetpack", "rest api", "git",
    "sqlite", "mvvm", "retrofit", "firebase", "material design",
  ],
  "ios developer": [
    "swift", "objective-c", "xcode", "uikit", "swiftui", "rest api",
    "git", "core data", "mvvm", "firebase", "cocoapods",
  ],
  "react native developer": [
    "react native", "javascript", "typescript", "react", "mobile",
    "android", "ios", "rest api", "git", "expo", "redux", "firebase",
  ],
  "flutter developer": [
    "flutter", "dart", "mobile", "android", "ios", "rest api", "git",
    "firebase", "state management", "bloc", "provider",
  ],

  // ── Java / .NET ────────────────────────────────────────────────────────
  "java developer": [
    "java", "spring boot", "spring", "hibernate", "sql", "rest api",
    "maven", "git", "docker", "microservices", "junit", "postgresql",
    "kafka", "redis",
  ],
  "spring boot developer": [
    "java", "spring boot", "spring", "hibernate", "sql", "rest api",
    "maven", "git", "docker", "microservices", "junit",
  ],
  ".net developer": [
    "c#", ".net", "asp.net", "sql", "rest api", "git", "entity framework",
    "azure", "mvc", "microservices", "docker",
  ],

  // ── Design ─────────────────────────────────────────────────────────────
  "ui ux designer": [
    "figma", "adobe xd", "sketch", "wireframing", "prototyping",
    "user research", "usability testing", "design systems", "html", "css",
    "responsive design", "accessibility",
  ],
  "ui/ux designer": [
    "figma", "adobe xd", "sketch", "wireframing", "prototyping",
    "user research", "usability testing", "design systems", "html", "css",
  ],

  // ── Software Engineering (generic) ────────────────────────────────────
  "software developer": [
    "javascript", "python", "java", "git", "sql", "rest api", "docker",
    "data structures", "algorithms", "problem solving", "api", "linux",
  ],
  "software engineer": [
    "javascript", "python", "java", "c++", "git", "sql", "rest api",
    "docker", "data structures", "algorithms", "system design", "linux",
    "microservices",
  ],

  // ── Common Aliases / Casual Inputs ────────────────────────────────────
  "web developer": [
    "html", "css", "javascript", "react", "node", "git", "rest api",
    "typescript", "responsive design", "bootstrap", "tailwind", "sql",
    "mongodb", "express", "api",
  ],
  "data science": [
    "python", "machine learning", "pandas", "numpy", "scikit-learn",
    "tensorflow", "sql", "data visualization", "statistics", "matplotlib",
    "jupyter", "deep learning", "nlp", "git", "r",
  ],
  "fullstack developer": [
    "react", "node", "mongodb", "express", "html", "css", "javascript",
    "typescript", "rest api", "git", "sql", "docker", "redux", "tailwind",
    "jwt", "authentication", "api", "database", "frontend", "backend",
  ],
  "full stack": [
    "react", "node", "mongodb", "express", "html", "css", "javascript",
    "typescript", "rest api", "git", "sql", "docker", "redux",
    "jwt", "authentication", "api", "database",
  ],
  "front end developer": [
    "html", "css", "javascript", "react", "typescript", "redux", "git",
    "responsive design", "tailwind", "bootstrap", "webpack", "figma",
  ],
  "back end developer": [
    "node", "express", "python", "java", "rest api", "sql", "mongodb",
    "postgresql", "git", "docker", "api design", "authentication",
  ],
};

/**
 * Normalize a role title for map lookup:
 * - lowercase
 * - strip common filler phrases users type casually
 * - strip seniority keywords
 * - collapse whitespace
 */
function normalizeRole(title) {
  return title
    .toLowerCase()
    .trim()
    // Strip casual filler phrases
    .replace(/\b(i\s+)?(want\s+to|wanna|looking\s+for|looking\s+to|apply\s+for|applying\s+for|apply\s+to|search\s+for|searching\s+for|find\s+a|find\s+me|get\s+a|get\s+me|become\s+a|become\s+an|hire\s+me\s+as|job\s+for|job\s+of|job\s+as|role\s+of|role\s+as|role\s+in|position\s+of|position\s+as|position\s+in|career\s+as|career\s+in)\s*/gi, "")
    // Strip articles and filler words
    .replace(/\b(a|an|the|in|as|for|to|is|am|i|my|me|please|help|check|tell|show|see|give)\b/g, "")
    // Strip seniority levels
    .replace(/\b(senior|junior|sr|jr|lead|associate|principal|mid|entry\s+level|fresher|intern|trainee)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Given a job role title, return the expected skill list.
 * Returns null if the role is not found in the map.
 *
 * Matching priority:
 *   1. Exact match after normalization
 *   2. Input contains a known role key (e.g. "full stack developer" inside "I want full stack developer job")
 *   3. A known role key contains the input (e.g. input is "react" matches "react developer")
 *
 * @param {string} roleTitle - e.g. "Full Stack Web Developer" or "I want to apply for data science role"
 * @returns {string[] | null}
 */
function getSkillsForRole(roleTitle) {
  const normalized = normalizeRole(roleTitle);

  if (!normalized || normalized.length < 2) return null;

  // 1. Exact match
  if (ROLE_SKILLS_MAP[normalized]) return ROLE_SKILLS_MAP[normalized];

  // 2. Input contains a known role key (longest match first for precision)
  const sortedKeys = Object.keys(ROLE_SKILLS_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      return ROLE_SKILLS_MAP[key];
    }
  }

  // 3. A known role key contains the normalized input
  for (const key of sortedKeys) {
    if (key.includes(normalized)) {
      return ROLE_SKILLS_MAP[key];
    }
  }

  return null;
}

/**
 * Detect whether a given string looks like a short job role title
 * rather than a full job description.
 *
 * Heuristics:
 *  - Short (< 120 characters)
 *  - Very few words (< 15 words — allows casual sentences like "I want to apply for X")
 *  - Contains at least one role-like keyword
 *
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeRoleTitle(text) {
  const trimmed = text.trim();
  if (trimmed.length > 150) return false;
  const words = trimmed.split(/\s+/);
  if (words.length > 15) return false;

  // Must contain at least one role-like keyword
  const roleKeywords = [
    "developer", "engineer", "designer", "analyst", "scientist",
    "architect", "lead", "manager", "admin", "specialist", "consultant",
    "programmer", "coder", "devops", "full stack", "fullstack",
    "frontend", "front end", "backend", "back end",
    "mobile", "android", "ios", "data", "cloud", "machine learning", "ai",
    "web developer", "software", "python", "java", "react", "node",
    "mern", "mean", "django", "flask", "spring", "flutter", "dart",
  ];
  const lower = trimmed.toLowerCase();
  return roleKeywords.some((kw) => lower.includes(kw));
}

module.exports = { getSkillsForRole, looksLikeRoleTitle, normalizeRole };
