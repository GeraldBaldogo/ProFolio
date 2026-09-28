const PASS_SCORE = 85;
const LEVELS = ['easy', 'medium', 'hard'];

const CURRICULUM = {
  programming: {
    easy: [
      { key: 'variables_operators', label: 'Variables and operators',
        brief: 'Assignment, arithmetic, type conversion, and computing a value from inputs. No classes, no data structures.' },
      { key: 'conditionals', label: 'Conditions',
        brief: 'if / else if / else with comparison and logical operators. Branching on input values.' },
      { key: 'loops', label: 'Loops',
        brief: 'for and while loops: counting, accumulating a total, iterating over a string or list.' },
    ],
    medium: [
      { key: 'classes_objects', label: 'Classes and objects',
        brief: 'Define a class with attributes, a constructor and methods, then create and use instances of it.' },
      { key: 'inheritance', label: 'Inheritance and overriding',
        brief: 'A base class and at least one subclass; the subclass overrides a method and reuses the parent\u2019s behaviour.' },
      { key: 'polymorphism_encapsulation', label: 'Polymorphism and encapsulation',
        brief: 'Several classes sharing one interface used interchangeably, with internal state kept private and accessed through methods.' },
    ],
    hard: [
      { key: 'data_structures', label: 'Data structures',
        brief: 'Implement or use a stack, queue, linked list or hash map to solve the problem efficiently.' },
      { key: 'recursion', label: 'Recursion',
        brief: 'A problem naturally solved recursively, with a correct base case and progress toward it.' },
      { key: 'sorting_searching', label: 'Sorting and searching',
        brief: 'Implement or apply binary search or a sorting algorithm, with attention to time complexity.' },
    ],
  },

  bugfix: {
    easy: [
      { key: 'syntax_types', label: 'Syntax and type errors',
        brief: 'Missing brackets or colons, misspelled names, adding a string to a number.' },
      { key: 'off_by_one', label: 'Off-by-one and loop bounds',
        brief: 'Loops that run one time too many or too few, <= where < was meant, wrong starting index.' },
      { key: 'wrong_operators', label: 'Wrong operators and conditions',
        brief: 'Using = for ==, and for or, * for +, or a condition that is inverted.' },
    ],
    medium: [
      { key: 'object_state', label: 'Object state and constructors',
        brief: 'Attributes not initialised, set on the wrong object, or overwritten by a method.' },
      { key: 'inheritance_bugs', label: 'Inheritance and overriding bugs',
        brief: 'A subclass that forgets to call the parent constructor, overrides with the wrong signature, or shadows an attribute.' },
      { key: 'shared_references', label: 'Shared and mutable references',
        brief: 'Two variables unexpectedly pointing at the same list or object, or a mutable default value shared between calls.' },
    ],
    hard: [
      { key: 'recursion_base_case', label: 'Recursion base cases',
        brief: 'A recursive function with a missing or wrong base case, or a step that never approaches it.' },
      { key: 'ds_edge_cases', label: 'Data structure edge cases',
        brief: 'Code that fails on an empty stack or queue, a single-element list, or a key that doesn\u2019t exist.' },
      { key: 'algorithm_logic', label: 'Algorithm logic',
        brief: 'A search or sort that is almost right — wrong midpoint, wrong swap, or a boundary that loops forever.' },
    ],
  },

  sql: {
    easy: [
      { key: 'select_where', label: 'SELECT and WHERE',
        brief: 'Single table. Choose columns and filter rows with WHERE, AND, OR, comparison operators.' },
      { key: 'order_count', label: 'ORDER BY and COUNT',
        brief: 'Single table. Sort results, and count rows with COUNT, optionally filtered.' },
      { key: 'modify_rows', label: 'INSERT, UPDATE and DELETE',
        brief: 'Single table. Add a row, change rows matching a condition, or remove rows matching a condition.' },
    ],
    medium: [
      { key: 'joins', label: 'JOIN',
        brief: 'Two or three related tables combined with INNER JOIN or LEFT JOIN.' },
      { key: 'group_aggregate', label: 'GROUP BY and aggregates',
        brief: 'Group rows and compute SUM, AVG, MIN, MAX or COUNT per group, usually across a join.' },
      { key: 'having', label: 'HAVING',
        brief: 'Filter groups after aggregation with HAVING, distinct from filtering rows with WHERE.' },
    ],
    hard: [
      { key: 'subqueries', label: 'Subqueries',
        brief: 'A query that needs a nested SELECT, in WHERE, FROM or SELECT — for example, above-average values.' },
      { key: 'multi_join_aggregate', label: 'Multi-table joins with aggregation',
        brief: 'Three or four tables joined, grouped and aggregated to answer one business question.' },
      { key: 'window_functions', label: 'Window functions',
        brief: 'RANK, ROW_NUMBER or a running total with OVER (PARTITION BY ... ORDER BY ...).' },
    ],
  },

  flowchart: {
    easy: [
      { key: 'sequence', label: 'Sequence',
        brief: 'Input, a few processing steps in order, output. No decisions or loops.' },
      { key: 'single_decision', label: 'A single decision',
        brief: 'One decision point with two paths that rejoin before the end.' },
      { key: 'multiple_decisions', label: 'Multiple decisions',
        brief: 'Several decisions in sequence or a chain of else-if style branches.' },
    ],
    medium: [
      { key: 'counting_loop', label: 'Counting loop',
        brief: 'A loop that repeats a fixed number of times using a counter.' },
      { key: 'condition_loop', label: 'Condition-controlled loop',
        brief: 'A loop that repeats until a condition is met, such as input validation or a sentinel value.' },
      { key: 'loop_with_decision', label: 'Loop with a decision inside',
        brief: 'A loop whose body contains a decision, such as counting or totalling only some items.' },
    ],
    hard: [
      { key: 'nested_loops', label: 'Nested loops',
        brief: 'A loop inside a loop, such as processing rows and columns or comparing every pair.' },
      { key: 'search_sort', label: 'Search or sort algorithm',
        brief: 'The flow of a linear search, binary search, or a simple sort such as bubble sort.' },
      { key: 'validation_process', label: 'Multi-step process with validation',
        brief: 'A realistic process — a transaction, enrolment or login — with validation, retries and several outcomes.' },
    ],
  },

  // Communication prompts are written out in full rather than generated, so
  // each topic is one fixed task and costs nothing to hand out.
  communication: {
    easy: [
      { key: 'explain_concept', label: 'Explain a simple concept', title: 'Explain a Simple Concept',
        prompt: 'Explain what a variable is in programming to a friend who has never written code. Use an everyday comparison to make it clear. Write 3–5 sentences.',
        criteria: 'clarity, accuracy, plain language, use of comparison' },
      { key: 'give_instructions', label: 'Give clear instructions', title: 'Give Clear Instructions',
        prompt: 'Write step-by-step instructions for a classmate on how to back up an important file to cloud storage. Number the steps and keep each one short. Write 4–6 steps.',
        criteria: 'correct order, completeness, clarity, conciseness' },
      { key: 'summarize_nontech', label: 'Summarise for a non-technical reader', title: 'Summarise for a Non-Technical Reader',
        prompt: 'Summarise what a school or personal project of yours does, for a parent who is not technical. Avoid jargon and focus on what it is for. Write 3–5 sentences.',
        criteria: 'plain language, relevance, conciseness, audience awareness' },
    ],
    medium: [
      { key: 'status_update', label: 'Status update to a manager', title: 'Write a Status Update',
        prompt: 'Write a short status update to your team lead: what you finished this week, what is still in progress, and one thing blocking you along with what you need to unblock it. Write 4–6 sentences.',
        criteria: 'structure, conciseness, actionability, professional tone' },
      { key: 'explain_bug_client', label: 'Explain a bug to a client', title: 'Explain a Bug to a Client',
        prompt: 'A client reports that the online form on their website loses everything they typed when they press the back button. Write a message explaining, in plain terms, why this happens and what you will do about it. Write 4–6 sentences.',
        criteria: 'plain language, accountability, clarity, reassurance' },
      { key: 'respond_complaint', label: 'Respond to a complaint', title: 'Respond to a Complaint',
        prompt: 'A user writes in, frustrated that your app has become very slow since the last update. Write a reply that acknowledges their frustration, explains what you know, and sets clear expectations for a fix. Write 4–6 sentences.',
        criteria: 'empathy, professionalism, clarity, setting expectations' },
    ],
    hard: [
      { key: 'technical_proposal', label: 'Technical proposal', title: 'Write a Technical Proposal',
        prompt: 'Write an email to your adviser proposing a new feature for your capstone system. Explain the feature, why it adds value, how long it will take, and one risk and how you would handle it. Include a subject line, greeting, body and closing. Write 6–10 sentences.',
        criteria: 'structure, persuasiveness, technical clarity, realism, conciseness' },
      { key: 'incident_report', label: 'Incident report', title: 'Write an Incident Report',
        prompt: 'Your system was unavailable for two hours after an update was deployed. Write an incident report covering what happened, who was affected, the cause, how it was fixed, and what will prevent it happening again. Write 6–10 sentences.',
        criteria: 'structure, accuracy, accountability, completeness, prevention' },
      { key: 'tradeoff_persuasion', label: 'Argue a trade-off', title: 'Argue a Trade-off',
        prompt: 'Your team must choose between releasing on schedule with a known minor bug, or delaying by one week to fix it. Write a message to your project manager recommending one option while fairly weighing both. Write 6–10 sentences.',
        criteria: 'reasoning, balance, persuasiveness, clarity' },
    ],
  },
};

const findTopic = (type, key) => {
  const plan = CURRICULUM[type];
  if (!plan || !key) return null;
  for (const level of LEVELS) {
    const t = plan[level].find((x) => x.key === key);
    if (t) return { ...t, level };
  }
  return null;
};

module.exports = { CURRICULUM, LEVELS, PASS_SCORE, findTopic };