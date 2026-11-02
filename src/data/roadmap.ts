export interface Phase { id: number; name: string; summary: string }
export interface Topic {
  id: string; name: string; phase: number; tier: 1 | 2 | 3; prerequisites: string[];
  description: string; objectives: string[];
}

export const PHASES: Phase[] = [
  { id: 0, name: 'Fundamentals', summary: 'Complexity analysis and C++ STL essentials.' },
  { id: 1, name: 'High-frequency foundations', summary: 'Arrays, hashing, strings, two pointers, sliding window, prefix sums, matrices.' },
  { id: 2, name: 'Searching and linear structures', summary: 'Binary search, stacks, queues, linked lists, intervals.' },
  { id: 3, name: 'Recursion and search', summary: 'Recursion and backtracking.' },
  { id: 4, name: 'Trees and hierarchical structures', summary: 'Binary trees, BSTs, heaps, tries.' },
  { id: 5, name: 'Greedy and optimization', summary: 'Greedy choice, scheduling, jump-style problems.' },
  { id: 6, name: 'Graphs', summary: 'BFS/DFS, grids, topological sort, shortest paths.' },
  { id: 7, name: 'Dynamic programming', summary: '1D, grid, knapsack, string and partition DP.' },
  { id: 8, name: 'Additional interview topics', summary: 'Bits, math, data-structure design.' },
  { id: 9, name: 'Advanced and specialist', summary: 'KMP, range queries, harder combinations.' },
  { id: 10, name: 'Interview simulation', summary: 'Mixed timed rounds and weak-topic remediation using problems you already know.' },
];

