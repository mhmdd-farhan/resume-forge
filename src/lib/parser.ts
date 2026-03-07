interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  topics?: string[];
}

export interface GitHubProfile {
  name: string | null;
  bio: string | null;
  repos: {
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
    topics: string[];
  }[];
  languages: string[];
  topProjects: {
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
  }[];
}

export async function parseGitHubProfile(
  url: string
): Promise<GitHubProfile | null> {
  try {
    const username = url
      .replace(/\/$/, "")
      .split("/")
      .pop();
    if (!username) return null;

    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 3600 },
      }),
      fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=stars&direction=desc`,
        {
          headers: { Accept: "application/vnd.github.v3+json" },
          next: { revalidate: 3600 },
        }
      ),
    ]);

    if (!userRes.ok || !reposRes.ok) return null;

    const user = await userRes.json();
    const repos: GitHubRepo[] = await reposRes.json();

    const ownRepos = repos.filter((r) => !r.fork);
    const languages = Array.from(
      new Set(ownRepos.map((r) => r.language).filter(Boolean))
    ) as string[];

    const topProjects = ownRepos.slice(0, 6).map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
    }));

    return {
      name: user.name,
      bio: user.bio,
      repos: ownRepos.map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        topics: r.topics || [],
      })),
      languages,
      topProjects,
    };
  } catch {
    return null;
  }
}

export interface GitHubRepoDetail {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  topics: string[];
  readme: string | null;
}

export async function parseGitHubRepo(
  url: string
): Promise<GitHubRepoDetail | null> {
  try {
    // Extract owner/repo from URLs like https://github.com/owner/repo
    const cleaned = url.replace(/\/$/, "").replace(/\.git$/, "");
    const parts = cleaned.split("/");
    const repo = parts.pop();
    const owner = parts.pop();
    if (!owner || !repo) return null;

    const headers = { Accept: "application/vnd.github.v3+json" };

    const [repoRes, readmeRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers,
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: { ...headers, Accept: "application/vnd.github.v3.raw" },
        next: { revalidate: 3600 },
      }),
    ]);

    if (!repoRes.ok) return null;

    const repoData = await repoRes.json();

    let readme: string | null = null;
    if (readmeRes.ok) {
      const fullReadme = await readmeRes.text();
      // Truncate to first 2000 chars to keep prompt size reasonable
      readme = fullReadme.slice(0, 2000);
    }

    return {
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      topics: repoData.topics || [],
      readme,
    };
  } catch {
    return null;
  }
}

export async function parseGitHubRepos(
  urls: string[]
): Promise<GitHubRepoDetail[]> {
  const results = await Promise.all(urls.map(parseGitHubRepo));
  return results.filter((r): r is GitHubRepoDetail => r !== null);
}

export interface LinkedInProfile {
  url: string | null;
  pastedText: string | null;
}

export function parseLinkedInProfile(
  url?: string,
  pastedText?: string
): LinkedInProfile | null {
  if (!url && !pastedText) return null;

  return {
    url: url || null,
    pastedText: pastedText || null,
  };
}
