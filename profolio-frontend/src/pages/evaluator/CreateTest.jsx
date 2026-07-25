import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faPlus, faTrash, faSpinner, faCircleCheck,
  faFileCirclePlus, faUserGraduate,
} from '@fortawesome/free-solid-svg-icons'
import { createTest, assignTest } from '../../services/test.service'
import { getAssignedPortfolios } from '../../services/evaluation.service'

const TYPES = [
  { value: 'typing', label: 'Speed Typing' },
  { value: 'programming', label: 'Coding Challenge' },
  { value: 'flowchart', label: 'Flowchart Analysis' },
  { value: 'sql', label: 'SQL Query' },
  { value: 'bugfix', label: 'Bug Fixing' },
  { value: 'communication', label: 'Communication Skills' },
]

const inputClass = "w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-blue-500/50 focus:bg-blue-500/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none transition-all"
const labelClass = "text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block"

const emptyTestCase = () => ({ input: '', expected_output: '' })

const CreateTest = () => {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('form') // form | assign | done
  const [type, setType] = useState('programming')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [createdTest, setCreatedTest] = useState(null)

  // Config fields - only the ones relevant to the selected type get used
  const [textPassage, setTextPassage] = useState('')
  const [durationSeconds, setDurationSeconds] = useState(60)
  const [problemStatement, setProblemStatement] = useState('')
  const [starterCode, setStarterCode] = useState('')
  const [language, setLanguage] = useState('JavaScript')
  const [testCases, setTestCases] = useState([emptyTestCase()])
  const [scenarioDescription, setScenarioDescription] = useState('')
  const [rubricText, setRubricText] = useState('') // comma-separated, split into array
  const [schemaSql, setSchemaSql] = useState('')
  const [question, setQuestion] = useState('')
  const [expectedQuery, setExpectedQuery] = useState('')
  const [buggyCode, setBuggyCode] = useState('')
  const [prompt, setPrompt] = useState('')

  // Assign phase
  const [students, setStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [dueDate, setDueDate] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)

  useEffect(() => {
    if (phase === 'assign') {
      setLoadingStudents(true)
      getAssignedPortfolios()
        .then(setStudents)
        .catch((err) => console.error('Failed to load students:', err))
        .finally(() => setLoadingStudents(false))
    }
  }, [phase])

  const addTestCase = () => setTestCases([...testCases, emptyTestCase()])
  const removeTestCase = (i) => setTestCases(testCases.filter((_, idx) => idx !== i))
  const updateTestCase = (i, field, value) => {
    const updated = [...testCases]
    updated[i][field] = value
    setTestCases(updated)
  }

  const buildConfig = () => {
    switch (type) {
      case 'typing':
        return { text_passage: textPassage, duration_seconds: Number(durationSeconds) }
      case 'programming':
        return {
          problem_statement: problemStatement,
          starter_code: starterCode,
          language,
          test_cases: testCases.filter((tc) => tc.input || tc.expected_output),
        }
      case 'flowchart':
        return {
          scenario_description: scenarioDescription,
          rubric: rubricText.split(',').map((s) => s.trim()).filter(Boolean),
        }
      case 'sql':
        return { schema_sql: schemaSql, question, expected_query: expectedQuery || null }
      case 'bugfix':
        return {
          buggy_code: buggyCode,
          language,
          test_cases: testCases.filter((tc) => tc.input || tc.expected_output),
        }
      case 'communication':
        return {
          prompt,
          rubric: rubricText.split(',').map((s) => s.trim()).filter(Boolean),
        }
      default:
        return {}
    }
  }

  const handleCreate = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    try {
      const test = await createTest({
        type,
        title: title.trim(),
        description,
        config: buildConfig(),
        time_limit_minutes: Number(timeLimitMinutes) || null,
        is_published: true,
      })
      setCreatedTest(test)
      setPhase('assign')
    } catch (err) {
      setError(err.message || 'Failed to create test.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStudent = (userId) => {
    setSelectedStudents((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      setError('Select at least one student.')
      return
    }
    setAssigning(true)
    setError(null)
    try {
      await assignTest(createdTest.id, selectedStudents, dueDate || null)
      setPhase('done')
    } catch (err) {
      setError(err.message || 'Failed to assign test.')
    } finally {
      setAssigning(false)
    }
  }

  // ── DONE ───────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-xl mx-auto flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center">
          <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-2xl" />
        </div>
        <p className="text-white font-bold text-lg">Test created and assigned!</p>
        <p className="text-gray-500 text-sm">
          {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} can now see "{createdTest?.title}" in their assigned tests.
        </p>
        <button
          onClick={() => navigate('/evaluator/dashboard')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  // ── ASSIGN ─────────────────────────────────────────────────────────────────
  if (phase === 'assign') {
    return (
      <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-white font-bold text-lg flex items-center gap-2">
              <FontAwesomeIcon icon={faUserGraduate} className="text-blue-400" /> Assign "{createdTest?.title}"
            </h1>
            <p className="text-gray-500 text-xs">Select which students should take this test</p>
          </div>
        </div>

        {error && (
          <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 mb-4 text-rose-400 text-sm">{error}</div>
        )}

        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
          <label className={labelClass}>Due date (optional)</label>
          <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div className="border border-white/8 bg-white/[0.03] rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-white font-bold text-sm">Your assigned students</p>
          </div>
          {loadingStudents ? (
            <div className="flex justify-center py-10">
              <FontAwesomeIcon icon={faSpinner} className="text-gray-500 animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-gray-600 text-xs px-5 py-6 text-center">No students assigned to you yet.</p>
          ) : (
            <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
              {students.map((assignment) => {
                const studentProfile = assignment.portfolios?.student_profiles
                const studentUserId = studentProfile?.user_id
                const studentName = studentProfile?.users?.full_name || 'Student'
                const studentEmail = studentProfile?.users?.email
                const checked = selectedStudents.includes(studentUserId)

                return (
                  <label key={assignment.id} className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-white/[0.02]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStudent(studentUserId)}
                      className="w-4 h-4 rounded accent-blue-500"
                    />
                    <div>
                      <p className="text-white text-sm font-medium">{studentName}</p>
                      <p className="text-gray-500 text-xs">{studentEmail}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAssign}
            disabled={assigning || selectedStudents.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-all"
          >
            {assigning ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCircleCheck} />}
            {assigning ? 'Assigning...' : `Assign to ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''}`}
          </button>
          <button
            onClick={() => navigate('/evaluator/dashboard')}
            className="border border-white/8 text-gray-400 hover:text-white text-sm font-semibold px-5 py-3 rounded-2xl transition-all"
          >
            Skip for now
          </button>
        </div>
      </div>
    )
  }

  // ── FORM ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060612] font-sans px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/evaluator/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faFileCirclePlus} className="text-blue-400" /> Create Test
          </h1>
          <p className="text-gray-500 text-xs">Build a custom assessment for your students</p>
        </div>
      </div>

      {error && (
        <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-4 mb-4 text-rose-400 text-sm">{error}</div>
      )}

      {/* Type selector */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4">
        <label className={labelClass}>Activity Type</label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                type === t.value ? 'border-blue-500/40 bg-blue-500/10 text-blue-400' : 'border-white/8 text-gray-500 hover:text-white hover:border-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Basic info */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-4 flex flex-col gap-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input className={inputClass} placeholder="e.g. Midterm Coding Assessment" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea className={inputClass + ' resize-none h-20'} placeholder="Brief description shown to students" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Time limit (minutes)</label>
          <input type="number" min="1" className={inputClass} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} />
        </div>
      </div>

      {/* Type-specific config */}
      <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-5 mb-6 flex flex-col gap-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Content</p>

        {type === 'typing' && (
          <>
            <div>
              <label className={labelClass}>Text passage to type *</label>
              <textarea className={inputClass + ' resize-none h-28'} placeholder="The text students will type..." value={textPassage} onChange={(e) => setTextPassage(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Duration (seconds) *</label>
              <input type="number" min="10" className={inputClass} value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)} />
            </div>
          </>
        )}

        {type === 'programming' && (
          <>
            <div>
              <label className={labelClass}>Problem statement *</label>
              <textarea className={inputClass + ' resize-none h-24'} placeholder="Describe the coding problem..." value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Language *</label>
              <input className={inputClass} placeholder="e.g. JavaScript, Python" value={language} onChange={(e) => setLanguage(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Starter code *</label>
              <textarea className={inputClass + ' resize-none h-24 font-mono'} placeholder="function solve() {}" value={starterCode} onChange={(e) => setStarterCode(e.target.value)} />
            </div>
            <TestCaseEditor testCases={testCases} onAdd={addTestCase} onRemove={removeTestCase} onUpdate={updateTestCase} />
          </>
        )}

        {type === 'flowchart' && (
          <>
            <div>
              <label className={labelClass}>Scenario description *</label>
              <textarea className={inputClass + ' resize-none h-28'} placeholder="Describe the process students should flowchart..." value={scenarioDescription} onChange={(e) => setScenarioDescription(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Rubric criteria (comma-separated)</label>
              <input className={inputClass} placeholder="e.g. correct start/end, decision points, loop logic" value={rubricText} onChange={(e) => setRubricText(e.target.value)} />
            </div>
          </>
        )}

        {type === 'sql' && (
          <>
            <div>
              <label className={labelClass}>Schema SQL *</label>
              <textarea className={inputClass + ' resize-none h-24 font-mono'} placeholder="create table students (...)" value={schemaSql} onChange={(e) => setSchemaSql(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Question *</label>
              <textarea className={inputClass + ' resize-none h-20'} placeholder="What query should the student write?" value={question} onChange={(e) => setQuestion(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Expected query (optional, for reference)</label>
              <textarea className={inputClass + ' resize-none h-16 font-mono'} placeholder="select * from students where ..." value={expectedQuery} onChange={(e) => setExpectedQuery(e.target.value)} />
            </div>
          </>
        )}

        {type === 'bugfix' && (
          <>
            <div>
              <label className={labelClass}>Language *</label>
              <input className={inputClass} placeholder="e.g. JavaScript, Python" value={language} onChange={(e) => setLanguage(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Buggy code *</label>
              <textarea className={inputClass + ' resize-none h-32 font-mono'} placeholder="Code with intentional bugs..." value={buggyCode} onChange={(e) => setBuggyCode(e.target.value)} />
            </div>
            <TestCaseEditor testCases={testCases} onAdd={addTestCase} onRemove={removeTestCase} onUpdate={updateTestCase} />
          </>
        )}

        {type === 'communication' && (
          <>
            <div>
              <label className={labelClass}>Prompt *</label>
              <textarea className={inputClass + ' resize-none h-28'} placeholder="What should the student write about?" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Rubric criteria (comma-separated)</label>
              <input className={inputClass} placeholder="e.g. clarity, professionalism, structure" value={rubricText} onChange={(e) => setRubricText(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleCreate}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
      >
        {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faFileCirclePlus} />}
        {saving ? 'Creating...' : 'Create Test'}
      </button>
    </div>
  )
}

// Reusable input/output test case list, used by both programming and bugfix
const TestCaseEditor = ({ testCases, onAdd, onRemove, onUpdate }) => (
  <div>
    <label className={labelClass}>Test cases (optional)</label>
    <div className="flex flex-col gap-2">
      {testCases.map((tc, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            className={inputClass}
            placeholder="Input"
            value={tc.input}
            onChange={(e) => onUpdate(i, 'input', e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Expected output"
            value={tc.expected_output}
            onChange={(e) => onUpdate(i, 'expected_output', e.target.value)}
          />
          <button
            onClick={() => onRemove(i)}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
          </button>
        </div>
      ))}
    </div>
    <button
      onClick={onAdd}
      className="mt-2 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-semibold"
    >
      <FontAwesomeIcon icon={faPlus} /> Add test case
    </button>
  </div>
)

export default CreateTest