package com.mockinterview.service.coding;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * A bank of three Java coding problems (Easy / Medium / Hard), each with:
 *  - A problem description shown in the UI
 *  - A starter code template pre-loaded into the Monaco editor
 *  - A TestHarness class that calls the candidate's Solution and compares stdout
 *  - Visible + hidden test cases
 */
@Component
public class CodingProblemBank {

    // ─────────────────────────────────────────────────────────────────────────
    // Domain records
    // ─────────────────────────────────────────────────────────────────────────

    public record TestCase(String name, String expectedOutput, boolean hidden) {}

    public record CodingProblem(
        String id,
        String title,
        String description,
        String difficulty,
        String starterCode,
        String testHarnessCode,   // complete Java class with main() that calls Solution.*
        List<TestCase> testCases  // in the same order as TestHarness.main() println calls
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Problem definitions
    // ─────────────────────────────────────────────────────────────────────────

    private static final CodingProblem EASY = new CodingProblem(
        "easy_first_nonrepeating",
        "First Non-Repeating Character",
        """
## Problem: First Non-Repeating Character

Given a string `s` containing only lowercase English letters, find and return \
the **first character that does not repeat** anywhere in the string.

Return `'-'` if no such character exists.

### Examples
| Input | Output | Reason |
|-------|--------|--------|
| `"aabcc"` | `'b'` | `a` repeats, `b` appears once |
| `"abcd"` | `'a'` | `a` is first, all are unique |
| `"aabb"` | `'-'` | every character repeats |
| `""` | `'-'` | empty string |

### Constraints
- `0 ≤ s.length ≤ 100 000`
- `s` consists of lowercase English letters only
- **Expected time complexity:** O(n)  |  **Space:** O(1) — at most 26 distinct chars
""",
        "EASY",
        """
import java.util.*;

public class Solution {

    /**
     * Returns the first non-repeating character in s,
     * or '-' if every character repeats.
     *
     * Hint: Consider using a LinkedHashMap to preserve insertion order.
     */
    public static char firstNonRepeating(String s) {
        // TODO: implement your solution here
        return '-';
    }

    // You can modify this main method to manually test your logic.
    public static void main(String[] args) {
        System.out.println(firstNonRepeating("aabcc")); // Expected: b
        System.out.println(firstNonRepeating("abcd"));  // Expected: a
        System.out.println(firstNonRepeating("aabb"));  // Expected: -
    }
}
""",
        """
public class TestHarness {
    public static void main(String[] args) {
        // TC1: basic - b is first non-repeating
        System.out.println(Solution.firstNonRepeating("aabcc"));
        // TC2: all unique - first char
        System.out.println(Solution.firstNonRepeating("abcd"));
        // TC3: all repeat - return '-'
        System.out.println(Solution.firstNonRepeating("aabb"));
        // TC4: empty string
        System.out.println(Solution.firstNonRepeating(""));
        // TC5: single char
        System.out.println(Solution.firstNonRepeating("z"));
        // TC6 [hidden]: last char is non-repeating
        System.out.println(Solution.firstNonRepeating("aabbc"));
        // TC7 [hidden]: longer string
        System.out.println(Solution.firstNonRepeating("abcabc"));
    }
}
""",
        List.of(
            new TestCase("Basic (aabcc → b)",      "b", false),
            new TestCase("All unique (abcd → a)",  "a", false),
            new TestCase("All repeated (aabb → -)", "-", false),
            new TestCase("Empty string → -",        "-", false),
            new TestCase("Single char (z → z)",    "z", false),
            new TestCase("Hidden: end char",        "c", true),
            new TestCase("Hidden: all repeat",      "-", true)
        )
    );

    private static final CodingProblem MEDIUM = new CodingProblem(
        "medium_two_sum",
        "Two Sum",
        """
## Problem: Two Sum

Given an integer array `nums` and an integer `target`, return the **indices** \
of the two numbers such that they add up to `target`.

You may assume that each input has **exactly one solution**, and you may not \
use the same element twice. Return `"-1 -1"` if no solution exists.

Print the two indices separated by a space on one line (smaller index first).

### Examples
| Input | Target | Output |
|-------|--------|--------|
| `[2, 7, 11, 15]` | `9` | `0 1` |
| `[3, 2, 4]` | `6` | `1 2` |
| `[3, 3]` | `6` | `0 1` |
| `[1, 2, 3]` | `10` | `-1 -1` |

### Constraints
- `2 ≤ nums.length ≤ 10 000`
- `-10^9 ≤ nums[i] ≤ 10^9`
- **Expected time complexity:** O(n)  |  **Space:** O(n)
""",
        "MEDIUM",
        """
import java.util.*;

public class Solution {

    /**
     * Returns the two indices [i, j] such that nums[i] + nums[j] == target.
     * Returns {-1, -1} if no such pair exists.
     *
     * Hint: Use a HashMap to store each number and its index.
     */
    public static int[] twoSum(int[] nums, int target) {
        // TODO: implement your solution here
        return new int[]{-1, -1};
    }

    // You can modify this main method to manually test your logic.
    public static void main(String[] args) {
        int[] r = twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println(r[0] + " " + r[1]); // Expected: 0 1
    }
}
""",
        """
public class TestHarness {
    static String solve(int[] nums, int target) {
        int[] r = Solution.twoSum(nums, target);
        // normalise: always smaller index first
        if (r[0] > r[1]) { int t = r[0]; r[0] = r[1]; r[1] = t; }
        return r[0] + " " + r[1];
    }
    public static void main(String[] args) {
        // TC1
        System.out.println(solve(new int[]{2, 7, 11, 15}, 9));
        // TC2
        System.out.println(solve(new int[]{3, 2, 4}, 6));
        // TC3: duplicate values
        System.out.println(solve(new int[]{3, 3}, 6));
        // TC4: no solution
        System.out.println(solve(new int[]{1, 2, 3}, 10));
        // TC5 [hidden]: negative numbers
        System.out.println(solve(new int[]{-3, 4, 3, 90}, 0));
        // TC6 [hidden]: single pair
        System.out.println(solve(new int[]{5, 5}, 10));
        // TC7 [hidden]: larger input
        System.out.println(solve(new int[]{0, 4, 3, 0}, 0));
    }
}
""",
        List.of(
            new TestCase("Basic [2,7,11,15], target=9",      "0 1", false),
            new TestCase("[3,2,4], target=6",                 "1 2", false),
            new TestCase("Duplicate values [3,3], target=6", "0 1", false),
            new TestCase("No solution → -1 -1",              "-1 -1", false),
            new TestCase("Hidden: negatives",                 "0 2", true),
            new TestCase("Hidden: [5,5] target=10",          "0 1", true),
            new TestCase("Hidden: zeros",                     "0 3", true)
        )
    );

    private static final CodingProblem HARD = new CodingProblem(
        "hard_lcs",
        "Longest Common Subsequence",
        """
## Problem: Longest Common Subsequence (LCS)

Given two strings `s1` and `s2`, return the **length of their longest common \
subsequence**.

A *subsequence* is a sequence derived from a string by deleting some or no \
characters without changing the order of the remaining characters.

### Examples
| s1 | s2 | Output |
|----|-----|--------|
| `"ABCBDAB"` | `"BDCAB"` | `4` (BCAB) |
| `"AGGTAB"` | `"GXTXAYB"` | `4` (GTAB) |
| `"ABC"` | `"ABC"` | `3` |
| `""` | `"ABC"` | `0` |
| `"ABCD"` | `"EFGH"` | `0` |

### Constraints
- `0 ≤ s1.length, s2.length ≤ 1 000`
- Strings contain uppercase English letters only
- **Expected time complexity:** O(m × n)  |  **Space:** O(m × n) or O(min(m, n))
""",
        "HARD",
        """
public class Solution {

    /**
     * Returns the length of the Longest Common Subsequence of s1 and s2.
     *
     * Hint: Classic 2D DP. Build a table dp[i][j] = LCS of s1[0..i-1] and s2[0..j-1].
     * Recurrence:
     *   if s1[i-1] == s2[j-1]:  dp[i][j] = dp[i-1][j-1] + 1
     *   else:                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
     */
    public static int lcs(String s1, String s2) {
        // TODO: implement your solution here
        return 0;
    }

    // You can modify this main method to manually test your logic.
    public static void main(String[] args) {
        System.out.println(lcs("ABCBDAB", "BDCAB")); // Expected: 4
        System.out.println(lcs("ABC", "ABC"));        // Expected: 3
    }
}
""",
        """
public class TestHarness {
    public static void main(String[] args) {
        // TC1
        System.out.println(Solution.lcs("ABCBDAB", "BDCAB"));
        // TC2
        System.out.println(Solution.lcs("AGGTAB", "GXTXAYB"));
        // TC3: identical
        System.out.println(Solution.lcs("ABC", "ABC"));
        // TC4: empty string
        System.out.println(Solution.lcs("", "ABC"));
        // TC5: no common
        System.out.println(Solution.lcs("ABCD", "EFGH"));
        // TC6 [hidden]
        System.out.println(Solution.lcs("MZJAWXU", "XMJYAUZ"));
        // TC7 [hidden]: single char match
        System.out.println(Solution.lcs("A", "A"));
    }
}
""",
        List.of(
            new TestCase("ABCBDAB, BDCAB → 4",    "4", false),
            new TestCase("AGGTAB, GXTXAYB → 4",   "4", false),
            new TestCase("Identical strings → 3",  "3", false),
            new TestCase("Empty string → 0",       "0", false),
            new TestCase("No common chars → 0",    "0", false),
            new TestCase("Hidden: MZJAWXU, XMJYAUZ", "4", true),
            new TestCase("Hidden: single char",    "1", true)
        )
    );

    private static final Map<String, CodingProblem> BY_DIFFICULTY = Map.of(
        "EASY",   EASY,
        "MEDIUM", MEDIUM,
        "HARD",   HARD
    );

    public CodingProblem getByDifficulty(String difficulty) {
        if (difficulty == null) return MEDIUM;
        CodingProblem p = BY_DIFFICULTY.get(difficulty.toUpperCase());
        return p != null ? p : MEDIUM;
    }
}
