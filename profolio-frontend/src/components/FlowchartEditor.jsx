import { useCallback, useMemo, useState, forwardRef, useImperativeHandle } from 'react'
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState, useReactFlow,
  Handle, Position, MarkerType, ConnectionMode, getNodesBounds, getViewportForBounds,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toPng } from 'html-to-image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlay, faSquare, faDiamond, faRightLeft, faTrash,
  faTriangleExclamation, faCircleCheck, faArrowRightLong, faXmark,
} from '@fortawesome/free-solid-svg-icons'

/**
 * A flowchart editor: drag shapes out of the palette, join them with arrows,
 * type the labels in.
 *
 * Drawing in the app instead of photographing paper gives marking the actual
 * structure — which shapes exist, what each says, what connects to what —
 * rather than a photograph the AI has to interpret. Feedback can then be
 * specific: "your decision has only one branch" instead of "the logic is
 * unclear".
 *
 * Both are still offered. Paper suits some people, and a student without a
 * mouse is better off drawing by hand.
 *
 * export() returns a PNG for the existing marking pipeline and the structure
 * alongside it.
 */

// ─── Shapes ──────────────────────────────────────────────────────────────────
// Flowchart convention: oval for start and end, rectangle for a process,
// diamond for a decision, parallelogram for input or output.

// A connection point on each side, big enough to hit without aiming. In loose
// connection mode any of them can start or finish an arrow, so a student never
// has to work out which dot is the "out" one.
const SIDES = [
  { id: 't', position: Position.Top },
  { id: 'r', position: Position.Right },
  { id: 'b', position: Position.Bottom },
  { id: 'l', position: Position.Left },
]

const Ports = ({ offsets = {} }) => SIDES.map((sd) => (
  <Handle
    key={sd.id}
    id={sd.id}
    type="source"
    position={sd.position}
    style={offsets[sd.id]}
    className="!w-3.5 !h-3.5 !bg-blue-400 !border-2 !border-[#0a0a18] hover:!bg-blue-300 hover:!scale-125 !transition-all"
  />
))

const Terminal = ({ data, selected }) => (
  <div className={`px-4 py-2 rounded-full border-2 text-center text-[13px] font-semibold min-w-[110px] ${
    selected ? 'border-blue-400 bg-blue-500/15 text-white' : 'border-emerald-400/70 bg-emerald-500/10 text-emerald-200'
  }`}>
    <Ports />
    {data.label}
  </div>
)

const Process = ({ data, selected }) => (
  <div className={`px-4 py-2.5 rounded-md border-2 text-center text-[13px] min-w-[130px] ${
    selected ? 'border-blue-400 bg-blue-500/15 text-white' : 'border-gray-400/70 bg-white/[0.06] text-gray-100'
  }`}>
    <Ports />
    {data.label}
  </div>
)

const Decision = ({ data, selected }) => (
  <div className="relative" style={{ width: 150, height: 96 }}>
    <div className={`absolute border-2 rotate-45 ${
      selected ? 'border-blue-400 bg-blue-500/15' : 'border-amber-400/70 bg-amber-500/10'
    }`} style={{ width: 88, height: 88, left: 31, top: 4 }} />
    <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[12px] text-amber-100 leading-tight pointer-events-none">
      {data.label}
    </div>
    <Ports offsets={{ t: { left: 75 }, b: { left: 75 }, r: { top: 48 }, l: { top: 48 } }} />
  </div>
)

const InputOutput = ({ data, selected }) => (
  <div className={`px-5 py-2.5 border-2 text-center text-[13px] min-w-[130px] ${
    selected ? 'border-blue-400 bg-blue-500/15 text-white' : 'border-violet-400/70 bg-violet-500/10 text-violet-100'
  }`} style={{ transform: 'skewX(-18deg)' }}>
    <div style={{ transform: 'skewX(18deg)' }}>{data.label}</div>
    <Ports />
  </div>
)

const nodeTypes = { terminal: Terminal, process: Process, decision: Decision, io: InputOutput }

const PALETTE = [
  { kind: 'terminal', label: 'Start / End', icon: faPlay, text: 'Start' },
  { kind: 'io', label: 'Input / Output', icon: faRightLeft, text: 'Read input' },
  { kind: 'process', label: 'Process', icon: faSquare, text: 'Do something' },
  { kind: 'decision', label: 'Decision', icon: faDiamond, text: 'Condition?' },
]

const START_NODES = [
  { id: 'n1', type: 'terminal', position: { x: 180, y: 40 }, data: { label: 'Start' } },
]

let idCounter = 100
const nextId = () => `n${++idCounter}`

// ─── Editor ──────────────────────────────────────────────────────────────────

