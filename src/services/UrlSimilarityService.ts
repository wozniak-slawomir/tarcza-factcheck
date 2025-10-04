export class UrlSimilarityService {
  // Helper method to normalize URLs for comparison
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const normalized = `${urlObj.hostname.toLowerCase()}${urlObj.pathname.toLowerCase()}`.replace(/\/+$/, '');
      return normalized;
    } catch (error) {
      // Fallback to simple normalization if URL parsing fails
      return url.toLowerCase().replace(/\/+$/, '');
    }
  }

  // Levenshtein distance algorithm for string similarity
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1, // substitution
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1      // insertion
          );
        }
      }
    }

    return dp[m][n];
  }

  // Calculate similarity score between two URLs
  calculateUrlSimilarity(url1: string, url2: string): number {
    const normalized1 = this.normalizeUrl(url1);
    const normalized2 = this.normalizeUrl(url2);

    if (normalized1 === normalized2) {
      return 1.0;
    }

    const distance = this.calculateLevenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    const similarity = 1 - (distance / maxLength);

    return similarity;
  }
}