export const TOPICS: Topic[] = [
  { id: 'complexity', name: 'Complexity and Big-O', phase: 0, tier: 1, prerequisites: [], description: 'Reason about time and space cost before coding.', objectives: ['Derive Big-O for loops and recursion', 'Estimate feasibility from input limits'] },
  { id: 'cpp-stl', name: 'C++ STL essentials', phase: 0, tier: 1, prerequisites: [], description: 'vector, string, pair, map/set, unordered containers, sort with comparators.', objectives: ['Use containers fluently', 'Write custom comparators and lambdas'] },
  { id: 'arrays-hashing', name: 'Arrays and hashing', phase: 1, tier: 1, prerequisites: ['complexity', 'cpp-stl'], description: 'Frequency counting, hash maps/sets, in-place array manipulation.', objectives: ['Trade space for time with hash maps', 'Group and count efficiently'] },
  { id: 'strings', name: 'Strings', phase: 1, tier: 1, prerequisites: ['arrays-hashing'], description: 'String parsing, palindromes, formatting.', objectives: ['Handle parsing edge cases', 'Expand around centers'] },
  { id: 'two-pointers', name: 'Two pointers', phase: 1, tier: 1, prerequisites: ['arrays-hashing'], description: 'Converging and same-direction pointer scans.', objectives: ['Recognise sorted/symmetric structure', 'Maintain pointer invariants'] },
  { id: 'sliding-window', name: 'Sliding window', phase: 1, tier: 1, prerequisites: ['arrays-hashing', 'two-pointers'], description: 'Fixed and variable windows over arrays and strings.', objectives: ['Expand/shrink with an invariant', 'Track window state with counts'] },
  { id: 'prefix-sums', name: 'Prefix sums and Kadane', phase: 1, tier: 1, prerequisites: ['arrays-hashing'], description: 'Prefix sums, difference arrays, subarray optimisation.', objectives: ['Convert range queries to O(1)', 'Apply Kadane-style DP'] },
  { id: 'matrix', name: 'Matrix traversal', phase: 1, tier: 2, prerequisites: ['arrays-hashing'], description: 'In-place transforms and traversal orders.', objectives: ['Manage boundaries', 'Transform in place'] },
  { id: 'stack-queue', name: 'Stacks, queues and monotonic structures', phase: 2, tier: 1, prerequisites: ['arrays-hashing'], description: 'Stack matching, monotonic stack/deque, next-greater patterns.', objectives: ['Use a stack for nested structure', 'Maintain monotonic order'] },
  { id: 'binary-search', name: 'Binary search', phase: 2, tier: 1, prerequisites: ['arrays-hashing'], description: 'Bounds, rotated arrays, binary search on the answer.', objectives: ['Write bug-free bounds', 'Search over a monotone predicate'] },
  { id: 'linked-list', name: 'Linked lists', phase: 2, tier: 1, prerequisites: ['complexity'], description: 'Pointer manipulation, fast/slow pointers, reversal.', objectives: ['Reverse and splice safely', 'Detect cycles'] },
  { id: 'intervals', name: 'Intervals and sweep line', phase: 2, tier: 2, prerequisites: ['arrays-hashing'], description: 'Merging, inserting and sweeping intervals.', objectives: ['Sort by start/end', 'Sweep over events'] },
  { id: 'recursion-backtracking', name: 'Recursion and backtracking', phase: 3, tier: 1, prerequisites: ['complexity'], description: 'Choose-explore-unchoose search and pruning.', objectives: ['Model a decision tree', 'Prune invalid branches'] },
  { id: 'trees', name: 'Binary trees and BSTs', phase: 4, tier: 1, prerequisites: ['recursion-backtracking'], description: 'DFS/BFS traversals, construction, LCA, path problems.', objectives: ['Write recursive tree solutions', 'Choose DFS vs BFS'] },
  { id: 'heap', name: 'Heaps and top-K', phase: 4, tier: 1, prerequisites: ['arrays-hashing'], description: 'Priority queues, top-K, k-way merge.', objectives: ['Pick min vs max heap', 'Merge sorted streams'] },
  { id: 'trie', name: 'Tries', phase: 4, tier: 2, prerequisites: ['trees', 'strings'], description: 'Prefix search and word dictionaries.', objectives: ['Implement a trie node', 'Combine trie with DFS'] },
  { id: 'greedy', name: 'Greedy', phase: 5, tier: 2, prerequisites: ['arrays-hashing', 'intervals'], description: 'Local choices with exchange-argument justification.', objectives: ['Justify a greedy choice', 'Combine sorting with greedy'] },
  { id: 'graphs', name: 'Graphs', phase: 6, tier: 1, prerequisites: ['trees', 'stack-queue'], description: 'BFS/DFS, grids, topological sort, shortest paths.', objectives: ['Model problems as graphs', 'Detect cycles and order dependencies'] },
  { id: 'dynamic-programming', name: 'Dynamic programming', phase: 7, tier: 1, prerequisites: ['recursion-backtracking'], description: '1D, grid, knapsack, string and partition DP.', objectives: ['Define state and transition', 'Optimise space'] },
  { id: 'bits-math', name: 'Bits and math', phase: 8, tier: 2, prerequisites: ['arrays-hashing'], description: 'Bit tricks, number theory basics, fast exponentiation.', objectives: ['Use XOR and masks', 'Apply modular arithmetic'] },
  { id: 'design', name: 'Data-structure design', phase: 8, tier: 2, prerequisites: ['linked-list', 'arrays-hashing'], description: 'LRU/LFU caches and O(1) structures.', objectives: ['Combine hash map with list/heap', 'Meet O(1) requirements'] },
  { id: 'advanced', name: 'Advanced patterns', phase: 9, tier: 3, prerequisites: ['prefix-sums', 'binary-search', 'graphs', 'dynamic-programming'], description: 'KMP, Fenwick/segment trees, harder combinations.', objectives: ['Recognise range-query structure', 'Apply string matching'] },
  { id: 'simulation', name: 'Interview simulation', phase: 10, tier: 1, prerequisites: ['trees', 'graphs', 'dynamic-programming'], description: 'Timed mixed-topic rounds drawn from problems you have already studied.', objectives: ['Identify patterns without topic labels', 'Perform under a clock'] },
];

export const topicById = new Map(TOPICS.map((t) => [t.id, t]));