const Canvas = forwardRef((_props, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(START_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selected, setSelected] = useState(null)   // { kind: 'node' | 'edge', id }
  // Dragging between two small points is fiddly, especially on a laptop
  // trackpad. Pick a shape, press Connect, then click where the arrow goes.
  const [connectFrom, setConnectFrom] = useState(null)
  const { screenToFlowPosition, fitView } = useReactFlow()

  const selectedNode = selected?.kind === 'node' ? nodes.find((n) => n.id === selected.id) : null
  const selectedEdge = selected?.kind === 'edge' ? edges.find((e) => e.id === selected.id) : null

  const edgeStyle = {
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
    style: { strokeWidth: 1.6 },
  }

  // A decision's branches are labelled as they are drawn: the first way out is
  // Yes, the second No. Both can be renamed.
  const branchLabel = (sourceId, existing) => {
    const from = nodes.find((n) => n.id === sourceId)
    if (from?.type !== 'decision') return undefined
    const out = existing.filter((e) => e.source === sourceId).length
    return out === 0 ? 'Yes' : out === 1 ? 'No' : undefined
  }

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({
    ...params, ...edgeStyle, label: branchLabel(params.source, eds),
  }, eds)), [setEdges, nodes])

  // Joins two shapes from whichever sides face each other.
  const connectTo = (targetId) => {
    const a = nodes.find((n) => n.id === connectFrom)
    const b = nodes.find((n) => n.id === targetId)
    if (!a || !b) return
    const dx = b.position.x - a.position.x
    const dy = b.position.y - a.position.y
    const [sh, th] = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? ['r', 'l'] : ['l', 'r'])
      : (dy > 0 ? ['b', 't'] : ['t', 'b'])

    setEdges((eds) => addEdge({
      source: connectFrom, target: targetId, sourceHandle: sh, targetHandle: th,
      ...edgeStyle, label: branchLabel(connectFrom, eds),
    }, eds))
    setConnectFrom(null)
  }

  const addNode = (kind, text) => {
    const id = nextId()
    // Dropped near the middle of what's on screen, then nudged so a run of
    // added shapes doesn't stack in one spot.
    const offset = nodes.length * 14
    setNodes((ns) => ns.concat({
      id,
      type: kind,
      position: { x: 180 + (offset % 120), y: 140 + offset },
      data: { label: text },
    }))
    setSelected({ kind: 'node', id })
  }

  const setLabel = (text) => {
    if (selectedNode) {
      setNodes((ns) => ns.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: text } } : n)))
    } else if (selectedEdge) {
      setEdges((es) => es.map((e) => (e.id === selectedEdge.id ? { ...e, label: text || undefined } : e)))
    }
  }

  const removeSelected = () => {
    if (selectedNode) {
      setNodes((ns) => ns.filter((n) => n.id !== selectedNode.id))
      setEdges((es) => es.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
    } else if (selectedEdge) {
      setEdges((es) => es.filter((e) => e.id !== selectedEdge.id))
    }
    setSelected(null)
  }

  // Problems worth catching before a student submits.
  const issues = useMemo(() => {
    const found = []
    const labels = nodes.map((n) => String(n.data.label || '').trim().toLowerCase())
    if (!nodes.length) return ['The canvas is empty.']
    if (!labels.some((l) => l === 'start')) found.push('No shape labelled “Start”.')
    if (!labels.some((l) => l === 'end' || l === 'stop')) found.push('No shape labelled “End”.')

    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))
    const loose = nodes.filter((n) => !connected.has(n.id))
    if (loose.length) found.push(`${loose.length} shape${loose.length > 1 ? 's are' : ' is'} not connected to anything.`)

    nodes.filter((n) => n.type === 'decision').forEach((d) => {
      const out = edges.filter((e) => e.source === d.id)
      if (out.length < 2) found.push(`Decision “${d.data.label}” has ${out.length} way out — a decision needs two.`)
      else if (out.some((e) => !e.label)) found.push(`Label both branches of “${d.data.label}” (Yes / No).`)
    })

    if (nodes.some((n) => !String(n.data.label || '').trim())) found.push('Some shapes have no text.')
    return found
  }, [nodes, edges])

  useImperativeHandle(ref, () => ({
    issues,
    isEmpty: nodes.length <= 1 && edges.length === 0,

    // A PNG for the existing marking pipeline, plus the structure behind it.
    async export() {
      const width = 1000
      const height = 700
      const bounds = getNodesBounds(nodes)
      const viewport = getViewportForBounds(bounds, width, height, 0.4, 2, 40)
      const el = document.querySelector('.react-flow__viewport')

      // White background: the marker reads it as a diagram on paper would be.
      const dataUrl = await toPng(el, {
        backgroundColor: '#ffffff',
        width, height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      })

      const byId = new Map(nodes.map((n) => [n.id, n]))
      const diagram = {
        source: 'drawn',
        nodes: nodes.map((n) => ({ id: n.id, kind: n.type, label: String(n.data.label || '').trim() })),
        edges: edges.map((e) => ({
          from: byId.get(e.source)?.data.label || e.source,
          to: byId.get(e.target)?.data.label || e.target,
          label: e.label || null,
        })),
      }
      return { dataUrl, diagram }
    },
  }), [nodes, edges, issues])

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      {/* Palette + inspector */}
      <div className="lg:w-56 flex-shrink-0 flex flex-col gap-3">
        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-3">
          <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Shapes</p>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
            {PALETTE.map((p) => (
              <button
                key={p.kind}
                type="button"
                onClick={() => addNode(p.kind, p.text)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/8 text-gray-300 hover:text-white hover:border-white/20 transition-all text-left"
              >
                <FontAwesomeIcon icon={p.icon} className="text-[11px] text-gray-500" />
                <span className="text-xs">{p.label}</span>
              </button>
            ))}
          </div>
          <p className="text-gray-600 text-[10px] leading-relaxed mt-2">
            To join two shapes: click one, press <span className="text-gray-400">Connect to…</span>, then click the
            other. Or drag from any blue dot to another shape.
          </p>
        </div>

        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-3">
          <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
            {selectedNode ? 'Shape' : selectedEdge ? 'Arrow' : 'Nothing selected'}
          </p>
          {(selectedNode || selectedEdge) ? (
            <>
              <input
                value={selectedNode ? selectedNode.data.label || '' : selectedEdge.label || ''}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={selectedNode ? 'Type the text' : 'Yes / No'}
                className="w-full bg-white/5 border border-white/10 focus:border-blue-400/50 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none transition-all"
              />
              {selectedEdge && (
                <div className="flex gap-1.5 mt-1.5">
                  {['Yes', 'No'].map((v) => (
                    <button key={v} type="button" onClick={() => setLabel(v)}
                      className="flex-1 text-[11px] text-gray-400 hover:text-white border border-white/10 rounded-lg py-1 transition-all">
                      {v}
                    </button>
                  ))}
                </div>
              )}
              {selectedNode && (
                <button
                  type="button"
                  onClick={() => setConnectFrom(connectFrom === selectedNode.id ? null : selectedNode.id)}
                  className={`w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs transition-all border ${
                    connectFrom === selectedNode.id
                      ? 'border-blue-400/60 bg-blue-500/15 text-blue-200'
                      : 'border-white/10 text-gray-300 hover:text-white hover:border-white/25'
                  }`}
                >
                  <FontAwesomeIcon icon={connectFrom === selectedNode.id ? faXmark : faArrowRightLong} className="text-[10px]" />
                  {connectFrom === selectedNode.id ? 'Cancel — pick again' : 'Connect to…'}
                </button>
              )}

              <button
                type="button"
                onClick={removeSelected}
                className="w-full mt-2 flex items-center justify-center gap-1.5 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg py-1.5 text-xs transition-all"
              >
                <FontAwesomeIcon icon={faTrash} className="text-[10px]" /> Delete
              </button>
            </>
          ) : (
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Click a shape or an arrow to rename or delete it.
            </p>
          )}
        </div>

        {/* Checks, so nothing obvious is missed before submitting */}
        <div className="border border-white/8 bg-white/[0.03] rounded-2xl p-3">
          <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Checks</p>
          {issues.length === 0 ? (
            <p className="text-emerald-400 text-[11px] flex items-start gap-1.5">
              <FontAwesomeIcon icon={faCircleCheck} className="mt-0.5" /> Nothing obviously missing.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {issues.map((msg, i) => (
                <li key={i} className="text-amber-300/90 text-[11px] flex items-start gap-1.5 leading-relaxed">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 flex-shrink-0 text-[10px]" /> {msg}
                </li>
              ))}
            </ul>
          )}
          <p className="text-gray-600 text-[10px] mt-2">These are reminders, not rules — you can still submit.</p>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-w-0 relative">
        {connectFrom && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowRightLong} className="text-[10px]" />
            Click the shape the arrow should point to
            <button type="button" onClick={() => setConnectFrom(null)} className="ml-1 opacity-80 hover:opacity-100">
              <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
            </button>
          </div>
        )}
        <div className="h-[460px] sm:h-[560px] border border-white/8 rounded-2xl overflow-hidden bg-[#0a0a18]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => {
            if (connectFrom && connectFrom !== n.id) connectTo(n.id)
            else setSelected({ kind: 'node', id: n.id })
          }}
          onEdgeClick={(_, e) => setSelected({ kind: 'edge', id: e.id })}
          onPaneClick={() => { setSelected(null); setConnectFrom(null) }}
          connectionMode={ConnectionMode.Loose}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 }, style: { strokeWidth: 1.6 } }}
          fitView
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={18} size={1} color="#243044" />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable className="!bg-[#0d1218] !border !border-white/10" maskColor="rgba(0,0,0,0.6)" />
        </ReactFlow>
        </div>
      </div>
    </div>
  )
})
Canvas.displayName = 'FlowchartCanvas'

const FlowchartEditor = forwardRef((props, ref) => (
  <ReactFlowProvider>
    <Canvas ref={ref} {...props} />
  </ReactFlowProvider>
))
FlowchartEditor.displayName = 'FlowchartEditor'

export default FlowchartEditor