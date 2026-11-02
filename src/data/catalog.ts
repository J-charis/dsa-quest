import type { Difficulty, Problem } from '../domain/types.ts';
import { topicById } from './roadmap.ts';

/**
 * Curated catalog. Titles, slugs and difficulties were written from the author's knowledge of LeetCode
 * and have NOT been checked against leetcode.com in this build, so every entry is `unverified`.
 * Run through the README's "validate problems" checklist, then flip entries to 'verified'.
 */
type Row = [slug: string, title: string, diff: 'E' | 'M' | 'H', pattern: string];
export interface Batch {
  id: string; topicId: string; title: string; subtopic: string;
  kind: 'standard' | 'mixed-challenge'; // mixed-challenge: the Hard reinforces earlier patterns
  rows: Row[];
}

export const BATCHES: Batch[] = [
  { id: 'arrays-hashing-1', topicId: 'arrays-hashing', title: 'Hashing fundamentals', subtopic: 'Frequency and lookup', kind: 'standard', rows: [
    ['contains-duplicate', 'Contains Duplicate', 'E', 'Hash set membership'],
    ['two-sum', 'Two Sum', 'E', 'Complement lookup in a hash map'],
    ['group-anagrams', 'Group Anagrams', 'M', 'Canonical-key grouping'],
    ['product-of-array-except-self', 'Product of Array Except Self', 'M', 'Prefix/suffix products'],
    ['first-missing-positive', 'First Missing Positive', 'H', 'In-place index hashing'] ] },
  { id: 'arrays-hashing-2', topicId: 'arrays-hashing', title: 'Counting and sequences', subtopic: 'Frequency counting', kind: 'standard', rows: [
    ['valid-anagram', 'Valid Anagram', 'E', 'Character counts'],
    ['majority-element', 'Majority Element', 'E', 'Counting / Boyer-Moore voting'],
    ['top-k-frequent-elements', 'Top K Frequent Elements', 'M', 'Frequency map + bucket/heap'],
    ['longest-consecutive-sequence', 'Longest Consecutive Sequence', 'M', 'Hash set sequence starts'],
    ['max-points-on-a-line', 'Max Points on a Line', 'H', 'Slope hashing'] ] },
  { id: 'strings-1', topicId: 'strings', title: 'String handling', subtopic: 'Parsing and palindromes', kind: 'standard', rows: [
    ['valid-palindrome', 'Valid Palindrome', 'E', 'Two-ended scan with filtering'],
    ['longest-common-prefix', 'Longest Common Prefix', 'E', 'Vertical scanning'],
    ['string-to-integer-atoi', 'String to Integer (atoi)', 'M', 'Careful parsing and overflow'],
    ['longest-palindromic-substring', 'Longest Palindromic Substring', 'M', 'Expand around center'],
    ['text-justification', 'Text Justification', 'H', 'Greedy line packing and simulation'] ] },
  { id: 'two-pointers-1', topicId: 'two-pointers', title: 'Two pointers', subtopic: 'Converging and in-place', kind: 'standard', rows: [
    ['move-zeroes', 'Move Zeroes', 'E', 'Read/write pointers'],
    ['merge-sorted-array', 'Merge Sorted Array', 'E', 'Merge from the back'],
    ['3sum', '3Sum', 'M', 'Sort + converging pointers + dedupe'],
    ['container-with-most-water', 'Container With Most Water', 'M', 'Greedy pointer movement'],
    ['trapping-rain-water', 'Trapping Rain Water', 'H', 'Two-pointer boundaries'] ] },
  { id: 'sliding-window-1', topicId: 'sliding-window', title: 'Sliding window', subtopic: 'Fixed and variable windows', kind: 'standard', rows: [
    ['best-time-to-buy-and-sell-stock', 'Best Time to Buy and Sell Stock', 'E', 'Running minimum'],
    ['maximum-average-subarray-i', 'Maximum Average Subarray I', 'E', 'Fixed-size window'],
    ['longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'M', 'Variable window with set/map'],
    ['longest-repeating-character-replacement', 'Longest Repeating Character Replacement', 'M', 'Window validity via max frequency'],
    ['minimum-window-substring', 'Minimum Window Substring', 'H', 'Window with need/have counts'] ] },
  { id: 'prefix-sums-1', topicId: 'prefix-sums', title: 'Prefix sums and Kadane', subtopic: 'Subarray patterns', kind: 'mixed-challenge', rows: [
    ['running-sum-of-1d-array', 'Running Sum of 1d Array', 'E', 'Prefix sum'],
    ['find-pivot-index', 'Find Pivot Index', 'E', 'Prefix vs total sum'],
    ['maximum-subarray', 'Maximum Subarray', 'M', 'Kadane'],
    ['subarray-sum-equals-k', 'Subarray Sum Equals K', 'M', 'Prefix sum + hash map'],
    ['shortest-subarray-with-sum-at-least-k', 'Shortest Subarray with Sum at Least K', 'H', 'Prefix sums + monotonic deque'] ] },
  { id: 'matrix-1', topicId: 'matrix', title: 'Matrix manipulation', subtopic: 'Traversal and transforms', kind: 'mixed-challenge', rows: [
    ['transpose-matrix', 'Transpose Matrix', 'E', 'Index mapping'],
    ['flipping-an-image', 'Flipping an Image', 'E', 'In-place row transforms'],
    ['rotate-image', 'Rotate Image', 'M', 'Transpose + reverse'],
    ['spiral-matrix', 'Spiral Matrix', 'M', 'Boundary shrinking'],
    ['maximal-rectangle', 'Maximal Rectangle', 'H', 'Histogram per row (stack)'] ] },
  { id: 'stack-queue-1', topicId: 'stack-queue', title: 'Stacks', subtopic: 'Matching and monotonic stacks', kind: 'standard', rows: [
    ['valid-parentheses', 'Valid Parentheses', 'E', 'Stack matching'],
    ['implement-queue-using-stacks', 'Implement Queue using Stacks', 'E', 'Two-stack amortisation'],
    ['daily-temperatures', 'Daily Temperatures', 'M', 'Monotonic stack'],
    ['evaluate-reverse-polish-notation', 'Evaluate Reverse Polish Notation', 'M', 'Operand stack'],
    ['largest-rectangle-in-histogram', 'Largest Rectangle in Histogram', 'H', 'Monotonic stack bounds'] ] },
  { id: 'stack-queue-2', topicId: 'stack-queue', title: 'Monotonic structures', subtopic: 'Next greater and deques', kind: 'standard', rows: [
    ['next-greater-element-i', 'Next Greater Element I', 'E', 'Next greater with map'],
    ['backspace-string-compare', 'Backspace String Compare', 'E', 'Stack / two-pointer from end'],
    ['next-greater-element-ii', 'Next Greater Element II', 'M', 'Circular monotonic stack'],
    ['online-stock-span', 'Online Stock Span', 'M', 'Monotonic stack with counts'],
    ['sliding-window-maximum', 'Sliding Window Maximum', 'H', 'Monotonic deque'] ] },
  { id: 'binary-search-1', topicId: 'binary-search', title: 'Binary search basics', subtopic: 'Bounds and rotation', kind: 'standard', rows: [
    ['binary-search', 'Binary Search', 'E', 'Classic bounds'],
    ['search-insert-position', 'Search Insert Position', 'E', 'Lower bound'],
    ['search-in-rotated-sorted-array', 'Search in Rotated Sorted Array', 'M', 'Identify the sorted half'],
    ['find-first-and-last-position-of-element-in-sorted-array', 'Find First and Last Position of Element in Sorted Array', 'M', 'Lower and upper bound'],
    ['median-of-two-sorted-arrays', 'Median of Two Sorted Arrays', 'H', 'Binary search on partition'] ] },
  { id: 'binary-search-2', topicId: 'binary-search', title: 'Binary search on the answer', subtopic: 'Monotone predicates', kind: 'standard', rows: [
    ['sqrtx', 'Sqrt(x)', 'E', 'Search the answer space'],
    ['first-bad-version', 'First Bad Version', 'E', 'Predicate boundary'],
    ['koko-eating-bananas', 'Koko Eating Bananas', 'M', 'Minimise feasible rate'],
    ['capacity-to-ship-packages-within-d-days', 'Capacity To Ship Packages Within D Days', 'M', 'Minimise feasible capacity'],
    ['split-array-largest-sum', 'Split Array Largest Sum', 'H', 'Binary search + greedy check'] ] },
  { id: 'linked-list-1', topicId: 'linked-list', title: 'Linked lists', subtopic: 'Reversal and fast/slow', kind: 'standard', rows: [
    ['reverse-linked-list', 'Reverse Linked List', 'E', 'Iterative reversal'],
    ['merge-two-sorted-lists', 'Merge Two Sorted Lists', 'E', 'Dummy head merge'],
    ['linked-list-cycle-ii', 'Linked List Cycle II', 'M', 'Floyd cycle detection'],
    ['remove-nth-node-from-end-of-list', 'Remove Nth Node From End of List', 'M', 'Gap pointers'],
    ['reverse-nodes-in-k-group', 'Reverse Nodes in k-Group', 'H', 'Segment reversal'] ] },
  { id: 'intervals-1', topicId: 'intervals', title: 'Intervals', subtopic: 'Merge and sweep', kind: 'standard', rows: [
    ['summary-ranges', 'Summary Ranges', 'E', 'Run detection'],
    ['teemo-attacking', 'Teemo Attacking', 'E', 'Overlap accounting'],
    ['merge-intervals', 'Merge Intervals', 'M', 'Sort by start'],
    ['insert-interval', 'Insert Interval', 'M', 'Three-phase scan'],
    ['the-skyline-problem', 'The Skyline Problem', 'H', 'Sweep line + heap'] ] },
  { id: 'recursion-backtracking-1', topicId: 'recursion-backtracking', title: 'Recursion and subsets', subtopic: 'Decision trees', kind: 'standard', rows: [
    ['fibonacci-number', 'Fibonacci Number', 'E', 'Base cases and recursion'],
    ['reverse-string', 'Reverse String', 'E', 'Recursive/in-place thinking'],
    ['subsets', 'Subsets', 'M', 'Include/exclude choices'],
    ['permutations', 'Permutations', 'M', 'Used-array backtracking'],
    ['n-queens', 'N-Queens', 'H', 'Constraint pruning'] ] },
  { id: 'recursion-backtracking-2', topicId: 'recursion-backtracking', title: 'Backtracking patterns', subtopic: 'Combinations and constraints', kind: 'standard', rows: [
    ['binary-tree-paths', 'Binary Tree Paths', 'E', 'Path accumulation'],
    ['binary-watch', 'Binary Watch', 'E', 'Enumerate combinations'],
    ['combination-sum', 'Combination Sum', 'M', 'Reuse with start index'],
    ['generate-parentheses', 'Generate Parentheses', 'M', 'Valid-prefix pruning'],
    ['sudoku-solver', 'Sudoku Solver', 'H', 'Constraint-based search'] ] },
  { id: 'trees-1', topicId: 'trees', title: 'Tree traversals', subtopic: 'DFS and BFS', kind: 'standard', rows: [
    ['maximum-depth-of-binary-tree', 'Maximum Depth of Binary Tree', 'E', 'Recursive DFS'],
    ['invert-binary-tree', 'Invert Binary Tree', 'E', 'Swap children recursively'],
    ['binary-tree-level-order-traversal', 'Binary Tree Level Order Traversal', 'M', 'BFS by level'],
    ['validate-binary-search-tree', 'Validate Binary Search Tree', 'M', 'Bounds propagation'],
    ['binary-tree-maximum-path-sum', 'Binary Tree Maximum Path Sum', 'H', 'Return-vs-global DFS'] ] },
  { id: 'trees-2', topicId: 'trees', title: 'Tree structure and construction', subtopic: 'LCA and construction', kind: 'standard', rows: [
    ['same-tree', 'Same Tree', 'E', 'Parallel recursion'],
    ['symmetric-tree', 'Symmetric Tree', 'E', 'Mirror recursion'],
    ['lowest-common-ancestor-of-a-binary-tree', 'Lowest Common Ancestor of a Binary Tree', 'M', 'Post-order LCA'],
    ['construct-binary-tree-from-preorder-and-inorder-traversal', 'Construct Binary Tree from Preorder and Inorder Traversal', 'M', 'Index map construction'],
    ['serialize-and-deserialize-binary-tree', 'Serialize and Deserialize Binary Tree', 'H', 'Preorder encoding'] ] },
  { id: 'trees-3', topicId: 'trees', title: 'Tree paths and BSTs', subtopic: 'Diameter, BST, path state', kind: 'standard', rows: [
    ['diameter-of-binary-tree', 'Diameter of Binary Tree', 'E', 'Height with global best'],
    ['balanced-binary-tree', 'Balanced Binary Tree', 'E', 'Height with early exit'],
    ['kth-smallest-element-in-a-bst', 'Kth Smallest Element in a BST', 'M', 'Inorder traversal'],
    ['path-sum-ii', 'Path Sum II', 'M', 'Backtracking on trees'],
    ['binary-tree-cameras', 'Binary Tree Cameras', 'H', 'Tree DP / greedy states'] ] },
  { id: 'heap-1', topicId: 'heap', title: 'Heaps and top-K', subtopic: 'Priority queues', kind: 'standard', rows: [
    ['kth-largest-element-in-a-stream', 'Kth Largest Element in a Stream', 'E', 'Size-k min-heap'],
    ['last-stone-weight', 'Last Stone Weight', 'E', 'Max-heap simulation'],
    ['kth-largest-element-in-an-array', 'Kth Largest Element in an Array', 'M', 'Heap or quickselect'],
    ['k-closest-points-to-origin', 'K Closest Points to Origin', 'M', 'Top-K with comparator'],
    ['merge-k-sorted-lists', 'Merge k Sorted Lists', 'H', 'K-way merge'] ] },
  { id: 'trie-1', topicId: 'trie', title: 'Tries', subtopic: 'Prefix search', kind: 'standard', rows: [
    ['counting-words-with-a-given-prefix', 'Counting Words With a Given Prefix', 'E', 'Prefix matching'],
    ['check-if-a-word-occurs-as-a-prefix-of-any-word-in-a-sentence', 'Check If a Word Occurs As a Prefix of Any Word in a Sentence', 'E', 'Prefix scanning'],
    ['implement-trie-prefix-tree', 'Implement Trie (Prefix Tree)', 'M', 'Trie node design'],
    ['design-add-and-search-words-data-structure', 'Design Add and Search Words Data Structure', 'M', 'Trie + wildcard DFS'],
    ['word-search-ii', 'Word Search II', 'H', 'Trie-guided backtracking'] ] },
  { id: 'greedy-1', topicId: 'greedy', title: 'Greedy', subtopic: 'Local choice, global optimum', kind: 'standard', rows: [
    ['assign-cookies', 'Assign Cookies', 'E', 'Sort and match'],
    ['lemonade-change', 'Lemonade Change', 'E', 'Greedy change-making'],
    ['jump-game', 'Jump Game', 'M', 'Farthest reach'],
    ['gas-station', 'Gas Station', 'M', 'Running surplus reset'],
    ['candy', 'Candy', 'H', 'Two-pass greedy'] ] },
  { id: 'graphs-1', topicId: 'graphs', title: 'Graph traversal', subtopic: 'BFS and DFS on grids', kind: 'standard', rows: [
    ['flood-fill', 'Flood Fill', 'E', 'Grid DFS/BFS'],
    ['find-if-path-exists-in-graph', 'Find if Path Exists in Graph', 'E', 'Graph reachability'],
    ['number-of-islands', 'Number of Islands', 'M', 'Connected components'],
    ['rotting-oranges', 'Rotting Oranges', 'M', 'Multi-source BFS'],
    ['word-ladder', 'Word Ladder', 'H', 'BFS on implicit graph'] ] },
  { id: 'graphs-2', topicId: 'graphs', title: 'Graph ordering', subtopic: 'Topological sort and DAGs', kind: 'standard', rows: [
    ['find-center-of-star-graph', 'Find Center of Star Graph', 'E', 'Degree counting'],
    ['find-the-town-judge', 'Find the Town Judge', 'E', 'In/out degree'],
    ['course-schedule', 'Course Schedule', 'M', 'Cycle detection'],
    ['course-schedule-ii', 'Course Schedule II', 'M', 'Topological order (Kahn)'],
    ['longest-increasing-path-in-a-matrix', 'Longest Increasing Path in a Matrix', 'H', 'DFS + memo on DAG'] ] },
  { id: 'graphs-3', topicId: 'graphs', title: 'Components and shortest paths', subtopic: 'Dijkstra and connectivity', kind: 'mixed-challenge', rows: [
    ['island-perimeter', 'Island Perimeter', 'E', 'Grid neighbour counting'],
    ['n-ary-tree-preorder-traversal', 'N-ary Tree Preorder Traversal', 'E', 'Graph-like DFS'],
    ['number-of-provinces', 'Number of Provinces', 'M', 'Components / union-find'],
    ['network-delay-time', 'Network Delay Time', 'M', 'Dijkstra'],
    ['swim-in-rising-water', 'Swim in Rising Water', 'H', 'Dijkstra / union-find on minimax'] ] },
  { id: 'dynamic-programming-1', topicId: 'dynamic-programming', title: '1D dynamic programming', subtopic: 'Linear transitions', kind: 'mixed-challenge', rows: [
    ['climbing-stairs', 'Climbing Stairs', 'E', 'Fibonacci-style DP'],
    ['min-cost-climbing-stairs', 'Min Cost Climbing Stairs', 'E', 'Min over previous states'],
    ['house-robber', 'House Robber', 'M', 'Take/skip DP'],
    ['decode-ways', 'Decode Ways', 'M', 'Counting DP on strings'],
    ['maximum-profit-in-job-scheduling', 'Maximum Profit in Job Scheduling', 'H', 'DP + binary search'] ] },
  { id: 'dynamic-programming-2', topicId: 'dynamic-programming', title: 'Grid and unbounded DP', subtopic: 'Grids and coins', kind: 'standard', rows: [
    ['pascals-triangle', "Pascal's Triangle", 'E', 'Row-by-row DP'],
    ['n-th-tribonacci-number', 'N-th Tribonacci Number', 'E', 'Rolling state'],
    ['unique-paths', 'Unique Paths', 'M', 'Grid DP'],
    ['coin-change', 'Coin Change', 'M', 'Unbounded knapsack'],
    ['dungeon-game', 'Dungeon Game', 'H', 'Reverse grid DP'] ] },
  { id: 'dynamic-programming-3', topicId: 'dynamic-programming', title: 'String and sequence DP', subtopic: 'LIS, LCS, matching', kind: 'standard', rows: [
    ['is-subsequence', 'Is Subsequence', 'E', 'Greedy / DP matching'],
    ['counting-bits', 'Counting Bits', 'E', 'DP on bit structure'],
    ['longest-increasing-subsequence', 'Longest Increasing Subsequence', 'M', 'DP / patience sorting'],
    ['longest-common-subsequence', 'Longest Common Subsequence', 'M', '2D string DP'],
    ['regular-expression-matching', 'Regular Expression Matching', 'H', 'Pattern DP'] ] },
  { id: 'dynamic-programming-4', topicId: 'dynamic-programming', title: 'Knapsack and interval DP', subtopic: 'Partition and range DP', kind: 'standard', rows: [
    ['divisor-game', 'Divisor Game', 'E', 'Game-state DP'],
    ['get-maximum-in-generated-array', 'Get Maximum in Generated Array', 'E', 'Table building'],
    ['partition-equal-subset-sum', 'Partition Equal Subset Sum', 'M', '0/1 knapsack / subset sum'],
    ['palindromic-substrings', 'Palindromic Substrings', 'M', 'Palindrome DP / expansion'],
    ['burst-balloons', 'Burst Balloons', 'H', 'Interval DP'] ] },
  { id: 'bits-math-1', topicId: 'bits-math', title: 'Bits and math', subtopic: 'XOR, masks, exponentiation', kind: 'mixed-challenge', rows: [
    ['single-number', 'Single Number', 'E', 'XOR cancellation'],
    ['number-of-1-bits', 'Number of 1 Bits', 'E', 'Bit counting'],
    ['pow-x-n', 'Pow(x, n)', 'M', 'Fast exponentiation'],
    ['count-primes', 'Count Primes', 'M', 'Sieve of Eratosthenes'],
    ['number-of-digit-one', 'Number of Digit One', 'H', 'Digit counting math'] ] },
  { id: 'design-1', topicId: 'design', title: 'Data-structure design', subtopic: 'O(1) structures and caches', kind: 'standard', rows: [
    ['design-hashset', 'Design HashSet', 'E', 'Bucketing'],
    ['design-hashmap', 'Design HashMap', 'E', 'Chaining'],
    ['lru-cache', 'LRU Cache', 'M', 'Hash map + doubly linked list'],
    ['insert-delete-getrandom-o1', 'Insert Delete GetRandom O(1)', 'M', 'Array + hash map swap-delete'],
    ['lfu-cache', 'LFU Cache', 'H', 'Frequency buckets'] ] },
  { id: 'advanced-1', topicId: 'advanced', title: 'Advanced patterns', subtopic: 'KMP and range queries', kind: 'standard', rows: [
    ['find-the-index-of-the-first-occurrence-in-a-string', 'Find the Index of the First Occurrence in a String', 'E', 'String matching (KMP)'],
    ['repeated-substring-pattern', 'Repeated Substring Pattern', 'E', 'Failure function'],
    ['range-sum-query-2d-immutable', 'Range Sum Query 2D - Immutable', 'M', '2D prefix sums'],
    ['range-sum-query-mutable', 'Range Sum Query - Mutable', 'M', 'Fenwick / segment tree'],
    ['count-of-smaller-numbers-after-self', 'Count of Smaller Numbers after Self', 'H', 'Fenwick tree / merge sort'] ] },
];

const DIFF: Record<'E' | 'M' | 'H', Difficulty> = { E: 'Easy', M: 'Medium', H: 'Hard' };
const MINUTES: Record<Difficulty, number> = { Easy: 15, Medium: 30, Hard: 50 };

export const PROBLEMS: Problem[] = BATCHES.flatMap((b) =>
  b.rows.map(([slug, title, d, pattern], i): Problem => {
    const topic = topicById.get(b.topicId)!;
    const difficulty = DIFF[d];
    return {
      id: slug, slug, title, difficulty,
      url: `https://leetcode.com/problems/${slug}/`,
      topicId: b.topicId, subtopic: b.subtopic, priority: topic.tier,
      patterns: [pattern], estMinutes: MINUTES[difficulty], batchId: b.id, order: i + 1,
      objective: `Practise: ${pattern}.`, prerequisites: topic.prerequisites, verification: 'unverified',
    };
  }),
);
export const problemById = new Map(PROBLEMS.map((p) => [p.id, p]));
